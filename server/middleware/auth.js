import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

export function signAuthCookie(res, payload, options = {}) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    ...options,
  });
  return token;
}

export function clearAuthCookie(res, options = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    ...options,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Sesi tidak ditemukan." });
    }
    const payload = verifyToken(token);
    req.auth = payload;
    next();
  } catch (_err) {
    return res
      .status(401)
      .json({
        success: false,
        error: "Sesi kedaluwarsa, silakan login kembali.",
      });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.auth?.role) {
      return res
        .status(403)
        .json({ success: false, error: "Akses ditolak." });
    }
    if (req.auth.role !== role) {
      return res
        .status(403)
        .json({ success: false, error: "Akses ditolak untuk peran ini." });
    }
    next();
  };
}

export function requireRoles(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [];
  return (req, res, next) => {
    if (!req.auth?.role) {
      return res
        .status(403)
        .json({ success: false, error: "Akses ditolak." });
    }
    if (!allowed.includes(req.auth.role)) {
      return res
        .status(403)
        .json({ success: false, error: "Akses ditolak untuk peran ini." });
    }
    next();
  };
}

export { JWT_SECRET };
