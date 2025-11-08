const LOGIN_URL = "/views/login.html";
const HOME_URL = "/views/index.html";

const state = {
  user: null,
  promise: null,
};

const guestUser = Object.freeze({
  id: null,
  name: "Guest",
  username: "",
  role: "",
  nis: null,
  jenis_kelamin: null,
});

function normalizeUser(data) {
  if (!data || typeof data !== "object") return guestUser;

  const normalized = {
    id: data.id ?? data.id_user ?? null,
    name: data.name ?? data.nama_user ?? "Guest",
    username: data.username ?? "",
    role: data.role ?? "",
    nis: data.nis ?? null,
    jenis_kelamin: data.jenis_kelamin ?? null,
  };

  return Object.freeze(normalized);
}

async function loadUser(forceRefresh = false) {
  if (!forceRefresh && state.user) return state.user;
  if (!forceRefresh && state.promise) return state.promise;

  state.promise = fetch("/api/auth/me", { credentials: "include" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Failed to fetch user");
      const raw = await response.json().catch(() => ({}));
      return normalizeUser(raw);
    })
    .catch(() => guestUser)
    .then((user) => {
      state.user = user;
      if (typeof window !== "undefined") {
        window.__AUTH = user;
      }
      return user;
    })
    .finally(() => {
      state.promise = null;
    });

  return state.promise;
}

export async function getCurrentUser(options = {}) {
  const { forceRefresh = false } = options;
  return loadUser(forceRefresh);
}

export function clearCachedUser() {
  state.user = null;
  state.promise = null;
  if (typeof window !== "undefined") {
    window.__AUTH = guestUser;
  }
}

export async function requireAuth(options = {}) {
  const {
    allowRoles,
    redirectIfLoggedIn,
    loginUrl = LOGIN_URL,
    forbiddenUrl = HOME_URL,
    forceRefresh = false,
  } = options;

  const user = await loadUser(forceRefresh);
  const roles = Array.isArray(allowRoles) ? allowRoles.filter(Boolean) : [];

  if (redirectIfLoggedIn && user.id) {
    window.location.href = redirectIfLoggedIn;
    return { redirected: true, user };
  }

  if (!user.id) {
    if (!redirectIfLoggedIn) {
      window.location.href = loginUrl;
      return { redirected: true, user };
    }
    return { redirected: false, user };
  }

  if (roles.length && !roles.includes(user.role)) {
    window.location.href = forbiddenUrl;
    return { redirected: true, user };
  }

  return { redirected: false, user };
}

if (typeof window !== "undefined") {
  window.AuthGuard = Object.freeze({
    requireAuth,
    getCurrentUser,
    clearCachedUser,
  });
  if (!window.__AUTH) {
    window.__AUTH = guestUser;
  }
}
