import db from "../config/db.js";
import { getNilaiAkhirAlternatif } from "./perhitungan.js";

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const ensureRankIndex = (rank) => {
  const index = Number(rank);
  if (!Number.isFinite(index) || index <= 0) {
    throw new Error("Ranking tidak valid.");
  }
  return index;
};

export async function listStudents() {
  const [rows] = await db.query(
    `
      SELECT
        id_user,
        nama_user,
        nis
      FROM users
      WHERE role = 'Siswa'
      ORDER BY nama_user ASC, id_user ASC
    `
  );

  return rows.map((row) => ({
    id_user: row.id_user,
    nama_user: row.nama_user,
    nis: row.nis,
  }));
}

export async function getRankingByUser(id_user) {
  const nilaiAkhir = await getNilaiAkhirAlternatif(id_user);
  if (!Array.isArray(nilaiAkhir) || nilaiAkhir.length === 0) {
    return [];
  }

  const sorted = [...nilaiAkhir].sort((a, b) => {
    const nilaiA = toNumber(a.nilai_akhir);
    const nilaiB = toNumber(b.nilai_akhir);
    if (nilaiB !== nilaiA) return nilaiB - nilaiA;
    return String(a.kode_alternatif).localeCompare(String(b.kode_alternatif));
  });

  return sorted.map((row, index) => ({
    ranking: index + 1,
    id_alternatif: row.id_alternatif,
    kode_alternatif: row.kode_alternatif,
    nama_alternatif: row.nama_alternatif,
    nilai_akhir: toNumber(row.nilai_akhir),
  }));
}

export async function getTablePerangkingan(id_user) {
  const ranking = await getRankingByUser(id_user);

  return ranking.map((row) => ({
    no: row.ranking,
    id_alternatif: row.id_alternatif,
    kode_alternatif: row.kode_alternatif,
    nama_alternatif: row.nama_alternatif,
    nilai_akhir: Number(row.nilai_akhir.toFixed(4)),
    keterangan: `Rank ${row.ranking}`,
  }));
}

export async function getAlternatifTerbaik(id_user) {
  const ranking = await getRankingByUser(id_user);
  return ranking[0] || null;
}

export async function getAlternatifByRank(id_user, rank) {
  const index = ensureRankIndex(rank);
  const ranking = await getRankingByUser(id_user);
  return ranking[index - 1] || null;
}

export async function getTotalAlternatifRanking(id_user) {
  const ranking = await getRankingByUser(id_user);
  return ranking.length;
}

export async function hasDataPerangkingan(id_user) {
  const total = await getTotalAlternatifRanking(id_user);
  return total > 0;
}

export async function getStatistikPerangkingan(id_user) {
  const ranking = await getRankingByUser(id_user);
  if (ranking.length === 0) {
    return {
      total_alternatif: 0,
      nilai_tertinggi: 0,
      nilai_terendah: 0,
      rata_rata: 0,
    };
  }

  const nilaiList = ranking.map((row) => toNumber(row.nilai_akhir));
  const totalAlternatif = ranking.length;
  const nilaiTertinggi = Math.max(...nilaiList);
  const nilaiTerendah = Math.min(...nilaiList);
  const rataRata =
    nilaiList.reduce((sum, value) => sum + value, 0) / totalAlternatif;

  return {
    total_alternatif: totalAlternatif,
    nilai_tertinggi: Number(nilaiTertinggi.toFixed(4)),
    nilai_terendah: Number(nilaiTerendah.toFixed(4)),
    rata_rata: Number(rataRata.toFixed(4)),
  };
}
