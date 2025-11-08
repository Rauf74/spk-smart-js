import db from "../config/db.js";

const baseSelect = `SELECT
  id_user,
  nama_user,
  jenis_kelamin,
  username,
  password,
  role,
  nis,
  is_logged_in
FROM users`;

const mapRow = (row) => ({
  id_user: row.id_user,
  nama_user: row.nama_user,
  jenis_kelamin: row.jenis_kelamin,
  username: row.username,
  password: row.password,
  role: row.role,
  nis: row.nis,
  is_logged_in: row.is_logged_in,
});

export async function listUsers() {
  const [rows] = await db.query(`${baseSelect} ORDER BY id_user ASC`);
  return rows.map(mapRow);
}

export async function listStudents() {
  const [rows] = await db.query(
    `SELECT id_user, nama_user, nis FROM users WHERE role = 'Siswa' ORDER BY nama_user`
  );
  return rows;
}

export async function isUsernameExists(username, excludeId = null) {
  const params = [username];
  let sql = "SELECT COUNT(*) AS total FROM users WHERE username = ?";
  if (excludeId) {
    sql += " AND id_user <> ?";
    params.push(excludeId);
  }
  const [rows] = await db.query(sql, params);
  return Number(rows?.[0]?.total || 0) > 0;
}

export async function createUser(data) {
  const nama_user = (data.nama_user ?? "").trim();
  const username = (data.username ?? "").trim();
  const password = (data.password ?? "").trim();
  const role = data.role === "Guru BK" ? "Guru BK" : "Siswa";
  const jenis_kelamin = data.jenis_kelamin || null;
  const nis = data.nis || null;

  if (!nama_user || !username || !password) {
    throw new Error("Nama, username, dan password wajib diisi.");
  }

  const exists = await isUsernameExists(username);
  if (exists) {
    throw new Error("Username sudah digunakan.");
  }

  const [rows] = await db.query(
    `INSERT INTO users (nama_user, jenis_kelamin, username, password, role, nis, is_logged_in)
     VALUES (?, ?, ?, ?, ?, ?, FALSE)
     RETURNING id_user`,
    [nama_user, jenis_kelamin, username, password, role, nis]
  );

  const inserted = rows?.[0];
  return getUserById(inserted?.id_user);
}

export async function getUserById(id_user) {
  const [rows] = await db.query(`${baseSelect} WHERE id_user = ? LIMIT 1`, [
    id_user,
  ]);
  const row = rows?.[0];
  return row ? mapRow(row) : null;
}

export async function updateUser(id_user, payload = {}) {
  const id = Number(id_user);
  if (!Number.isFinite(id)) {
    throw new Error("ID pengguna tidak valid.");
  }

  const user = await getUserById(id);
  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  const nama_user = (payload.nama_user ?? "").trim();
  const username = (payload.username ?? "").trim();
  const role = payload.role === "Guru BK" ? "Guru BK" : "Siswa";
  const jenis_kelamin = payload.jenis_kelamin || null;
  const nis = payload.nis || null;
  const password = (payload.password ?? "").trim();

  if (!nama_user || !username) {
    throw new Error("Nama dan username wajib diisi.");
  }

  const exists = await isUsernameExists(username, id);
  if (exists) {
    throw new Error("Username sudah digunakan.");
  }

  const params = [nama_user, jenis_kelamin, username, role, nis, id];
  let sql = `UPDATE users
               SET nama_user = ?,
                   jenis_kelamin = ?,
                   username = ?,
                   role = ?,
                   nis = ?`;

  if (password) {
    sql += `, password = ?`;
    params.splice(5, 0, password);
  }
  sql += ` WHERE id_user = ?`;

  const [result] = await db.query(sql, params);

  if (result.affectedRows === 0) {
    throw new Error("Tidak ada perubahan pada data.");
  }

  return getUserById(id);
}

export async function deleteUser(id_user, currentUserId) {
  const id = Number(id_user);
  if (!Number.isFinite(id)) {
    throw new Error("ID tidak valid.");
  }

  if (Number(id) === Number(currentUserId)) {
    throw new Error("Tidak dapat menghapus user yang sedang login.");
  }

  const [result] = await db.query("DELETE FROM users WHERE id_user = ?", [id]);
  if (result.affectedRows === 0) {
    throw new Error("Data user tidak ditemukan.");
  }
}
