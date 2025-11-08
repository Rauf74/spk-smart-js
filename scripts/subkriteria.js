import { requireAuth } from "./auth-guard.js";

const API_KRITERIA = "/api/kriteria";
const API_SUBKRITERIA = "/api/subkriteria";

const tables = new Map();
let kriteriaList = [];
let editOriginalKriteriaId = null;

let container;
let modalElement;
let form;
let inputIdSubkriteria;
let selectKriteria;
let inputNama;
let inputNilai;
let modalTitle;

let currentAction = "add";

const modalInstance = () => {
  if (!modalElement) throw new Error("Elemen modal subkriteria tidak ditemukan.");
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
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (typeof data === "object" && data?.error) ||
      (typeof data === "object" && data?.message) ||
      "Permintaan ke server gagal.";
    throw new Error(message);
  }

  return data;
};

const html = String.raw;

function renderKriteriaOptions(selectedId = null) {
  const fragment = document.createDocumentFragment();
  kriteriaList.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id_kriteria;
    option.textContent = item.nama_kriteria;
    if (Number(selectedId) === Number(item.id_kriteria)) {
      option.selected = true;
    }
    fragment.appendChild(option);
  });
  selectKriteria.innerHTML = "";
  selectKriteria.appendChild(fragment);
}

function initTableForKriteria(kriteria) {
  const tableId = `tableSubkriteria_${kriteria.id_kriteria}`;
  const sectionHtml = html`
    <div class="subkriteria-section mb-5" data-id-kriteria="${kriteria.id_kriteria}">
      <h5 class="mt-4">Kriteria: ${kriteria.nama_kriteria}</h5>
      <button type="button"
              class="btn btn-primary m-1 mt-3 tambahSubkriteria"
              data-id-kriteria="${kriteria.id_kriteria}">
        Tambah Subkriteria
      </button>
      <table id="${tableId}" class="table table-striped" width="100%">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Subkriteria</th>
            <th>Nilai</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  container.append(sectionHtml);

  const table = $(`#${tableId}`).DataTable({
    data: [],
    columns: [
      {
        data: null,
        className: "text-center",
      },
      { data: "nama_subkriteria", className: "text-center" },
      {
        data: "nilai",
        className: "text-center",
        render: (data) => formatDecimal(data),
      },
      {
        data: null,
        className: "text-center",
        render: (data, _type, row) => html`
          <button class="btn btn-warning btn-sm edit-sub-btn"
                  data-id="${row.id_subkriteria}"
                  data-idk="${row.id_kriteria}">
            Edit
          </button>
          <button class="btn btn-danger btn-sm delete-sub-btn"
                  data-id="${row.id_subkriteria}"
                  data-idk="${row.id_kriteria}">
            Hapus
          </button>
        `,
      },
    ],
    order: [[2, "asc"]],
    scrollX: true,
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

  tables.set(kriteria.id_kriteria, table);
}

async function refreshTable(id_kriteria) {
  const table = tables.get(Number(id_kriteria));
  if (!table) return;
  try {
    const response = await fetchJSON(
      `${API_SUBKRITERIA}?id_kriteria=${id_kriteria}`
    );
    const rows = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];
    table.clear();
    table.rows.add(rows);
    table.draw();
  } catch (error) {
    console.error("[subkriteria] refresh", error);
    Swal.fire({
      icon: "error",
      title: "Gagal memuat data",
      text: error.message,
    });
  }
}

function openModalAdd(defaultKriteriaId) {
  currentAction = "add";
  editOriginalKriteriaId = null;
  modalTitle.textContent = "Tambah Subkriteria";
  inputIdSubkriteria.value = "";
  inputNama.value = "";
  inputNilai.value = "";
  renderKriteriaOptions(defaultKriteriaId);
  modalInstance().show();
}

