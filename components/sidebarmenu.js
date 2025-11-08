// File: assets/js/sidebarmenu.js
function initSidebarMenu() {
  // Bersihkan semua kelas active dan selected terlebih dahulu
  $("#sidebarnav a").removeClass("active");
  $("#sidebarnav li").removeClass("active selected");
  $("#sidebarnav ul").removeClass("in");

  // Dapatkan URL dan path saat ini
  var url = window.location.href;
  var path = url.replace(window.location.protocol + "//" + window.location.host + "/", "");
  
  // Normalisasi path untuk menangani kasus index.php
  if (path === "" || path === "index.php") {
    path = "./index.php";
  }

  // Cari elemen yang cocok dengan URL
  var element = $("#sidebarnav a").filter(function () {
    // Normalisasi href untuk perbandingan
    var href = this.href.replace(window.location.protocol + "//" + window.location.host + "/", "");
    return href === path;
  });

  // Jika tidak ada elemen yang cocok, cari elemen Dashboard secara eksplisit untuk halaman utama
  if (element.length === 0 && (path === "./index.php" || path === "")) {
    element = $("#sidebarnav a[href='./index.php']");
  }

  // Tambahkan kelas active dan selected ke elemen yang cocok
  element.each(function () {
    $(this).addClass("active");
    $(this).parentsUntil(".sidebar-nav").each(function () {
      if ($(this).is("li") && $(this).children("a").length !== 0) {
        $(this).children("a").addClass("active");
        $(this).parent("ul#sidebarnav").length === 0
          ? $(this).addClass("active")
          : $(this).addClass("selected");
      } else if (!$(this).is("ul") && $(this).children("a").length === 0) {
        $(this).addClass("selected");
      } else if ($(this).is("ul")) {
        $(this).addClass("in");
      }
    });
  });

  // Event listener untuk klik pada menu
  $("#sidebarnav a").off("click").on("click", function (e) {
    if (!$(this).hasClass("active")) {
      // Bersihkan semua status aktif
      $("#sidebarnav a").removeClass("active");
      $("#sidebarnav li").removeClass("active selected");
      $("#sidebarnav ul").removeClass("in");

      // Tambahkan status aktif ke elemen yang diklik
      $(this).addClass("active");
      $(this).parentsUntil(".sidebar-nav").each(function () {
        if ($(this).is("li") && $(this).children("a").length !== 0) {
          $(this).children("a").addClass("active");
          $(this).parent("ul#sidebarnav").length === 0
            ? $(this).addClass("active")
            : $(this).addClass("selected");
        } else if (!$(this).is("ul") && $(this).children("a").length === 0) {
          $(this).addClass("selected");
        } else if ($(this).is("ul")) {
          $(this).addClass("in");
        }
      });
    } else {
      $(this).removeClass("active");
      $(this).parents("ul:first").removeClass("active");
      $(this).next("ul").removeClass("in");
    }
  });

  $("#sidebarnav >li >a.has-arrow").off("click").on("click", function (e) {
    e.preventDefault();
  });
}

// Panggil saat dokumen siap
$(document).ready(initSidebarMenu);

// Ekspor fungsi untuk dipanggil ulang
window.initSidebarMenu = initSidebarMenu;