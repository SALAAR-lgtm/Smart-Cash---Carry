import { app } from "./app.js";
import { config } from "./config.js";
import { database, verifyDatabaseConnection } from "./database.js";

async function startServer() {
  await verifyDatabaseConnection();

  app.listen(config.port, () => {
    console.log("Smart Cash & Carry backend is ready.");
  });
}

startServer().catch(async (error) => {
  console.error("Backend startup failed:", error);
  await database.end();
  process.exit(1);
});

