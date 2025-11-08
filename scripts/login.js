// scripts/login.js
$(document).ready(function () {
  const apiUrl = '/api/auth'; // GANTI: pakai router Node

  $('#loginForm').on('submit', function (e) {
    e.preventDefault();
    var formData = {
      username: $('#username').val().trim(),
      password: $('#password').val()
    };
    if (!validateForm(formData)) return;
    processLogin(formData);
  });

  function processLogin(formData) {
    Swal.fire({
      title: '<div class="spinner-border text-primary mb-3" role="status"></div>',
      html: `
        <h5 class="mb-3">Memverifikasi Login</h5>
        <div class="progress mb-3">
          <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%"></div>
        </div>
        <p class="text-muted mb-0">Sedang memeriksa kredensial...</p>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      customClass: { popup: 'rounded-4' },
      didOpen: function () {
        let progress = 0; const bar = document.querySelector('.progress-bar');
        const itv = setInterval(()=>{ progress+=15; bar.style.width = progress+'%'; if(progress>=90) clearInterval(itv); },150);
      }
    });

    $.ajax({
      url: `${apiUrl}/login`,
      type: 'POST',
      data: JSON.stringify(formData),
      contentType: 'application/json',
      timeout: 8000,
      xhrFields: { withCredentials: true }, // penting untuk cookie
      success: function (response) {
        if (response.success) {
          showLoginSuccess(response);
        } else {
          showLoginError(response.error || 'Username atau password salah');
        }
      },
      error: function (xhr, status) {
        let msg = 'Terjadi kesalahan sistem.';
        if (status === 'timeout') msg = 'Koneksi timeout. Periksa koneksi internet Anda.';
        else if (xhr.status === 0) msg = 'Tidak dapat menghubungi server. Periksa koneksi internet.';
        else if (xhr.status === 401) msg = 'Username atau password salah.';
        else if (xhr.status >= 500) msg = 'Server sedang bermasalah. Coba lagi nanti.';
        showLoginError(msg);
      }
    });
  }

  function showLoginSuccess(response) {
    const userRole = response.user.role || 'Pengguna';
    const userName = response.user.nama_user || 'User';
    Swal.fire({
      icon: 'success',
      title: '<i class="bi bi-check-circle-fill text-success animate-check"></i><br>Login Berhasil!',
      html: `
        <div class="alert alert-success mt-3 text-center">
          Selamat datang kembali, <strong>${userName}</strong>!
        </div>
        <div class="bg-light rounded-3 p-3 mt-3 text-center">
          <div class="d-flex align-items-center justify-content-center">
            <i class="bi bi-person-badge me-2 text-primary"></i>
            <span class="fw-semibold">Role: ${userRole}</span>
          </div>
        </div>
        <p class="text-muted mt-3 text-center">Anda akan diarahkan ke dashboard...</p>
      `,
      timer: 1800,
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: { popup: 'rounded-4' },
      didOpen: function () {
        const icon = document.querySelector('.animate-check');
        icon.style.transition = 'transform .5s ease, opacity .5s ease';
        icon.style.transform = 'scale(1.2)'; icon.style.opacity = '0.8';
        setTimeout(()=>{ icon.style.transform='scale(1)'; icon.style.opacity='1'; }, 500);
      }
    }).then(() => {
      // arahkan ke dashboard HTML
      window.location.href = '/views/index.html';
    });
  }

  function showLoginError(errorMessage) {
    Swal.fire({
      icon: 'error',
      title: '<i class="bi bi-shield-x text-danger"></i><br>Login Gagal',
      html: `
        <div class="alert alert-danger mt-3">
          <i class="bi bi-exclamation-triangle me-2"></i>${errorMessage}
        </div>
        <div class="mt-3">
          <p class="text-muted mb-2">Tips untuk login berhasil:</p>
          <ul class="text-start text-muted small">
            <li>Pastikan username dan password benar</li>
            <li>Periksa koneksi internet Anda</li>
            <li>Hubungi administrator jika masalah berlanjut</li>
          </ul>
        </div>
      `,
      confirmButtonText: '<i class="bi bi-arrow-clockwise me-1"></i>Coba Lagi',
      confirmButtonColor: '#dc3545',
      customClass: { popup: 'rounded-4', confirmButton: 'rounded-3' }
    }).then(() => { $('#username').focus(); resetSubmitButton(); });
  }

  function validateForm(data) {
    let ok = true, errs = [];
    if (!data.username || data.username.length < 3) { errs.push('Username minimal 3 karakter'); $('#username').addClass('is-invalid'); ok = false; }
    else { $('#username').removeClass('is-invalid').addClass('is-valid'); }
    if (!data.password || data.password.length < 1) { errs.push('Password wajib diisi'); $('#password').addClass('is-invalid'); ok = false; }
    else { $('#password').removeClass('is-invalid').addClass('is-valid'); }
    if (!ok) {
      Swal.fire({
        icon: 'warning',
        title: '<i class="bi bi-exclamation-triangle text-warning"></i><br>Data Tidak Valid',
        html: `
          <div class="alert alert-warning mt-3"><i class="bi bi-info-circle me-2"></i>Silakan perbaiki kesalahan berikut:</div>
          <ul class="text-start mt-3">${errs.map(e=>`<li>${e}</li>`).join('')}</ul>
        `,
        confirmButtonText: '<i class="bi bi-pencil me-1"></i>Perbaiki Data',
        confirmButtonColor: '#ffc107',
        customClass: { popup: 'rounded-4', confirmButton: 'rounded-3' }
      });
    }
    return ok;
  }

  function resetSubmitButton() {
    const btn = $('#loginSubmit');
    btn.html('<i class="bi bi-box-arrow-in-right me-2"></i>Masuk ke Sistem');
    btn.prop('disabled', false);
  }

  // sisa efek UI punyamu biarkan...
  $('#loginForm').on('input','input',function(){ const $i=$(this),v=$i.val().trim(); $i.removeClass('is-invalid is-valid'); if(v&&v.length>=3){setTimeout(()=>{$i.addClass('is-valid')},200)}});
  $('.form-control').on('focus',function(){$(this).closest('.input-group').addClass('shadow-sm border-primary')}).on('blur',function(){$(this).closest('.input-group').removeClass('shadow-sm border-primary')});
  $(document).on('keydown',function(e){ if(e.ctrlKey&&e.key==='Enter'){e.preventDefault(); $('#loginForm').trigger('submit')} if(e.key==='Escape'){clearForm()} });
  function clearForm(){ $('#loginForm')[0].reset(); $('.form-control').removeClass('is-valid is-invalid'); $('#username').focus(); }
  $('#username').on('input',function(){ let v=$(this).val().replace(/\s/g,'').toLowerCase(); $(this).val(v); });
  $('#togglePassword').on('click',function(){ const p=$('#password'); const ic=$(this).find('i'); const t=p.attr('type'); $(this).addClass('active'); setTimeout(()=>{$(this).removeClass('active')},150); if(t==='password'){p.attr('type','text'); ic.removeClass('bi-eye').addClass('bi-eye-slash')} else {p.attr('type','password'); ic.removeClass('bi-eye-slash').addClass('bi-eye')} });
  setTimeout(()=>{$('#username').focus()},100);
});
