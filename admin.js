/* ===========================
   ADMIN PANEL LOGIC
   =========================== */

// ─────────────────────────────────────────────────────────────────────────
// SECURITY NOTICE — READ THIS.
// This is a STATIC site. Anything that runs in the browser can be bypassed by
// the visitor (DevTools, editing sessionStorage, calling showApp() directly).
// Therefore this "login" is NOT a security boundary — it only keeps the panel
// out of the way for casual visitors. It gates NOTHING shared: the admin panel
// only reads/writes THIS browser's localStorage; there is no server, no API,
// no other user's data to reach. So a bypass exposes nothing of value.
//
// We store only the SHA-256 hash of the passphrase (never the cleartext) so the
// owner's password is not leaked in the public bundle and cannot be reused
// against their other accounts.
//
// For a REAL content backend (orders DB, shared photo gallery), move auth
// server-side: Netlify Identity, an edge function with a session cookie, or a
// hosted CMS. Never trust the client.
// ─────────────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD_SHA256 =
  '0723531a2fbe67653368ab879cfe08564043e6059806b6ca69c1fd058ca3f2f3';

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  I18N.init();
  initLanguage();
  initLogin();
  if (sessionStorage.getItem('yd_admin') === '1') showApp();
});

/* ============ LANGUAGE ============ */
function initLanguage() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => I18N.apply(btn.dataset.lang));
  });
  document.addEventListener('languagechange', () => {
    if (document.getElementById('adminApp').style.display !== 'none') {
      renderPhotos();
      renderVideos();
      renderOrders();
    }
  });
}

/* ============ LOGIN ============ */
function initLogin() {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const password = document.getElementById('passwordInput').value;
    const hash = await sha256Hex(password);
    if (hash === ADMIN_PASSWORD_SHA256) {
      sessionStorage.setItem('yd_admin', '1');
      showApp();
    } else {
      document.getElementById('loginError').classList.add('show');
      document.getElementById('passwordInput').value = '';
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('yd_admin');
    location.reload();
  });
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display = 'block';
  initTabs();
  initPhotos();
  initVideos();
  renderPhotos();
  renderVideos();
  renderOrders();
}

/* ============ TABS ============ */
function initTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + 'Panel').classList.add('active');
    });
  });
}

/* ============ PHOTOS ============ */
function initPhotos() {
  const dropZone = document.getElementById('photoDropZone');
  const input = document.getElementById('photoInput');

  dropZone.addEventListener('click', () => input.click());

  input.addEventListener('change', e => handleFiles(e.target.files));

  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', e => {
    handleFiles(e.dataTransfer.files);
  });
}

