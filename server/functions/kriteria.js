import db from "../config/db.js";

const selectBase = `
  SELECT
    id_kriteria,
    kode_kriteria,
    nama_kriteria,
    jenis,
    bobot
  FROM kriteria
`;

const orderClause = " ORDER BY kode_kriteria ASC, id_kriteria ASC";

const mapRow = (row) => ({
  id_kriteria: row.id_kriteria,
  kode_kriteria: row.kode_kriteria,
  nama_kriteria: row.nama_kriteria,
  jenis: row.jenis,
  bobot: Number(row.bobot),
});

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

async function getTotalBobot() {
  const [rows] = await db.query(
    "SELECT COALESCE(SUM(bobot), 0) AS total FROM kriteria"
  );
  return Number(rows?.[0]?.total || 0);
}

async function getKriteriaById(id_kriteria) {
  const [rows] = await db.query(`${selectBase} WHERE id_kriteria = ?`, [id_kriteria]);
  return rows?.[0] ? mapRow(rows[0]) : null;
}

async function isKodeOrNamaExists(kode, nama, excludeId = null) {
  const params = [kode.trim(), nama.trim()];
  let sql = "SELECT COUNT(*) AS total FROM kriteria WHERE (kode_kriteria = ? OR nama_kriteria = ?)";
  if (excludeId) {
    sql += " AND id_kriteria <> ?";
    params.push(excludeId);
  }
  const [rows] = await db.query(sql, params);
  return Number(rows?.[0]?.total || 0) > 0;
}

export async function list() {
  const [rows] = await db.query(`${selectBase}${orderClause}`);
  return rows.map(mapRow);
}

export async function create(payload = {}) {
  const kode_kriteria = String(payload.kode_kriteria ?? "").trim();
  const nama_kriteria = String(payload.nama_kriteria ?? "").trim();
  const jenis = String(payload.jenis ?? "").trim();
  const bobot = toNumber(payload.bobot);

  if (!kode_kriteria) throw new Error("Kode kriteria wajib diisi.");
  if (!nama_kriteria) throw new Error("Nama kriteria wajib diisi.");
  if (!["Benefit", "Cost"].includes(jenis)) {
    throw new Error("Jenis harus 'Benefit' atau 'Cost'.");
  }
  if (!Number.isFinite(bobot)) throw new Error("Bobot wajib berupa angka.");
  if (bobot < 0) throw new Error("Bobot tidak boleh negatif.");

  const duplicate = await isKodeOrNamaExists(kode_kriteria, nama_kriteria);
  if (duplicate) {
    throw new Error("Kode kriteria atau nama kriteria sudah digunakan.");
  }

  const totalBobot = await getTotalBobot();
  if (totalBobot + bobot > 100) {
    throw new Error("Total bobot melebihi 100%.");
  }

  const [rows] = await db.query(
    `INSERT INTO kriteria (kode_kriteria, nama_kriteria, jenis, bobot)
     VALUES (?,?,?,?)
     RETURNING id_kriteria`,
    [kode_kriteria, nama_kriteria, jenis, bobot]
  );

  return {
    id_kriteria: rows?.[0]?.id_kriteria,
    kode_kriteria,
    nama_kriteria,
    jenis,
    bobot,
  };
}

export async function update(id_kriteria, payload = {}) {
  const id = Number(id_kriteria);
  if (!Number.isFinite(id)) throw new Error("ID kriteria tidak valid.");

  const existing = await getKriteriaById(id);
  if (!existing) throw new Error("Data kriteria tidak ditemukan.");

  const kode_kriteria = String(payload.kode_kriteria ?? "").trim();
  const nama_kriteria = String(payload.nama_kriteria ?? "").trim();
  const jenis = String(payload.jenis ?? "").trim();
  const bobot = toNumber(payload.bobot);

  if (!kode_kriteria) throw new Error("Kode kriteria wajib diisi.");
  if (!nama_kriteria) throw new Error("Nama kriteria wajib diisi.");
  if (!["Benefit", "Cost"].includes(jenis)) {
    throw new Error("Jenis harus 'Benefit' atau 'Cost'.");
  }
  if (!Number.isFinite(bobot)) throw new Error("Bobot wajib berupa angka.");
  if (bobot < 0) throw new Error("Bobot tidak boleh negatif.");

  const duplicate = await isKodeOrNamaExists(kode_kriteria, nama_kriteria, id);
  if (duplicate) {
    throw new Error("Kode kriteria atau nama kriteria sudah digunakan.");
  }

  const totalBobot = await getTotalBobot();
  if (totalBobot - existing.bobot + bobot > 100) {
    throw new Error("Total bobot melebihi 100%.");
  }

  const [result] = await db.query(
    `UPDATE kriteria
        SET kode_kriteria = ?, nama_kriteria = ?, jenis = ?, bobot = ?
      WHERE id_kriteria = ?`,
    [kode_kriteria, nama_kriteria, jenis, bobot, id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Tidak ada perubahan pada data.");
  }

  return {
    id_kriteria: id,
    kode_kriteria,
    nama_kriteria,
    jenis,
    bobot,
  };
}

export async function remove(id_kriteria) {
  const id = Number(id_kriteria);
  if (!Number.isFinite(id)) throw new Error("ID kriteria tidak valid.");

  const [result] = await db.query(
    "DELETE FROM kriteria WHERE id_kriteria = ?",
    [id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Data kriteria tidak ditemukan.");
  }

  return { success: true };
}
