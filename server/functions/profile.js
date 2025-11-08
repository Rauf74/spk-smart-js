import db from "../config/db.js";

const mapUserRow = (row) => {
  if (!row) return null;
  return {
    id: row.id_user,
    name: row.nama_user,
    username: row.username,
    role: row.role,
    nis: row.nis,
    jenis_kelamin: row.jenis_kelamin,
    is_logged_in: Boolean(row.is_logged_in),
  };
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

const formatDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const iso = d.toISOString();
  return iso.replace("T", " ").slice(0, 19);
};

export async function getUserById(id_user) {
  if (!Number.isFinite(Number(id_user))) return null;
  const [rows] = await db.query(
    `SELECT id_user, nama_user, username, role, nis, jenis_kelamin, is_logged_in
       FROM users
      WHERE id_user = ?
      LIMIT 1`,
    [id_user]
  );
  return mapUserRow(rows?.[0] || null);
}

export async function getUserWithPassword(id_user) {
  if (!Number.isFinite(Number(id_user))) return null;
  const [rows] = await db.query(
    `SELECT id_user, nama_user, username, role, nis, jenis_kelamin, is_logged_in, password
       FROM users
      WHERE id_user = ?
      LIMIT 1`,
    [id_user]
  );
  const row = rows?.[0];
  if (!row) return null;
  return {
    ...mapUserRow(row),
    password: row.password,
  };
}

export async function updateUserProfile(id_user, payload = {}) {
  const id = Number(id_user);
  if (!Number.isFinite(id)) {
    throw new Error("ID pengguna tidak valid.");
  }
  const nama_user = (payload.nama_user ?? "").trim();
  const username = (payload.username ?? "").trim();
  const jenis_kelamin = (payload.jenis_kelamin ?? "").trim();

  if (!nama_user || !username) {
    throw new Error("Nama dan username wajib diisi.");
  }

  const [dupRows] = await db.query(
    `SELECT id_user FROM users WHERE username = ? AND id_user <> ? LIMIT 1`,
    [username, id]
  );

  if (dupRows && dupRows.length) {
    throw new Error("Username sudah digunakan pengguna lain.");
  }

  const [result] = await db.query(
    `UPDATE users
        SET nama_user = ?, username = ?, jenis_kelamin = ?
      WHERE id_user = ?`,
    [nama_user, username, jenis_kelamin || null, id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Data pengguna tidak ditemukan.");
  }

  return getUserById(id);
}

export async function changeUserPassword(
  id_user,
  current_password,
  new_password
) {
  const id = Number(id_user);
  if (!Number.isFinite(id)) {
    throw new Error("ID pengguna tidak valid.");
  }
  const user = await getUserWithPassword(id);
  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  if ((current_password ?? "") !== (user.password ?? "")) {
    throw new Error("Password lama tidak sesuai.");
  }

  if ((new_password ?? "").length < 6) {
    throw new Error("Password baru minimal 6 karakter.");
  }

  const [result] = await db.query(
    `UPDATE users SET password = ? WHERE id_user = ?`,
    [new_password, id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Gagal mengubah password.");
  }
}

export function buildUserStats(user) {
  const now = new Date();
  const fallbackCreated = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    total_login: user?.is_logged_in ? 1 : 0,
    last_login: formatDateTime(now),
    created_date: formatDate(fallbackCreated),
  };
}

export function buildRecentActivities(user) {
  const now = new Date();
  const activities = [
    {
      action: `Login sebagai <strong>${user?.role || "Pengguna"}</strong>`,
      time: `Saat ini (${formatDateTime(now)})`,
      icon: "ti ti-login",
      color: "primary",
    },
  ];

  if (user?.name) {
    activities.push({
      action: `Profil <strong>${user.name}</strong> diperiksa`,
      time: "Baru saja",
      icon: "ti ti-user",
      color: "success",
    });
  }

  activities.push({
    action: "Aktivitas sistem berjalan normal",
    time: "Hari ini",
    icon: "ti ti-activity",
    color: "info",
  });

  return activities.slice(0, 3);
}
