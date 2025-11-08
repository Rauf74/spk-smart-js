import express from "express";
import {
  listAllSubkriteria,
  listSubkriteriaByKriteria,
  getSubkriteriaById,
  createSubkriteria,
  updateSubkriteria,
  deleteSubkriteria,
} from "../functions/subkriteria.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Guru BK"));

router.get("/", async (req, res) => {
  try {
    const { id_kriteria } = req.query || {};
    const data = id_kriteria
      ? await listSubkriteriaByKriteria(id_kriteria)
      : await listAllSubkriteria();
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat data subkriteria.";
    const status = message.includes("tidak valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get("/:id_subkriteria", async (req, res) => {
  try {
    const subkriteria = await getSubkriteriaById(req.params.id_subkriteria);
    if (!subkriteria) {
      return res
        .status(404)
        .json({ success: false, error: "Data subkriteria tidak ditemukan." });
    }
    return res.json({ success: true, data: subkriteria });
  } catch (error) {
    const message = error?.message || "Gagal memuat data subkriteria.";
    const status = message.includes("tidak valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.post("/", async (req, res) => {
  try {
    const subkriteria = await createSubkriteria(req.body || {});
    return res.status(201).json({ success: true, data: subkriteria });
  } catch (error) {
    const message = error?.message || "Gagal menambahkan subkriteria.";
    return res.status(400).json({ success: false, error: message });
  }
});

router.put("/:id_subkriteria", async (req, res) => {
  try {
    const subkriteria = await updateSubkriteria(
      req.params.id_subkriteria,
      req.body || {}
    );
    return res.json({ success: true, data: subkriteria });
  } catch (error) {
    const message = error?.message || "Gagal memperbarui subkriteria.";
    const status = message.includes("tidak ditemukan") ? 404 : 400;
    return res.status(status).json({ success: false, error: message });
  }
});

router.delete("/:id_subkriteria", async (req, res) => {
  try {
    await deleteSubkriteria(req.params.id_subkriteria);
    return res.json({ success: true });
  } catch (error) {
    const message = error?.message || "Gagal menghapus subkriteria.";
    const status = message.includes("tidak ditemukan") ? 404 : 400;
    return res.status(status).json({ success: false, error: message });
  }
});

export default router;
