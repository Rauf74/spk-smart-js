import express from "express";
import {
  getRankingAlternatif,
  getDataPerangkingan,
  getAlternatifTerbaik,
  getAlternatifByRank,
  getTotalAlternatifRanking,
  hasDataPerangkingan,
  getStatistikPerangkingan,
} from "../functions/perangkingan-siswa.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Siswa"));

router.get("/perangkingan", async (req, res) => {
  try {
    const data = await getDataPerangkingan(req.auth.id);
    res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat data perangkingan.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

router.get("/ranking", async (req, res) => {
  try {
    const data = await getRankingAlternatif(req.auth.id);
    res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat data ranking.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

router.get("/top", async (req, res) => {
  try {
    const data = await getAlternatifTerbaik(req.auth.id);
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

router.get("/rank/:rank", async (req, res) => {
  try {
    const data = await getAlternatifByRank(req.auth.id, req.params.rank);
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

router.get("/total", async (req, res) => {
  try {
    const total = await getTotalAlternatifRanking(req.auth.id);
    res.json({ success: true, total });
  } catch (error) {
    const message = error?.message || "Gagal memuat total alternatif.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

router.get("/has-data", async (req, res) => {
  try {
    const hasData = await hasDataPerangkingan(req.auth.id);
    res.json({ success: true, has_data: hasData });
  } catch (error) {
    const message = error?.message || "Gagal memeriksa data perangkingan.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const data = await getStatistikPerangkingan(req.auth.id);
    res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat statistik perangkingan.";
    const status = message.includes("tidak valid") ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

export default router;
