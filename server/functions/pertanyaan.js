import db from "../config/db.js";

const baseSelect = `
  SELECT
    p.id_pertanyaan,
    p.id_kriteria,
    k.nama_kriteria,
    p.id_alternatif,
    a.nama_alternatif,
    p.teks_pertanyaan
  FROM pertanyaan p
  JOIN kriteria k ON p.id_kriteria = k.id_kriteria
  JOIN alternatif a ON p.id_alternatif = a.id_alternatif
`;

const orderClause = " ORDER BY a.kode_alternatif ASC, k.kode_kriteria ASC, p.id_pertanyaan ASC";

const mapRow = (row) => ({
  id_pertanyaan: row.id_pertanyaan,
  id_kriteria: row.id_kriteria,
  nama_kriteria: row.nama_kriteria,
  id_alternatif: row.id_alternatif,
  nama_alternatif: row.nama_alternatif,
  teks_pertanyaan: row.teks_pertanyaan,
});

const toId = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

async function isDuplicatePertanyaan(id_kriteria, id_alternatif, teks, excludeId = null) {
  const params = [id_kriteria, id_alternatif, teks.trim()];
  let sql = `SELECT COUNT(*) AS total FROM pertanyaan WHERE id_kriteria = ? AND id_alternatif = ? AND teks_pertanyaan = ?`;
  if (excludeId) {
    sql += " AND id_pertanyaan <> ?";
    params.push(excludeId);
  }
  const [rows] = await db.query(sql, params);
  return Number(rows?.[0]?.total || 0) > 0;
}

async function ensureKriteriaExists(id_kriteria) {
  const [rows] = await db.query(
    "SELECT id_kriteria FROM kriteria WHERE id_kriteria = ? LIMIT 1",
    [id_kriteria]
  );
  if (!rows?.length) {
    throw new Error("Kriteria tidak ditemukan.");
  }
}

async function ensureAlternatifExists(id_alternatif) {
  const [rows] = await db.query(
    "SELECT id_alternatif FROM alternatif WHERE id_alternatif = ? LIMIT 1",
    [id_alternatif]
  );
  if (!rows?.length) {
    throw new Error("Alternatif tidak ditemukan.");
  }
}

export async function listAllPertanyaan() {
  const [rows] = await db.query(`${baseSelect}${orderClause}`);
  return rows.map(mapRow);
}

export async function listPertanyaanByAlternatif(id_alternatif) {
  const id = toId(id_alternatif);
  if (!Number.isFinite(id)) {
    throw new Error("ID alternatif tidak valid.");
  }
  const [rows] = await db.query(
    `${baseSelect} WHERE p.id_alternatif = ?${orderClause}`,
    [id]
  );
  return rows.map(mapRow);
}

export async function getPertanyaanById(id_pertanyaan) {
  const id = toId(id_pertanyaan);
  if (!Number.isFinite(id)) {
    throw new Error("ID pertanyaan tidak valid.");
  }
  const [rows] = await db.query(`${baseSelect} WHERE p.id_pertanyaan = ?`, [id]);
  const row = rows?.[0];
  return row ? mapRow(row) : null;
}

export async function createPertanyaan(payload = {}) {
  const id_kriteria = toId(payload.id_kriteria);
  const id_alternatif = toId(payload.id_alternatif);
  const teks_pertanyaan = String(payload.teks_pertanyaan ?? "").trim();

  if (!Number.isFinite(id_kriteria)) {
    throw new Error("Kriteria wajib dipilih.");
  }
  if (!Number.isFinite(id_alternatif)) {
    throw new Error("Alternatif wajib dipilih.");
  }
  if (!teks_pertanyaan) {
    throw new Error("Teks pertanyaan wajib diisi.");
  }

  await ensureKriteriaExists(id_kriteria);
  await ensureAlternatifExists(id_alternatif);

  const duplicate = await isDuplicatePertanyaan(
    id_kriteria,
    id_alternatif,
    teks_pertanyaan
  );
  if (duplicate) {
    throw new Error("Teks pertanyaan sudah digunakan untuk kriteria dan alternatif ini.");
  }

  const [rows] = await db.query(
    `INSERT INTO pertanyaan (id_kriteria, id_alternatif, teks_pertanyaan)
     VALUES (?,?,?)
     RETURNING id_pertanyaan`,
    [id_kriteria, id_alternatif, teks_pertanyaan]
  );

  const inserted = rows?.[0];
  return getPertanyaanById(inserted?.id_pertanyaan);
}

export async function updatePertanyaan(id_pertanyaan, payload = {}) {
  const id = toId(id_pertanyaan);
  if (!Number.isFinite(id)) {
    throw new Error("ID pertanyaan tidak valid.");
  }

  const current = await getPertanyaanById(id);
  if (!current) {
    throw new Error("Data pertanyaan tidak ditemukan.");
  }

  const id_kriteria = toId(payload.id_kriteria);
  const id_alternatif = toId(payload.id_alternatif);
  const teks_pertanyaan = String(payload.teks_pertanyaan ?? "").trim();

  if (!Number.isFinite(id_kriteria)) {
    throw new Error("Kriteria wajib dipilih.");
  }
  if (!Number.isFinite(id_alternatif)) {
    throw new Error("Alternatif wajib dipilih.");
  }
  if (!teks_pertanyaan) {
    throw new Error("Teks pertanyaan wajib diisi.");
  }

  await ensureKriteriaExists(id_kriteria);
  await ensureAlternatifExists(id_alternatif);

  const duplicate = await isDuplicatePertanyaan(
    id_kriteria,
    id_alternatif,
    teks_pertanyaan,
    id
  );
  if (duplicate) {
    throw new Error("Teks pertanyaan sudah digunakan untuk kriteria dan alternatif ini.");
  }

  const [result] = await db.query(
    `UPDATE pertanyaan
        SET id_kriteria = ?, id_alternatif = ?, teks_pertanyaan = ?
      WHERE id_pertanyaan = ?`,
    [id_kriteria, id_alternatif, teks_pertanyaan, id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Tidak ada perubahan pada data.");
  }

  return getPertanyaanById(id);
}

export async function deletePertanyaan(id_pertanyaan) {
  const id = toId(id_pertanyaan);
  if (!Number.isFinite(id)) {
    throw new Error("ID pertanyaan tidak valid.");
  }

  const [result] = await db.query(
    "DELETE FROM pertanyaan WHERE id_pertanyaan = ?",
    [id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Data pertanyaan tidak ditemukan.");
  }
}

export async function listKriteriaOptions() {
  const [rows] = await db.query(
    "SELECT id_kriteria, nama_kriteria FROM kriteria ORDER BY kode_kriteria ASC, id_kriteria ASC"
  );
  return rows.map((row) => ({
    id_kriteria: row.id_kriteria,
    nama_kriteria: row.nama_kriteria,
  }));
}

export async function listAlternatifOptions() {
  const [rows] = await db.query(
    "SELECT id_alternatif, nama_alternatif FROM alternatif ORDER BY kode_alternatif ASC, id_alternatif ASC"
  );
  return rows.map((row) => ({
    id_alternatif: row.id_alternatif,
    nama_alternatif: row.nama_alternatif,
  }));

}
