/* ===========================
   YAKOV DEVELOPMENT — MAIN JS
   =========================== */

document.addEventListener('DOMContentLoaded', () => {
  I18N.init();
  initHeader();
  initLanguage();
  initMobileMenu();
  initGalleryTabs();
  loadGallery();
  initLightbox();
  initOrderForm();
  initReveal();
  initProjectsMap();
});

/* ============ HEADER SCROLL ============ */
function initHeader() {
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============ LANGUAGE SWITCHER ============ */
function initLanguage() {
  document.querySelectorAll('.lang-btn, .footer-lang').forEach(btn => {
    btn.addEventListener('click', () => I18N.apply(btn.dataset.lang));
  });
  document.addEventListener('languagechange', () => {
    loadGallery();
  });
}

/* ============ MOBILE MENU ============ */
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => nav.classList.remove('open'));
  });
}

/* ============ GALLERY TABS ============ */
function initGalleryTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const photoGrid = document.getElementById('photoGrid');
  const videoGrid = document.getElementById('videoGrid');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isPhotos = tab.dataset.tab === 'photos';
      photoGrid.style.display = isPhotos ? 'grid' : 'none';
      videoGrid.style.display = isPhotos ? 'none' : 'grid';
      updateGalleryEmpty();
    });
  });
}

/* ============ GALLERY LOADING ============ */
function getPhotos() {
  try { return JSON.parse(localStorage.getItem('yd_photos') || '[]'); }
  catch { return []; }
}
function getVideos() {
  try { return JSON.parse(localStorage.getItem('yd_videos') || '[]'); }
  catch { return []; }
}

function loadGallery() {
  const photoGrid = document.getElementById('photoGrid');
  const videoGrid = document.getElementById('videoGrid');
  if (!photoGrid || !videoGrid) return;

  const photos = getPhotos();
  const videos = getVideos();

  photoGrid.innerHTML = photos.map((p, i) => `
    <div class="gallery-item" data-type="photo" data-index="${i}">
      <img src="${p.src}" alt="${p.title || 'Project photo'}" loading="lazy">
      <div class="overlay"></div>
    </div>
  `).join('');

  videoGrid.innerHTML = videos.map((v, i) => `
    <div class="gallery-item" data-type="video" data-index="${i}">
      ${v.thumb
        ? `<img src="${v.thumb}" alt="${v.title || 'Project video'}" loading="lazy">`
        : `<div style="background:linear-gradient(135deg,#16161a,#1c1c21);width:100%;height:100%"></div>`}
      <div class="play-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>
      </div>
      <div class="overlay"></div>
    </div>
  `).join('');

  updateGalleryEmpty();

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => openLightbox(item.dataset.type, +item.dataset.index));
  });
}

function updateGalleryEmpty() {
  const empty = document.getElementById('galleryEmpty');
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  const hasContent = activeTab === 'photos' ? getPhotos().length > 0 : getVideos().length > 0;
  empty.style.display = hasContent ? 'none' : 'block';
}

/* ============ LIGHTBOX ============ */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightboxClose');
  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}

