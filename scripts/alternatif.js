import { requireAuth } from "./auth-guard.js";

$(document).ready(async function () {
  await bootstrap();
});

const API_URL = "/api/alternatif";
let dataTable;
let tableData = [];

function initTable() {
  dataTable = $("#myTableAlternatif").DataTable({
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
      { data: "kode_alternatif", className: "text-center" },
      { data: "nama_alternatif", className: "text-center" },
      {
        data: null,
        className: "text-center",
        render: (_data, _type, row) => `
          <button class="btn btn-warning btn-sm edit-btn" data-id="${row.id_alternatif}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${row.id_alternatif}">Hapus</button>
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
    Swal.fire({ icon: "error", title: "Gagal", text: error.message || "Tidak dapat memuat data alternatif." });
  }
}

function bindEvents() {
  $("#tambah").on("click", () => {
    resetForm();
    $("#formAction").val("add");
    $("#modalTitle").text("Tambah Alternatif");
    $("#alternatifModal").modal("show");
  });

  $("#myTableAlternatif").on("click", ".edit-btn", function () {
    const id = Number($(this).data("id"));
    const row = tableData.find((item) => Number(item.id_alternatif) === id);

    if (!row) {
      Swal.fire({ icon: "error", title: "Terjadi Kesalahan", text: "Data alternatif tidak ditemukan." });
      return;
    }

    $("#formAction").val("edit");
    $("#modalTitle").text("Edit Alternatif");
    $("#id_alternatif").val(row.id_alternatif);
    $("#kode_alternatif").val(row.kode_alternatif || "");
    $("#nama_alternatif").val(row.nama_alternatif || "");
    $("#alternatifModal").modal("show");
  });

  $("#myTableAlternatif").on("click", ".delete-btn", async function () {
    const id = Number($(this).data("id"));

    const confirmation = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus alternatif ini?",
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

      await loadTable();
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data alternatif berhasil dihapus",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Terjadi Kesalahan", text: error.message || "Gagal menghapus data." });
    }
  });

  $("#alternatifForm").on("submit", async function (e) {
    e.preventDefault();

    const action = $("#formAction").val();
    const id = Number($("#id_alternatif").val());

    const payload = {
      kode_alternatif: $("#kode_alternatif").val().trim(),
      nama_alternatif: $("#nama_alternatif").val().trim(),
    };

    if (!payload.kode_alternatif || !payload.nama_alternatif) {
      Swal.fire({ icon: "error", title: "Data tidak lengkap", text: "Lengkapi semua data dengan benar." });
      return;
    }

    const confirmText = action === "add" ? "menambahkan data alternatif ini?" : "mengedit data alternatif ini?";
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

      $("#alternatifModal").modal("hide");
      await loadTable();

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Data alternatif berhasil ${action === "add" ? "ditambahkan" : "diperbarui"}`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Gagal!", text: error.message || "Tidak dapat menyimpan data." });
    }
  });
}

function resetForm() {
  const form = $("#alternatifForm")[0];
  if (form) form.reset();
  $("#formAction").val("add");
  $("#id_alternatif").val("");
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

async function bootstrap() {
  const { redirected } = await requireAuth({ allowRoles: ["Guru BK"] });
  if (redirected) return;

  initTable();
  bindEvents();
  await loadTable();
}
