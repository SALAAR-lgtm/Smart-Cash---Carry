function requireEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port number.");
  }

  return port;
}

export const config = {
  databaseUrl: requireEnvironmentVariable("DATABASE_URL"),
  port: parsePort(requireEnvironmentVariable("PORT")),
  adminUsername: requireEnvironmentVariable("ADMIN_USERNAME"),
  adminPassword: requireEnvironmentVariable("ADMIN_PASSWORD"),
  jwtSecret: requireEnvironmentVariable("JWT_SECRET"),
  uploadsDir: process.env.UPLOADS_DIR ?? "/app/uploads",
};
