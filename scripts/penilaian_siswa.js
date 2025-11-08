import { requireAuth, getCurrentUser } from "./auth-guard.js";

const API_BASE = "/api/penilaian-siswa";

const state = {
  alternatifOrder: [],
  pertanyaan: new Map(),
  penilaian: new Map(),
  subkriteria: new Map(),
};

let kuesionerContainer = null;
let studentNameElement = null;
let studentNisElement = null;

const fetchJSON = async (url, options = {}) => {
  const config = {
    credentials: "include",
    ...options,
  };

  if (config.body && typeof config.body !== "string" && !(config.body instanceof FormData)) {
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

const resetState = () => {
  state.alternatifOrder = [];
  state.pertanyaan.clear();
  state.penilaian.clear();
  state.subkriteria.clear();
};

const setEmptyMessage = (message) => {
  if (kuesionerContainer) {
    kuesionerContainer.innerHTML = `<p class="text-muted">${message}</p>`;
  }
};

const calculateProgress = (formElement, totalPertanyaan) => {
  if (totalPertanyaan === 0) return 0;
  const answered = formElement.querySelectorAll(".kuesioner-radio:checked").length;
  return Math.round((answered / totalPertanyaan) * 100);
};

const updateProgressBar = (formElement, totalPertanyaan) => {
  const bar = formElement.querySelector(".progress-bar");
  const submitButton = formElement.querySelector(".btn-submit-all");
  if (!bar) return;
  const progress = calculateProgress(formElement, totalPertanyaan);
  bar.style.width = `${progress}%`;
  bar.setAttribute("aria-valuenow", String(progress));
  bar.textContent = `${progress}%`;

  if (submitButton) {
    if (progress === 100) {
      submitButton.setAttribute("disabled", "disabled");
      submitButton.classList.add("disabled");
    } else {
      submitButton.removeAttribute("disabled");
      submitButton.classList.remove("disabled");
    }
  }
};

const renderKuesioner = (idUser) => {
  if (!kuesionerContainer) return;

  kuesionerContainer.innerHTML = "";

  if (state.alternatifOrder.length === 0) {
    setEmptyMessage("Tidak ada penilaian untuk Anda.");
    return;
  }

  let totalPertanyaan = 0;
  state.alternatifOrder.forEach((id) => {
    totalPertanyaan += (state.pertanyaan.get(id) || []).length;
  });

  let formHtml = `
    <form class="kuesioner-form" data-id-user="${idUser}">
      <div class="mb-4">
        <label class="form-label">Progres Pengisian Keseluruhan:</label>
        <div class="progress">
          <div
            class="progress-bar bg-success progress-bar-striped"
            role="progressbar"
            style="width: 0%"
            aria-valuenow="0"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            0%
          </div>
        </div>
      </div>
      <div class="list-group list-group-flush">
  `;

  let globalNumber = 1;

  for (const alternatifId of state.alternatifOrder) {
    const pertanyaanList = state.pertanyaan.get(alternatifId) || [];
    const alternatifData = state.penilaian.get(alternatifId) || {
      penilaian: [],
      nama: "",
    };

    // Tidak menampilkan judul alternatif agar identitas prodi tetap rahasia

    pertanyaanList.forEach((pertanyaan) => {
      const penilaian = alternatifData.penilaian.find(
        (item) => item.id_kriteria === pertanyaan.id_kriteria
      );
      const selectedJawaban = penilaian
        ? penilaian.jawaban_list.find(
            (jawaban) => jawaban.id_pertanyaan === pertanyaan.id_pertanyaan
          )
        : null;
      const selectedSubkriteria = selectedJawaban?.id_subkriteria ?? null;
      const subkriteriaOptions =
        state.subkriteria.get(pertanyaan.id_kriteria) || [];

      formHtml += `
        <div class="list-group-item py-4">
          <h5 class="mb-3">
            <span class="badge bg-primary me-2">${globalNumber}</span>
            (${pertanyaan.nama_kriteria}) ${pertanyaan.teks_pertanyaan}
          </h5>
          <div class="fs-3 d-flex flex-wrap gap-2">
      `;

      subkriteriaOptions.forEach((sub) => {
        const isChecked = String(selectedSubkriteria) === String(sub.id_subkriteria);
        formHtml += `
          <div class="form-check form-check-inline">
            <input
              class="form-check-input kuesioner-radio"
              type="radio"
              name="pertanyaan_${globalNumber}"
              data-kriteria="${pertanyaan.id_kriteria}"
              data-pertanyaan="${pertanyaan.id_pertanyaan}"
              data-alternatif="${alternatifId}"
              value="${sub.id_subkriteria}"
              data-nilai="${sub.nilai}"
              ${isChecked ? "checked" : ""}
              required
            >
            <label class="form-check-label">
              ${sub.nama_subkriteria} (Nilai: ${sub.nilai})
            </label>
          </div>
        `;
      });

      formHtml += `
          </div>
        </div>
      `;

      globalNumber += 1;
    });
  }

  formHtml += `
      </div>
      <div class="mt-4 text-end">
        <button type="submit" class="btn btn-primary btn-responsive btn-submit-all">Simpan Semua</button>
      </div>
    </form>
  `;

  kuesionerContainer.innerHTML = formHtml;

  const formElement = kuesionerContainer.querySelector(".kuesioner-form");
  if (formElement) {
    updateProgressBar(formElement, totalPertanyaan);
  }
};

const loadKuesionerData = async (idUser) => {
  setEmptyMessage("Memuat data kuesioner...");
  resetState();

  try {
    const alternatifRes = await fetchJSON(`${API_BASE}/alternatif`);
    const alternatifList = alternatifRes?.data || [];

    if (alternatifList.length === 0) {
      setEmptyMessage("Tidak ada penilaian untuk Anda.");
      return;
    }

    state.alternatifOrder = alternatifList.map((item) => item.id_alternatif);

    for (const alternatif of alternatifList) {
      const [pertanyaanRes, penilaianRes] = await Promise.all([
        fetchJSON(
          `${API_BASE}/alternatif/${alternatif.id_alternatif}/pertanyaan`
        ),
        fetchJSON(`${API_BASE}/alternatif/${alternatif.id_alternatif}`),
      ]);

      state.pertanyaan.set(alternatif.id_alternatif, pertanyaanRes?.data || []);
      state.penilaian.set(alternatif.id_alternatif, {
        nama: alternatif.nama_alternatif,
        penilaian: penilaianRes?.data || [],
      });

      const pertanyaanList = state.pertanyaan.get(alternatif.id_alternatif) || [];
      for (const pertanyaan of pertanyaanList) {
        if (!state.subkriteria.has(pertanyaan.id_kriteria)) {
          const subRes = await fetchJSON(
            `${API_BASE}/kriteria/${pertanyaan.id_kriteria}/subkriteria`
          );
          state.subkriteria.set(
            pertanyaan.id_kriteria,
            subRes?.data || []
          );
        }
      }
    }

    renderKuesioner(idUser);
  } catch (error) {
    setEmptyMessage("Gagal memuat data kuesioner.");
    Swal.fire({
      icon: "error",
      title: "Terjadi Kesalahan",
      text: error.message,
    });
  }
};

const buildPayload = (formElement) => {
  const radios = formElement.querySelectorAll(".kuesioner-radio:checked");
  return Array.from(radios).map((input) => ({
    id_alternatif: Number(input.dataset.alternatif),
    id_kriteria: Number(input.dataset.kriteria),
    id_pertanyaan: Number(input.dataset.pertanyaan),
    id_subkriteria: Number(input.value),
    jawaban: Number(input.dataset.nilai),
  }));
};

const handleFormSubmit = async (event) => {
  const form = event.target;
  if (!form.classList.contains("kuesioner-form")) return;

  event.preventDefault();

  const idUser = form.dataset.idUser;
  let totalPertanyaan = 0;
  state.alternatifOrder.forEach((id) => {
    totalPertanyaan += (state.pertanyaan.get(id) || []).length;
  });

  const answered = form.querySelectorAll(".kuesioner-radio:checked").length;
  if (answered < totalPertanyaan) {
    Swal.fire({
      icon: "warning",
      title: "Peringatan",
      text: "Harap isi semua pertanyaan sebelum menyimpan!",
    });
    return;
  }

  const confirm = await Swal.fire({
    title: "Konfirmasi",
    text: "Apakah Anda yakin ingin menyimpan semua penilaian ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Simpan!",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  const payload = buildPayload(form);

  try {
    Swal.fire({
      title: "Memproses",
      text: "Sedang menyimpan data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await fetchJSON(API_BASE, { method: "PUT", body: { penilaian: payload } });

    Swal.close();
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Penilaian berhasil disimpan.",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      window.location.href = "/views/perangkingan_siswa.html";
    });
  } catch (error) {
    Swal.close();
    Swal.fire({
      icon: "error",
      title: "Gagal menyimpan",
      text: error.message,
    });
  }
};

const handleRadioChange = (event) => {
  if (!event.target.classList.contains("kuesioner-radio")) return;
  const form = event.target.closest(".kuesioner-form");
  if (!form) return;

  let totalPertanyaan = 0;
  state.alternatifOrder.forEach((id) => {
    totalPertanyaan += (state.pertanyaan.get(id) || []).length;
  });
  updateProgressBar(form, totalPertanyaan);
};

const updateStudentHeader = (user) => {
  if (studentNameElement) {
    studentNameElement.textContent = user?.name || "Pengguna";
  }
  if (studentNisElement) {
    studentNisElement.textContent = user?.nis || "-";
  }
};

const bootstrap = async () => {
  kuesionerContainer = document.getElementById("kuesionerContainer");
  studentNameElement = document.getElementById("studentName");
  studentNisElement = document.getElementById("studentNis");

  const { redirected } = await requireAuth({ allowRoles: ["Siswa"] });
  if (redirected) return;

  const currentUser = await getCurrentUser();
  updateStudentHeader(currentUser);

  if (!currentUser?.id) {
    Swal.fire({
      icon: "error",
      title: "Terjadi Kesalahan",
      text: "ID Pengguna tidak ditemukan. Silakan login kembali.",
    });
    return;
  }

  await loadKuesionerData(currentUser.id);

  if (kuesionerContainer) {
    kuesionerContainer.addEventListener("submit", handleFormSubmit);
    kuesionerContainer.addEventListener("change", handleRadioChange);
  }
};

document.addEventListener("DOMContentLoaded", bootstrap);
