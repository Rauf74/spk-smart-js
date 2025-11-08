// server/api/api-auth.js
import express from "express";
import db from "../config/db.js";
import { signAuthCookie, clearAuthCookie, verifyToken } from "../middleware/auth.js";

const router = express.Router();

const toTrimmed = (value) => String(value ?? "").trim();
const isEmpty = (value) => !value || value.trim().length === 0;

async function isDuplicateUsername(username) {
  const [rows] = await db.query("SELECT COUNT(*) AS total FROM users WHERE username = ?", [username]);
  return Number(rows?.[0]?.total || 0) > 0;
}

async function isDuplicateNis(nis) {
  const [rows] = await db.query("SELECT COUNT(*) AS total FROM users WHERE nis = ?", [nis]);
  return Number(rows?.[0]?.total || 0) > 0;
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const nama_user = toTrimmed(req.body?.nama_user);
    const username = toTrimmed(req.body?.username);
    const password = toTrimmed(req.body?.password);
    const nis = toTrimmed(req.body?.nis);
    const jenis_kelamin = toTrimmed(req.body?.jenis_kelamin);

    if (!nama_user || nama_user.length < 3) {
      return res.status(400).json({ success: false, error: "Nama lengkap minimal 3 karakter." });
    }
    if (!username || username.length < 3) {
      return res.status(400).json({ success: false, error: "Username minimal 3 karakter." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: "Password minimal 6 karakter." });
    }
    if (!nis) {
      return res.status(400).json({ success: false, error: "NIS wajib diisi." });
    }
    if (!jenis_kelamin) {
      return res.status(400).json({ success: false, error: "Jenis kelamin wajib dipilih." });
    }

    const [usernameExists, nisExists] = await Promise.all([
      isDuplicateUsername(username),
      isDuplicateNis(nis),
    ]);

    if (usernameExists) {
      return res.status(400).json({ success: false, error: "Username sudah digunakan." });
    }
    if (nisExists) {
      return res.status(400).json({ success: false, error: "NIS sudah terdaftar." });
    }

    const [rows] = await db.query(
      `INSERT INTO users (nama_user, username, password, role, nis, jenis_kelamin)
       VALUES (?, ?, ?, 'Siswa', ?, ?)
       RETURNING id_user` ,
      [nama_user, username, password, nis, jenis_kelamin]
    );

    return res.status(201).json({ success: true, data: { id: rows?.[0]?.id_user } });
  } catch (error) {
    console.error("[auth/register]", error);
    return res.status(500).json({ success: false, error: "Gagal mendaftarkan akun." });
  }
});

// POST /api/auth/login
// Body: { username, password }
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username & password wajib" });
    }

    // Kompatibel dengan PHP lama: password plaintext (nanti kita upgrade ke hash)
    const [rows] = await db.query(
      `SELECT id_user, nama_user, username, password, role, nis, jenis_kelamin
       FROM users
       WHERE username = ? AND password = ?
       LIMIT 1`,
      [username, password]
    );

    const user = rows?.[0];
    if (!user) {
      return res.status(401).json({ success: false, error: "Username atau password salah" });
    }

    // Update status login
    await db.query(`UPDATE users SET is_logged_in = TRUE WHERE id_user = ?`, [user.id_user]);

    const payload = {
      id: user.id_user,
      name: user.nama_user,
      username: user.username,
      role: user.role,
      nis: user.nis,
      jenis_kelamin: user.jenis_kelamin,
    };

    signAuthCookie(res, payload);
    return res.json({ success: true, user });
  } catch (e) {
    console.error("[auth/login]", e);
    return res.status(500).json({ success: false, error: "Error login" });
  }
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.json({ id: null, name: "Guest", role: "", jenis_kelamin: null });
    }
    const payload = verifyToken(token);
    return res.json(payload);
  } catch {
    return res.json({ id: null, name: "Guest", role: "", jenis_kelamin: null });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  try {
    try {
      const token = req.cookies?.token;
      if (token) {
        const p = verifyToken(token);
        if (p?.id) {
          await db.query(`UPDATE users SET is_logged_in = FALSE WHERE id_user = ?`, [p.id]);
        }
      }
    } catch {}
    clearAuthCookie(res);
    return res.json({ success: true });
  } catch (e) {
    console.error("[auth/logout]", e);
    return res.status(500).json({ success: false, error: "Error logout" });
  }
});

export default router;
