import db from "../config/db.js";

const baseSelect = `
  SELECT
    s.id_subkriteria,
    s.id_kriteria,
    k.nama_kriteria,
    s.nama_subkriteria,
    s.nilai
  FROM subkriteria s
  JOIN kriteria k ON s.id_kriteria = k.id_kriteria
`;

const orderClause = " ORDER BY k.kode_kriteria ASC, s.nilai ASC, s.id_subkriteria ASC";

const mapRow = (row) => ({
  id_subkriteria: row.id_subkriteria,
  id_kriteria: row.id_kriteria,
  nama_kriteria: row.nama_kriteria,
  nama_subkriteria: row.nama_subkriteria,
  nilai: Number(row.nilai),
});

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

async function ensureKriteriaExists(id_kriteria) {
  const [rows] = await db.query(
    "SELECT id_kriteria FROM kriteria WHERE id_kriteria = ? LIMIT 1",
    [id_kriteria]
  );
  if (!rows?.length) {
    throw new Error("Kriteria tidak ditemukan.");
  }
}

async function isDuplicateNilai(id_kriteria, nilai, excludeId = null) {
  const params = [id_kriteria, nilai];
  let sql =
    "SELECT COUNT(*) AS total FROM subkriteria WHERE id_kriteria = ? AND nilai = ?";
  if (excludeId) {
    sql += " AND id_subkriteria <> ?";
    params.push(excludeId);
  }
  const [rows] = await db.query(sql, params);
  return Number(rows?.[0]?.total || 0) > 0;
}

export async function listAllSubkriteria() {
  const [rows] = await db.query(`${baseSelect}${orderClause}`);
  return rows.map(mapRow);
}

export async function listSubkriteriaByKriteria(id_kriteria) {
  const id = toNumber(id_kriteria);
  if (!Number.isFinite(id)) {
    throw new Error("id_kriteria tidak valid.");
  }
  const [rows] = await db.query(
    `${baseSelect} WHERE s.id_kriteria = ?${orderClause}`,
    [id]
  );
  return rows.map(mapRow);
}

export async function getSubkriteriaById(id_subkriteria) {
  const id = toNumber(id_subkriteria);
  if (!Number.isFinite(id)) {
    throw new Error("ID subkriteria tidak valid.");
  }
  const [rows] = await db.query(`${baseSelect} WHERE s.id_subkriteria = ?`, [
    id,
  ]);
  const row = rows?.[0];
  return row ? mapRow(row) : null;
}

export async function createSubkriteria(payload = {}) {
  const id_kriteria = toNumber(payload.id_kriteria);
  const nama_subkriteria = String(payload.nama_subkriteria ?? "").trim();
  const nilai = toNumber(payload.nilai);

  if (!Number.isFinite(id_kriteria)) {
    throw new Error("Kriteria wajib dipilih.");
  }
  if (!nama_subkriteria) {
    throw new Error("Nama subkriteria wajib diisi.");
  }
  if (!Number.isFinite(nilai)) {
    throw new Error("Nilai wajib berupa angka.");
  }

  await ensureKriteriaExists(id_kriteria);

  const duplicate = await isDuplicateNilai(id_kriteria, nilai);
  if (duplicate) {
    throw new Error("Nilai sudah digunakan untuk kriteria ini.");
  }

  const [rows] = await db.query(
    `INSERT INTO subkriteria (id_kriteria, nama_subkriteria, nilai)
     VALUES (?,?,?)
     RETURNING id_subkriteria`,
    [id_kriteria, nama_subkriteria, nilai]
  );

  const inserted = rows?.[0];
  return getSubkriteriaById(inserted?.id_subkriteria);
}

export async function updateSubkriteria(id_subkriteria, payload = {}) {
  const id = toNumber(id_subkriteria);
  if (!Number.isFinite(id)) {
    throw new Error("ID subkriteria tidak valid.");
  }

  const current = await getSubkriteriaById(id);
  if (!current) {
    throw new Error("Data subkriteria tidak ditemukan.");
  }

  const id_kriteria = toNumber(payload.id_kriteria);
  const nama_subkriteria = String(payload.nama_subkriteria ?? "").trim();
  const nilai = toNumber(payload.nilai);

  if (!Number.isFinite(id_kriteria)) {
    throw new Error("Kriteria wajib dipilih.");
  }
  if (!nama_subkriteria) {
    throw new Error("Nama subkriteria wajib diisi.");
  }
  if (!Number.isFinite(nilai)) {
    throw new Error("Nilai wajib berupa angka.");
  }

  await ensureKriteriaExists(id_kriteria);

  const duplicate = await isDuplicateNilai(id_kriteria, nilai, id);
  if (duplicate) {
    throw new Error("Nilai sudah digunakan untuk kriteria ini.");
  }

  const [result] = await db.query(
    `UPDATE subkriteria
        SET id_kriteria = ?, nama_subkriteria = ?, nilai = ?
      WHERE id_subkriteria = ?`,
    [id_kriteria, nama_subkriteria, nilai, id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Tidak ada perubahan pada data.");
  }

  return getSubkriteriaById(id);
}

export async function deleteSubkriteria(id_subkriteria) {
  const id = toNumber(id_subkriteria);
  if (!Number.isFinite(id)) {
    throw new Error("ID subkriteria tidak valid.");
  }

  const [result] = await db.query(
    "DELETE FROM subkriteria WHERE id_subkriteria = ?",
    [id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Data subkriteria tidak ditemukan.");
  }
}

