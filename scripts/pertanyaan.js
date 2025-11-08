import { requireAuth } from "./auth-guard.js";

const API_BASE = "/api/pertanyaan";

let container;
const tables = new Map();
let alternatifList = [];
let kriteriaOptions = [];
let editOriginalAlternatifId = null;

let modalElement;
let form;
let inputIdPertanyaan;
let inputIdAlternatif;
let selectKriteria;
let inputTeks;
let modalTitle;

let currentAction = "add";

const modal = () => {
  if (!modalElement) throw new Error("Elemen modal pertanyaan tidak ditemukan.");
  const bootstrapLib = window.bootstrap;
  if (!bootstrapLib?.Modal) throw new Error("Bootstrap Modal belum siap.");
  return bootstrapLib.Modal.getOrCreateInstance(modalElement);
};

const fetchJSON = async (url, options = {}) => {
  const config = {
    credentials: "include",
    ...options,
  };

  if (config.body && typeof config.body !== "string") {
    config.headers = {
      ...(config.headers || {}),
      "Content-Type": "application/json",
    };
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      (payload && (payload.error || payload.message)) ||
      `Permintaan gagal (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

const html = String.raw;

function renderKriteriaOptions(selectedId) {
  selectKriteria.innerHTML = "";
  const fragment = document.createDocumentFragment();
  kriteriaOptions.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id_kriteria;
    option.textContent = item.nama_kriteria;
    if (Number(selectedId) === Number(item.id_kriteria)) {
      option.selected = true;
    }
    fragment.appendChild(option);
  });
  selectKriteria.appendChild(fragment);
}

function initTableForAlternatif(alternatif) {
  const tableId = `tablePertanyaan_${alternatif.id_alternatif}`;
  const section = html`
    <div class="pertanyaan-section mb-5" data-id-alternatif="${alternatif.id_alternatif}">
      <h5 class="mt-4">Prodi: ${alternatif.nama_alternatif}</h5>
      <button type="button" class="btn btn-primary m-1 mt-3 tambahPertanyaan" data-id-alternatif="${alternatif.id_alternatif}">
        Tambah Pertanyaan
      </button>
      <table id="${tableId}" class="table table-striped" width="100%">
        <thead>
          <tr>
            <th>No</th>
            <th>Kriteria</th>
            <th>Teks Pertanyaan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  container.append(section);

  const table = $(`#${tableId}`).DataTable({
    data: [],
    order: [[0, "asc"]],
    scrollX: true,
    columns: [
      {
        data: null,
        className: "text-center",
      },
      { data: "nama_kriteria", className: "text-center" },
      { data: "teks_pertanyaan", className: "text-center" },
      {
        data: null,
        className: "text-center",
        render: (_data, _type, row) => html`
          <button class="btn btn-warning btn-sm edit-pert-btn"
                  data-id="${row.id_pertanyaan}"
                  data-ida="${row.id_alternatif}">
            Edit
          </button>
          <button class="btn btn-danger btn-sm delete-pert-btn"
                  data-id="${row.id_pertanyaan}"
                  data-ida="${row.id_alternatif}">
            Hapus
          </button>
        `,
      },
    ],
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
    drawCallback: function () {
      this.api()
        .column(0, { search: "applied", order: "applied" })
        .nodes()
        .each((cell, i) => {
          cell.innerHTML = i + 1;
        });
    },
  });

  tables.set(Number(alternatif.id_alternatif), table);
}

async function refreshTable(id_alternatif) {
  const table = tables.get(Number(id_alternatif));
  if (!table) return;
  try {
    const response = await fetchJSON(`${API_BASE}?id_alternatif=${id_alternatif}`);
    const rows = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];
    table.clear();
    table.rows.add(rows);
    table.draw();
  } catch (error) {
    console.error("[pertanyaan] refresh", error);
    Swal.fire({
      icon: "error",
      title: "Gagal memuat data",
      text: error.message,
    });
  }
}

function openModalAdd(idAlternatif) {
  currentAction = "add";
  editOriginalAlternatifId = null;
  modalTitle.textContent = "Tambah Pertanyaan";
  inputIdPertanyaan.value = "";
  inputIdAlternatif.value = idAlternatif;
  inputTeks.value = "";
  renderKriteriaOptions();
  modal().show();
}

async function openModalEdit(idPertanyaan, idAlternatif) {
  try {
    Swal.fire({
      title: "Memuat Data",
      text: "Mohon tunggu...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const response = await fetchJSON(`${API_BASE}/${idPertanyaan}`);
    const data = response?.data || response;
    if (!data) throw new Error("Data pertanyaan tidak ditemukan.");

    currentAction = "edit";
    modalTitle.textContent = "Edit Pertanyaan";
    inputIdPertanyaan.value = data.id_pertanyaan;
    inputIdAlternatif.value = data.id_alternatif;
    inputTeks.value = data.teks_pertanyaan || "";
    renderKriteriaOptions(data.id_kriteria);
    editOriginalAlternatifId = idAlternatif;

    modal().show();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal memuat data",
      text: error.message,
    });
  } finally {
    Swal.close();
  }
}

