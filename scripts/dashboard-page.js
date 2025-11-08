import { requireAuth, getCurrentUser } from "./auth-guard.js";
import { initDashboard } from "./dashboard.js";

const selectors = {
  welcomeName: "#welcomeName",
  totalKriteria: "#statTotalKriteria",
  totalSubkriteria: "#statTotalSubkriteria",
  totalAlternatif: "#statTotalAlternatif",
  totalPenilaian: "#statTotalPenilaian",
  totalSiswa: "#statTotalSiswa",
  totalUsers: "#statTotalUsers",
  avgBobot: "#avgBobotValue",
  activities: "#recentActivities",
  latestPrograms: "#latestPrograms",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function renderStats(stats) {
  setText(selectors.totalKriteria, stats.totalKriteria ?? "0");
  setText(selectors.totalSubkriteria, stats.totalSubkriteria ?? "0");
  setText(selectors.totalAlternatif, stats.totalAlternatif ?? "0");
  setText(selectors.totalPenilaian, stats.totalPenilaian ?? "0");
  setText(selectors.totalSiswa, stats.totalSiswa ?? "0");
  setText(selectors.totalUsers, stats.totalUsers ?? "0");
  setText(selectors.avgBobot, stats.avgBobot ?? "0.00");
}

function renderActivities(activities = []) {
  const container = document.querySelector(selectors.activities);
  if (!container) return;

  container.innerHTML = "";

  activities.forEach((activity) => {
    const item = document.createElement("div");
    item.className = "d-flex align-items-center pb-9 activity-item";
    item.innerHTML = `
      <span class="me-3 round-48 bg-light-${activity.color} rounded-circle d-flex align-items-center justify-content-center">
        <i class="${activity.icon} text-${activity.color}"></i>
      </span>
      <div>
        <h6 class="mb-1 fw-semibold fs-3">${activity.action}</h6>
        <p class="mb-0 text-muted">${activity.time ?? ""}</p>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderLatestPrograms(programs = []) {
  const container = document.querySelector(selectors.latestPrograms);
  if (!container) return;

  container.innerHTML = "";

  if (!programs.length) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="ti ti-building-store fs-4 text-muted"></i>
        <p class="mb-0 text-muted">Belum ada program studi</p>
      </div>
    `;
    return;
  }

  programs.slice(0, 4).forEach((program) => {
    const item = document.createElement("div");
    item.className = "d-flex align-items-center pb-9";
    const name = escapeHtml(program.nama ?? "Program Studi");
    item.innerHTML = `
      <span class="me-3 round-48 bg-light-success rounded-circle d-flex align-items-center justify-content-center">
        <i class="ti ti-building text-success"></i>
      </span>
      <div>
        <h6 class="mb-1 fw-semibold fs-3">${name}</h6>
        <p class="mb-0 text-muted">Program Studi</p>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderQuickActions(role) {
  const guru = document.querySelector("#quickActionsGuru");
  const siswa = document.querySelector("#quickActionsSiswa");
  if (guru) guru.hidden = role !== "Guru BK";
  if (siswa) siswa.hidden = role !== "Siswa";
}

async function fetchDashboardData() {
  const response = await fetch("/api/dashboard", { credentials: "include" });
  if (!response.ok) throw new Error("Gagal memuat data dashboard.");
  const json = await response.json();
  if (!json.success) throw new Error(json.error || "Gagal memuat data dashboard.");
  return json.data;
}

async function bootstrap() {
  const { redirected, user } = await requireAuth();
  if (redirected) return;

  const currentUser = user ?? (await getCurrentUser());
  const displayName = currentUser?.name || "Pengguna";
  setText(selectors.welcomeName, displayName);
  renderQuickActions(currentUser?.role || "");
  const programLink = document.querySelector("[data-program-link]");
  if (programLink) {
    programLink.setAttribute("href", "/views/alternatif.php");
  }

  try {
    const data = await fetchDashboardData();
    renderStats(data.stats || {});
    renderActivities(data.activities || []);
    renderLatestPrograms(data.latestPrograms || []);
    initDashboard(
      data.charts?.kriteriaJenis || [],
      data.charts?.bobot || [],
      Number(data.stats?.totalUsers ?? 0)
    );
  } catch (error) {
    console.error("[dashboard-page] gagal memuat data", error);
    renderActivities([
      {
        action: "Tidak dapat memuat aktivitas terbaru.",
        icon: "ti ti-alert-triangle",
        color: "danger",
        time: error.message || "",
      },
    ]);
    renderLatestPrograms([]);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bootstrap();
});