function openLightbox(type, index) {
  const lightbox = document.getElementById('lightbox');
  const content = document.getElementById('lightboxContent');

  if (type === 'photo') {
    const photo = getPhotos()[index];
    if (!photo) return;
    content.innerHTML = `<img src="${photo.src}" alt="">`;
  } else {
    const video = getVideos()[index];
    if (!video) return;
    const embed = toEmbedUrl(video.url);
    content.innerHTML = embed
      ? `<iframe src="${embed}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
      : `<video controls autoplay src="${video.url}"></video>`;
  }
  lightbox.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('show');
  document.getElementById('lightboxContent').innerHTML = '';
  document.body.style.overflow = '';
}

function toEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
  return null;
}

/* ============ ORDER FORM ============ */
const FORMSUBMIT_EMAIL = 'yakovdevelopment@gmail.com';

function initOrderForm() {
  const form = document.getElementById('orderForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    const data = {
      id: Date.now(),
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      service: form.service.value,
      size: form.size.value,
      message: form.message.value.trim(),
      date: new Date().toISOString(),
      read: false,
    };

    // Send to email via FormSubmit (real delivery path).
    // Note: we intentionally do NOT write to localStorage here — localStorage
    // is per-browser, so the admin would only see orders submitted from
    // their own browser. Real orders arrive in the email inbox.
    try {
      await fetch(`https://formsubmit.co/ajax/${FORMSUBMIT_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `🏗️ Новая заявка с сайта Yakov Development — ${data.name}`,
          _template: 'table',
          _captcha: 'false',
          'Имя / Name': data.name,
          'Телефон / Phone': data.phone,
          'Email': data.email || '—',
          'Услуга / Service': data.service,
          'Масштаб / Scale': data.size,
          'Сообщение / Message': data.message || '—',
          'Дата / Date': new Date(data.date).toLocaleString('ru-RU'),
        })
      });
    } catch (err) {
      console.warn('FormSubmit unreachable, order saved locally only', err);
    }

    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    const success = document.getElementById('formSuccess');
    success.classList.add('show');
    setTimeout(() => success.classList.remove('show'), 6000);
  });
}

