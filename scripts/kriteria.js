$(document).ready(async function () {
  initTable();
  bindEvents();
  enforceDotSeparator();
  await loadTable();
});

const API_URL = "/api/kriteria";
let dataTable;
let tableData = [];

function initTable() {
  dataTable = $("#myTableKriteria").DataTable({
    data: [],
    processing: true,
    serverSide: false,
    scrollX: true,
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
        render: (value) => formatDecimal(value),
      },
      {
        data: null,
        className: "text-center",
        render: (_data, _type, row) => `
          <button class="btn btn-warning btn-sm edit-btn" data-id="${row.id_kriteria}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${row.id_kriteria}">Hapus</button>
        `,
      },
    ],
    responsive: true,
    language: {
      search: "Cari:",
      lengthMenu: "Tampilkan _MENU_ data per halaman",
      zeroRecords: "Tidak ada data yang ditemukan",
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
}

async function loadTable() {
  try {
    const response = await fetchJSON(API_URL);
    const rows = Array.isArray(response?.data) ? response.data : response;
    tableData = Array.isArray(rows) ? rows : [];
    dataTable.clear().rows.add(tableData).draw();
  } catch (error) {
    tableData = [];
    dataTable.clear().draw();
    Swal.fire({ icon: "error", title: "Gagal", text: error.message || "Tidak dapat memuat data kriteria." });
  }
}

function bindEvents() {
  $("#tambah").on("click", () => {
    resetForm();
    $("#formAction").val("add");
    $("#modalTitle").text("Tambah Kriteria");
    $("#kriteriaModal").modal("show");
  });

  $("#myTableKriteria").on("click", ".edit-btn", function () {
    const id = Number($(this).data("id"));
    const row = tableData.find((item) => Number(item.id_kriteria) === id);

    if (!row) {
      Swal.fire({ icon: "error", title: "Terjadi Kesalahan", text: "Data kriteria tidak ditemukan." });
      return;
    }

    $("#formAction").val("edit");
    $("#modalTitle").text("Edit Kriteria");
    $("#id_kriteria").val(row.id_kriteria);
    $("#kode_kriteria").val(row.kode_kriteria || "");
    $("#nama_kriteria").val(row.nama_kriteria || "");
    $("#jenis").val(row.jenis || "Benefit");
    $("#bobot").val(row.bobot ?? "");
    $("#kriteriaModal").modal("show");
  });

  $("#myTableKriteria").on("click", ".delete-btn", async function () {
    const id = Number($(this).data("id"));

    const confirmation = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus kriteria ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!confirmation.isConfirmed) return;

    try {
      Swal.fire({
        title: "Memproses",
        text: "Sedang menghapus data...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await fetchJSON(`${API_URL}/${id}`, { method: "DELETE" });
      Swal.close();

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data kriteria berhasil dihapus",
        timer: 1500,
        showConfirmButton: false,
      });

      await loadTable();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Terjadi Kesalahan", text: error.message || "Gagal menghapus data." });
    }
  });

  $("#kriteriaForm").on("submit", async function (e) {
    e.preventDefault();

    const action = $("#formAction").val();
    const id = Number($("#id_kriteria").val());

    const payload = {
      kode_kriteria: $("#kode_kriteria").val().trim(),
      nama_kriteria: $("#nama_kriteria").val().trim(),
      jenis: $("#jenis").val(),
      bobot: Number($("#bobot").val()),
    };

    if (!payload.kode_kriteria || !payload.nama_kriteria || !payload.jenis || !Number.isFinite(payload.bobot)) {
      Swal.fire({ icon: "error", title: "Data tidak lengkap", text: "Lengkapi semua data dengan benar." });
      return;
    }

    if (payload.bobot < 0 || payload.bobot > 100) {
      Swal.fire({
        icon: "error",
        title: `Gagal ${action === "add" ? "Menambahkan" : "Mengedit"} Kriteria`,
        text: "Bobot harus berada di antara 0 hingga 100.",
      });
      return;
    }

    let totalBobot = tableData.reduce((sum, row) => sum + (Number(row.bobot) || 0), 0);
    if (action === "edit") {
      const existing = tableData.find((row) => Number(row.id_kriteria) === id);
      if (existing) {
        totalBobot -= Number(existing.bobot) || 0;
      }
    }
    totalBobot += payload.bobot;

    if (totalBobot > 100) {
      Swal.fire({
        icon: "error",
        title: `Gagal ${action === "add" ? "Menambahkan" : "Mengedit"} Kriteria`,
        text: "Total bobot melebihi 100%.",
      });
      return;
    }

    const confirmText = action === "add" ? "menambahkan data kriteria ini?" : "mengedit data kriteria ini?";
    const confirmButtonText = action === "add" ? "Ya, Tambahkan!" : "Ya, Simpan!";

    const confirmation = await Swal.fire({
      title: "Konfirmasi",
      text: `Apakah Anda yakin ingin ${confirmText}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText,
      cancelButtonText: "Batal",
    });

    if (!confirmation.isConfirmed) return;

    try {
      Swal.fire({
        title: "Memproses",
        text: "Sedang menyimpan data...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      if (action === "add") {
        await fetchJSON(API_URL, { method: "POST", body: payload });
      } else {
        await fetchJSON(`${API_URL}/${id}`, { method: "PUT", body: payload });
      }

      Swal.close();

      $("#kriteriaModal").modal("hide");
      await loadTable();

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Data kriteria berhasil ${action === "add" ? "ditambahkan" : "diperbarui"}`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Gagal!", text: error.message || "Tidak dapat menyimpan data." });
    }
  });
}

function resetForm() {
  const form = $("#kriteriaForm")[0];
  if (form) form.reset();
  $("#formAction").val("add");
  $("#id_kriteria").val("");
  $("#jenis").val("Benefit");
}

function enforceDotSeparator() {
  const input = $("#bobot");
  if (!input.length) return;
  input.on("input", () => {
    const value = input.val();
    if (typeof value === "string" && value.includes(",")) {
      input.val(value.replace(/,/g, "."));
    }
  });
}

function formatDecimal(value) {
  const num = Number(value);
  if (Number.isFinite(num)) {
    return num.toFixed(2);
  }
  return value ?? "-";
}

async function fetchJSON(url, options = {}) {
  const config = { credentials: "include", ...options };
  const headers = { ...(config.headers || {}) };

  if (config.body && typeof config.body !== "string") {
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    config.body = JSON.stringify(config.body);
  }

  config.headers = headers;

  const response = await fetch(url, config);
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.warn("Gagal mengurai respons JSON:", error);
    }
  }

  if (!response.ok) {
    const message = data?.error || data?.message || "Permintaan ke server gagal.";
    throw new Error(message);
  }

  return data;
}
