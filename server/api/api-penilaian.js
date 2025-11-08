import express from "express";
import {
  getSiswaWithPenilaian,
  getAllPenilaianByUser,
  getPenilaianByAlternatifAndUser,
  deletePenilaianByAlternatifAndUser,
  getPertanyaanByAlternatif,
  getSubkriteriaByKriteria,
  savePenilaian,
} from "../functions/penilaian.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Guru BK"));

router.get("/students", async (_req, res) => {
  try {
    const data = await getSiswaWithPenilaian();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[penilaian] get students", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat daftar siswa." });
  }
});

router.get("/users/:id_user/alternatif", async (req, res) => {
  try {
    const data = await getAllPenilaianByUser(req.params.id_user);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Gagal memuat data penilaian.";
    const status = message.includes("valid") ? 400 : 500;
    return res.status(status).json({ success: false, error: message });
  }
});

router.get(
  "/users/:id_user/alternatif/:id_alternatif",
  async (req, res) => {
    try {
      const data = await getPenilaianByAlternatifAndUser(
        req.params.id_alternatif,
        req.params.id_user
      );
      return res.json({ success: true, data });
    } catch (error) {
      const message = error?.message || "Gagal memuat detail penilaian.";
      const status = message.includes("valid") ? 400 : 500;
      return res.status(status).json({ success: false, error: message });
    }
  }
);

router.put(
  "/users/:id_user/alternatif/:id_alternatif",
  async (req, res) => {
    const penilaianData = req.body?.penilaian;
    const altIdParam = Number(req.params.id_alternatif);

    if (!Array.isArray(penilaianData) || penilaianData.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Data penilaian wajib diisi.",
      });
    }

    const invalidAlt = penilaianData.some(
      (item) => Number(item?.id_alternatif) !== altIdParam
    );
    if (invalidAlt) {
      return res.status(400).json({
        success: false,
        error: "Alternatif pada data tidak sesuai.",
      });
    }

    try {
      await savePenilaian(
        penilaianData,
        req.params.id_user
      );
      return res.json({ success: true });
    } catch (error) {
      const message = error?.message || "Gagal menyimpan penilaian.";
      const status =
        message.includes("harus") || message.includes("valid") ? 400 : 500;
      return res.status(status).json({ success: false, error: message });
    }
  }
);

router.delete(
  "/users/:id_user/alternatif/:id_alternatif",
  async (req, res) => {
    try {
      await deletePenilaianByAlternatifAndUser(
        req.params.id_alternatif,
        req.params.id_user
      );
      return res.json({ success: true });
    } catch (error) {
      const message = error?.message || "Gagal menghapus penilaian.";
      const status = message.includes("valid") ? 400 : 500;
      return res.status(status).json({ success: false, error: message });
    }
  }
);

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

export default router;
