// ============================================================
// TopClicks — Shared JavaScript Utilities
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// ── Auth Helpers ─────────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('tc_token'),
  getUser: () => {
    const u = localStorage.getItem('tc_user');
    try { return u ? JSON.parse(u) : null; } catch { return null; }
  },
  setAuth: (token, user) => {
    localStorage.setItem('tc_token', token);
    localStorage.setItem('tc_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('tc_token');
    localStorage.removeItem('tc_user');
  },
  isLoggedIn: () => !!localStorage.getItem('tc_token'),
  isPhotographer: () => {
    const u = Auth.getUser();
    return u && (u.role === 'photographer' || u.role === 'admin');
  },
  isAdmin: () => {
    const u = Auth.getUser();
    return u && u.role === 'admin';
  },
  requireLogin: (redirect = 'login.html') => {
    if (!Auth.isLoggedIn()) {
      window.location.href = redirect;
      return false;
    }
    return true;
  },
  requireRole: (role, redirect = 'index.html') => {
    const u = Auth.getUser();
    if (!u || u.role !== role) {
      Toast.show('Access denied.', 'error');
      setTimeout(() => window.location.href = redirect, 800);
      return false;
    }
    return true;
  },
};

// ── API Helpers ──────────────────────────────────────────────────
const Api = {
  headers: (withAuth = true, isForm = false) => {
    const h = {};
    if (!isForm) h['Content-Type'] = 'application/json';
    if (withAuth && Auth.getToken()) h['Authorization'] = `Bearer ${Auth.getToken()}`;
    return h;
  },

  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: Api.headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  post: async (path, body, isForm = false) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: Api.headers(true, isForm),
      body: isForm ? body : JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.errors?.[0]?.msg || 'Request failed');
    return data;
  },

  put: async (path, body, isForm = false) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: Api.headers(true, isForm),
      body: isForm ? body : JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  delete: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: Api.headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },
};

// ── Toast Notifications ──────────────────────────────────────────
const Toast = {
  container: null,
  icons: {
    success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  },
  colors: { success: '#2d7a3a', error: '#c0392b', info: '#1a5276', warning: '#b8860b' },

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.setProperty('--toast-color', this.colors[type] || this.colors.info);
    toast.style.setProperty('--toast-duration', `${duration}ms`);
    toast.innerHTML = `${this.icons[type] || this.icons.info}<span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => toast.remove(), duration + 300);
  },
};

// ── DOM Helpers ──────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  });
  children.forEach(c => {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  });
  return e;
};

// ── Format Helpers ────────────────────────────────────────────────
const Fmt = {
  date: (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  timeAgo: (d) => {
    const now = Date.now();
    const diff = now - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return Fmt.date(d);
  },
  fileSize: (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },
  number: (n) => n?.toLocaleString() || 0,
};

// ── Stars HTML ────────────────────────────────────────────────────
const renderStars = (avg, total) => {
  const starSVG = (type) => {
    if (type === 'full') return `<svg class="star filled" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    if (type === 'empty') return `<svg class="star" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    return `<svg class="star half" viewBox="0 0 24 24"><defs><clipPath id="h${Math.random().toString(36).slice(2)}"><rect x="0" y="0" width="12" height="24"/></clipPath></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" clip-path="url(#h${Math.random().toString(36).slice(2)})"/></svg>`;
  };
  const rating = parseFloat(avg) || 0;
  let html = '<div class="stars">';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) html += starSVG('full');
    else if (rating >= i - 0.5) html += starSVG('half');
    else html += starSVG('empty');
  }
  html += `<span class="rating-text">${rating.toFixed(1)} (${Fmt.number(total)})</span></div>`;
  return html;
};

// ── Avatar Placeholder ────────────────────────────────────────────
const avatarHTML = (user, size = 'xs') => {
  const letter = (user?.username || '?')[0].toUpperCase();
  if (user?.avatar) {
    return `<img class="avatar-${size}" src="${API_BASE.replace('/api', '')}${user.avatar}" alt="${user.username}" onerror="this.outerHTML='<span class=\\'avatar-${size}\\'>${letter}</span>'">`;
  }
  return `<span class="avatar-${size}">${letter}</span>`;
};

