import express from "express";
import { list, create, update, remove } from "../functions/kriteria.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Guru BK"));

router.get("/", async (_req, res) => {
  try {
    const rows = await list();
    res.json(rows);
  } catch (err) {
    console.error("[kriteria] list", err);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = await create(req.body || {});
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err?.message || "Gagal membuat data" });
  }
});

router.put("/:id_kriteria", async (req, res) => {
  try {
    const data = await update(req.params.id_kriteria, req.body || {});
    res.json({ success: true, data });
  } catch (err) {
    const message = err?.message || "Gagal memperbarui data";
    const isNotFound = message.includes("tidak ditemukan");
    res.status(isNotFound ? 404 : 400).json({ success: false, error: message });
  }
});

router.delete("/:id_kriteria", async (req, res) => {
  try {
    const result = await remove(req.params.id_kriteria);
    res.json({ success: true, ...result });
  } catch (err) {
    const message = err?.message || "Gagal menghapus data";
    const isNotFound = message.includes("tidak ditemukan");
    res.status(isNotFound ? 404 : 400).json({ success: false, error: message });
  }
});

export default router;
