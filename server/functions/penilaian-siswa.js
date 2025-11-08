import db from "../config/db.js";
import {
  getAllPenilaianByUser,
  getPenilaianByAlternatifAndUser,
  getPertanyaanByAlternatif,
  getSubkriteriaByKriteria,
} from "./penilaian.js";

const toId = (value, label = "ID") => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${label} tidak valid.`);
  }
  return num;
};

export {
  getAllPenilaianByUser,
  getPenilaianByAlternatifAndUser,
  getPertanyaanByAlternatif,
  getSubkriteriaByKriteria,
};

export async function savePenilaian(penilaianData = [], id_user) {
  const userId = toId(id_user, "ID user");

  if (!Array.isArray(penilaianData) || penilaianData.length === 0) {
    throw new Error("Data penilaian wajib diisi.");
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const selectSql = `SELECT id_penilaian
                       FROM penilaian
                       WHERE id_user = ?
                         AND id_alternatif = ?
                         AND id_kriteria = ?
                         AND id_pertanyaan = ?
                       LIMIT 1`;

    const insertSql = `INSERT INTO penilaian
        (id_user, id_alternatif, id_kriteria, id_pertanyaan, id_subkriteria, jawaban)
      VALUES (?, ?, ?, ?, ?, ?)`;

    const updateSql = `UPDATE penilaian
      SET id_subkriteria = ?, jawaban = ?
      WHERE id_penilaian = ?`;

    for (const item of penilaianData) {
      const alternatifId = toId(item.id_alternatif, "ID alternatif");
      const idKriteria = toId(item.id_kriteria, "ID kriteria");
      const idPertanyaan = toId(item.id_pertanyaan, "ID pertanyaan");
      const idSubkriteria = toId(item.id_subkriteria, "ID subkriteria");
      const jawaban = Number(item.jawaban);

      if (!Number.isFinite(jawaban)) {
        throw new Error("Nilai jawaban tidak valid.");
      }

      const [rows] = await connection.query(selectSql, [
        userId,
        alternatifId,
        idKriteria,
        idPertanyaan,
      ]);

      const existing = rows?.[0];

      if (existing) {
        await connection.query(updateSql, [
          idSubkriteria,
          jawaban,
          existing.id_penilaian,
        ]);
      } else {
        await connection.query(insertSql, [
          userId,
          alternatifId,
          idKriteria,
          idPertanyaan,
          idSubkriteria,
          jawaban,
        ]);
      }
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