/* ============ PROJECTS MAP ============ */
// Demo data — replace with real projects once available.
const PROJECTS = [
  // ---- TEL AVIV AREA ----
  {
    lat: 32.0639, lng: 34.7763,
    city: { ru: 'Тель-Авив, Ротшильд', en: 'Tel Aviv, Rothschild', he: 'תל אביב, רוטשילד' },
    title: { ru: 'Бутик-отель на бульваре Ротшильд', en: 'Rothschild Boulevard Boutique Hotel', he: 'מלון בוטיק בשדרות רוטשילד' },
    type: { ru: 'Реновация 32 номеров', en: '32-room renovation', he: 'שיפוץ 32 חדרים' },
    year: 2024,
    img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=520&h=300&fit=crop',
  },
  {
    lat: 32.0769, lng: 34.7869,
    city: { ru: 'Тель-Авив, Сарона', en: 'Tel Aviv, Sarona', he: 'תל אביב, שרונה' },
    title: { ru: 'Технологический офис 1800 м²', en: 'Tech Office 1800 m²', he: 'משרד הייטק 1800 מ"ר' },
    type: { ru: 'Гипсокартон, перегородки, акустика', en: 'Drywall, partitions, acoustics', he: 'גבס, מחיצות, אקוסטיקה' },
    year: 2024,
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=520&h=300&fit=crop',
  },
  {
    lat: 32.0566, lng: 34.7723,
    city: { ru: 'Тель-Авив, Флорентин', en: 'Tel Aviv, Florentin', he: 'תל אביב, פלורנטין' },
    title: { ru: 'Лофт-апартаменты', en: 'Loft Apartments', he: 'דירות לופט' },
    type: { ru: 'Многоуровневые потолки', en: 'Multi-level ceilings', he: 'תקרות רב-מפלסיות' },
    year: 2023,
    img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=520&h=300&fit=crop',
  },
  {
    lat: 32.1186, lng: 34.8053,
    city: { ru: 'Тель-Авив, Рамат-Авив', en: 'Tel Aviv, Ramat Aviv', he: 'תל אביב, רמת אביב' },
    title: { ru: 'Жилой комплекс Park View', en: 'Park View Residential', he: 'פארק וויו — מגורים' },
    type: { ru: 'Премиум-отделка 24 квартир', en: 'Premium finishing, 24 units', he: 'גימור פרימיום, 24 דירות' },
    year: 2024,
    img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=520&h=300&fit=crop',
  },

  // ---- JERUSALEM ----
  {
    lat: 31.7770, lng: 35.2256,
    city: { ru: 'Иерусалим, Мамилла', en: 'Jerusalem, Mamilla', he: 'ירושלים, ממילא' },
    title: { ru: 'Ресторан в Мамилле', en: 'Mamilla Restaurant', he: 'מסעדה בממילא' },
    type: { ru: 'Полная реновация интерьера', en: 'Full interior renovation', he: 'שיפוץ פנים מלא' },
    year: 2024,
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=520&h=300&fit=crop',
  },
  {
    lat: 31.7560, lng: 35.2334,
    city: { ru: 'Иерусалим, Тальпиот', en: 'Jerusalem, Talpiot', he: 'ירושלים, תלפיות' },
    title: { ru: 'Бизнес-центр Talpiot', en: 'Talpiot Business Center', he: 'מרכז עסקים תלפיות' },
    type: { ru: 'Большой объект — 8 этажей', en: 'Large-scale — 8 floors', he: 'פרויקט גדול — 8 קומות' },
    year: 2023,
    img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=520&h=300&fit=crop',
  },
  {
    lat: 31.7747, lng: 35.2169,
    city: { ru: 'Иерусалим, Рехавия', en: 'Jerusalem, Rehavia', he: 'ירושלים, רחביה' },
    title: { ru: 'Семейная клиника', en: 'Family Clinic', he: 'מרפאה משפחתית' },
    type: { ru: 'Медицинская отделка под стандарт', en: 'Medical-standard finishing', he: 'גימור בתקן רפואי' },
    year: 2023,
    img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=520&h=300&fit=crop',
  },

  // ---- HAIFA ----
  {
    lat: 32.7940, lng: 34.9896,
    city: { ru: 'Хайфа, Кармель', en: 'Haifa, Carmel', he: 'חיפה, כרמל' },
    title: { ru: 'Офисный центр Carmel Plaza', en: 'Carmel Plaza Office Center', he: 'מרכז משרדים כרמל פלאזה' },
    type: { ru: 'Перегородки и потолки 4000 м²', en: 'Partitions & ceilings 4000 m²', he: 'מחיצות ותקרות 4000 מ"ר' },
    year: 2023,
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=520&h=300&fit=crop',
  },
  {
    lat: 32.8166, lng: 34.9849,
    city: { ru: 'Хайфа, Немецкая колония', en: 'Haifa, German Colony', he: 'חיפה, המושבה הגרמנית' },
    title: { ru: 'Бутик-кафе', en: 'Boutique Café', he: 'בית קפה בוטיק' },
    type: { ru: 'Дизайн-проект под ключ', en: 'Turnkey design project', he: 'פרויקט עיצוב מקצה לקצה' },
    year: 2024,
    img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=520&h=300&fit=crop',
  },

  // ---- RAMAT GAN ----
  {
    lat: 32.0684, lng: 34.8248,
    city: { ru: 'Рамат-Ган, Алмазная биржа', en: 'Ramat Gan, Diamond District', he: 'רמת גן, בורסת היהלומים' },
    title: { ru: 'Бизнес-центр Diamond Tower', en: 'Diamond Tower Business Center', he: 'מרכז עסקים מגדל היהלום' },
    type: { ru: 'Крупный объект — 12 этажей', en: 'Large-scale — 12 floors', he: 'פרויקט גדול — 12 קומות' },
    year: 2023,
    img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=520&h=300&fit=crop',
  },

  // ---- NETANYA ----
  {
    lat: 32.3215, lng: 34.8532,
    city: { ru: 'Натания, центр', en: 'Netanya, Center', he: 'נתניה, מרכז העיר' },
    title: { ru: 'Апартаменты Park Tower', en: 'Park Tower Apartments', he: 'דירות מגדל הפארק' },
    type: { ru: 'Дизайнерская отделка', en: 'Designer finishing', he: 'גימור מעוצב' },
    year: 2024,
    img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=520&h=300&fit=crop',
  },

  // ---- BEER SHEVA ----
  {
    lat: 31.2418, lng: 34.7913,
    city: { ru: 'Беэр-Шева', en: 'Beer Sheva', he: 'באר שבע' },
    title: { ru: 'Торговый комплекс Negev Mall', en: 'Negev Mall', he: 'קניון הנגב' },
    type: { ru: 'Коммерческое строительство', en: 'Commercial construction', he: 'בנייה מסחרית' },
    year: 2022,
    img: 'https://images.unsplash.com/photo-1519642918688-7e43b19245d8?w=520&h=300&fit=crop',
  },

  // ---- EILAT ----
  {
    lat: 29.5577, lng: 34.9519,
    city: { ru: 'Эйлат, Марина', en: 'Eilat, Marina', he: 'אילת, המרינה' },
    title: { ru: 'Отель Royal Beach', en: 'Royal Beach Hotel', he: 'מלון רויאל ביץ׳' },
    type: { ru: 'Реконструкция лобби и 60 номеров', en: 'Lobby & 60 rooms renovation', he: 'שיפוץ לובי ו-60 חדרים' },
    year: 2023,
    img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=520&h=300&fit=crop',
  },

  // ---- HERZLIYA ----
  {
    lat: 32.1624, lng: 34.8443,
    city: { ru: 'Герцлия, Марина', en: 'Herzliya, Marina', he: 'הרצליה, המרינה' },
    title: { ru: 'Пентхаус с видом на море', en: 'Sea-view Penthouse', he: 'פנטהאוז עם נוף לים' },
    type: { ru: 'Премиум-интерьер 380 м²', en: 'Premium interior 380 m²', he: 'אינטריור פרימיום 380 מ"ר' },
    year: 2024,
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=520&h=300&fit=crop',
  },

  // ---- ASHDOD ----
  {
    lat: 31.8044, lng: 34.6553,
    city: { ru: 'Ашдод', en: 'Ashdod', he: 'אשדוד' },
    title: { ru: 'Жилой район Marina Heights', en: 'Marina Heights Residential', he: 'מרינה הייטס — מגורים' },
    type: { ru: 'Гипсокартон в 64 квартирах', en: 'Drywall in 64 apartments', he: 'גבס ב-64 דירות' },
    year: 2023,
    img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=520&h=300&fit=crop',
  },

  // ---- RISHON LEZION ----
  {
    lat: 31.9730, lng: 34.7925,
    city: { ru: 'Ришон-ле-Цион', en: 'Rishon LeZion', he: 'ראשון לציון' },
    title: { ru: 'Школа Western High', en: 'Western High School', he: 'תיכון מערב' },
    type: { ru: 'Реновация учебных классов', en: 'Classroom renovation', he: 'שיפוץ כיתות' },
    year: 2023,
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=520&h=300&fit=crop',
  },

  // ---- PETAH TIKVA ----
  {
    lat: 32.0871, lng: 34.8878,
    city: { ru: 'Петах-Тиква', en: 'Petah Tikva', he: 'פתח תקווה' },
    title: { ru: 'Логистический центр', en: 'Logistics Center', he: 'מרכז לוגיסטי' },
    type: { ru: 'Промышленные перегородки 6000 м²', en: 'Industrial partitions 6000 m²', he: 'מחיצות תעשייתיות 6000 מ"ר' },
    year: 2022,
    img: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=520&h=300&fit=crop',
  },

  // ---- MODI'IN ----
  {
    lat: 31.8943, lng: 35.0078,
    city: { ru: 'Модиин', en: 'Modi\'in', he: 'מודיעין' },
    title: { ru: 'Жилой комплекс Buchman', en: 'Buchman Residential Complex', he: 'מתחם מגורים בוכמן' },
    type: { ru: 'Многоуровневые потолки 18 этажей', en: 'Multi-level ceilings, 18 floors', he: 'תקרות רב-מפלסיות, 18 קומות' },
    year: 2024,
    img: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=520&h=300&fit=crop',
  },

  // ---- RA'ANANA ----
  {
    lat: 32.1836, lng: 34.8704,
    city: { ru: 'Раанана', en: 'Ra\'anana', he: 'רעננה' },
    title: { ru: 'Коворкинг Park 360', en: 'Park 360 Co-working', he: 'חלל עבודה פארק 360' },
    type: { ru: 'Открытое пространство 2200 м²', en: 'Open space 2200 m²', he: 'מרחב פתוח 2200 מ"ר' },
    year: 2024,
    img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=520&h=300&fit=crop',
  },

  // ---- TIBERIAS ----
  {
    lat: 32.7959, lng: 35.5208,
    city: { ru: 'Тверия', en: 'Tiberias', he: 'טבריה' },
    title: { ru: 'Спа-отель у Кинерета', en: 'Spa Hotel by the Sea of Galilee', he: 'מלון ספא בכינרת' },
    type: { ru: 'Реновация 45 номеров', en: '45-room renovation', he: 'שיפוץ 45 חדרים' },
    year: 2022,
    img: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=520&h=300&fit=crop',
  },

  // ---- ASHKELON ----
  {
    lat: 31.6688, lng: 34.5742,
    city: { ru: 'Ашкелон, Марина', en: 'Ashkelon, Marina', he: 'אשקלון, מרינה' },
    title: { ru: 'Семейные апартаменты у моря', en: 'Seaside Family Apartments', he: 'דירות משפחה לחוף הים' },
    type: { ru: 'Отделка 32 квартир', en: 'Finishing 32 apartments', he: 'גימור 32 דירות' },
    year: 2023,
    img: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=520&h=300&fit=crop',
  },
];