async function handleDelete(idPertanyaan, idAlternatif) {
  const confirmation = await Swal.fire({
    title: "Hapus pertanyaan ini?",
    text: "Data yang dihapus tidak dapat dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (!confirmation.isConfirmed) return;

  try {
    await fetchJSON(`${API_BASE}/${idPertanyaan}`, { method: "DELETE" });
    await refreshTable(idAlternatif);
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Pertanyaan berhasil dihapus.",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal menghapus",
      text: error.message,
    });
  }
}

function bindEvents() {
  container.on("click", ".tambahPertanyaan", (event) => {
    const idAlternatif = Number($(event.currentTarget).data("id-alternatif"));
    openModalAdd(idAlternatif);
  });

  container.on("click", ".edit-pert-btn", (event) => {
    const id = Number($(event.currentTarget).data("id"));
    const idAlternatif = Number($(event.currentTarget).data("ida"));
    openModalEdit(id, idAlternatif);
  });

  container.on("click", ".delete-pert-btn", (event) => {
    const id = Number($(event.currentTarget).data("id"));
    const idAlternatif = Number($(event.currentTarget).data("ida"));
    handleDelete(id, idAlternatif);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      id_kriteria: Number(selectKriteria.value),
      id_alternatif: Number(inputIdAlternatif.value),
      teks_pertanyaan: inputTeks.value.trim(),
    };

    if (
      !Number.isFinite(payload.id_kriteria) ||
      !Number.isFinite(payload.id_alternatif) ||
      !payload.teks_pertanyaan
    ) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Lengkapi semua data dengan benar.",
      });
      return;
    }

    const confirmation = await Swal.fire({
      title: "Konfirmasi",
      text:
        currentAction === "add"
          ? "Tambah pertanyaan ini?"
          : "Simpan perubahan pertanyaan ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
    });

    if (!confirmation.isConfirmed) return;

    try {
      if (currentAction === "add") {
        await fetchJSON(API_BASE, { method: "POST", body: payload });
      } else {
        const id = inputIdPertanyaan.value;
        await fetchJSON(`${API_BASE}/${id}`, { method: "PUT", body: payload });
      }

      modal().hide();

      if (
        editOriginalAlternatifId &&
        editOriginalAlternatifId !== payload.id_alternatif
      ) {
        await refreshTable(editOriginalAlternatifId);
      }
      await refreshTable(payload.id_alternatif);
      editOriginalAlternatifId = null;

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text:
          currentAction === "add"
            ? "Pertanyaan berhasil ditambahkan."
            : "Pertanyaan berhasil diperbarui.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan",
        text: error.message,
      });
    }
  });

  modalElement.addEventListener("hidden.bs.modal", () => {
    form.reset();
    currentAction = "add";
    editOriginalAlternatifId = null;
  });
}

async function bootstrap() {
  const { redirected } = await requireAuth({ allowRoles: ["Guru BK"] });
  if (redirected) return;

  try {
    const alternatifResponse = await fetchJSON(`${API_BASE}/options/alternatif`);
    alternatifList = Array.isArray(alternatifResponse?.data)
      ? alternatifResponse.data
      : Array.isArray(alternatifResponse)
      ? alternatifResponse
      : [];

    const kriteriaResponse = await fetchJSON(`${API_BASE}/options/kriteria`);
    kriteriaOptions = Array.isArray(kriteriaResponse?.data)
      ? kriteriaResponse.data
      : Array.isArray(kriteriaResponse)
      ? kriteriaResponse
      : [];

    container.empty();
    alternatifList.forEach((item) => {
      initTableForAlternatif(item);
    });

    bindEvents();

    for (const item of alternatifList) {
      await refreshTable(item.id_alternatif);
    }
  } catch (error) {
    console.error("[pertanyaan] init", error);
    Swal.fire({
      icon: "error",
      title: "Gagal memuat data",
      text: error.message,
    });
  }
}

function cacheDomReferences() {
  container = $("#container-pertanyaan");
  modalElement = document.getElementById("pertanyaanModal");
  form = document.getElementById("pertanyaanForm");
  inputIdPertanyaan = document.getElementById("id_pertanyaan");
  inputIdAlternatif = document.getElementById("id_alternatif");
  selectKriteria = document.getElementById("id_kriteria");
  inputTeks = document.getElementById("teks_pertanyaan");
  modalTitle = document.getElementById("modalTitlePert");

  const elements = [
    container,
    modalElement,
    form,
    inputIdPertanyaan,
    inputIdAlternatif,
    selectKriteria,
    inputTeks,
    modalTitle,
  ];

  if (!container?.length || elements.slice(1).some((el) => !el)) {
    console.error("[pertanyaan] Elemen formulir tidak lengkap.");
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!cacheDomReferences()) return;
  await bootstrap();
});