// ── Photo Card HTML ───────────────────────────────────────────────
const photoCardHTML = (photo) => {
  const imgSrc = photo.thumbnailPath
    ? `${API_BASE.replace('/api', '')}${photo.thumbnailPath}`
    : photo.filePath
    ? `${API_BASE.replace('/api', '')}${photo.filePath}`
    : 'https://placehold.co/400x300/2a2a28/888?text=Photo';

  return `
    <div class="photo-card" onclick="window.location.href='photo.html?id=${photo._id}'">
      <div class="photo-card-img-wrap">
        <img src="${imgSrc}" alt="${photo.title}" loading="lazy" onerror="this.src='https://placehold.co/400x300/2a2a28/888?text=Photo'">
        <div class="photo-badge">
          ${photo.isFeatured ? '<span class="badge badge-featured">⭐ Featured</span>' : ''}
          <span class="badge badge-category">${photo.category}</span>
        </div>
        <div class="photo-card-overlay">
          <div class="overlay-stats">
            <span class="overlay-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              ${Fmt.number(photo.viewCount)}
            </span>
            <span class="overlay-stat">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ${photo.averageRating?.toFixed(1) || '—'}
            </span>
          </div>
        </div>
      </div>
      <div class="photo-card-body">
        <div class="photo-card-title" title="${photo.title}">${photo.title}</div>
        <div class="photo-card-meta">
          <div class="photo-card-author">
            ${avatarHTML(photo.photographer)}
            <span>${photo.photographer?.username || 'Unknown'}</span>
          </div>
          ${renderStars(photo.averageRating, photo.totalRatings)}
        </div>
      </div>
    </div>
  `;
};

// ── Navbar Rendering ──────────────────────────────────────────────
const renderNavbar = () => {
  const user = Auth.getUser();
  const isLoggedIn = Auth.isLoggedIn();

  const navEl = document.getElementById('navbar');
  if (!navEl) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  navEl.innerHTML = `
    <div class="navbar-inner">
      <a href="index.html" class="nav-logo">Top<span>Clicks</span></a>

      <div class="nav-search">
        <svg class="nav-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" id="nav-search-input" placeholder="Search photos..." autocomplete="off">
      </div>

      <nav class="nav-links">
        <a href="index.html" class="nav-link ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">Home</a>
        <a href="photos.html" class="nav-link ${currentPage === 'photos.html' ? 'active' : ''}">Explore</a>
        <a href="photographers.html" class="nav-link ${currentPage === 'photographers.html' ? 'active' : ''}">Photographers</a>
        ${isLoggedIn && Auth.isPhotographer() ? `<a href="upload.html" class="nav-link ${currentPage === 'upload.html' ? 'active' : ''}">Upload</a>` : ''}
        ${Auth.isAdmin() ? `<a href="admin.html" class="nav-link ${currentPage === 'admin.html' ? 'active' : ''}">Admin</a>` : ''}
      </nav>

      <div class="nav-actions">
        <button class="theme-toggle" id="theme-toggle" title="Toggle dark mode">
          <svg id="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg id="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        ${isLoggedIn ? `
          <div class="nav-user">
            <div class="nav-avatar" tabindex="0">
              ${user?.avatar
                ? `<img src="${API_BASE.replace('/api','')}${user.avatar}" alt="${user.username}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
                : (user?.username?.[0] || '?').toUpperCase()
              }
            </div>
            <div class="nav-dropdown">
              <div class="dropdown-header">
                <div class="username">${user?.username}</div>
                <span class="role-badge role-${user?.role}">${user?.role}</span>
              </div>
              <a href="profile.html?u=${user?.username}" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Profile
              </a>
              ${Auth.isPhotographer() ? `
              <a href="upload.html" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Upload Photo
              </a>` : ''}
              ${Auth.isAdmin() ? `
              <a href="admin.html" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Admin Panel
              </a>` : ''}
              <a href="settings.html" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
              </a>
              <button class="dropdown-item danger" id="logout-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </div>
        ` : `
          <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
          <a href="register.html" class="btn btn-primary btn-sm">Join Free</a>
        `}

        <button class="mobile-menu-btn" id="mobile-menu-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');
  const savedTheme = localStorage.getItem('tc_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'dark') { sunIcon.style.display = 'none'; moonIcon.style.display = 'block'; }

  themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tc_theme', next);
    if (next === 'dark') { sunIcon.style.display = 'none'; moonIcon.style.display = 'block'; }
    else { sunIcon.style.display = 'block'; moonIcon.style.display = 'none'; }
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    Auth.clear();
    Toast.show('Logged out successfully.', 'info');
    setTimeout(() => window.location.href = 'index.html', 800);
  });

  // Search
  const searchInput = document.getElementById('nav-search-input');
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.location.href = `photos.html?search=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });
};

// ── Spinner ───────────────────────────────────────────────────────
const showSpinner = (container) => {
  if (typeof container === 'string') container = document.getElementById(container);
  if (container) container.innerHTML = '<div class="spinner"></div>';
};

const showEmpty = (container, title, message, icon = '') => {
  if (typeof container === 'string') container = document.getElementById(container);
  if (container) container.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        ${icon || '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'}
      </svg>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
};

// Auto-init navbar
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});
