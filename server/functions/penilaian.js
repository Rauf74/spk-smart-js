import db from "../config/db.js";

const toId = (value, label = "ID") => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${label} tidak valid.`);
  }
  return num;
};

const mapStudentRow = (row) => ({
  id_user: row.id_user,
  nama_user: row.nama_user,
  nis: row.nis,
});

const mapPertanyaanRow = (row) => ({
  id_pertanyaan: row.id_pertanyaan,
  id_kriteria: row.id_kriteria,
  id_alternatif: row.id_alternatif,
  teks_pertanyaan: row.teks_pertanyaan,
  nama_kriteria: row.nama_kriteria,
});

const mapSubkriteriaRow = (row) => ({
  id_subkriteria: row.id_subkriteria,
  id_kriteria: row.id_kriteria,
  nama_subkriteria: row.nama_subkriteria,
  nilai: Number(row.nilai),
});

export async function getSiswaWithPenilaian() {
  const [rows] = await db.query(
    `SELECT DISTINCT
        u.id_user,
        u.nama_user,
        u.nis
     FROM users u
     INNER JOIN penilaian p ON u.id_user = p.id_user
     WHERE u.role = 'Siswa'
     ORDER BY u.nama_user ASC`
  );
  return rows.map(mapStudentRow);
}

export async function getAllPenilaianByUser(id_user) {
  const userId = toId(id_user, "ID user");
  const [rows] = await db.query(
    `SELECT
        a.id_alternatif,
        a.nama_alternatif,
        (
          SELECT COUNT(*)
          FROM penilaian p
          WHERE p.id_alternatif = a.id_alternatif
            AND p.id_user = ?
        ) AS status_penilaian
     FROM alternatif a
     ORDER BY a.id_alternatif ASC`,
    [userId]
  );
  return rows.map((row) => ({
    id_alternatif: row.id_alternatif,
    nama_alternatif: row.nama_alternatif,
    status_penilaian: Number(row.status_penilaian) || 0,
  }));
}

export async function getPenilaianByAlternatifAndUser(
  id_alternatif,
  id_user
) {
  const alternatifId = toId(id_alternatif, "ID alternatif");
  const userId = toId(id_user, "ID user");

  const [rows] = await db.query(
    `SELECT
        p.id_penilaian,
        p.id_user,
        p.id_alternatif,
        p.id_kriteria,
        p.id_pertanyaan,
        p.id_subkriteria,
        p.jawaban,
        u.nama_user,
        u.nis,
        k.kode_kriteria,
        k.nama_kriteria,
        s.nama_subkriteria,
        s.nilai,
        pt.teks_pertanyaan
     FROM penilaian p
     INNER JOIN users u ON p.id_user = u.id_user
     INNER JOIN kriteria k ON p.id_kriteria = k.id_kriteria
     INNER JOIN subkriteria s ON p.id_subkriteria = s.id_subkriteria
     INNER JOIN pertanyaan pt ON p.id_pertanyaan = pt.id_pertanyaan
     WHERE p.id_alternatif = ? AND p.id_user = ?
     ORDER BY k.kode_kriteria ASC, p.id_pertanyaan ASC`,
    [alternatifId, userId]
  );

  const grouped = new Map();

  for (const row of rows) {
    const key = row.id_kriteria;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id_user: row.id_user,
        nama_user: row.nama_user,
        nis: row.nis,
        id_alternatif: row.id_alternatif,
        id_kriteria: row.id_kriteria,
        kode_kriteria: row.kode_kriteria,
        nama_kriteria: row.nama_kriteria,
        jawaban_list: [],
        rata_rata: 0,
        nama_subkriteria: "",
        nilai: 0,
      });
    }

    grouped.get(key).jawaban_list.push({
      id_pertanyaan: row.id_pertanyaan,
      teks_pertanyaan: row.teks_pertanyaan,
      id_subkriteria: row.id_subkriteria,
      nama_subkriteria: row.nama_subkriteria,
      jawaban: Number(row.jawaban),
    });
  }

  for (const group of grouped.values()) {
    if (group.jawaban_list.length === 0) continue;

    const total = group.jawaban_list.reduce(
      (sum, item) => sum + Number(item.jawaban || 0),
      0
    );
    group.rata_rata = total / group.jawaban_list.length;

    const [subRows] = await db.query(
      `SELECT
          nama_subkriteria,
          nilai
       FROM subkriteria
       WHERE id_kriteria = ?
       ORDER BY ABS(nilai - ?) ASC
       LIMIT 1`,
      [group.id_kriteria, group.rata_rata]
    );

    const nearest = subRows?.[0];
    if (nearest) {
      group.nama_subkriteria = nearest.nama_subkriteria;
      group.nilai = Number(nearest.nilai);
    }
  }

  return Array.from(grouped.values());
}

export async function deletePenilaianByAlternatifAndUser(
  id_alternatif,
  id_user
) {
  const alternatifId = toId(id_alternatif, "ID alternatif");
  const userId = toId(id_user, "ID user");

  const [result] = await db.query(
    `DELETE FROM penilaian
     WHERE id_alternatif = ? AND id_user = ?`,
    [alternatifId, userId]
  );

  return result.affectedRows > 0;
}

export async function getPertanyaanByAlternatif(id_alternatif) {
  const alternatifId = toId(id_alternatif, "ID alternatif");

  const [rows] = await db.query(
    `SELECT
        p.id_pertanyaan,
        p.id_kriteria,
        p.id_alternatif,
        p.teks_pertanyaan,
        k.nama_kriteria
     FROM pertanyaan p
     INNER JOIN kriteria k ON p.id_kriteria = k.id_kriteria
     WHERE p.id_alternatif = ?
     ORDER BY k.nama_kriteria ASC, p.id_pertanyaan ASC`,
    [alternatifId]
  );

  return rows.map(mapPertanyaanRow);
}

export async function getSubkriteriaByKriteria(id_kriteria) {
  const kriteriaId = toId(id_kriteria, "ID kriteria");

  const [rows] = await db.query(
    `SELECT
        id_subkriteria,
        id_kriteria,
        nama_subkriteria,
        nilai
     FROM subkriteria
     WHERE id_kriteria = ?
     ORDER BY nilai ASC`,
    [kriteriaId]
  );

  return rows.map(mapSubkriteriaRow);
}

export async function savePenilaian(penilaianData = [], id_user) {
  const userId = toId(id_user, "ID user");
  if (!Array.isArray(penilaianData) || penilaianData.length === 0) {
    throw new Error("Data penilaian wajib diisi.");
  }

  const alternatifId = toId(
    penilaianData[0]?.id_alternatif,
    "ID alternatif"
  );

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `DELETE FROM penilaian
       WHERE id_user = ? AND id_alternatif = ?`,
      [userId, alternatifId]
    );

    const insertSql = `INSERT INTO penilaian
      (id_user, id_alternatif, id_kriteria, id_pertanyaan, id_subkriteria, jawaban)
      VALUES (?, ?, ?, ?, ?, ?)`;

    for (const item of penilaianData) {
      const altId = toId(item.id_alternatif, "ID alternatif");
      if (altId !== alternatifId) {
        throw new Error("Semua data harus memiliki alternatif yang sama.");
      }

      const idKriteria = toId(item.id_kriteria, "ID kriteria");
      const idPertanyaan = toId(item.id_pertanyaan, "ID pertanyaan");
      const idSubkriteria = toId(item.id_subkriteria, "ID subkriteria");
      const jawaban = Number(item.jawaban);

      if (!Number.isFinite(jawaban)) {
        throw new Error("Nilai jawaban tidak valid.");
      }

      await connection.query(insertSql, [
        userId,
        altId,
        idKriteria,
        idPertanyaan,
        idSubkriteria,
        jawaban,
      ]);
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

}