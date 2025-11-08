const normalizeBase = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const API_BASE = normalizeBase(window.BASE_API);
const API_PERANGKINGAN = `${API_BASE}/api/perangkingan-siswa`;

let dataTable = null;

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return (0).toFixed(digits);
  return num.toFixed(digits);
};

const fetchJSON = (url) =>
  $.ajax({
    url,
    method: "GET",
    dataType: "json",
    xhrFields: { withCredentials: true },
  });

const updateStats = (stats = null) => {
  $("#totalAlternatif").text(stats?.total_alternatif ?? "-");
  $("#nilaiTertinggi").text(stats ? formatNumber(stats.nilai_tertinggi) : "-");
  $("#nilaiTerendah").text(stats ? formatNumber(stats.nilai_terendah) : "-");
  $("#rataRata").text(stats ? formatNumber(stats.rata_rata) : "-");
};

const updateBestAlternative = (data = null) => {
  const container = $("#alternatifTerbaik");
  if (!data) {
    container.empty();
    return;
  }

  container.html(`
    <div class="alert alert-success mb-0">
      <h5 class="mb-3"><i class="fas fa-trophy me-2"></i>Alternatif Terbaik</h5>
      <p class="fs-5 mb-1 text-black"><strong>Kode:</strong> ${data.kode_alternatif}</p>
      <p class="fs-5 mb-1 text-black"><strong>Nama:</strong> ${data.nama_alternatif}</p>
      <p class="fs-5 mb-0 text-black"><strong>Nilai Akhir:</strong> ${formatNumber(data.nilai_akhir)}</p>
    </div>
  `);
};

const toggleNoDataState = (hasData) => {
  $("#noDataMessage").toggleClass("d-none", hasData);
  $("#tableContainer").toggleClass("d-none", !hasData);
  if (!hasData) {
    updateStats(null);
    updateBestAlternative(null);
  }
};

const loadStats = async () => {
  try {
    const response = await fetchJSON(`${API_PERANGKINGAN}/stats`);
    updateStats(response?.data);
  } catch (error) {
    console.error("[perangkingan-siswa] stats", error);
    updateStats(null);
  }
};

const loadBestAlternative = async () => {
  try {
    const response = await fetchJSON(`${API_PERANGKINGAN}/top`);
    updateBestAlternative(response?.data);
  } catch (error) {
    if (error?.status === 404) {
      updateBestAlternative(null);
      return;
    }
    console.error("[perangkingan-siswa] top", error);
    updateBestAlternative(null);
  }
};

const checkHasData = async () => {
  try {
    const response = await fetchJSON(`${API_PERANGKINGAN}/has-data`);
    const hasData = Boolean(response?.has_data);
    toggleNoDataState(hasData);
    return hasData;
  } catch (error) {
    console.error("[perangkingan-siswa] has-data", error);
    toggleNoDataState(false);
    return false;
  }
};

const buildTable = () => {
  dataTable = $("#myTablePerangkingan").DataTable({
    ajax: (_data, callback) => {
      const request = $.ajax({
        url: `${API_PERANGKINGAN}/perangkingan`,
        method: "GET",
        dataType: "json",
        xhrFields: { withCredentials: true },
        success: (response) => {
          const rows = Array.isArray(response?.data) ? response.data : [];
          callback({ data: rows });
        },
        error: (xhr, _status, error) => {
          console.error("[perangkingan-siswa] table", error);
          console.error("[perangkingan-siswa] response", xhr?.responseText);
          callback({ data: [] });
        },
      });

      return request;
    },
    columns: [
      {
        data: null,
        className: "text-center",
        render: (_data, _type, _row, meta) => meta.row + 1,
      },
      { data: "kode_alternatif", className: "text-center" },
      { data: "nama_alternatif", className: "text-center" },
      {
        data: "nilai_akhir",
        className: "text-center",
        render: (val) => formatNumber(val),
      },
      {
        data: "keterangan",
        className: "text-center",
        render: (text, _type, row) => {
          let badge = "secondary";
          if (row.no === 1) badge = "success";
          else if (row.no === 2) badge = "warning";
          else if (row.no === 3) badge = "info";
          return `<span class="badge bg-${badge}">${text}</span>`;
        },
      },
    ],
    responsive: true,
    autoWidth: false,
    language: {
      search: "Cari:",
      lengthMenu: "Tampilkan _MENU_ data per halaman",
      zeroRecords: "Tidak ada data perangkingan yang ditemukan",
      info: "Menampilkan halaman _PAGE_ dari _PAGES_",
      infoEmpty: "Tidak ada data yang tersedia",
      infoFiltered: "(disaring dari _MAX_ total data)",
      paginate: {
        first: "Pertama",
        last: "Terakhir",
        next: "Selanjutnya",
        previous: "Sebelumnya",
      },
    },
  });
};

