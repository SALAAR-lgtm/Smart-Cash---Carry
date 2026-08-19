import bcrypt from "bcrypt";
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";

function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function normalizeName(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function normalizePrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a non-negative number.");
  }

  return price;
}

function normalizeCategoryId(value) {
  const categoryId = Number(value);

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    throw new Error("A valid category_id is required.");
  }

  return categoryId;
}

function normalizeAvailable(value) {
  if (typeof value !== "boolean") {
    throw new Error("Available must be true or false.");
  }

  return value;
}

function normalizeImageUrl(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("image_url must be a text value.");
  }

  return value.trim() || null;
}

function normalizeProduct(input) {
  return {
    name: normalizeName(input.name, "Product name"),
    price: normalizePrice(input.price),
    categoryId: normalizeCategoryId(input.category_id),
    imageUrl: normalizeImageUrl(input.image_url),
    available: normalizeAvailable(input.available),
  };
}

async function getProduct(database, id) {
  const result = await database.query(
    `SELECT p.id, p.name, p.price, p.category_id, p.image_url, p.available, c.name AS category_name
     FROM "Product" p
     INNER JOIN "Category" c ON c.id = p.category_id
     WHERE p.id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
}

function createUpload(uploadsDir) {
  return multer({
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (_request, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${randomUUID()}${extension}`);
      },
    }),
    fileFilter: (_request, file, callback) => {
      if (!file.mimetype.startsWith("image/")) {
        return callback(new Error("Only image files can be uploaded."));
      }

      return callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  });
}

export function createAdminRouter({ database, auth, uploadsDir }) {
  const router = Router();
  const upload = createUpload(uploadsDir);

  router.post(
    "/login",
    asyncRoute(async (request, response) => {
      const username = normalizeName(request.body.username, "Username");
      const password = normalizeName(request.body.password, "Password");
      const result = await database.query('SELECT id, username, password_hash FROM "Admin" WHERE username = $1', [username]);
      const admin = result.rows[0];

      if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
        return response.status(401).json({ error: "Incorrect username or password." });
      }

      return response.status(200).json({
        token: auth.createToken(admin),
        admin: { id: admin.id, username: admin.username },
      });
    }),
  );

  router.use(auth.requireAdmin);

  router.get(
    "/categories",
    asyncRoute(async (_request, response) => {
      const result = await database.query('SELECT id, name FROM "Category" ORDER BY name ASC, id ASC');
      response.json({ categories: result.rows });
    }),
  );

  router.post(
    "/categories",
    asyncRoute(async (request, response) => {
      const name = normalizeName(request.body.name, "Category name");
      const result = await database.query('INSERT INTO "Category" (name) VALUES ($1) RETURNING id, name', [name]);
      response.status(201).json({ category: result.rows[0] });
    }),
  );

  router.get(
    "/products",
    asyncRoute(async (_request, response) => {
      const result = await database.query(
        `SELECT p.id, p.name, p.price, p.category_id, p.image_url, p.available, c.name AS category_name
         FROM "Product" p
         INNER JOIN "Category" c ON c.id = p.category_id
         ORDER BY p.id DESC`,
      );
      response.json({ products: result.rows });
    }),
  );

  router.post(
    "/products",
    asyncRoute(async (request, response) => {
      const product = normalizeProduct(request.body);
      const result = await database.query(
        `INSERT INTO "Product" (name, price, category_id, image_url, available)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [product.name, product.price, product.categoryId, product.imageUrl, product.available],
      );
      response.status(201).json({ product: await getProduct(database, result.rows[0].id) });
    }),
  );

  router.put(
    "/products/:id",
    asyncRoute(async (request, response) => {
      const existing = await getProduct(database, request.params.id);

      if (!existing) {
        return response.status(404).json({ error: "Product not found." });
      }

      const product = normalizeProduct({ ...existing, ...request.body });
      await database.query(
        `UPDATE "Product"
         SET name = $1, price = $2, category_id = $3, image_url = $4, available = $5
         WHERE id = $6`,
        [product.name, product.price, product.categoryId, product.imageUrl, product.available, existing.id],
      );
      return response.json({ product: await getProduct(database, existing.id) });
    }),
  );

  router.delete(
    "/products/:id",
    asyncRoute(async (request, response) => {
      const result = await database.query('DELETE FROM "Product" WHERE id = $1 RETURNING id', [request.params.id]);

      if (!result.rows[0]) {
        return response.status(404).json({ error: "Product not found." });
      }

      return response.status(204).send();
    }),
  );

  router.patch(
    "/products/:id/availability",
    asyncRoute(async (request, response) => {
      const available = normalizeAvailable(request.body.available);
      const result = await database.query('UPDATE "Product" SET available = $1 WHERE id = $2 RETURNING id', [available, request.params.id]);

      if (!result.rows[0]) {
        return response.status(404).json({ error: "Product not found." });
      }

      return response.json({ product: await getProduct(database, request.params.id) });
    }),
  );

  router.post(
    "/uploads",
    upload.single("image"),
    (request, response) => {
      if (!request.file) {
        return response.status(400).json({ error: "An image file is required." });
      }

      return response.status(201).json({ image_url: `/uploads/${request.file.filename}` });
    },
  );

  return router;
}