async function openModalEdit(id) {
  try {
    Swal.fire({
      title: "Memuat Data",
      text: "Mohon tunggu...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const response = await fetchJSON(`${API_SUBKRITERIA}/${id}`);
    const data = response?.data || response;
    if (!data) {
      throw new Error("Data subkriteria tidak ditemukan.");
    }

    currentAction = "edit";
    modalTitle.textContent = "Edit Subkriteria";
    inputIdSubkriteria.value = data.id_subkriteria;
    inputNama.value = data.nama_subkriteria || "";
    inputNilai.value =
      data.nilai !== undefined && data.nilai !== null ? data.nilai : "";
    renderKriteriaOptions(data.id_kriteria);
    editOriginalKriteriaId = data.id_kriteria;

    modalInstance().show();
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

async function handleDelete(id, id_kriteria) {
  const confirm = await Swal.fire({
    title: "Hapus subkriteria ini?",
    text: "Data yang dihapus tidak dapat dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });
  if (!confirm.isConfirmed) return;

  try {
    await fetchJSON(`${API_SUBKRITERIA}/${id}`, { method: "DELETE" });
    await refreshTable(id_kriteria);
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Subkriteria berhasil dihapus.",
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
  container.on("click", ".tambahSubkriteria", (event) => {
    const id = Number($(event.currentTarget).data("id-kriteria"));
    openModalAdd(id);
  });

  container.on("click", ".edit-sub-btn", (event) => {
    const id = $(event.currentTarget).data("id");
    openModalEdit(id);
  });

  container.on("click", ".delete-sub-btn", (event) => {
    const id = $(event.currentTarget).data("id");
    const idKriteria = Number($(event.currentTarget).data("idk"));
    handleDelete(id, idKriteria);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      id_kriteria: Number(selectKriteria.value),
      nama_subkriteria: inputNama.value.trim(),
      nilai: Number(inputNilai.value),
    };

    if (
      !Number.isFinite(payload.id_kriteria) ||
      !payload.nama_subkriteria ||
      !Number.isFinite(payload.nilai)
    ) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Lengkapi semua data dengan benar.",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Konfirmasi",
      text:
        currentAction === "add"
          ? "Tambah subkriteria ini?"
          : "Simpan perubahan subkriteria ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      if (currentAction === "add") {
        await fetchJSON(API_SUBKRITERIA, {
          method: "POST",
          body: payload,
        });
      } else {
        const id = inputIdSubkriteria.value;
        await fetchJSON(`${API_SUBKRITERIA}/${id}`, {
          method: "PUT",
          body: payload,
        });
      }

      modalInstance().hide();
      if (
        editOriginalKriteriaId &&
        editOriginalKriteriaId !== payload.id_kriteria
      ) {
        await refreshTable(editOriginalKriteriaId);
      }
      await refreshTable(payload.id_kriteria);
      editOriginalKriteriaId = null;

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text:
          currentAction === "add"
            ? "Subkriteria berhasil ditambahkan."
            : "Subkriteria berhasil diperbarui.",
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
    editOriginalKriteriaId = null;
  });
}

function formatDecimal(value) {
  const num = Number(value);
  if (Number.isFinite(num)) {
    return num.toFixed(2);
  }
  return value ?? "-";
}

async function bootstrap() {
  const { redirected } = await requireAuth({ allowRoles: ["Guru BK"] });
  if (redirected) return;

  try {
    const kriteriaResponse = await fetchJSON(API_KRITERIA);
    kriteriaList = Array.isArray(kriteriaResponse?.data)
      ? kriteriaResponse.data
      : Array.isArray(kriteriaResponse)
      ? kriteriaResponse
      : [];

    container.empty();
    kriteriaList.forEach((item) => {
      initTableForKriteria(item);
    });

    bindEvents();

    for (const item of kriteriaList) {
      await refreshTable(item.id_kriteria);
    }
  } catch (error) {
    console.error("[subkriteria] init", error);
    Swal.fire({
      icon: "error",
      title: "Gagal memuat data",
      text: error.message,
    });
  }
}

function cacheDomReferences() {
  container = $("#container-subkriteria");
  modalElement = document.getElementById("subkriteriaModal");
  form = document.getElementById("subkriteriaForm");
  inputIdSubkriteria = document.getElementById("id_subkriteria");
  selectKriteria = document.getElementById("id_kriteria");
  inputNama = document.getElementById("nama_subkriteria");
  inputNilai = document.getElementById("nilai");
  modalTitle = document.getElementById("modalTitleSub");

  const elements = [
    container,
    modalElement,
    form,
    inputIdSubkriteria,
    selectKriteria,
    inputNama,
    inputNilai,
    modalTitle,
  ];

  if (!container?.length || elements.slice(1).some((el) => !el)) {
    console.error("[subkriteria] Elemen formulir tidak lengkap.");
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!cacheDomReferences()) return;
  await bootstrap();
});
