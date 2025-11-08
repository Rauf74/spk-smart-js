import express from "express";
import {
  getAllPenilaianByUser,
  getPenilaianByAlternatifAndUser,
  getPertanyaanByAlternatif,
  getSubkriteriaByKriteria,
} from "../functions/penilaian.js";
import { savePenilaian } from "../functions/penilaian-siswa.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Siswa"));

router.get("/alternatif", async (req, res) => {
  try {
    const data = await getAllPenilaianByUser(req.auth.id);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat data penilaian.";
    const status = message.includes("valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get("/alternatif/:id_alternatif", async (req, res) => {
  try {
    const data = await getPenilaianByAlternatifAndUser(
      req.params.id_alternatif,
      req.auth.id
    );
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat detail penilaian.";
    const status = message.includes("valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get("/alternatif/:id_alternatif/pertanyaan", async (req, res) => {
  try {
    const data = await getPertanyaanByAlternatif(req.params.id_alternatif);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat pertanyaan.";
    const status = message.includes("valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get("/kriteria/:id_kriteria/subkriteria", async (req, res) => {
  try {
    const data = await getSubkriteriaByKriteria(req.params.id_kriteria);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat subkriteria.";
    const status = message.includes("valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.put("/", async (req, res) => {
  const penilaianData = req.body?.penilaian;
  if (!Array.isArray(penilaianData) || penilaianData.length === 0) {
    return res
      .status(400)
      .json({ success: false, error: "Data penilaian wajib diisi." });
  }

  try {
    await savePenilaian(penilaianData, req.auth.id);
    return res.json({ success: true });
  } catch (error) {
    const message = error?.message || "Gagal menyimpan penilaian.";
    const status =
      message.includes("valid") || message.includes("wajib") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

export default router;
