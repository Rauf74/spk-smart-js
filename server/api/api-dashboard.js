import express from "express";
import db from "../config/db.js";

const router = express.Router();

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

router.get("/", async (_req, res) => {
  try {
    const results = await Promise.all([
      db.query("SELECT COUNT(*) AS total FROM kriteria"),
      db.query("SELECT COUNT(*) AS total FROM subkriteria"),
      db.query("SELECT COUNT(*) AS total FROM alternatif"),
      db.query("SELECT COUNT(*) AS total FROM users"),
      db.query("SELECT COUNT(DISTINCT id_user) AS total FROM penilaian"),
      db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'Siswa'"),
      db.query("SELECT ROUND(AVG(bobot), 2) AS avg_bobot FROM kriteria"),
      db.query(
        "SELECT jenis, COUNT(*) AS jumlah FROM kriteria GROUP BY jenis"
      ),
      db.query(
        "SELECT nama_kriteria, CAST(bobot AS DECIMAL(10,2)) AS bobot FROM kriteria ORDER BY bobot DESC"
      ),
      db.query(
        "SELECT id_alternatif, nama_alternatif FROM alternatif ORDER BY id_alternatif DESC LIMIT 4"
      ),
      db.query(
        `(SELECT 'user_baru' AS type, id_user AS id, nama_user AS detail, id_user AS sort_key FROM users ORDER BY id_user DESC LIMIT 5)
         UNION ALL
         (SELECT 'kriteria_baru' AS type, id_kriteria AS id, nama_kriteria AS detail, id_kriteria AS sort_key FROM kriteria ORDER BY id_kriteria DESC LIMIT 5)
         UNION ALL
         (SELECT 'alternatif_baru' AS type, id_alternatif AS id, nama_alternatif AS detail, id_alternatif AS sort_key FROM alternatif ORDER BY id_alternatif DESC LIMIT 5)
         UNION ALL
         (SELECT 'penilaian_selesai' AS type, p.id_user AS id, u.nama_user AS detail, MAX(p.id_penilaian) AS sort_key
            FROM penilaian p
            JOIN users u ON p.id_user = u.id_user
            GROUP BY p.id_user, u.nama_user
            ORDER BY sort_key DESC LIMIT 5)
         ORDER BY sort_key DESC
         LIMIT 8`
      ),
    ]);

    const [
      [kriteriaRows],
      [subkriteriaRows],
      [alternatifRows],
      [userRows],
      [penilaianRows],
      [siswaRows],
      [avgBobotRows],
      [kriteriaJenisRows],
      [bobotRows],
      [alternatifTerbaruRows],
      [recentActivityRows],
    ] = results;

    const stats = {
      totalKriteria: toNumber(kriteriaRows?.[0]?.total),
      totalSubkriteria: toNumber(subkriteriaRows?.[0]?.total),
      totalAlternatif: toNumber(alternatifRows?.[0]?.total),
      totalUsers: toNumber(userRows?.[0]?.total),
      totalPenilaian: toNumber(penilaianRows?.[0]?.total),
      totalSiswa: toNumber(siswaRows?.[0]?.total),
      avgBobot: toNumber(avgBobotRows?.[0]?.avg_bobot, 0).toFixed(2),
    };

    const charts = {
      kriteriaJenis:
        kriteriaJenisRows?.length
          ? kriteriaJenisRows.map((row) => ({
              jenis: row.jenis,
              jumlah: toNumber(row.jumlah),
            }))
          : [
              { jenis: "Benefit", jumlah: 0 },
              { jenis: "Cost", jumlah: 0 },
            ],
      bobot:
        bobotRows?.length
          ? bobotRows.map((row) => ({
              nama_kriteria: row.nama_kriteria,
              bobot: toNumber(row.bobot),
            }))
          : [],
    };

    const latestPrograms =
      alternatifTerbaruRows?.map((row) => ({
        id: row.id_alternatif,
        nama: row.nama_alternatif,
      })) ?? [];

    const activities = [];
    const seenPenilaian = new Set();

    for (const activity of recentActivityRows ?? []) {
      const type = activity.type;
      const detail = escapeHtml(activity.detail);
      const sortKey = activity.sort_key;

      if (type === "penilaian_selesai") {
        if (seenPenilaian.has(activity.id)) continue;
        seenPenilaian.add(activity.id);
      }

      let icon = "ti ti-info-circle";
      let color = "secondary";
      let action = detail ? `Aktivitas: <strong>${detail}</strong>` : "Aktivitas terbaru";

      if (type === "user_baru") {
        icon = "ti ti-user-plus";
        color = "warning";
        action = `User baru registrasi: <strong>${detail}</strong>`;
      } else if (type === "kriteria_baru") {
        icon = "ti ti-article";
        color = "primary";
        action = `Kriteria baru ditambahkan: <strong>${detail}</strong>`;
      } else if (type === "alternatif_baru") {
        icon = "ti ti-building";
        color = "success";
        action = `Prodi baru ditambahkan: <strong>${detail}</strong>`;
      } else if (type === "penilaian_selesai") {
        icon = "ti ti-check";
        color = "info";
        action = `Siswa menyelesaikan penilaian: <strong>${detail}</strong>`;
      }

      activities.push({
        action,
        icon,
        color,
        time: sortKey ? `ID: ${sortKey}` : "",
      });

      if (activities.length >= 4) break;
    }

    if (!activities.length) {
      activities.push({
        action: "Belum ada aktivitas terbaru yang tercatat.",
        icon: "ti ti-info-circle",
        color: "secondary",
        time: "",
      });
    }

    return res.json({
      success: true,
      data: {
        stats,
        charts,
        activities,
        latestPrograms,
      },
    });
  } catch (error) {
    console.error("[dashboard] error", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat data dashboard." });
  }
});

export default router;
