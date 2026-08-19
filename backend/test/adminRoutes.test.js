import bcrypt from "bcrypt";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createAdminRouter } from "../src/adminRoutes.js";
import { createApp } from "../src/app.js";
import { createAuth } from "../src/auth.js";
import { seedAdmin } from "../src/seedAdmin.js";

async function withServer(app, callback) {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });

  try {
    return await callback(server.address().port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function createDatabase() {
  const state = {
    admin: null,
    categories: [],
    products: [],
    nextCategoryId: 1,
    nextProductId: 1,
  };

  async function query(sql, values = []) {
    if (sql.includes('SELECT id FROM "Admin"')) return { rows: state.admin ? [{ id: state.admin.id }] : [] };
    if (sql.includes('INSERT INTO "Admin"')) {
      state.admin = { id: 1, username: values[0], password_hash: values[1] };
      return { rows: [{ id: state.admin.id, username: state.admin.username }] };
    }
    if (sql.includes('SELECT id, username, password_hash FROM "Admin"')) {
      return { rows: state.admin?.username === values[0] ? [state.admin] : [] };
    }
    if (sql.includes('SELECT id, name FROM "Category"')) return { rows: [...state.categories] };
    if (sql.includes('INSERT INTO "Category"')) {
      const category = { id: state.nextCategoryId++, name: values[0] };
      state.categories.push(category);
      return { rows: [category] };
    }
    if (sql.includes('INSERT INTO "Product"')) {
      const product = { id: state.nextProductId++, name: values[0], price: values[1], category_id: values[2], image_url: values[3], available: values[4] };
      state.products.push(product);
      return { rows: [{ id: product.id }] };
    }
    if (sql.includes('UPDATE "Product" SET available')) {
      const product = state.products.find((item) => item.id === Number(values[1]));
      if (!product) return { rows: [] };
      product.available = values[0];
      return { rows: [{ id: product.id }] };
    }
    if (sql.includes('FROM "Product" p')) {
      const rows = state.products.map((product) => ({
        ...product,
        category_name: state.categories.find((category) => category.id === product.category_id)?.name,
      }));
      const requestedId = values[0] ? Number(values[0]) : null;
      return { rows: requestedId ? rows.filter((product) => product.id === requestedId) : rows };
    }
    throw new Error(`Unhandled test query: ${sql}`);
  }

  return { query, state };
}

describe("Sprint 2 admin API", () => {
  it("seeds only the first admin and stores a bcrypt hash", async () => {
    const database = createDatabase();
    const result = await seedAdmin({ database, username: "admin", password: "safe-password" });

    expect(result.created).toBe(true);
    expect(database.state.admin.password_hash).not.toBe("safe-password");
    await expect(bcrypt.compare("safe-password", database.state.admin.password_hash)).resolves.toBe(true);
    await expect(seedAdmin({ database, username: "ignored", password: "ignored" })).resolves.toEqual({ created: false });
  });

  it("requires a token for management routes and permits an authenticated category/product workflow", async () => {
    const database = createDatabase();
    await seedAdmin({ database, username: "admin", password: "safe-password" });
    const app = createApp();
    app.use("/api/admin", createAdminRouter({ database, auth: createAuth({ jwtSecret: "test-secret" }), uploadsDir: "/tmp" }));

    await withServer(app, async (port) => {
      const base = `http://127.0.0.1:${port}`;
      const unauthorized = await fetch(`${base}/api/admin/categories`);
      expect(unauthorized.status).toBe(401);

      const login = await fetch(`${base}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "admin", password: "safe-password" }) });
      expect(login.status).toBe(200);
      const { token } = await login.json();
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      const category = await fetch(`${base}/api/admin/categories`, { method: "POST", headers, body: JSON.stringify({ name: "Pantry" }) });
      expect(category.status).toBe(201);
      const categoryBody = await category.json();

      const product = await fetch(`${base}/api/admin/products`, { method: "POST", headers, body: JSON.stringify({ name: "Basmati Rice", price: 250, category_id: categoryBody.category.id, image_url: "https://example.com/rice.jpg", available: true }) });
      expect(product.status).toBe(201);
      expect((await product.json()).product).toMatchObject({ name: "Basmati Rice", category_name: "Pantry", available: true });
    });
  });

  it("accepts an authenticated image upload and returns a static URL", async () => {
    const database = createDatabase();
    const uploadDirectory = await mkdtemp(path.join(tmpdir(), "scc-upload-"));
    const auth = createAuth({ jwtSecret: "test-secret" });
    const app = createApp();
    app.use("/api/admin", createAdminRouter({ database, auth, uploadsDir: uploadDirectory }));

    try {
      await withServer(app, async (port) => {
        const form = new FormData();
        form.append("image", new Blob(["image-bytes"], { type: "image/png" }), "rice.png");
        const response = await fetch(`http://127.0.0.1:${port}/api/admin/uploads`, {
          method: "POST",
          headers: { Authorization: `Bearer ${auth.createToken({ id: 1, username: "admin" })}` },
          body: form,
        });

        expect(response.status).toBe(201);
        const { image_url: imageUrl } = await response.json();
        expect(imageUrl).toMatch(/^\/uploads\/[\w-]+\.png$/);
        expect(await readdir(uploadDirectory)).toHaveLength(1);
      });
    } finally {
      await rm(uploadDirectory, { recursive: true, force: true });
    }
  });
});
