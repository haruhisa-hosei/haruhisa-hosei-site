document.addEventListener('DOMContentLoaded', function() {
  // --- first-party analytics (self) ---
  try { initSelfAnalytics(); } catch (e) {}

  // ===============================================
  // 1. UI & Animations (Common)
  // ===============================================

  // --- Hamburger Menu ---
  const menuBtn = document.getElementById('menuBtn');
  const navOverlay = document.getElementById('navOverlay');
  const menuLinks = document.querySelectorAll('.menu-link');

  if (menuBtn && navOverlay) {
    menuBtn.addEventListener('click', () => {
      const isOpen = menuBtn.classList.toggle('is-open');
      navOverlay.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', isOpen);
    });

    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuLinks.forEach(l => l.classList.remove('is-active'));
        link.classList.add('is-active');
        setTimeout(() => {
          menuBtn.classList.remove('is-open');
          navOverlay.classList.remove('is-open');
          menuBtn.setAttribute('aria-expanded', 'false');
          setTimeout(() => { link.classList.remove('is-active'); }, 500);
        }, 600);
      });
    });

    menuBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        menuBtn.click();
      }
    });

    const pressOn = () => menuBtn.classList.add('is-pressing');
    const pressOff = () => menuBtn.classList.remove('is-pressing');
    menuBtn.addEventListener('pointerdown', pressOn);
    menuBtn.addEventListener('pointerup', pressOff);
    menuBtn.addEventListener('pointerleave', pressOff);
  }

  // --- Language Menu ---
  const langToggle = document.getElementById('langToggle');
  const langMenu = document.getElementById('langMenu');

  if (langToggle && langMenu) {
    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = langMenu.classList.toggle('is-open');
      langToggle.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('click', (e) => {
      if (!langToggle.contains(e.target) && !langMenu.contains(e.target)) {
        langMenu.classList.remove('is-open');
        langToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (langMenu.classList.contains('is-open')) {
          langMenu.classList.remove('is-open');
          langToggle.setAttribute('aria-expanded', 'false');
        }
        if (menuBtn && menuBtn.classList.contains('is-open')) {
          menuBtn.click();
        }
      }
    });
  }

  // --- Scroll Effects (Home Only) ---
  const sunLight = document.getElementById('sunLight');
  if (sunLight && menuBtn) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        sunLight.classList.add('is-active');
        menuBtn.classList.add('is-active-scroll');
      } else {
        sunLight.classList.remove('is-active');
        menuBtn.classList.remove('is-active-scroll');
      }
    });
  }

  // --- Intersection Observer (Fade/Slide Animations) ---
  const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);
  document.querySelectorAll('.fade-up, .fade-in, .slide-left').forEach(el => observer.observe(el));

  // --- Header Reveal (Home Only) ---
  const header = document.querySelector('header.hero-header');
  if (header) {
    setTimeout(() => {
      if (!header.classList.contains('is-visible')) header.classList.add('is-visible');
    }, 1000);
  }

  // --- Profile Animation (Home Only) ---
  const personEl = document.querySelector('.profile-anim-wrap .person-frame');
  const notesEl = document.querySelector('.profile-anim-wrap .notes-frame');
  if (personEl && notesEl) {
    const personFrames = ['images/profile.jpg', 'images/officialprofile2.png', 'images/officialprofile3.png', 'images/officialprofile2.png'];
    const notesFrames  = ['images/notes_01.png', 'images/notes_02.png', 'images/notes_03.png', 'images/notes_04.png'];
    const frameDurations = [260, 260, 520, 260];
    let fi = 0;
    const tick = () => {
      personEl.src = personFrames[fi];
      notesEl.src = notesFrames[fi];
      const wait = frameDurations[fi];
      fi = (fi + 1) % personFrames.length;
      window.setTimeout(tick, wait);
    };
    window.setTimeout(tick, 60);
  }

  // --- Initialize Swipers ---
  if (typeof Swiper !== 'undefined') {
    const voiceEl = document.querySelector('.voice-section .swiper-container');
    if (voiceEl) {
      const voiceSection = voiceEl.closest('.voice-section');
      const voiceNext = voiceSection ? voiceSection.querySelector('.swiper-button-next') : null;
      const voicePrev = voiceSection ? voiceSection.querySelector('.swiper-button-prev') : null;
      new Swiper(voiceEl, {
        loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 25, speed: 600,
        observer: true, observeParents: true,
        navigation: { nextEl: voiceNext, prevEl: voicePrev },
        on: { init: function() { setTimeout(() => { this.update(); }, 100); } }
      });
    }

    // Books Swiper is initialized after books.json is loaded (see loadBooks()).
    const archiveEl = document.querySelector('.archive-swiper');
    if (archiveEl) {
      new Swiper(archiveEl, {
        loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 30, speed: 800
      });
    }
  }

  
  // ===============================================
  // 1.5 Books (Static JSON)
  // ===============================================
  const BOOKS_LANG = document.documentElement.lang === 'en' ? 'en' : 'ja';
  const booksWrapper = document.querySelector('#books .swiper-wrapper');
  const booksSwiperEl = document.querySelector('#books .books-swiper');

  async function loadBooks() {
    if (!booksWrapper) return;

    try {
      const res = await fetch(withCacheBuster('books.json'), { cache: 'no-store' });
      if (!res.ok) throw new Error('books.json fetch failed: ' + res.status);
      const data = await res.json();
      renderBooks(data);

      // init / update swiper after render
      if (typeof Swiper !== 'undefined' && booksSwiperEl) {
        const nextEl = booksSwiperEl.querySelector('.swiper-button-next');
        const prevEl = booksSwiperEl.querySelector('.swiper-button-prev');

        if (booksSwiperEl.swiper) {
          booksSwiperEl.swiper.update();
          booksSwiperEl.swiper.slideTo(0, 0);
        } else {
          new Swiper(booksSwiperEl, {
            loop: (booksWrapper.children.length > 1),
            centeredSlides: true,
            slidesPerView: 'auto',
            spaceBetween: 25,
            speed: 600,
            observer: true,
            observeParents: true,
            navigation: { nextEl, prevEl },
            on: { init: function() { setTimeout(() => { this.update(); }, 100); } }
          });
        }

        // Hide arrows if only 1 slide
        const hasMany = booksWrapper.children.length > 1;
        if (nextEl) nextEl.style.display = hasMany ? '' : 'none';
        if (prevEl) prevEl.style.display = hasMany ? '' : 'none';
      }
    } catch (e) {
      console.error('Books load failed:', e);
    }
  }

  function renderBooks(payload) {
    const items = (payload && Array.isArray(payload.items)) ? payload.items : [];
    const valid = items.filter(it => String(it.enabled || '').toUpperCase() === 'TRUE');

    const html = valid.map(it => {
      const title = (BOOKS_LANG === 'en') ? (it.title_en || it.title_ja || '') : (it.title_ja || it.title_en || '');
      const subtitle = (BOOKS_LANG === 'en') ? (it.subtitle_en || '') : (it.subtitle_ja || '');
      const published = it.published || '';
      const comment = (BOOKS_LANG === 'en') ? (it.comment_en || '') : (it.comment_ja || '');
      const buyLabel = (BOOKS_LANG === 'en')
  ? 'Buy PDF Download Version'
  : 'PDFダウンロード版購入';
      const img = normalizeImageSrc(it.cover_image || '', 'images/books/');
      const buyUrl = it.purchase_url || '#';

      return `
        <div class="swiper-slide">
          <article class="voice-slide book-slide">
            <div class="voice-img-box book-img-box">
              <img class="voice-photo book-photo" src="${img}" alt="${title}" loading="lazy">
            </div>

            <div class="book-content">
              <h3 class="book-title">${safeHtml(title)}</h3>
              ${subtitle ? `<p class="book-sub">${safeHtml(subtitle)}</p>` : ``}
              ${published ? `<p class="book-date">${safeHtml(published)}</p>` : ``}
              <div class="book-strongline" aria-hidden="true"></div>
              ${comment ? `<p class="book-comment">${safeHtml(comment)}</p>` : ``}
              ${buyUrl && buyUrl !== '#' ? `<a class="book-buy-link" href="${buyUrl}" target="_blank" rel="noopener">${buyLabel}</a>` : ``}
            </div>
          </article>
        </div>
      `;
    }).join('');

    booksWrapper.innerHTML = html;
  }

  // load Books immediately (does not affect Worker API fetching)
  loadBooks();

