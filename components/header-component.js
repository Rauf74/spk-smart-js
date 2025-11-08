// components/header-component.js
class SpkHeader extends HTMLElement {
  async connectedCallback() {
    const user = await this._getUser();
    const profileImg = this._profileImageByGender(user?.jenis_kelamin);

    this.innerHTML = `
<header class="app-header">
  <nav class="navbar navbar-expand-lg navbar-light">
    <ul class="navbar-nav">
      <li class="nav-item d-block d-xl-none">
        <a class="nav-link sidebartoggler nav-icon-hover" id="headerCollapse" href="javascript:void(0)">
          <i class="ti ti-menu-2"></i>
        </a>
      </li>
    </ul>
    <div class="navbar-collapse justify-content-end px-0" id="navbarNav">
      <ul class="navbar-nav flex-row ms-auto align-items-center justify-content-end">
        <li class="nav-item dropdown">
          <a class="nav-link nav-icon-hover" href="javascript:void(0)" id="drop2" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="${profileImg}" alt="" width="35" height="35" class="rounded-circle">
          </a>
          <div class="dropdown-menu dropdown-menu-end dropdown-menu-animate-up" aria-labelledby="drop2">
            <div class="message-body text-center">
              <p class="mb-1 fw-bold">Halo,</p>
              <p class="mb-2">${this._escape(user?.name || 'Guest')}</p>
              <div class="d-grid gap-2 px-3 mt-2">
                ${user?.id
                  ? `<button id="btnLogout" class="btn btn-outline-primary">Logout</button>`
                  : `<a href="/views/login.html" class="btn btn-outline-primary">Login</a>`
                }
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </nav>
</header>
`;

    if (window.initSidebarToggler) window.initSidebarToggler();

    const btnLogout = this.querySelector("#btnLogout");
    if (btnLogout) {
      btnLogout.addEventListener("click", async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } catch {}
        location.href = "/views/login.html";
      });
    }
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
    } catch {
      return { id: null, name: "Guest", role: "", jenis_kelamin: null };
    }
  }

  _profileImageByGender(jk) {
    if (jk === "Laki-laki") return "/assets/images/profile/user-male.png";
    if (jk === "Perempuan")  return "/assets/images/profile/user-female.png";
    return "/assets/images/profile/user-1.jpg";
  }

  _escape(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[c])); }
}
customElements.define("spk-header", SpkHeader);

