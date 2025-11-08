import { requireAuth, getCurrentUser, clearCachedUser } from "./auth-guard.js";

const API_BASE = "/api/profile";

const selectors = {
  avatar: "#profile_image",
  name: '[id="nama_lengkap"]',
  username: '[id="username_display"]',
  nameDetail: "#nama_lengkap_detail",
  usernameDetail: "#username_detail",
  userId: "#user_id_display",
  status: "#status_akun",
  gender: "#jenis_kelamin_display",
  nisWrapper: "#nis_wrapper",
  nis: "#nis_display",
  quickLinksContainer: "#quickLinksContainer",
  quickLinksGuruTemplate: "#quickLinksGuru",
  quickLinksSiswaTemplate: "#quickLinksSiswa",
  editForm: "#editProfileForm",
  changePasswordForm: "#changePasswordForm",
  editName: "#edit_nama_user",
  editUsername: "#edit_username",
  editGender: "#edit_jenis_kelamin",
  newPassword: "#new_password",
  passwordStrength: ".password-strength",
};

const genderAvatar = (gender) => {
  if (gender === "Laki-laki") return "/assets/images/profile/user-male.png";
  if (gender === "Perempuan") return "/assets/images/profile/user-female.png";
  return "/assets/images/profile/user-1.jpg";
};

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function formatUserId(id) {
  if (!id) return "#0000";
  return `#${String(id).padStart(4, "0")}`;
}

function setTextAll(selector, value) {
  $$(selector).forEach((el) => {
    if (el) el.textContent = value;
  });
}

function setText(selector, value) {
  const el = $(selector);
  if (el) el.textContent = value;
}

function setHTML(selector, value) {
  const el = $(selector);
  if (el) el.innerHTML = value;
}

function renderStatus(isLoggedIn) {
  const el = $(selectors.status);
  if (!el) return;
  if (isLoggedIn) {
    el.className = "badge bg-success rounded-3 fw-semibold";
    el.innerHTML = "Online";
  } else {
    el.className = "badge bg-secondary rounded-3 fw-semibold";
    el.innerHTML = "Offline";
  }
}

function fillProfileForm(user) {
  const nameInput = $(selectors.editName);
  const usernameInput = $(selectors.editUsername);
  const genderSelect = $(selectors.editGender);
  if (nameInput) nameInput.value = user?.name || "";
  if (usernameInput) usernameInput.value = user?.username || "";
  if (genderSelect) genderSelect.value = user?.jenis_kelamin || "";
}

function clearPasswordForm() {
  const form = $(selectors.changePasswordForm);
  if (form) form.reset();
  $$(selectors.passwordStrength).forEach((node) => node.remove());
}

