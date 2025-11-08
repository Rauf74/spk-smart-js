import express from "express";
import {
  listAlternatif,
  getAlternatifById,
  createAlternatif,
  updateAlternatif,
  deleteAlternatif,
} from "../functions/alternatif.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Guru BK"));

router.get("/", async (_req, res) => {
  try {
    const data = await listAlternatif();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[alternatif] list", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat data alternatif." });
  }
});

router.get("/:id_alternatif", async (req, res) => {
  try {
    const alternatif = await getAlternatifById(req.params.id_alternatif);
    if (!alternatif) {
      return res
        .status(404)
        .json({ success: false, error: "Data alternatif tidak ditemukan." });
    }
    return res.json({ success: true, data: alternatif });
  } catch (error) {
    const message = error?.message || "Gagal memuat data alternatif.";
    const status = message.includes("tidak valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.post("/", async (req, res) => {
  try {
    const alternatif = await createAlternatif(req.body || {});
    return res.status(201).json({ success: true, data: alternatif });
  } catch (error) {
    const message = error?.message || "Gagal menambahkan alternatif.";
    return res.status(400).json({ success: false, error: message });
  }
});

router.put("/:id_alternatif", async (req, res) => {
  try {
    const alternatif = await updateAlternatif(req.params.id_alternatif, req.body || {});
    return res.json({ success: true, data: alternatif });
  } catch (error) {
    const message = error?.message || "Gagal memperbarui alternatif.";
    const status = message.includes("tidak ditemukan") ? 404 : 400;
    return res.status(status).json({ success: false, error: message });
  }
});

router.delete("/:id_alternatif", async (req, res) => {
  try {
    await deleteAlternatif(req.params.id_alternatif);
    return res.json({ success: true });
  } catch (error) {
    const message = error?.message || "Gagal menghapus alternatif.";
    const status = message.includes("tidak ditemukan") ? 404 : 400;
    return res.status(status).json({ success: false, error: message });
  }
});

export default router;