// ===============================================
  // 2. Data Fetching (Worker + D1 JSON)
  // ===============================================

  // Detect current language from HTML tag
  const LANG = document.documentElement.lang === 'en' ? 'en' : 'ja';

  // Home page containers
  const newsContainer = document.querySelector('#news .news-container');
  const voiceWrapper  = document.querySelector('#voice .swiper-wrapper');

  // Archive containers (複数候補を見ておく：HTML差異吸収)
  function getArchiveWrapper() {
    return (
      document.querySelector('.archive-swiper .swiper-wrapper') ||
      document.querySelector('#archive .swiper-wrapper') ||
      document.getElementById('archiveList') ||
      document.getElementById('archive-list')
    );
  }

  // Worker API base (あなたの環境に合わせて変更)
  // 例: https://hosei-content-api.dic706.workers.dev
  const API_BASE = "https://hosei-content-api.dic706.workers.dev";

  function withCacheBuster(url) {
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + '_ts=' + Date.now();
  }

  // Only fetch if any containers exist (Home page)
  if (newsContainer || voiceWrapper || getArchiveWrapper()) {
    fetchData();
  }

  async function fetchData() {
    try {
      const needNews = !!newsContainer;
      const needVoice = !!voiceWrapper;
      const needArchive = !!getArchiveWrapper();

      const reqs = [];
      if (needNews)    reqs.push(fetch(withCacheBuster(`${API_BASE}/api/news`),    { cache: 'no-store' }));
      else             reqs.push(Promise.resolve(null));

      if (needVoice)   reqs.push(fetch(withCacheBuster(`${API_BASE}/api/voice`),   { cache: 'no-store' }));
      else             reqs.push(Promise.resolve(null));

      if (needArchive) reqs.push(fetch(withCacheBuster(`${API_BASE}/api/archive`), { cache: 'no-store' }));
      else             reqs.push(Promise.resolve(null));

      const [newsRes, voiceRes, archiveRes] = await Promise.all(reqs);

      if (newsRes && newsRes.ok && newsContainer) {
        const newsData = await newsRes.json();
        renderNews(newsData);
      }

      if (voiceRes && voiceRes.ok && voiceWrapper) {
        const voiceData = await voiceRes.json();
        renderVoice(voiceData);
      }

      if (archiveRes && archiveRes.ok) {
        const archiveData = await archiveRes.json();
        renderArchive(archiveData);
      }
    } catch (e) {
      console.error("Data load failed:", e);
    }
  }

  // ----------------------------
  // helpers (D1 JSON)
  // ----------------------------
  function isTrue(v) {
    if (v == null) return false;
    return String(v).trim().toUpperCase() === 'TRUE';
  }
  function safeHtml(s) {
    return (s == null) ? "" : String(s);
  }
  function normalizeImageSrc(src, fallbackDir = "images/") {
    if (!src) return "";
    const s = String(src).trim();
    if (!s) return "";
    if (s.startsWith('http')) return s;
    if (s.startsWith('images/')) return s;
    return fallbackDir + s;
  }
  function parseDotDate(s) {
    // "2022.07.06" -> Date
    return new Date(String(s || "").replace(/\./g, '/'));
  }

  // ----------------------------
  // ARCHIVE
  // ----------------------------
  function renderArchive(data) {
    const archiveWrapper = getArchiveWrapper();
    if (!archiveWrapper) return;

    // ★ display列はもう無い：enabled=TRUE のみ
    const validItems = (Array.isArray(data) ? data : [])
      .filter(item => isTrue(item.enabled));

    // date DESC
    validItems.sort((a, b) => parseDotDate(b.date) - parseDotDate(a.date));

    const html = validItems.map(item => {
      // D1版は ja_html/en_html がタイトル相当
      const title = (LANG === 'ja') ? safeHtml(item.ja_html) : safeHtml(item.en_html);
      const dateText = (item.view_date || item.date || "");
      const imgSrc = normalizeImageSrc(item.image_src);

      // Swiper wrapper でない場合でも同じHTMLで出す（崩れないように）
      return `
        <div class="swiper-slide">
          <div class="archive-card">
            <img alt="${title}" src="${imgSrc}" loading="lazy">
            <div class="archive-info">
              <div class="archive-date">${dateText}</div>
              <div class="archive-name">${title}</div>
            </div>
          </div>
        </div>`;
    }).join("");

    archiveWrapper.innerHTML = html;

    // Swiper update
    const swiperEl = document.querySelector('.archive-swiper');
    if (swiperEl && swiperEl.swiper) {
      swiperEl.swiper.update();
    }
  }

  // ----------------------------
  // NEWS
  // ----------------------------
  function renderNews(data) {
    const validItems = (Array.isArray(data) ? data : [])
      // enabled=TRUE のみ（従来意図）
      .filter(item => isTrue(item.enabled));

    // 並びはAPI（Worker）が決める（created_at DESC / 直った前提）
    const html = validItems.map((item, idx) => {
      const date = (item.view_date || item.date || "");
      const body = safeHtml(item[LANG + '_html'] || item.ja_html || "");
      const linkText = item[LANG + '_link_text'] || item.ja_link_text;
      const linkHref = item[LANG + '_link_href'] || item.ja_link_href;

      const linkHtml = (linkText && linkHref)
        ? `<br><a href="${linkHref}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
        : "";

      return `
        <div class="news-item fade-up" data-stagger="${idx}">
          <span class="news-date">${date}</span>
          <div class="news-text">${body}${linkHtml}</div>
        </div>
      `;
    }).join("");

    if (html.trim()) {
      newsContainer.innerHTML = html;

      // Stagger animation for dynamically injected items (元ロジック踏襲)
      const items = newsContainer.querySelectorAll('.news-item');
      const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const el = e.target;
          setTimeout(() => el.classList.add('is-visible'), 120 * (el.dataset.stagger || 0));
          o.unobserve(el);
        });
      }, { root: null, margin: '0px 0px -10% 0px', threshold: 0.15 });
      items.forEach(el => obs.observe(el));
    }
  }

  // ----------------------------
  // VOICE
  // ----------------------------
  function renderVoice(data) {
    const voiceWrapper = document.querySelector('#voice .swiper-wrapper');
    if (!voiceWrapper) return;

    const validItems = (Array.isArray(data) ? data : [])
      .filter(item => isTrue(item.enabled));

    validItems.sort((a, b) => parseDotDate(b.date) - parseDotDate(a.date));

    const html = validItems.map(item => {
      const body = safeHtml(item[LANG + '_html'] || item.ja_html || "");
      const dateText = (item.view_date || item.date || "");

      const isNoImage = !item.image_src || String(item.image_src).trim() === "";
      const kind = (isNoImage || item.image_kind === "logo") ? "logo" : "photo";
      const imgClass = (kind === "logo") ? "voice-logo-placeholder" : "voice-photo";

      let imgSrc = item.image_src;
      if (isNoImage) {
        imgSrc = "images/voice_card_logo_text_black.png";
      } else {
        imgSrc = normalizeImageSrc(imgSrc);
      }

      return `
        <div class="swiper-slide voice-slide">
          <div class="voice-img-box">
            <img src="${imgSrc}" alt="Voice Image" class="${imgClass}" loading="lazy">
          </div>
          <div class="voice-content">
            <div class="voice-date-text">${dateText}</div>
            <p class="voice-body">${body}</p>
          </div>
        </div>
      `;
    }).join("");

    if (html.trim()) {
      voiceWrapper.innerHTML = html;

      const swiperEl = document.querySelector('.voice-section .swiper-container');
      if (swiperEl && swiperEl.swiper) {
        swiperEl.swiper.update();
        swiperEl.swiper.slideToLoop(0, 0);
      }
    }
  }

});

// ============================================================
// First-party analytics (self) -> Cloudflare Worker /event
// ============================================================

function initSelfAnalytics() {
  const endpoint = (window.SELF_ANALYTICS_ENDPOINT || "https://analytics-worker.dic706.workers.dev/event").toString();
  const site = (window.SELF_ANALYTICS_SITE || "main").toString().toLowerCase();
  const name = (window.SELF_ANALYTICS_NAME || "official").toString();

  const started = performance && typeof performance.now === "function" ? performance.now() : Date.now();
  const path = location.pathname + location.search + location.hash;
  const ref = document.referrer || "";

  // pageview
  sendSelfEvent(endpoint, {
    site,
    type: "pageview",
    name,
    path,
    ref,
    ts: Date.now(),
    data: { title: document.title || "" }
  });

  // page_leave
  window.addEventListener("pagehide", () => {
    const now = performance && typeof performance.now === "function" ? performance.now() : Date.now();
    const dur = Math.max(0, Math.round(now - started));
    sendSelfEvent(endpoint, {
      site,
      type: "page_leave",
      name,
      path,
      ref,
      ts: Date.now(),
      data: { dur_ms: dur }
    }, true);
  });
}

function sendSelfEvent(endpoint, payload, keepalive) {
  try {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: !!keepalive,
      mode: "cors"
    }).catch(() => {});
  } catch (e) {}
}
