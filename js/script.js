// script.js — OFFICIAL SITE (UI 그대로 + Data source: API(JSON)へ切替版)
// - Swiperあり
// - 言語切替あり（documentElement.lang）
// - 既存アニメ/演出あり
//
// CHANGE SUMMARY (CSV -> JSON API):
// - fetch(withCacheBuster(CSV_URL)) -> fetch(withCacheBuster(API_URL)).json()
// - parseCSV は不要（残してもOKだが、ここでは削除）
//
// API:
// - https://hosei-content-api.dic706.workers.dev/posts?type=news
// - https://hosei-content-api.dic706.workers.dev/posts?type=voice
// - https://hosei-content-api.dic706.workers.dev/posts?type=archive

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

    // Close when link clicked
    menuLinks.forEach(link => {
      link.addEventListener('click', (e) => {
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

    // Keyboard Support
    menuBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        menuBtn.click();
      }
    });

    // Touch Feedback
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
      if (!header.classList.contains('is-visible')) {
        header.classList.add('is-visible');
      }
    }, 1000);
  }

  // --- Profile Animation (Home Only) ---
  const personEl = document.querySelector('.profile-anim-wrap .person-frame');
  const notesEl = document.querySelector('.profile-anim-wrap .notes-frame');
  if (personEl && notesEl) {
    const personFrames = ['images/profile.jpg', 'images/officialprofile2.png', 'images/officialprofile3.png', 'images/officialprofile2.png'];
    const notesFrames = ['images/notes_01.png', 'images/notes_02.png', 'images/notes_03.png', 'images/notes_04.png'];
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
    // Voice Swiper
    const voiceEl = document.querySelector('.voice-section .swiper-container');
    if (voiceEl) {
      new Swiper(voiceEl, {
        loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 25, speed: 600,
        observer: true, observeParents: true,
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        on: { init: function() { setTimeout(() => { this.update(); }, 100); } }
      });
    }
    // Archive Swiper
    const archiveEl = document.querySelector('.archive-swiper');
    if (archiveEl) {
      new Swiper(archiveEl, {
        loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 30, speed: 800
      });
    }
  }

  // ===============================================
  // 2. Data Fetching (JSON from Worker API)
  // ===============================================
  const API_BASE = "https://hosei-content-api.dic706.workers.dev";
  const NEWS_API_URL = `${API_BASE}/posts?type=news`;
  const VOICE_API_URL = `${API_BASE}/posts?type=voice`;
  const ARCHIVE_API_URL = `${API_BASE}/posts?type=archive`;

  // Cache-buster: avoid iOS/edge caching (also helps CF cache layers if any)
  function withCacheBuster(url) {
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + '_ts=' + Date.now();
  }

  // Detect current language from HTML tag
  const LANG = document.documentElement.lang === 'en' ? 'en' : 'ja';

  const newsContainer = document.querySelector('#news .news-container');
  const voiceWrapper = document.querySelector('#voice .swiper-wrapper');

  // Only fetch if containers exist (Home page)
  if (newsContainer || voiceWrapper) {
    fetchData();
  }

  async function fetchJson(url) {
    const res = await fetch(withCacheBuster(url), { cache: 'no-store' });
    if (!res.ok) throw new Error(`API fetch failed: ${res.status} ${res.statusText}`);
    return await res.json();
  }

  async function fetchData() {
    try {
      const [newsData, voiceData, archiveData] = await Promise.all([
        fetchJson(NEWS_API_URL),
        fetchJson(VOICE_API_URL),
        fetchJson(ARCHIVE_API_URL),
      ]);

      if (newsContainer) renderNews(newsData || []);
      if (voiceWrapper) renderVoice(voiceData || []);
      renderArchive(archiveData || []);
    } catch (e) {
      console.error("Data load failed:", e);
    }
  }

  function renderArchive(data) {
  const archiveWrapper = document.querySelector('.archive-swiper .swiper-wrapper');
  if (!archiveWrapper) return;

  const validItems = (data || []).filter(item => (item.display || "").toString().toUpperCase() === 'TRUE');

  // 日付順 (同一ならID順)
  validItems.sort((a, b) => {
    const dA = (a.date || "").toString();
    const dB = (b.date || "").toString();
    if (dA < dB) return 1;
    if (dA > dB) return -1;
    const iA = (a.id || "").toString();
    const iB = (b.id || "").toString();
    return iB.localeCompare(iA);
  });

  // client fallback: "2022.07.06" -> "2022.7.6"
  function toViewDateFallback(dateStr) {
    const s = (dateStr || "").toString().trim();
    const m = s.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
    if (!m) return s;
    const y = m[1];
    const mo = String(parseInt(m[2], 10));
    const da = String(parseInt(m[3], 10));
    return `${y}.${mo}.${da}`;
  }

  const html = validItems.map(item => {
    // HTMLタグを含むコンテンツを優先使用
    const contentHtml = (LANG === 'ja')
      ? (item.ja_html || item.title_ja || "")
      : (item.en_html || item.title_en || item.ja_html || item.title_ja || "");

    // alt属性用にタグを除去したテキストを作成
    const plainText = contentHtml.replace(/<[^>]*>?/gm, '').trim();

    // 画像処理
    const imgPath = normalizeImageSrc(item.image_src, { allowEmpty: true });
    const imgTag = imgPath
      ? `<div class="archive-image"><img src="${escapeAttr(imgPath)}" alt="${escapeAttr(plainText)}" loading="lazy"></div>`
      : "";

    const vDate = (item.view_date || "") ? item.view_date : toViewDateFallback(item.date || "");

    return `
      <div class="swiper-slide">
        <div class="archive-card fade-up">
          <div class="archive-date">${escapeHtml(vDate)}</div>
          ${imgTag}
          <div class="archive-comment">${contentHtml}</div>
        </div>
      </div>`;
  }).join("");

  if (html.trim()) {
    archiveWrapper.innerHTML = html;

    // ★重要：動的に追加した .fade-up を監視して is-visible を付ける（付かないと非表示のまま）
    try {
      archiveWrapper.querySelectorAll('.fade-up, .fade-in, .slide-left').forEach(el => observer.observe(el));
    } catch (e) {}

    const swiperEl = document.querySelector('.archive-swiper');
    if (swiperEl && swiperEl.swiper) {
      swiperEl.swiper.update();
    }
  }
}

  function renderNews(data) {
    const validItems = (data || []).filter(item => (item.enabled || "").toString().toUpperCase() === 'TRUE');

    const html = validItems.map((item, idx) => {
      const date = (item.view_date || item.date || "");
      const body = item[LANG + '_html'] || "";
      const linkText = item[LANG + '_link_text'] || "";
      const linkHref = item[LANG + '_link_href'] || "";

      const linkHtml = (linkText && linkHref)
        ? `<br><a href="${escapeAttr(linkHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkText)}</a>`
        : "";

      return `
        <div class="news-item fade-up" data-stagger="${idx}">
          <span class="news-date">${escapeHtml(date)}</span>
          <div class="news-text">${body}${linkHtml}</div>
        </div>
      `;
    }).join("");

    if (html.trim()) {
      newsContainer.innerHTML = html;

      // Activate Stagger Animations for dynamic content
      const items = newsContainer.querySelectorAll('.news-item');
      const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(e => {
          if(!e.isIntersecting) return;
          const el = e.target;
          setTimeout(() => el.classList.add('is-visible'), 120 * (el.dataset.stagger || 0));
          o.unobserve(el);
        });
      }, { root: null, margin: '0px 0px -10% 0px', threshold: 0.15 });
      items.forEach(el => obs.observe(el));
    }
  }

  function renderVoice(data) {
    const voiceWrapper = document.querySelector('#voice .swiper-wrapper');
    if (!voiceWrapper) return;

    const validItems = (data || []).filter(item => (item.enabled || "").toString().toUpperCase() === 'TRUE');
    validItems.sort((a, b) => {
      const dA = new Date((a.date || "").toString().replace(/\./g, '/'));
      const dB = new Date((b.date || "").toString().replace(/\./g, '/'));
      return dB - dA;
    });

    const html = validItems.map(item => {
      const body = item[LANG + '_html'] || "";

      const isNoImage = !item.image_src || item.image_src.trim() === "";
      const kind = (isNoImage || item.image_kind === "logo") ? "logo" : "photo";
      const imgClass = (kind === "logo") ? "voice-logo-placeholder" : "voice-photo";

      let imgSrc = "";
      if (isNoImage) {
        imgSrc = "images/voice_card_logo_text_black.png";
      } else {
        imgSrc = normalizeImageSrc(item.image_src, { allowEmpty: false }) || "";
      }

      return `
        <div class="swiper-slide voice-slide">
          <div class="voice-img-box">
            <img src="${escapeAttr(imgSrc)}" alt="Voice Image" class="${imgClass}" loading="lazy">
          </div>
          <div class="voice-content">
            <div class="voice-date-text">${escapeHtml(item.view_date || item.date || "")}</div>
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

  // ---- helpers ----

  // image_src を「現状維持（GitHub images/）」運用に合わせて正規化
  // - http(s) はそのまま
  // - "images/xxx" はそのまま
  // - "xxx.png" は "images/xxx.png"
  function normalizeImageSrc(src, { allowEmpty = true } = {}) {
    const s = (src ?? "").toString().trim();
    if (!s) return allowEmpty ? "" : "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("images/")) return s;
    // 既存資産は images/<file> 前提
    return "images/" + s;
  }

  function escapeHtml(str) {
    return (str ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(str) {
    // 属性用（最低限）
    return (str ?? "").toString().replaceAll('"', "&quot;");
  }
});


// ============================================================
// First-party analytics (self) -> Cloudflare Worker /event
// - Sends: pageview, page_leave (dur_ms)
// - Config via window.SELF_ANALYTICS_SITE / ENDPOINT / NAME
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
    data: {
      title: document.title || "",
      lang: document.documentElement.getAttribute("lang") || "",
    },
  });

  // dwell time (best effort)
  const sendLeave = () => {
    const durMs = (performance && typeof performance.now === "function")
      ? Math.max(0, Math.round(performance.now() - started))
      : 0;
    sendSelfEvent(endpoint, {
      site,
      type: "page_leave",
      name,
      path,
      ref,
      ts: Date.now(),
      data: { dur_ms: durMs },
    }, true);
  };

  // visibility/pagehide are the most reliable
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendLeave();
  });
  window.addEventListener("pagehide", sendLeave);
}

function sendSelfEvent(endpoint, payload, keepalive = false) {
  try {
    const body = JSON.stringify(payload || {});

    // Prefer sendBeacon for unload-safe delivery
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(endpoint, blob);
      if (ok) return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: !!keepalive,
    }).catch(() => {});
  } catch (_) {}
}


// -----------------------------
// Subscribe analytics helpers
// -----------------------------
function trackSubscribePages() {
  try {
    const p = location.pathname.toLowerCase();
    if (p.includes("submitted") || p.includes("thanks")) {
      if (typeof sendSelfEvent === "function") {
        sendSelfEvent("subscribe_complete", { path: p });
      }
    }
  } catch (e) {}
}

function bindSubscribeForm() {
  try {
    const form = document.querySelector("form");
    if (!form) return;
    form.addEventListener("submit", () => {
      if (typeof sendSelfEvent === "function") {
        sendSelfEvent("subscribe_submit", { path: location.pathname });
      }
    });
  } catch (e) {}
}

document.addEventListener("DOMContentLoaded", () => {
  trackSubscribePages();
  bindSubscribeForm();
});