import bcrypt from "bcrypt";

export async function seedAdmin({ database, username, password }) {
  const existingAdmin = await database.query('SELECT id FROM "Admin" LIMIT 1');

  if (existingAdmin.rows.length > 0) {
    return { created: false };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const createdAdmin = await database.query(
    'INSERT INTO "Admin" (username, password_hash) VALUES ($1, $2) RETURNING id, username',
    [username, passwordHash],
  );

  return { created: true, admin: createdAdmin.rows[0] };
}
