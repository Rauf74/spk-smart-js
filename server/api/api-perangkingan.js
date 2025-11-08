import express from "express";
import {
  listStudents,
  getRankingByUser,
  getTablePerangkingan,
  getAlternatifTerbaik,
  getAlternatifByRank,
  getTotalAlternatifRanking,
  hasDataPerangkingan,
  getStatistikPerangkingan,
} from "../functions/perangkingan.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Guru BK"));

router.get("/students", async (_req, res) => {
  try {
    const data = await listStudents();
    res.json({ success: true, data });
  } catch (error) {
    console.error("[perangkingan] list-students", error);
    res
      .status(500)
      .json({ success: false, error: "Gagal memuat daftar siswa." });
  }
});

router.get("/students/:id_user/perangkingan", async (req, res) => {
  try {
    const data = await getTablePerangkingan(req.params.id_user);
    res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat data perangkingan.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

router.get("/students/:id_user/ranking", async (req, res) => {
  try {
    const data = await getRankingByUser(req.params.id_user);
    res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat ranking.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

router.get("/students/:id_user/top", async (req, res) => {
  try {
    const data = await getAlternatifTerbaik(req.params.id_user);
    if (!data) {
      return res
        .status(404)
        .json({ success: false, error: "Belum ada data perangkingan." });
    }
    res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat alternatif terbaik.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

router.get("/students/:id_user/rank/:rank", async (req, res) => {
  try {
    const data = await getAlternatifByRank(
      req.params.id_user,
      req.params.rank
    );
    if (!data) {
      return res
        .status(404)
        .json({ success: false, error: "Ranking yang diminta tidak ditemukan." });
    }
    res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat data ranking.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

router.get("/students/:id_user/total", async (req, res) => {
  try {
    const total = await getTotalAlternatifRanking(req.params.id_user);
    res.json({ success: true, total });
  } catch (error) {
    const message = error?.message || "Gagal memuat total alternatif.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

router.get("/students/:id_user/has-data", async (req, res) => {
  try {
    const hasData = await hasDataPerangkingan(req.params.id_user);
    res.json({ success: true, has_data: hasData });
  } catch (error) {
    const message = error?.message || "Gagal memeriksa data perangkingan.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

router.get("/students/:id_user/stats", async (req, res) => {
  try {
    const data = await getStatistikPerangkingan(req.params.id_user);
    res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat statistik perangkingan.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

export default router;
