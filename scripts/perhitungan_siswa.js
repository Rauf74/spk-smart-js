const normalizeBase = (base) => {
  if (!base) return "";
  const trimmed = String(base).trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const API_BASE = normalizeBase(window.BASE_API);
const API_PERHITUNGAN = `${API_BASE}/api/perhitungan-siswa`;

let summaryData = {
  total_kriteria: 0,
  total_alternatif: 0,
  total_bobot: 0,
  total_normalisasi: 0,
};

let kriteriaList = [];

let tableCombined = null;
let tableNilaiKriteria = null;
let tableNilaiUtility = null;
let tableNilaiAkhir = null;

const fetchJSON = async (url, options = {}) => {
  const config = { credentials: "include", ...options };
  const headers = { ...(config.headers || {}) };

  if (config.body && typeof config.body !== "string") {
    headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }

  config.headers = headers;

  const response = await fetch(url, config);
  const text = await response.text();

  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.warn("Gagal parse JSON:", err);
    }
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      "Permintaan ke server gagal.";
    throw new Error(message);
  }

  return data;
};

const formatNumber = (value, decimals = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return (0).toFixed(decimals);
  return num.toFixed(decimals);
};

const dataTableLanguage = (emptyMessage = "Data belum tersedia.") => ({
  search: "Cari:",
  lengthMenu: "Tampilkan _MENU_ data per halaman",
  zeroRecords: "Tidak ada data yang ditemukan",
  info: "Menampilkan halaman _PAGE_ dari _PAGES_",
  infoEmpty: "Tidak ada data yang tersedia",
  infoFiltered: "(disaring dari _MAX_ total data)",
  emptyTable: emptyMessage,
  paginate: {
    first: "Pertama",
    last: "Terakhir",
    next: "Selanjutnya",
    previous: "Sebelumnya",
  },
});

const renderEmptyPlaceholder = (selector, message) => {
  const $tbody = $(`${selector} tbody`);
  const columnCount = $(`${selector} thead th`).length || 1;
  $tbody.html(
    `<tr><td colspan="${columnCount}" class="text-center text-muted">${message}</td></tr>`
  );
};

const renderDynamicHeader = (selector, labelBuilder, finalColumnLabel = "") => {
  let headerHtml = "<tr><th>No</th><th>Nama Alternatif</th>";
  if (kriteriaList.length > 0 && typeof labelBuilder === "function") {
    headerHtml += kriteriaList
      .map((kriteria) => `<th>${labelBuilder(kriteria)}</th>`)
      .join("");
  }
  if (finalColumnLabel) {
    headerHtml += `<th>${finalColumnLabel}</th>`;
  }
  headerHtml += "</tr>";
  $(`${selector} thead`).html(headerHtml);
};

const appendCombinedSummaryRows = () => {
  if (!tableCombined) return;
  const $tbody = $("#myTableCombinedKriteria tbody");
  $tbody.find("tr.summary-row").remove();

  const totalBobot = formatNumber(summaryData.total_bobot, 2);
  const totalNormalisasi = formatNumber(summaryData.total_normalisasi, 2);

  const totalBobotRow = `
    <tr class="summary-row table-warning fw-bold">
      <td colspan="4" class="text-center">Total Bobot</td>
      <td class="text-center">${totalBobot}</td>
      <td></td>
    </tr>
  `;

  const totalNormalisasiRow = `
    <tr class="summary-row table-success fw-bold">
      <td colspan="5" class="text-center">Total Normalisasi</td>
      <td class="text-center">${totalNormalisasi}</td>
    </tr>
  `;

  $tbody.append(totalBobotRow).append(totalNormalisasiRow);
};

const loadSummary = async () => {
  try {
    const response = await fetchJSON(`${API_PERHITUNGAN}/summary`);
    summaryData = response?.data || summaryData;
  } catch (error) {
    console.error("[perhitungan-siswa] summary", error);
    summaryData = {
      total_kriteria: 0,
      total_alternatif: 0,
      total_bobot: 0,
      total_normalisasi: 0,
    };
  }

  $("#totalKriteria").text(summaryData.total_kriteria ?? 0);
  $("#totalAlternatif").text(summaryData.total_alternatif ?? 0);
  $("#totalBobotDisplay").text(formatNumber(summaryData.total_bobot, 2));
  $("#totalNormalisasiDisplay").text(
    formatNumber(summaryData.total_normalisasi, 2)
  );

  appendCombinedSummaryRows();
};

const loadKriteriaHeader = async () => {
  try {
    const response = await fetchJSON(`${API_PERHITUNGAN}/kriteria/header`);
    kriteriaList = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    console.error("[perhitungan-siswa] kriteria-header", error);
    kriteriaList = [];
  }
};

