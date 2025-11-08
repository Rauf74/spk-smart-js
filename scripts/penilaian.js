import { requireAuth } from "./auth-guard.js";

const API_BASE = "/api/penilaian";

const state = {
  pertanyaan: new Map(),
  penilaian: new Map(),
  subkriteria: new Map(),
  activeAlternatifId: null,
};

let siswaDropdown = null;
let kuesionerContainer = null;

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
  state.pertanyaan.clear();
  state.penilaian.clear();
  state.subkriteria.clear();
};

const setEmptyMessage = (message) => {
  if (kuesionerContainer) {
    kuesionerContainer.innerHTML = `<p class="text-muted">${message}</p>`;
  }
};

const renderSiswaDropdown = (items) => {
  if (!siswaDropdown) return;
  siswaDropdown.innerHTML = '<option value="">Pilih Siswa</option>';
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id_user);
    option.textContent = `${item.nama_user} (NIS: ${item.nis ?? "-"})`;
    siswaDropdown.appendChild(option);
  });
};

const calculateProgress = (formElement) => {
  const total = formElement.querySelectorAll(".list-group-item").length;
  if (total === 0) return 0;
  const answered = formElement.querySelectorAll(".kuesioner-radio:checked").length;
  return Math.round((answered / total) * 100);
};

const updateProgressBar = (formElement) => {
  const bar = formElement.querySelector(".progress-bar");
  if (!bar) return;
  const progress = calculateProgress(formElement);
  bar.style.width = `${progress}%`;
  bar.setAttribute("aria-valuenow", String(progress));
  bar.textContent = `${progress}%`;
};

