import { app } from "./app.js";
import { config } from "./config.js";
import { database, verifyDatabaseConnection } from "./database.js";
import { createAuth } from "./auth.js";
import { createAdminRouter } from "./adminRoutes.js";
import { seedAdmin } from "./seedAdmin.js";
import express from "express";
import { mkdir } from "node:fs/promises";

async function startServer() {
  await verifyDatabaseConnection();
  await mkdir(config.uploadsDir, { recursive: true });

  const auth = createAuth({ jwtSecret: config.jwtSecret });
  await seedAdmin({
    database,
    username: config.adminUsername,
    password: config.adminPassword,
  });

  app.use("/uploads", express.static(config.uploadsDir));
  app.use(
    "/api/admin",
    createAdminRouter({
      database,
      auth,
      uploadsDir: config.uploadsDir,
    }),
  );

  app.use((error, _request, response, _next) => {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    response.status(status).json({ error: error.message || "Request could not be completed." });
  });

  app.listen(config.port, () => {
    console.log("Smart Cash & Carry backend is ready.");
  });
}

startServer().catch(async (error) => {
  console.error("Backend startup failed:", error);
  await database.end();
  process.exit(1);
});