const initCombinedTable = () => {
  tableCombined = $("#myTableCombinedKriteria").DataTable({
    ajax: async (_data, callback) => {
      try {
        const response = await fetchJSON(`${API_PERHITUNGAN}/kriteria/combined`);
        const rows = Array.isArray(response?.data) ? response.data : [];
        callback({ data: rows });
      } catch (error) {
        console.error("[perhitungan-siswa] combined-kriteria", error);
        callback({ data: [] });
      }
    },
    columns: [
      {
        data: null,
        className: "text-center",
        render: (_data, _type, _row, meta) => meta.row + 1,
      },
      { data: "kode_kriteria", className: "text-center" },
      { data: "nama_kriteria", className: "text-center" },
      { data: "jenis", className: "text-center" },
      {
        data: "bobot",
        className: "text-center",
        render: (val) => formatNumber(val, 2),
      },
      {
        data: "normalisasi",
        className: "text-center",
        render: (val) => formatNumber(val, 2),
      },
    ],
    responsive: true,
    autoWidth: false,
    language: dataTableLanguage(),
    drawCallback: appendCombinedSummaryRows,
  });
};

const initNilaiKriteriaTable = () => {
  renderDynamicHeader("#myTableNilaiKriteria", (kriteria) => kriteria.kode_kriteria);

  if (kriteriaList.length === 0) {
    renderEmptyPlaceholder("#myTableNilaiKriteria", "Belum ada data kriteria.");
    return;
  }

  const columns = [
    {
      data: null,
      className: "text-center",
      render: (_data, _type, _row, meta) => meta.row + 1,
    },
    { data: "nama_alternatif", className: "text-center" },
    ...kriteriaList.map((kriteria) => ({
      data: kriteria.kode_kriteria,
      className: "text-center",
      defaultContent: 0,
      render: (val) => formatNumber(val, 2),
    })),
  ];

  tableNilaiKriteria = $("#myTableNilaiKriteria").DataTable({
    ajax: async (_data, callback) => {
      try {
        const response = await fetchJSON(`${API_PERHITUNGAN}/nilai-kriteria`);
        const rows = Array.isArray(response?.data) ? response.data : [];
        callback({ data: rows });
      } catch (error) {
        console.error("[perhitungan-siswa] nilai-kriteria", error);
        callback({ data: [] });
      }
    },
    columns,
    responsive: true,
    autoWidth: false,
    language: dataTableLanguage("Data penilaian belum tersedia."),
  });
};

const initNilaiUtilityTable = () => {
  renderDynamicHeader(
    "#myTableNilaiUtility",
    (kriteria) => `Nilai Utility ${kriteria.kode_kriteria}`
  );

  if (kriteriaList.length === 0) {
    renderEmptyPlaceholder("#myTableNilaiUtility", "Belum ada data kriteria.");
    return;
  }

  const columns = [
    {
      data: null,
      className: "text-center",
      render: (_data, _type, _row, meta) => meta.row + 1,
    },
    { data: "nama_alternatif", className: "text-center" },
    ...kriteriaList.map((kriteria) => ({
      data: kriteria.kode_kriteria,
      className: "text-center",
      defaultContent: 0,
      render: (val) => formatNumber(val, 2),
    })),
  ];

  tableNilaiUtility = $("#myTableNilaiUtility").DataTable({
    ajax: async (_data, callback) => {
      try {
        const response = await fetchJSON(`${API_PERHITUNGAN}/nilai-utility`);
        const rows = Array.isArray(response?.data) ? response.data : [];
        callback({ data: rows });
      } catch (error) {
        console.error("[perhitungan-siswa] nilai-utility", error);
        callback({ data: [] });
      }
    },
    columns,
    responsive: true,
    autoWidth: false,
    language: dataTableLanguage("Data penilaian belum tersedia."),
  });
};

const initNilaiAkhirTable = () => {
  renderDynamicHeader(
    "#myTableNilaiAkhir",
    (kriteria) => kriteria.kode_kriteria,
    "Nilai Akhir"
  );

  if (kriteriaList.length === 0) {
    renderEmptyPlaceholder("#myTableNilaiAkhir", "Belum ada data kriteria.");
    return;
  }

  const columns = [
    {
      data: null,
      className: "text-center",
      render: (_data, _type, _row, meta) => meta.row + 1,
    },
    { data: "nama_alternatif", className: "text-center" },
    ...kriteriaList.map((kriteria) => ({
      data: kriteria.kode_kriteria,
      className: "text-center",
      defaultContent: 0,
      render: (val) => formatNumber(val, 2),
    })),
    {
      data: "nilai_akhir",
      className: "text-center fw-bold",
      render: (val) =>
        `<span class="badge bg-primary">${formatNumber(val, 2)}</span>`,
    },
  ];

  tableNilaiAkhir = $("#myTableNilaiAkhir").DataTable({
    ajax: async (_data, callback) => {
      try {
        const response = await fetchJSON(`${API_PERHITUNGAN}/nilai-akhir`);
        const rows = Array.isArray(response?.data) ? response.data : [];
        callback({ data: rows });
      } catch (error) {
        console.error("[perhitungan-siswa] nilai-akhir", error);
        callback({ data: [] });
      }
    },
    columns,
    responsive: true,
    autoWidth: false,
    language: dataTableLanguage("Data penilaian belum tersedia."),
  });
};

const initNilaiTables = () => {
  initNilaiKriteriaTable();
  initNilaiUtilityTable();
  initNilaiAkhirTable();
};

const initializePage = async () => {
  await Promise.all([loadSummary(), loadKriteriaHeader()]);
  initCombinedTable();
  initNilaiTables();
};

$(document).ready(() => {
  initializePage().catch((error) =>
    console.error("[perhitungan-siswa] init page", error)
  );
});
