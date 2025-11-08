import express from "express";
import {
  getKriteriaForPerhitungan,
  getCombinedKriteriaData,
  getKriteriaList,
  getNilaiKriteriaAlternatif,
  getNilaiUtilityAlternatif,
  getRawUtilityData,
  getNilaiAkhirAlternatif,
  getSummaryTotals,
} from "../functions/perhitungan-siswa.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Siswa"));

router.get("/kriteria", async (_req, res) => {
  try {
    const data = await getKriteriaForPerhitungan();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[perhitungan-siswa] list-kriteria", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat data kriteria." });
  }
});

router.get("/kriteria/combined", async (_req, res) => {
  try {
    const data = await getCombinedKriteriaData();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[perhitungan-siswa] combined-kriteria", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat data bobot kriteria." });
  }
});

router.get("/kriteria/header", async (_req, res) => {
  try {
    const data = await getKriteriaList();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[perhitungan-siswa] header", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat header kriteria." });
  }
});

router.get("/nilai-kriteria", async (req, res) => {
  try {
    const data = await getNilaiKriteriaAlternatif(req.auth.id);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat nilai kriteria.";
    return res.status(500).json({ success: false, error: message });
  }
});

router.get("/nilai-utility", async (req, res) => {
  try {
    const data = await getNilaiUtilityAlternatif(req.auth.id);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat nilai utility.";
    return res.status(500).json({ success: false, error: message });
  }
});

router.get("/nilai-utility/raw", async (req, res) => {
  try {
    const data = await getRawUtilityData(req.auth.id);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat data utility.";
    return res.status(500).json({ success: false, error: message });
  }
});

router.get("/nilai-akhir", async (req, res) => {
  try {
    const data = await getNilaiAkhirAlternatif(req.auth.id);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat nilai akhir.";
    return res.status(500).json({ success: false, error: message });
  }
});

router.get("/summary", async (_req, res) => {
  try {
    const data = await getSummaryTotals();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[perhitungan-siswa] summary", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat ringkasan perhitungan." });
  }
});

export default router;
