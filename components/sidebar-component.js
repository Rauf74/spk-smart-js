// components/sidebar-component.js
class SpkSidebar extends HTMLElement {
  async connectedCallback() {
    const user = await this._getUser();
    const role = user?.role || "";

    const EXT = ".html";                      // ganti ".php" untuk halaman yang belum migrasi
    const v = (name, ext=EXT) => `/views/${name}${ext}`;

    const menuHome = () => `
      <li class="nav-small-cap"><i class="ti ti-dots nav-small-cap-icon fs-4"></i><span class="hide-menu">Home</span></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("index")}"><span><i class="ti ti-home-2"></i></span><span class="hide-menu">Dashboard</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("profile")}"><span><i class="ti ti-user"></i></span><span class="hide-menu">Data Profile</span></a></li>
    `;

    const menuGuruBK = () => `
      <li class="nav-small-cap"><i class="ti ti-dots nav-small-cap-icon fs-4"></i><span class="hide-menu">Input Data</span></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("kriteria")}"><span><i class="ti ti-list-check"></i></span><span class="hide-menu">Data Kriteria</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("subkriteria")}"><span><i class="ti ti-list-details"></i></span><span class="hide-menu">Data Subkriteria</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("alternatif")}"><span><i class="ti ti-clipboard-list"></i></span><span class="hide-menu">Data Alternatif</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("pertanyaan")}"><span><i class="ti ti-help"></i></span><span class="hide-menu">Data Pertanyaan</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("penilaian")}"><span><i class="ti ti-star"></i></span><span class="hide-menu">Data Penilaian</span></a></li>

      <li class="nav-small-cap"><i class="ti ti-dots nav-small-cap-icon fs-4"></i><span class="hide-menu">Perhitungan</span></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("perhitungan")}"><span><i class="ti ti-calculator"></i></span><span class="hide-menu">Data Perhitungan</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("perangkingan")}"><span><i class="ti ti-trophy"></i></span><span class="hide-menu">Hasil Perangkingan</span></a></li>

      <li class="nav-small-cap"><i class="ti ti-dots nav-small-cap-icon fs-4"></i><span class="hide-menu">Manajemen User</span></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("user")}"><span><i class="ti ti-users"></i></span><span class="hide-menu">Data User</span></a></li>
    `;

    const menuSiswa = () => `
      <li class="nav-small-cap"><i class="ti ti-dots nav-small-cap-icon fs-4"></i><span class="hide-menu">Input Data</span></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("penilaian_siswa")}"><span><i class="ti ti-star"></i></span><span class="hide-menu">Data Penilaian Saya</span></a></li>

      <li class="nav-small-cap"><i class="ti ti-dots nav-small-cap-icon fs-4"></i><span class="hide-menu">Perhitungan</span></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("perhitungan_siswa")}"><span><i class="ti ti-calculator"></i></span><span class="hide-menu">Data Perhitungan Saya</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("perangkingan_siswa")}"><span><i class="ti ti-trophy"></i></span><span class="hide-menu">Hasil Perangkingan Saya</span></a></li>
    `;

    const menuAll = () => `
      <li class="nav-small-cap"><i class="ti ti-dots nav-small-cap-icon fs-4"></i><span class="hide-menu">Input Data</span></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("kriteria")}"><span><i class="ti ti-list-check"></i></span><span class="hide-menu">Data Kriteria</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("subkriteria")}"><span><i class="ti ti-list-details"></i></span><span class="hide-menu">Data Sub Kriteria</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("alternatif")}"><span><i class="ti ti-clipboard-list"></i></span><span class="hide-menu">Data Alternatif</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("pertanyaan")}"><span><i class="ti ti-help"></i></span><span class="hide-menu">Data Pertanyaan</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("penilaian")}"><span><i class="ti ti-star"></i></span><span class="hide-menu">Data Penilaian</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("penilaian_siswa")}"><span><i class="ti ti-star"></i></span><span class="hide-menu">Data Penilaian Siswa</span></a></li>

      <li class="nav-small-cap"><i class="ti ti-dots nav-small-cap-icon fs-4"></i><span class="hide-menu">Perhitungan</span></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("perhitungan")}"><span><i class="ti ti-calculator"></i></span><span class="hide-menu">Data Perhitungan</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("perhitungan_siswa")}"><span><i class="ti ti-calculator"></i></span><span class="hide-menu">Data Perhitungan Siswa</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("perangkingan")}"><span><i class="ti ti-trophy"></i></span><span class="hide-menu">Data Perangkingan</span></a></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("perangkingan_siswa")}"><span><i class="ti ti-trophy"></i></span><span class="hide-menu">Data Perangkingan Siswa</span></a></li>

      <li class="nav-small-cap"><i class="ti ti-dots nav-small-cap-icon fs-4"></i><span class="hide-menu">Manajemen User</span></li>
      <li class="sidebar-item"><a class="sidebar-link" href="${v("user")}"><span><i class="ti ti-users"></i></span><span class="hide-menu">Data User</span></a></li>
    `;

    const selected = role === "Guru BK" ? menuGuruBK()
                   : role === "Siswa"   ? menuSiswa()
                   : menuAll();

    this.innerHTML = `
<aside class="left-sidebar">
  <div>
    <div class="brand-logo d-flex align-items-center justify-content-between pt-3">
      <a href="${v("index")}" class="text-nowrap logo-img d-flex align-items-center gap-2">
        <img src="/assets/images/smk3.png" width="50" alt="" />
        <div>
          <span class="d-block fs-4 fw-bold">SMK Muhammadiyah 3</span>
          <span class="d-block fs-4 fw-bold">Tangerang Selatan</span>
        </div>
      </a>
    </div>
    <nav class="sidebar-nav scroll-sidebar" data-simplebar="">
      <ul id="sidebarnav">
        ${menuHome()}
        ${selected}
      </ul>
    </nav>
  </div>
</aside>
`;

    if (window.initSidebarToggler) window.initSidebarToggler();
    if (window.initSidebarMenu) window.initSidebarMenu();
  }

  async _getUser() {
    try {
      const guardGet = window.AuthGuard?.getCurrentUser;
      if (typeof guardGet === "function") {
        return await guardGet();
      }
    } catch {}

    if (window.__AUTH) {
      return window.__AUTH;
    }

    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      return await r.json();
    } catch { return { id: null, name: "Guest", role: "" }; }
  }
}
customElements.define("spk-sidebar", SpkSidebar);
