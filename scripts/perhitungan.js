const normalizeBase = (base) => {
  if (!base) return "";
  const trimmed = String(base).trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const API_BASE = normalizeBase(window.BASE_API);
const API_PERHITUNGAN = `${API_BASE}/api/perhitungan`;
const API_STUDENTS = `${API_BASE}/api/users/students`;

let summaryData = {
  total_kriteria: 0,
  total_alternatif: 0,
  total_bobot: 0,
  total_normalisasi: 0,
};

let kriteriaList = [];
let currentStudentId = "";

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

const dataTableLanguage = (emptyTableMessage = "Tidak ada data yang tersedia") => ({
  search: "Cari:",
  lengthMenu: "Tampilkan _MENU_ data per halaman",
  zeroRecords: "Tidak ada data yang ditemukan",
  info: "Menampilkan halaman _PAGE_ dari _PAGES_",
  infoEmpty: "Tidak ada data yang tersedia",
  infoFiltered: "(disaring dari _MAX_ total data)",
  emptyTable: emptyTableMessage,
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
    console.error("[perhitungan] summary", error);
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
    console.error("[perhitungan] kriteria-header", error);
    kriteriaList = [];
  }
};

const loadStudentsDropdown = async () => {
  const $select = $("#siswaDropdown");
  $select.empty().append('<option value="">Pilih Siswa</option>');

  try {
    const response = await fetchJSON(API_STUDENTS);
    const students = Array.isArray(response?.data) ? response.data : [];

    if (students.length === 0) {
      $select.append('<option value="">Belum ada data siswa</option>');
      return;
    }

    students.forEach((student) => {
      const nis = student.nis ? ` (NIS: ${student.nis})` : "";
      $select.append(
        `<option value="${student.id_user}">${student.nama_user}${nis}</option>`
      );
    });
  } catch (error) {
    console.error("[perhitungan] list siswa", error);
    $select.append('<option value="">Gagal memuat data siswa</option>');
  }
};

const initCombinedTable = () => {
  tableCombined = $("#myTableCombinedKriteria").DataTable({
    ajax: (data, callback) => {
      const jqxhr = $.ajax({
        url: `${API_PERHITUNGAN}/kriteria/combined`,
        method: "GET",
        dataType: "json",
        xhrFields: { withCredentials: true },
        success: (response) => {
          const rows = Array.isArray(response?.data) ? response.data : [];
          callback({ data: rows });
        },
        error: (xhr, _status, error) => {
          console.error("[perhitungan] combined-kriteria", error);
          console.error("[perhitungan] response", xhr?.responseText);
          callback({ data: [] });
        },
      });
      return jqxhr;
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
    ajax: (data, callback) => {
      if (!currentStudentId) {
        callback({ data: [] });
        return { abort() {} };
      }

      const jqxhr = $.ajax({
        url: `${API_PERHITUNGAN}/students/${currentStudentId}/nilai-kriteria`,
        method: "GET",
        dataType: "json",
        xhrFields: { withCredentials: true },
        success: (response) => {
          const rows = Array.isArray(response?.data) ? response.data : [];
          callback({ data: rows });
        },
        error: (xhr, _status, error) => {
          console.error("[perhitungan] nilai-kriteria", error);
          console.error("[perhitungan] response", xhr?.responseText);
          callback({ data: [] });
        },
      });

      return jqxhr;
    },
    columns,
    responsive: true,
    autoWidth: false,
    language: dataTableLanguage("Pilih siswa untuk menampilkan data."),
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
    ajax: (data, callback) => {
      if (!currentStudentId) {
        callback({ data: [] });
        return { abort() {} };
      }

      const jqxhr = $.ajax({
        url: `${API_PERHITUNGAN}/students/${currentStudentId}/nilai-utility`,
        method: "GET",
        dataType: "json",
        xhrFields: { withCredentials: true },
        success: (response) => {
          const rows = Array.isArray(response?.data) ? response.data : [];
          callback({ data: rows });
        },
        error: (xhr, _status, error) => {
          console.error("[perhitungan] nilai-utility", error);
          console.error("[perhitungan] response", xhr?.responseText);
          callback({ data: [] });
        },
      });

      return jqxhr;
    },
    columns,
    responsive: true,
    autoWidth: false,
    language: dataTableLanguage("Pilih siswa untuk menampilkan data."),
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
    ajax: (data, callback) => {
      if (!currentStudentId) {
        callback({ data: [] });
        return { abort() {} };
      }

      const jqxhr = $.ajax({
        url: `${API_PERHITUNGAN}/students/${currentStudentId}/nilai-akhir`,
        method: "GET",
        dataType: "json",
        xhrFields: { withCredentials: true },
        success: (response) => {
          const rows = Array.isArray(response?.data) ? response.data : [];
          callback({ data: rows });
        },
        error: (xhr, _status, error) => {
          console.error("[perhitungan] nilai-akhir", error);
          console.error("[perhitungan] response", xhr?.responseText);
          callback({ data: [] });
        },
      });

      return jqxhr;
    },
    columns,
    responsive: true,
    autoWidth: false,
    language: dataTableLanguage("Pilih siswa untuk menampilkan data."),
  });
};

const initNilaiTables = () => {
  initNilaiKriteriaTable();
  initNilaiUtilityTable();
  initNilaiAkhirTable();
};

const reloadStudentTables = () => {
  if (tableNilaiKriteria) tableNilaiKriteria.ajax.reload();
  if (tableNilaiUtility) tableNilaiUtility.ajax.reload();
  if (tableNilaiAkhir) tableNilaiAkhir.ajax.reload();
};

const bindEvents = () => {
  $("#siswaDropdown").on("change", (event) => {
    currentStudentId = (event.target.value || "").trim();
    reloadStudentTables();
  });
};

const initializePage = async () => {
  await Promise.all([loadSummary(), loadKriteriaHeader()]);
  initCombinedTable();
  initNilaiTables();
  bindEvents();
  await loadStudentsDropdown();
};

$(document).ready(() => {
  initializePage().catch((error) => {
    console.error("[perhitungan] init page", error);
  });
});