function handleFiles(files) {
  const photos = JSON.parse(localStorage.getItem('yd_photos') || '[]');
  let processed = 0;
  let toProcess = 0;

  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    toProcess++;
    const reader = new FileReader();
    reader.onload = ev => {
      photos.unshift({
        id: Date.now() + Math.random(),
        src: ev.target.result,
        title: file.name,
        date: new Date().toISOString(),
      });
      processed++;
      if (processed === toProcess) {
        try {
          localStorage.setItem('yd_photos', JSON.stringify(photos));
          renderPhotos();
        } catch (err) {
          alert('Слишком большой объем — попробуйте загрузить меньше или меньшие файлы.\nStorage is full — try fewer or smaller files.');
        }
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotos() {
  const photos = JSON.parse(localStorage.getItem('yd_photos') || '[]');
  const grid = document.getElementById('adminPhotoGrid');
  const empty = document.getElementById('emptyPhotos');
  document.getElementById('photoCount').textContent = photos.length;

  if (!photos.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = photos.map(p => `
    <div class="admin-item" data-id="${p.id}">
      <img src="${safeUrl(p.src)}" alt="${escapeHtml(p.title)}">
      <div class="admin-item-overlay">
        <div class="admin-item-title">${escapeHtml(p.title)}</div>
        <button class="delete-btn" data-action="delete-photo" data-id="${p.id}">${I18N.t('admin.delete')}</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('[data-action="delete-photo"]').forEach(btn => {
    btn.addEventListener('click', () => deletePhoto(btn.dataset.id));
  });
}

function deletePhoto(id) {
  const photos = JSON.parse(localStorage.getItem('yd_photos') || '[]');
  const next = photos.filter(p => String(p.id) !== String(id));
  localStorage.setItem('yd_photos', JSON.stringify(next));
  renderPhotos();
}

/* ============ VIDEOS ============ */
function initVideos() {
  document.getElementById('addVideoBtn').addEventListener('click', () => {
    const input = document.getElementById('videoUrlInput');
    const url = input.value.trim();
    if (!url) return;
    addVideo(url);
    input.value = '';
  });
}

function addVideo(url) {
  const videos = JSON.parse(localStorage.getItem('yd_videos') || '[]');
  const thumb = getVideoThumb(url);
  videos.unshift({
    id: Date.now(),
    url,
    thumb,
    title: extractVideoTitle(url),
    date: new Date().toISOString(),
  });
  localStorage.setItem('yd_videos', JSON.stringify(videos));
  renderVideos();
}

function getVideoThumb(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`;
  return '';
}

function extractVideoTitle(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `YouTube — ${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `Vimeo — ${vm[1]}`;
  return url;
}

function renderVideos() {
  const videos = JSON.parse(localStorage.getItem('yd_videos') || '[]');
  const grid = document.getElementById('adminVideoGrid');
  const empty = document.getElementById('emptyVideos');
  document.getElementById('videoCount').textContent = videos.length;

  if (!videos.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = videos.map(v => `
    <div class="admin-item" data-id="${v.id}">
      ${v.thumb
        ? `<img src="${safeUrl(v.thumb)}" alt="${escapeHtml(v.title)}">`
        : `<div class="video-thumb"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg></div>`}
      <div class="admin-item-overlay">
        <div class="admin-item-title">${escapeHtml(v.title)}</div>
        <button class="delete-btn" data-action="delete-video" data-id="${v.id}">${I18N.t('admin.delete')}</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('[data-action="delete-video"]').forEach(btn => {
    btn.addEventListener('click', () => deleteVideo(btn.dataset.id));
  });
}

function deleteVideo(id) {
  const videos = JSON.parse(localStorage.getItem('yd_videos') || '[]');
  const next = videos.filter(v => String(v.id) !== String(id));
  localStorage.setItem('yd_videos', JSON.stringify(next));
  renderVideos();
}

/* ============ ORDERS ============ */
function renderOrders() {
  const orders = JSON.parse(localStorage.getItem('yd_orders') || '[]');
  const list = document.getElementById('ordersList');
  const empty = document.getElementById('emptyOrders');
  document.getElementById('orderCount').textContent = orders.length;

  const unreadCount = orders.filter(o => !o.read).length;
  document.getElementById('orderCount').textContent = orders.length
    ? `${orders.length}${unreadCount ? ' • ' + unreadCount : ''}`
    : '0';

  if (!orders.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const dict = TRANSLATIONS[I18N.current];

  list.innerHTML = orders.map(o => `
    <div class="order-card ${o.read ? '' : 'unread'}">
      <div class="order-fields">
        <div>
          <div class="order-field-label">${dict['admin.orderName']}</div>
          <div class="order-field-value">${escapeHtml(o.name)}</div>
        </div>
        <div>
          <div class="order-field-label">${dict['admin.orderPhone']}</div>
          <div class="order-field-value"><a href="tel:${escapeHtml(o.phone)}" style="color:var(--accent)">${escapeHtml(o.phone)}</a></div>
        </div>
        ${o.email ? `
        <div>
          <div class="order-field-label">${dict['admin.orderEmail']}</div>
          <div class="order-field-value"><a href="mailto:${escapeHtml(o.email)}" style="color:var(--accent)">${escapeHtml(o.email)}</a></div>
        </div>` : ''}
        <div>
          <div class="order-field-label">${dict['admin.orderService']}</div>
          <div class="order-field-value">${escapeHtml(o.service)}</div>
        </div>
        <div>
          <div class="order-field-label">${dict['admin.orderSize']}</div>
          <div class="order-field-value">${escapeHtml(o.size)}</div>
        </div>
        ${o.message ? `
        <div class="order-message">
          <div class="order-field-label">${dict['admin.orderMessage']}</div>
          <div class="order-field-value">${escapeHtml(o.message)}</div>
        </div>` : ''}
      </div>
      <div class="order-actions">
        ${o.read ? '' : `<span class="order-tag">NEW</span>`}
        <div class="order-date">${formatDate(o.date)}</div>
        <button class="delete-btn" data-id="${o.id}">${dict['admin.delete']}</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const orders = JSON.parse(localStorage.getItem('yd_orders') || '[]');
      localStorage.setItem('yd_orders', JSON.stringify(orders.filter(o => String(o.id) !== String(btn.dataset.id))));
      renderOrders();
    });
  });

  setTimeout(() => {
    const updated = JSON.parse(localStorage.getItem('yd_orders') || '[]').map(o => ({ ...o, read: true }));
    localStorage.setItem('yd_orders', JSON.stringify(updated));
  }, 2000);
}

/* ============ HELPERS ============ */
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Only allow http(s) and data:image URLs into src attributes.
function safeUrl(u) {
  if (u == null) return '';
  const s = String(u).trim();
  if (/^(https?:|data:image\/)/i.test(s)) return escapeHtml(s);
  return '';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(I18N.current === 'he' ? 'he-IL' : I18N.current === 'en' ? 'en-US' : 'ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