const reloadAllData = async () => {
  const hasData = await checkHasData();
  if (dataTable) dataTable.ajax.reload();
  if (hasData) {
    await Promise.all([loadStats(), loadBestAlternative()]);
  } else {
    updateStats(null);
    updateBestAlternative(null);
  }
};

const showToast = (type, title, text) => {
  if (!window.Swal) return;
  Swal.fire({
    icon: type,
    title,
    text,
    timer: type === "success" ? 1600 : undefined,
    showConfirmButton: type !== "success",
  });
};

const exportPDF = () => {
  const tableData = dataTable?.rows()?.data()?.toArray?.() ?? [];
  if (tableData.length === 0) {
    showToast("info", "Tidak ada data", "Tidak ada data perangkingan untuk diekspor.");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast("error", "Gagal", "Library jsPDF tidak ditemukan.");
    return;
  }

  const doc = new window.jspdf.jsPDF();
  const namaSekolah = $("body").data("nama-sekolah") || "SMK Muhammadiyah 3 Tangerang Selatan";
  const logoPath = $("body").data("logo-path") || "/assets/images/smk3.png";
  const siswaName = window.__AUTH?.name || "Siswa";

  const addHeader = () => {
    try {
      doc.addImage(logoPath, "PNG", 15, 10, 20, 20);
    } catch (err) {
      console.warn("[perangkingan-siswa] gagal memuat logo untuk PDF", err);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(namaSekolah, doc.internal.pageSize.getWidth() / 2, 18, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Laporan Hasil Perangkingan Rekomendasi Program Studi",
      doc.internal.pageSize.getWidth() / 2,
      26,
      { align: "center" }
    );
    doc.setLineWidth(0.5);
    doc.line(15, 34, 195, 34);
  };

  addHeader();

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Nama Siswa:", 15, 44);
  doc.setFont("helvetica", "normal");
  doc.text(siswaName, 50, 44);

  const body = tableData.map((row, index) => [
    index + 1,
    row.kode_alternatif,
    row.nama_alternatif,
    formatNumber(row.nilai_akhir),
    row.keterangan,
  ]);

  doc.autoTable({
    startY: 52,
    head: [["No", "Kode Alternatif", "Nama Alternatif", "Nilai Akhir", "Keterangan"]],
    body,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    didDrawPage: (data) => {
      const page = doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(`Halaman ${page}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
    },
  });

  doc.save(`Laporan_Perangkingan_${siswaName.replace(/\s+/g, "_")}.pdf`);
};

const bindEvents = () => {
  $("#refreshData").on("click", async () => {
    if (window.Swal) {
      Swal.fire({
        title: "Memuat ulang data",
        text: "Sedang memperbarui data perangkingan...",
        allowOutsideClick: false,
        didOpen: Swal.showLoading,
      });
    }

    await reloadAllData();

    if (window.Swal) {
      Swal.close();
      showToast("success", "Berhasil", "Data perangkingan diperbarui.");
    }
  });

  $("#eksporData").on("click", exportPDF);
};

const initPage = async () => {
  buildTable();
  await reloadAllData();
  bindEvents();
};

$(document).ready(() => {
  initPage().catch((error) => {
    console.error("[perangkingan-siswa] init", error);
    showToast("error", "Gagal", "Halaman perangkingan gagal dimuat.");
  });
});