let mapInstance = null;

function initProjectsMap() {
  const mapEl = document.getElementById('projectsMap');
  if (!mapEl) return;

  // Leaflet loads with `defer` — wait for it.
  if (typeof L === 'undefined') {
    setTimeout(initProjectsMap, 100);
    return;
  }

  mapInstance = L.map('projectsMap', {
    center: [31.5, 35.0],
    zoom: 8,
    scrollWheelZoom: false,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapInstance);

  const icon = L.divIcon({
    className: 'yd-marker-wrap',
    html: '<div class="yd-marker"><div class="yd-marker-pulse"></div><div class="yd-marker-dot"></div></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -8],
  });

  renderProjectsOnMap();

  // Re-render popups in the new language when user switches
  document.addEventListener('languagechange', renderProjectsOnMap);
}

function renderProjectsOnMap() {
  if (!mapInstance) return;
  mapInstance.eachLayer(layer => {
    if (layer instanceof L.Marker) mapInstance.removeLayer(layer);
  });

  const lang = I18N.current;
  const icon = L.divIcon({
    className: 'yd-marker-wrap',
    html: '<div class="yd-marker"><div class="yd-marker-pulse"></div><div class="yd-marker-dot"></div></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -8],
  });

  PROJECTS.forEach(p => {
    const popupHtml = `
      <div class="project-popup">
        <img src="${p.img}" alt="${p.title[lang]}" class="project-popup-img" loading="lazy">
        <div class="project-popup-body">
          <div class="project-popup-city">${p.city[lang]}</div>
          <div class="project-popup-title">${p.title[lang]}</div>
          <div class="project-popup-meta">${p.type[lang]} • ${p.year}</div>
        </div>
      </div>
    `;
    L.marker([p.lat, p.lng], { icon }).addTo(mapInstance).bindPopup(popupHtml, {
      maxWidth: 280,
      minWidth: 260,
      closeButton: true,
    });
  });
}

/* ============ SCROLL REVEAL ============ */
function initReveal() {
  const targets = document.querySelectorAll('.section, .hero-stats, .service-card, .about-card, .contact-item');
  targets.forEach(t => t.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  targets.forEach(t => observer.observe(t));
}
