import express from "express";
import {
  getKriteriaForPerhitungan,
  getCombinedKriteriaData,
  getKriteriaList,
  getKriteriaById,
  getNilaiKriteriaAlternatif,
  getNilaiUtilityAlternatif,
  getRawUtilityData,
  getNilaiAkhirAlternatif,
  getSummaryTotals,
} from "../functions/perhitungan.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Guru BK"));

router.get("/kriteria", async (_req, res) => {
  try {
    const data = await getKriteriaForPerhitungan();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[perhitungan] list-kriteria", error);
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
    console.error("[perhitungan] combined-kriteria", error);
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
    console.error("[perhitungan] kriteria-header", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat header kriteria." });
  }
});

router.get("/kriteria/:id_kriteria", async (req, res) => {
  try {
    const detail = await getKriteriaById(req.params.id_kriteria);
    if (!detail) {
      return res
        .status(404)
        .json({ success: false, error: "Kriteria tidak ditemukan." });
    }
    return res.json({ success: true, data: detail });
  } catch (error) {
    const message = error?.message || "Gagal memuat detail kriteria.";
    const status = message.includes("tidak valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get("/students/:id_user/nilai-kriteria", async (req, res) => {
  try {
    const data = await getNilaiKriteriaAlternatif(req.params.id_user);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat nilai kriteria.";
    const status = message.includes("tidak valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get("/students/:id_user/nilai-utility", async (req, res) => {
  try {
    const data = await getNilaiUtilityAlternatif(req.params.id_user);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat nilai utility.";
    const status = message.includes("tidak valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get("/students/:id_user/nilai-utility/raw", async (req, res) => {
  try {
    const data = await getRawUtilityData(req.params.id_user);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat data utility.";
    const status = message.includes("tidak valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get("/students/:id_user/nilai-akhir", async (req, res) => {
  try {
    const data = await getNilaiAkhirAlternatif(req.params.id_user);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat nilai akhir.";
    const status = message.includes("tidak valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get("/summary", async (_req, res) => {
  try {
    const data = await getSummaryTotals();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[perhitungan] summary", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat ringkasan perhitungan." });
  }
});

export default router;
