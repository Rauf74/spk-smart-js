import express from "express";
import {
  listAllPertanyaan,
  listPertanyaanByAlternatif,
  getPertanyaanById,
  createPertanyaan,
  updatePertanyaan,
  deletePertanyaan,
  listKriteriaOptions,
  listAlternatifOptions,
} from "../functions/pertanyaan.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Guru BK"));

router.get("/", async (req, res) => {
  try {
    const { id_alternatif } = req.query || {};
    const data = id_alternatif
      ? await listPertanyaanByAlternatif(id_alternatif)
      : await listAllPertanyaan();
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat data pertanyaan.";
    const status = message.includes("tidak valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get("/options/kriteria", async (_req, res) => {
  try {
    const data = await listKriteriaOptions();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[pertanyaan] kriteria-options", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat data kriteria." });
  }
});

router.get("/options/alternatif", async (_req, res) => {
  try {
    const data = await listAlternatifOptions();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[pertanyaan] alternatif-options", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat data alternatif." });
  }
});

router.post("/", async (req, res) => {
  try {
    const pertanyaan = await createPertanyaan(req.body || {});
    return res.status(201).json({ success: true, data: pertanyaan });
  } catch (error) {
    const message = error?.message || "Gagal menambahkan pertanyaan.";
    return res.status(400).json({ success: false, error: message });
  }
});

router.get("/:id_pertanyaan", async (req, res) => {
  try {
    const pertanyaan = await getPertanyaanById(req.params.id_pertanyaan);
    if (!pertanyaan) {
      return res
        .status(404)
        .json({ success: false, error: "Data pertanyaan tidak ditemukan." });
    }
    return res.json({ success: true, data: pertanyaan });
  } catch (error) {
    const message = error?.message || "Gagal memuat data pertanyaan.";
    const status = message.includes("tidak valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.put("/:id_pertanyaan", async (req, res) => {
  try {
    const pertanyaan = await updatePertanyaan(req.params.id_pertanyaan, req.body || {});
    return res.json({ success: true, data: pertanyaan });
  } catch (error) {
    const message = error?.message || "Gagal memperbarui pertanyaan.";
    const status = message.includes("tidak ditemukan") ? 404 : 400;
    return res.status(status).json({ success: false, error: message });
  }
});

router.delete("/:id_pertanyaan", async (req, res) => {
  try {
    await deletePertanyaan(req.params.id_pertanyaan);
    return res.json({ success: true });
  } catch (error) {
    const message = error?.message || "Gagal menghapus pertanyaan.";
    const status = message.includes("tidak ditemukan") ? 404 : 400;
    return res.status(status).json({ success: false, error: message });
  }
});

export default router;
