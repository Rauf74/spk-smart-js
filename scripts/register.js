import { requireAuth } from "./auth-guard.js";

const API_REGISTER = "/api/auth/register";

const form = document.getElementById("registerForm");
const inputNama = document.getElementById("nama_user");
const inputUsername = document.getElementById("username");
const inputPassword = document.getElementById("password");
const inputNis = document.getElementById("nis");
const selectGender = document.getElementById("jenis_kelamin");
const togglePassword = document.getElementById("togglePassword");
const toggleIcon = document.getElementById("toggleIcon");

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

const showError = (title, message) => {
  Swal.fire({
    icon: "error",
    title,
    html: message,
    confirmButtonText: "Tutup",
  });
};

togglePassword?.addEventListener("click", () => {
  if (inputPassword.type === "password") {
    inputPassword.type = "text";
    toggleIcon.classList.remove("bi-eye");
    toggleIcon.classList.add("bi-eye-slash");
  } else {
    inputPassword.type = "password";
    toggleIcon.classList.remove("bi-eye-slash");
    toggleIcon.classList.add("bi-eye");
  }
});

const formFields = [inputNama, inputUsername, inputPassword, inputNis, selectGender];

formFields.forEach((field) => {
  field?.addEventListener("input", () => {
    field.classList.remove("is-invalid", "is-valid");
    if (field.value && field.checkValidity()) {
      field.classList.add("is-valid");
    }
  });

  field?.addEventListener("focus", () => {
    field.parentElement?.classList.add("shadow-sm", "border-primary");
  });

  field?.addEventListener("blur", () => {
    field.parentElement?.classList.remove("shadow-sm", "border-primary");
  });
});

inputNis?.addEventListener("input", () => {
  inputNis.value = inputNis.value.replace(/[^0-9]/g, "");
});

inputUsername?.addEventListener("input", () => {
  inputUsername.value = inputUsername.value
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form) return;

  const payload = {
    nama_user: inputNama.value.trim(),
    username: inputUsername.value.trim(),
    password: inputPassword.value,
    nis: inputNis.value.trim(),
    jenis_kelamin: selectGender.value,
  };

  const errors = [];

  if (!payload.nama_user || payload.nama_user.length < 3) {
    errors.push("Nama lengkap minimal 3 karakter.");
    inputNama.classList.add("is-invalid");
  } else {
    inputNama.classList.remove("is-invalid");
  }

  if (!payload.username || payload.username.length < 3) {
    errors.push("Username minimal 3 karakter.");
    inputUsername.classList.add("is-invalid");
  } else {
    inputUsername.classList.remove("is-invalid");
  }

  if (!payload.password || payload.password.length < 6) {
    errors.push("Password minimal 6 karakter.");
    inputPassword.classList.add("is-invalid");
  } else {
    inputPassword.classList.remove("is-invalid");
  }

  if (!payload.nis || payload.nis.length < 3) {
    errors.push("NIS wajib diisi.");
    inputNis.classList.add("is-invalid");
  } else {
    inputNis.classList.remove("is-invalid");
  }

  if (!payload.jenis_kelamin) {
    errors.push("Jenis kelamin wajib dipilih.");
    selectGender.classList.add("is-invalid");
  } else {
    selectGender.classList.remove("is-invalid");
  }

  if (errors.length) {
    showError(
      "Data Tidak Valid",
      html`
        <div class="alert alert-warning mt-3">
          <i class="bi bi-info-circle me-2"></i>
          Silakan perbaiki kesalahan berikut:
        </div>
        <ul class="text-start mt-3">
          ${errors.map((e) => `<li>${e}</li>`).join("")}
        </ul>
      `
    );
    return;
  }

  const confirm = await Swal.fire({
    title: html`<i class="bi bi-person-check text-primary"></i><br>Konfirmasi Pendaftaran`,
    html: html`
      <div class="text-start mt-3">
        <p class="mb-2"><strong>Nama:</strong> ${payload.nama_user}</p>
        <p class="mb-2"><strong>Username:</strong> ${payload.username}</p>
        <p class="mb-2"><strong>Jenis Kelamin:</strong> ${payload.jenis_kelamin}</p>
        <p class="mb-2"><strong>NIS:</strong> ${payload.nis}</p>
      </div>
      <div class="alert alert-info mt-3">
        <i class="bi bi-info-circle me-2"></i>
        Pastikan data yang Anda masukkan sudah benar.
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#667eea",
    cancelButtonColor: "#6c757d",
    confirmButtonText: html`<i class="bi bi-check-circle me-1"></i>Ya, Daftar!`,
    cancelButtonText: html`<i class="bi bi-x-circle me-1"></i>Periksa Kembali`,
  });

  if (!confirm.isConfirmed) return;

  Swal.fire({
    title: '<div class="spinner-border text-primary mb-3" role="status"></div>',
    html: html`
      <h5 class="mb-3">Sedang Memproses Pendaftaran</h5>
      <div class="progress mb-3">
        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
      </div>
      <p class="text-muted mb-0">Mohon tunggu sebentar...</p>
    `,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      let progress = 0;
      const bar = document.querySelector(".progress-bar");
      const itv = setInterval(() => {
        progress += 10;
        if (bar) bar.style.width = `${progress}%`;
        if (progress >= 90) clearInterval(itv);
      }, 100);
    },
  });

  try {
    await fetchJSON(API_REGISTER, {
      method: "POST",
      body: payload,
    });

    Swal.fire({
      icon: "success",
      title: html`<i class="bi bi-check-circle-fill text-success"></i><br>Pendaftaran Berhasil!`,
      html: html`
        <div class="alert alert-success mt-3">
          <i class="bi bi-shield-check me-2"></i>
          Akun siswa berhasil didaftarkan dalam sistem SPK.
        </div>
        <p class="mb-3">Selamat datang, <strong>${payload.nama_user}</strong>!</p>
        <p class="text-muted">Anda akan dialihkan ke halaman login...</p>
      `,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
    }).then(() => {
      window.location.href = "/views/login.html";
    });
  } catch (error) {
    showError("Pendaftaran Gagal", error.message);
  }
});

(async () => {
  const { redirected } = await requireAuth({ redirectIfLoggedIn: "/views/index.html" });
  if (redirected) return;
})();

