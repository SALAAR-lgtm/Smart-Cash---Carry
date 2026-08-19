import { describe, expect, it } from "vitest";
import { createAdminRouter } from "../src/adminRoutes.js";
import { createApp } from "../src/app.js";
import { createAuth } from "../src/auth.js";
import { seedAdmin } from "../src/seedAdmin.js";

describe("administrator environment credentials", () => {
  it("seed an administrator and authenticate through the login endpoint without exposing secret values", async () => {
    expect(process.env.ADMIN_USERNAME).toBeTruthy();
    expect(process.env.ADMIN_PASSWORD).toBeTruthy();

    let admin = null;
    const database = {
      query: async (sql, values = []) => {
        if (sql.includes('SELECT id FROM "Admin"')) return { rows: admin ? [{ id: admin.id }] : [] };
        if (sql.includes('INSERT INTO "Admin"')) {
          admin = { id: 1, username: values[0], password_hash: values[1] };
          return { rows: [{ id: admin.id, username: admin.username }] };
        }
        if (sql.includes('SELECT id, username, password_hash FROM "Admin"')) return { rows: admin?.username === values[0] ? [admin] : [] };
        throw new Error("Unexpected query in administrator credential test.");
      },
    };

    await seedAdmin({ database, username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD });
    const app = createApp();
    app.use("/api/admin", createAdminRouter({ database, auth: createAuth({ jwtSecret: process.env.JWT_SECRET || "test-jwt-secret" }), uploadsDir: "/tmp" }));
    const server = await new Promise((resolve) => {
      const listener = app.listen(0, () => resolve(listener));
    });

    try {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }),
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ token: expect.any(String) });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
