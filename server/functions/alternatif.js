import db from "../config/db.js";

const baseSelect = `
  SELECT
    id_alternatif,
    kode_alternatif,
    nama_alternatif
  FROM alternatif
`;

const orderClause = " ORDER BY kode_alternatif ASC, id_alternatif ASC";

const mapRow = (row) => ({
  id_alternatif: row.id_alternatif,
  kode_alternatif: row.kode_alternatif,
  nama_alternatif: row.nama_alternatif,
});

const toId = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

async function isDuplicate(kode_alternatif, nama_alternatif, excludeId = null) {
  const params = [kode_alternatif.trim(), nama_alternatif.trim()];
  let sql =
    "SELECT COUNT(*) AS total FROM alternatif WHERE (kode_alternatif = ? OR nama_alternatif = ?)";
  if (excludeId) {
    sql += " AND id_alternatif <> ?";
    params.push(excludeId);
  }
  const [rows] = await db.query(sql, params);
  return Number(rows?.[0]?.total || 0) > 0;
}

export async function listAlternatif() {
  const [rows] = await db.query(`${baseSelect}${orderClause}`);
  return rows.map(mapRow);
}

export async function getAlternatifById(id_alternatif) {
  const id = toId(id_alternatif);
  if (!Number.isFinite(id)) throw new Error("ID alternatif tidak valid.");
  const [rows] = await db.query(`${baseSelect} WHERE id_alternatif = ?`, [id]);
  const row = rows?.[0];
  return row ? mapRow(row) : null;
}

export async function createAlternatif(payload = {}) {
  const kode_alternatif = String(payload.kode_alternatif ?? "").trim();
  const nama_alternatif = String(payload.nama_alternatif ?? "").trim();

  if (!kode_alternatif) throw new Error("Kode alternatif wajib diisi.");
  if (!nama_alternatif) throw new Error("Nama alternatif wajib diisi.");

  const duplicate = await isDuplicate(kode_alternatif, nama_alternatif);
  if (duplicate) {
    throw new Error("Kode alternatif atau nama alternatif sudah digunakan.");
  }

  const [rows] = await db.query(
    `INSERT INTO alternatif (kode_alternatif, nama_alternatif)
     VALUES (?, ?)
     RETURNING id_alternatif`,
    [kode_alternatif, nama_alternatif]
  );

  const inserted = rows?.[0];
  return getAlternatifById(inserted?.id_alternatif);
}

export async function updateAlternatif(id_alternatif, payload = {}) {
  const id = toId(id_alternatif);
  if (!Number.isFinite(id)) throw new Error("ID alternatif tidak valid.");

  const existing = await getAlternatifById(id);
  if (!existing) throw new Error("Data alternatif tidak ditemukan.");

  const kode_alternatif = String(payload.kode_alternatif ?? "").trim();
  const nama_alternatif = String(payload.nama_alternatif ?? "").trim();

  if (!kode_alternatif) throw new Error("Kode alternatif wajib diisi.");
  if (!nama_alternatif) throw new Error("Nama alternatif wajib diisi.");

  const duplicate = await isDuplicate(kode_alternatif, nama_alternatif, id);
  if (duplicate) {
    throw new Error("Kode alternatif atau nama alternatif sudah digunakan.");
  }

  const [result] = await db.query(
    `UPDATE alternatif
        SET kode_alternatif = ?, nama_alternatif = ?
      WHERE id_alternatif = ?`,
    [kode_alternatif, nama_alternatif, id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Tidak ada perubahan pada data.");
  }

  return getAlternatifById(id);
}

export async function deleteAlternatif(id_alternatif) {
  const id = toId(id_alternatif);
  if (!Number.isFinite(id)) throw new Error("ID alternatif tidak valid.");

  const [result] = await db.query(
    "DELETE FROM alternatif WHERE id_alternatif = ?",
    [id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Data alternatif tidak ditemukan.");
  }
}
