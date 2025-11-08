import express from "express";
import {
  listUsers,
  listStudents,
  createUser,
  updateUser,
  deleteUser,
} from "../functions/user.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("Guru BK"));

router.get("/", async (_req, res) => {
  try {
    const users = await listUsers();
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error("[user] list", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat data user." });
  }
});

router.get("/students", async (_req, res) => {
  try {
    const students = await listStudents();
    return res.json({ success: true, data: students });
  } catch (error) {
    console.error("[user] list-students", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat data siswa." });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = await createUser(req.body || {});
    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error("[user] create", error);
    const message = error?.message;
    if (message) {
      return res.status(400).json({ success: false, error: message });
    }
    return res
      .status(500)
      .json({ success: false, error: "Gagal menambahkan user." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body || {});
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error("[user] update", error);
    const message = error?.message;
    if (message) {
      return res.status(400).json({ success: false, error: message });
    }
    return res
      .status(500)
      .json({ success: false, error: "Gagal memperbarui user." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteUser(req.params.id, req.auth?.id);
    return res.json({ success: true });
  } catch (error) {
    console.error("[user] delete", error);
    const message = error?.message;
    if (message) {
      return res.status(400).json({ success: false, error: message });
    }
    return res
      .status(500)
      .json({ success: false, error: "Gagal menghapus user." });
  }
});

export default router;
