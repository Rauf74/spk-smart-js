import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

// Import API
import authAPI from "./api/api-auth.js";
import kriteriaAPI from "./api/api-kriteria.js";
import subkriteriaAPI from "./api/api-subkriteria.js";
import alternatifAPI from "./api/api-alternatif.js";
import pertanyaanAPI from "./api/api-pertanyaan.js";
import penilaianAPI from "./api/api-penilaian.js";
import penilaianSiswaAPI from "./api/api-penilaian-siswa.js";
import perhitunganAPI from "./api/api-perhitungan.js";
import perhitunganSiswaAPI from "./api/api-perhitungan-siswa.js";
import perangkinganAPI from "./api/api-perangkingan.js";
import perangkinganSiswaAPI from "./api/api-perangkingan-siswa.js";
import dashboardAPI from "./api/api-dashboard.js";
import profileAPI from "./api/api-profile.js";
import userAPI from "./api/api-user.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Middleware Umum
app.use(cors({ origin: "true", credentials: true }));
app.use(express.json());
app.use(cookieParser());

//Folder Assets & Scripts & Views (Static Files)
app.use(
  "/assets",
  express.static(path.join(__dirname, "..", "assets"), {
    fallthrough: true,
  })
);
app.use("/scripts", express.static(path.join(__dirname, "..", "scripts")));
app.use("/views", express.static(path.join(__dirname, "..", "views")));
app.use("/components", express.static(path.join(__dirname, "..", "components")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "login.html"));
});

// Mount API (mirip server/api/*.php)
app.use("/api/auth", authAPI);
app.use("/api/kriteria", kriteriaAPI);
app.use("/api/subkriteria", subkriteriaAPI);
app.use("/api/alternatif", alternatifAPI);
app.use("/api/pertanyaan", pertanyaanAPI);
app.use("/api/penilaian", penilaianAPI);
app.use("/api/penilaian-siswa", penilaianSiswaAPI);
app.use("/api/perhitungan", perhitunganAPI);
app.use("/api/perhitungan-siswa", perhitunganSiswaAPI);
app.use("/api/perangkingan", perangkinganAPI);
app.use("/api/perangkingan-siswa", perangkinganSiswaAPI);
app.use("/api/dashboard", dashboardAPI);
app.use("/api/profile", profileAPI);
app.use("/api/users", userAPI);

export default app;
