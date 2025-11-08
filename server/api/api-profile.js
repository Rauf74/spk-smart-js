import express from "express";
import {
  getUserById,
  updateUserProfile,
  changeUserPassword,
  buildUserStats,
  buildRecentActivities,
} from "../functions/profile.js";
import { requireAuth, signAuthCookie } from "../middleware/auth.js";

const router = express.Router();

const buildAuthPayload = (user) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  role: user.role,
  nis: user.nis,
  jenis_kelamin: user.jenis_kelamin,
});

router.use(requireAuth);

router.get("/me", async (req, res) => {
  try {
    const user = await getUserById(req.auth?.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Pengguna tidak ditemukan." });
    }

    const stats = buildUserStats(user);
    const activities = buildRecentActivities(user);

    return res.json({
      success: true,
      data: {
        user,
        stats,
        activities,
      },
    });
  } catch (error) {
    console.error("[profile] GET /me", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal memuat data profil." });
  }
});

router.put("/me", async (req, res) => {
  try {
    const id_user = req.auth?.id;
    const user = await updateUserProfile(id_user, req.body || {});
    signAuthCookie(res, buildAuthPayload(user));
    return res.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      data: { user },
    });
  } catch (error) {
    console.error("[profile] PUT /me", error);
    const message = error?.message;
    if (message) {
      return res.status(400).json({ success: false, error: message });
    }
    return res
      .status(500)
      .json({ success: false, error: "Gagal memperbarui profil." });
  }
});

router.put("/me/password", async (req, res) => {
  try {
    const id_user = req.auth?.id;
    const { current_password, new_password, confirm_password } = req.body || {};

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        error: "Semua field password wajib diisi.",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        error: "Konfirmasi password tidak cocok.",
      });
    }

    await changeUserPassword(id_user, current_password, new_password);
    const user = await getUserById(id_user);
    if (user) signAuthCookie(res, buildAuthPayload(user));

    return res.json({ success: true, message: "Password berhasil diubah." });
  } catch (error) {
    console.error("[profile] PUT /me/password", error);
    const message = error?.message;
    if (message) {
      return res.status(400).json({ success: false, error: message });
    }
    return res
      .status(500)
      .json({ success: false, error: "Gagal mengubah password." });
  }
});

export default router;