const renderKuesioner = (idUser) => {
  if (!kuesionerContainer) return;

  kuesionerContainer.innerHTML = "";

  if (state.penilaian.size === 0) {
    setEmptyMessage("Tidak ada penilaian untuk siswa ini.");
    return;
  }

  let index = 0;
  for (const [alternatifId, alternatifData] of state.penilaian.entries()) {
    const pertanyaanList = state.pertanyaan.get(alternatifId) || [];
    const shouldExpand =
      state.activeAlternatifId !== null
        ? state.activeAlternatifId === String(alternatifId)
        : index === 0;

    let cardHtml = `
      <div class="card mb-3 shadow-sm">
        <div class="card-header bg-light" id="heading_${alternatifId}">
          <h5 class="mb-0">
            <button
              class="btn btn-link text-decoration-none text-dark w-100 text-start"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapse_${alternatifId}"
              aria-expanded="${shouldExpand ? "true" : "false"}"
              aria-controls="collapse_${alternatifId}"
            >
              Penilaian untuk ${alternatifData.nama}
            </button>
          </h5>
        </div>
        <div
          id="collapse_${alternatifId}"
          class="collapse ${shouldExpand ? "show" : ""}"
          aria-labelledby="heading_${alternatifId}"
          data-bs-parent="#kuesionerContainer"
        >
          <div class="card-body">
            <form
              class="kuesioner-form"
              data-id-alternatif="${alternatifId}"
              data-id-user="${idUser}"
            >
              <div class="mb-4">
                <label class="form-label">Progres Pengisian:</label>
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

    pertanyaanList.forEach((pertanyaan, idx) => {
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

      cardHtml += `
        <div class="list-group-item py-4">
          <h5 class="mb-3">
            <span class="badge bg-primary me-2">${idx + 1}</span>
            (${pertanyaan.nama_kriteria}) ${pertanyaan.teks_pertanyaan}
          </h5>
          <div class="fs-3 d-flex flex-wrap gap-2">
      `;

      subkriteriaOptions.forEach((sub) => {
        const isChecked = String(selectedSubkriteria) === String(sub.id_subkriteria);
        cardHtml += `
          <div class="form-check form-check-inline">
            <input
              class="form-check-input kuesioner-radio"
              type="radio"
              name="pertanyaan_${pertanyaan.id_pertanyaan}"
              data-kriteria="${pertanyaan.id_kriteria}"
              data-pertanyaan="${pertanyaan.id_pertanyaan}"
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

      cardHtml += `
          </div>
        </div>
      `;
    });

    if (Array.isArray(alternatifData.penilaian) && alternatifData.penilaian.length > 0) {
      cardHtml += `
        <div class="mt-4">
          <h6>Hasil Penilaian:</h6>
          <div class="table-responsive">
            <table class="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>Kriteria</th>
                  <th>Jawaban per Pertanyaan</th>
                  <th>Rata-rata</th>
                  <th>Kategori</th>
                </tr>
              </thead>
              <tbody>
      `;

      alternatifData.penilaian.forEach((penilaian) => {
        const jawabanDetails = Array.isArray(penilaian.jawaban_list)
          ? penilaian.jawaban_list
              .map(
                (jawaban) =>
                  `${jawaban.teks_pertanyaan}: ${jawaban.nama_subkriteria} (${jawaban.jawaban})`
              )
              .join("<br>")
          : "-";

        cardHtml += `
          <tr>
            <td>${penilaian.nama_kriteria}</td>
            <td>${jawabanDetails}</td>
            <td>${Number(penilaian.rata_rata || 0).toFixed(2)}</td>
            <td>${penilaian.nama_subkriteria || "-"}</td>
          </tr>
        `;
      });

      cardHtml += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    cardHtml += `
              <div class="mt-4 text-end">
                <button type="submit" class="btn btn-primary btn-responsive">Simpan</button>
                <button
                  type="button"
                  class="btn btn-danger btn-responsive delete-btn"
                  data-id-alternatif="${alternatifId}"
                  data-id-user="${idUser}"
                >
                  Hapus Penilaian
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    kuesionerContainer.insertAdjacentHTML("beforeend", cardHtml);
    index += 1;
  }

  kuesionerContainer
    .querySelectorAll(".kuesioner-form")
    .forEach((form) => updateProgressBar(form));
};

const loadKuesionerData = async (idUser) => {
  if (!idUser) {
    setEmptyMessage("Pilih siswa untuk melihat penilaian.");
    return;
  }

  setEmptyMessage("Memuat data penilaian...");
  resetState();

  try {
    const response = await fetchJSON(`${API_BASE}/users/${idUser}/alternatif`);
    const alternatifList = response?.data || [];

    if (alternatifList.length === 0) {
      setEmptyMessage("Tidak ada penilaian untuk siswa ini.");
      return;
    }

    for (const alternatif of alternatifList) {
      const [pertanyaanRes, penilaianRes] = await Promise.all([
        fetchJSON(`${API_BASE}/alternatif/${alternatif.id_alternatif}/pertanyaan`),
        fetchJSON(
          `${API_BASE}/users/${idUser}/alternatif/${alternatif.id_alternatif}`
        ),
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
    setEmptyMessage("Gagal memuat data penilaian.");
    Swal.fire({
      icon: "error",
      title: "Terjadi Kesalahan",
      text: error.message,
    });
  }
};

const handleSiswaChange = (event) => {
  const idUser = event.target.value;
  state.activeAlternatifId = null;
  loadKuesionerData(idUser);
};

const buildPayloadFromForm = (formElement) => {
  const idAlternatif = Number(formElement.dataset.idAlternatif);
  const radios = formElement.querySelectorAll(".kuesioner-radio:checked");
  return Array.from(radios).map((input) => ({
    id_alternatif: idAlternatif,
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
  const idAlternatif = form.dataset.idAlternatif;
  const pertanyaanList = state.pertanyaan.get(Number(idAlternatif)) || [];
  const answered = form.querySelectorAll(".kuesioner-radio:checked").length;

  if (answered < pertanyaanList.length) {
    Swal.fire({
      icon: "warning",
      title: "Peringatan",
      text: "Harap isi semua pertanyaan sebelum menyimpan!",
    });
    return;
  }

  const confirm = await Swal.fire({
    title: "Konfirmasi",
    text: "Apakah Anda yakin ingin menyimpan penilaian ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Simpan!",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  const penilaianPayload = buildPayloadFromForm(form);
  state.activeAlternatifId = idAlternatif;

  try {
    Swal.fire({
      title: "Memproses",
      text: "Sedang menyimpan data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await fetchJSON(
      `${API_BASE}/users/${idUser}/alternatif/${idAlternatif}`,
      {
        method: "PUT",
        body: { penilaian: penilaianPayload },
      }
    );

    Swal.close();
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Penilaian berhasil disimpan.",
      timer: 1500,
      showConfirmButton: false,
    });

    await loadKuesionerData(idUser);
  } catch (error) {
    Swal.close();
    Swal.fire({
      icon: "error",
      title: "Gagal menyimpan",
      text: error.message,
    });
  }
};

const handleDeleteClick = async (event) => {
  const button = event.target.closest(".delete-btn");
  if (!button) return;

  const idUser = button.dataset.idUser;
  const idAlternatif = button.dataset.idAlternatif;
  state.activeAlternatifId = idAlternatif;

  const confirm = await Swal.fire({
    title: "Konfirmasi Hapus",
    text: "Apakah Anda yakin ingin menghapus penilaian ini untuk alternatif tersebut?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  try {
    Swal.fire({
      title: "Memproses",
      text: "Sedang menghapus data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await fetchJSON(
      `${API_BASE}/users/${idUser}/alternatif/${idAlternatif}`,
      { method: "DELETE" }
    );

    Swal.close();
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Penilaian berhasil dihapus.",
      timer: 1500,
      showConfirmButton: false,
    });

    await loadKuesionerData(idUser);
  } catch (error) {
    Swal.close();
    Swal.fire({
      icon: "error",
      title: "Gagal menghapus",
      text: error.message,
    });
  }
};

const handleRadioChange = (event) => {
  if (!event.target.classList.contains("kuesioner-radio")) return;
  const form = event.target.closest(".kuesioner-form");
  if (form) {
    updateProgressBar(form);
  }
};

const loadSiswa = async () => {
  try {
    const response = await fetchJSON(`${API_BASE}/students`);
    renderSiswaDropdown(response?.data || []);
  } catch (error) {
    renderSiswaDropdown([]);
    Swal.fire({
      icon: "error",
      title: "Terjadi Kesalahan",
      text: error.message,
    });
  }
};

const bootstrap = async () => {
  siswaDropdown = document.getElementById("siswaDropdown");
  kuesionerContainer = document.getElementById("kuesionerContainer");

  const { redirected } = await requireAuth({ allowRoles: ["Guru BK"] });
  if (redirected) return;

  await loadSiswa();

  if (siswaDropdown) {
    siswaDropdown.addEventListener("change", handleSiswaChange);
  }

  if (kuesionerContainer) {
    kuesionerContainer.addEventListener("submit", handleFormSubmit);
    kuesionerContainer.addEventListener("click", handleDeleteClick);
    kuesionerContainer.addEventListener("change", handleRadioChange);
  }
};

document.addEventListener("DOMContentLoaded", bootstrap);