async function fetchProfile() {
  const response = await fetch(`${API_BASE}/me`, {
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Gagal memuat data profil.");
  }
  const json = await response.json();
  return json.data;
}

function renderProfile({ user, stats, activities }) {
  if (user) {
    const avatarEl = $(selectors.avatar);
    if (avatarEl) avatarEl.src = genderAvatar(user.jenis_kelamin);

    setTextAll(selectors.name, user.name || "-");
    setTextAll(
      selectors.username,
      user.username ? `@${user.username}` : "@username"
    );
    setText(selectors.nameDetail, user.name || "-");
    setText(
      selectors.usernameDetail,
      user.username ? `@${user.username}` : "@username"
    );
    setText(selectors.userId, formatUserId(user.id));
    renderStatus(user.is_logged_in);
    setText(selectors.gender, user.jenis_kelamin || "-");

    const nisWrapper = $(selectors.nisWrapper);
    if (user.role === "Siswa" && user.nis) {
      if (nisWrapper) nisWrapper.hidden = false;
      setText(selectors.nis, user.nis);
    } else if (nisWrapper) {
      nisWrapper.hidden = true;
      setText(selectors.nis, "-");
    }

    renderQuickLinks(user.role);

    fillProfileForm(user);
  }
}

function renderQuickLinks(role) {
  const container = $(selectors.quickLinksContainer);
  if (!container) return;

  const templateId =
    role === "Guru BK"
      ? selectors.quickLinksGuruTemplate
      : role === "Siswa"
      ? selectors.quickLinksSiswaTemplate
      : null;

  container.innerHTML = "";

  if (!templateId) {
    container.hidden = true;
    return;
  }

  const template = $(templateId);
  if (!template || !("content" in template)) {
    container.hidden = true;
    return;
  }

  container.appendChild(template.content.cloneNode(true));
  container.hidden = false;
}

async function loadProfile() {
  try {
    const data = await fetchProfile();
    renderProfile(data);
  } catch (error) {
    console.error("[profile] loadProfile", error);
    if (window.Swal) {
      Swal.fire({
        icon: "error",
        title: "Gagal memuat profil",
        text: error.message,
      });
    }
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = {
    nama_user: form.nama_user.value.trim(),
    username: form.username.value.trim(),
    jenis_kelamin: form.jenis_kelamin.value.trim(),
  };

  if (!payload.nama_user || !payload.username) {
    Swal.fire({
      icon: "warning",
      title: "Data tidak lengkap",
      text: "Nama dan username wajib diisi.",
    });
    return;
  }

  const confirm = await Swal.fire({
    icon: "question",
    title: "Simpan perubahan profil?",
    text: "Pastikan data sudah benar.",
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  try {
    const response = await fetch(`${API_BASE}/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.success) {
      throw new Error(json.error || "Gagal memperbarui profil.");
    }

    await Swal.fire({
      icon: "success",
      title: "Profil diperbarui",
      text: json.message || "Data berhasil disimpan.",
      timer: 1800,
      showConfirmButton: false,
    });

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editProfileModal")
    );
    modal?.hide();

    clearCachedUser?.();
    await loadProfile();
  } catch (error) {
    console.error("[profile] update", error);
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: error.message,
    });
  }
}

async function handlePasswordChange(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = {
    current_password: form.current_password.value,
    new_password: form.new_password.value,
    confirm_password: form.confirm_password.value,
  };

  if (payload.new_password !== payload.confirm_password) {
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: "Konfirmasi password tidak cocok.",
    });
    return;
  }

  const confirm = await Swal.fire({
    icon: "question",
    title: "Ubah password?",
    text: "Pastikan password baru aman.",
    showCancelButton: true,
    confirmButtonText: "Ubah",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  try {
    const response = await fetch(`${API_BASE}/me/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.success) {
      throw new Error(json.error || "Gagal mengubah password.");
    }

    await Swal.fire({
      icon: "success",
      title: "Password diperbarui",
      text: json.message || "Password berhasil diubah.",
      timer: 1800,
      showConfirmButton: false,
    });

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("changePasswordModal")
    );
    modal?.hide();
    clearPasswordForm();
  } catch (error) {
    console.error("[profile] changePassword", error);
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: error.message,
    });
  }
}

function handlePasswordStrength(event) {
  const password = event.currentTarget.value || "";
  let strength = 0;
  if (password.length >= 6) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  let text = "Sangat Lemah";
  let cls = "text-danger";

  if (strength >= 4) {
    text = "Kuat";
    cls = "text-success";
  } else if (strength >= 2) {
    text = "Sedang";
    cls = "text-warning";
  }

  $$(selectors.passwordStrength).forEach((node) => node.remove());

  const indicator = document.createElement("div");
  indicator.className = "password-strength mt-1";
  indicator.innerHTML = `<small class="${cls}">Kekuatan Password: ${text}</small>`;
  event.currentTarget.insertAdjacentElement("afterend", indicator);
}

function bindEvents() {
  const editForm = $(selectors.editForm);
  if (editForm) editForm.addEventListener("submit", handleProfileUpdate);

  const passwordForm = $(selectors.changePasswordForm);
  if (passwordForm) passwordForm.addEventListener("submit", handlePasswordChange);

  const newPasswordInput = $(selectors.newPassword);
  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", handlePasswordStrength);
  }

  document
    .getElementById("editProfileModal")
    ?.addEventListener("hidden.bs.modal", () => {
      const form = $(selectors.editForm);
      if (form) {
        form.reset();
        loadProfile();
      }
    });

  document
    .getElementById("changePasswordModal")
    ?.addEventListener("hidden.bs.modal", clearPasswordForm);
}

async function bootstrapProfile() {
  const { redirected, user } = await requireAuth();
  if (redirected) return;
  bindEvents();

  await getCurrentUser();
  await loadProfile();
}

document.addEventListener("DOMContentLoaded", bootstrapProfile);
