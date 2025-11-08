import { requireAuth, getCurrentUser } from "./auth-guard.js";

const API_BASE = "/api/users";

const fetchJSON = async (url, options = {}) => {
  const config = {
    credentials: "include",
    ...options,
  };
  const response = await fetch(url, config);
  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!response.ok) {
    const message =
      (json && (json.error || json.message)) ||
      `Request gagal (${response.status})`;
    throw new Error(message);
  }
  return json;
};

const fetchUsers = async () => {
  const result = await fetchJSON(API_BASE);
  return result?.data ?? [];
};

const createUser = async (payload) => {
  return fetchJSON(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

const updateUser = async (id, payload) => {
  return fetchJSON(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

const removeUser = async (id) => {
  return fetchJSON(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  const { redirected, user } = await requireAuth({ allowRoles: ["Guru BK"] });
  if (redirected) return;

  const current = user || (await getCurrentUser());
  const currentUserId = Number(current?.id ?? 0);
  const currentInput = document.getElementById("current-user-id");
  if (currentInput) currentInput.value = currentUserId || 0;

  let table;

  const reloadTable = (resetPaging = false) => {
    if (table) {
      table.ajax.reload(null, !resetPaging);
    }
  };

  const initTable = () => {
    table = $("#myTableUser").DataTable({
      processing: false,
      serverSide: false,
      ajax: (_data, callback) => {
        fetchUsers()
          .then((rows) => {
            callback({ data: rows });
          })
          .catch((error) => {
            console.error("[user] load", error);
            Swal.fire("Gagal!", error.message || "Tidak dapat memuat data user.", "error");
            callback({ data: [] });
          });
      },
      scrollX: true,
      columns: [
        {
          data: null,
          className: "text-center",
          render: (_data, _type, _row, meta) => meta.row + 1,
        },
        { data: "nama_user", className: "text-center" },
        {
          data: "jenis_kelamin",
          className: "text-center",
          render: (data) => data || "-",
        },
        { data: "username", className: "text-center" },
        {
          data: "password",
          className: "text-center",
          render: () => "********",
        },
        {
          data: "role",
          className: "text-center",
          render: (data) => (data === "Guru BK" ? "Guru BK" : "Siswa"),
        },
        {
          data: "nis",
          className: "text-center",
          render: (data) => data || "-",
        },
        {
          data: "is_logged_in",
          className: "text-center",
          render: (data) =>
            Number(data) === 1
              ? '<span class="badge bg-success">Online</span>'
              : '<span class="badge bg-secondary">Offline</span>',
        },
        {
          data: null,
          className: "text-center",
          render: (data, _type, row) => {
            const preventDelete = Number(row.id_user) === currentUserId;
            const tooltip = preventDelete
              ? ' data-bs-toggle="tooltip" data-bs-placement="top" title="Tidak dapat menghapus user yang sedang login"'
              : "";
            const disabled = preventDelete ? " disabled" : "";
            return `
              <button class="btn btn-warning btn-sm edit-btn" data-id="${row.id_user}">Edit</button>
              <button class="btn btn-danger btn-sm delete-btn" data-id="${row.id_user}"${tooltip}${disabled}>Hapus</button>
            `;
          },
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
      drawCallback: () => {
        document
          .querySelectorAll('[data-bs-toggle="tooltip"]')
          .forEach((el) => new bootstrap.Tooltip(el));
      },
    });
  };

  const resetForm = (action = "add") => {
    $("#userForm")[0].reset();
    $("#formAction").val(action);
    $("#id_user").val("");
    const passwordInput = $("#password");
    const help = $("#passwordHelp");
    if (action === "add") {
      passwordInput.attr("required", true);
      help.text("Masukkan password untuk user baru");
    } else {
      passwordInput.removeAttr("required");
      passwordInput.val("");
      help.text("Kosongkan jika tidak ingin mengubah password");
    }
  };

  const openModalForAdd = () => {
    $("#modalTitle").text("Tambah User");
    resetForm("add");
    $("#role").val("Siswa");
    $("#userModal").modal("show");
  };

  const openModalForEdit = (data) => {
    $("#modalTitle").text("Edit User");
    resetForm("edit");
    $("#id_user").val(data.id_user);
    $("#nama_user").val(data.nama_user || "");
    $("#jenis_kelamin").val(data.jenis_kelamin || "");
    $("#username").val(data.username || "");
    $("#role").val(data.role || "Siswa");
    $("#nis").val(data.nis || "");
    $("#userModal").modal("show");
  };

  const handleDelete = async (id) => {
    const confirmation = await Swal.fire({
      title: "Konfirmasi",
      text: "Apakah Anda yakin ingin menghapus user ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });
    if (!confirmation.isConfirmed) return;

    Swal.fire({
      title: "Menghapus",
      text: "Sedang menghapus data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const result = await removeUser(id);
      if (!result.success) throw new Error(result.error || "Gagal menghapus user.");
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data user berhasil dihapus",
        timer: 1500,
        showConfirmButton: false,
      });
      reloadTable();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: error.message || "Terjadi kesalahan saat menghapus data",
        confirmButtonText: "Tutup",
      });
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const action = $("#formAction").val();
    const id = $("#id_user").val();
    const payload = {
      nama_user: $("#nama_user").val().trim(),
      jenis_kelamin: $("#jenis_kelamin").val() || null,
      username: $("#username").val().trim(),
      password: $("#password").val().trim(),
      role: $("#role").val(),
      nis: $("#nis").val().trim() || null,
    };

    if (!payload.nama_user || !payload.username || (!payload.password && action === "add")) {
      Swal.fire("Perhatian", "Nama, username, dan password wajib diisi.", "warning");
      return;
    }

    const confirmText = action === "add" ? "menambahkan data user ini?" : "mengedit data user ini?";
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

    Swal.fire({
      title: "Memproses",
      text: "Sedang menyimpan data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      if (action === "add") {
        await createUser(payload);
      } else {
        if (!payload.password) {
          delete payload.password;
        }
        await updateUser(id, payload);
      }

      $("#userModal").modal("hide");
      reloadTable(true);

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Data user berhasil ${action === "add" ? "ditambahkan" : "diperbarui"}`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: error.message || "Terjadi kesalahan saat menyimpan data",
        confirmButtonText: "Tutup",
      });
    }
  };

  const bindEvents = () => {
    $("#tambah").on("click", openModalForAdd);

    $("#refreshTable").on("click", () => {
      Swal.fire({
        title: "Memperbarui Data",
        text: "Mohon tunggu...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      fetchUsers()
        .then(() => {
          reloadTable();
          Swal.close();
        })
        .catch((error) => {
          Swal.fire({
            icon: "error",
            title: "Gagal!",
            text: error.message || "Terjadi kesalahan saat memuat ulang data",
          });
        });
    });

    $("#myTableUser").on("click", ".edit-btn", function () {
      const row = table.row($(this).closest("tr"));
      const data = row.data();
      if (data) {
        openModalForEdit(data);
      }
    });

    $("#myTableUser").on("click", ".delete-btn", function () {
      const id = $(this).data("id");
      if (!id) return;
      if (Number(id) === currentUserId) return;
      handleDelete(id);
    });

    $("#userForm").on("submit", handleFormSubmit);

    setInterval(() => {
      reloadTable();
    }, 10000);
  };

  initTable();
  bindEvents();
});
