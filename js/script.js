document.addEventListener('DOMContentLoaded', function() {

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
    // 2. Data Fetching (CSV from Google Sheets)
    // ===============================================
    const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSkBOovAHzdZWtA0Z-KRe27h5ZzGFi5Bq2G7Bp0Mv4sQ-2C9urIYy8oR9IaMf7xdSR9M_iww2zMbG-/pub?gid=0&single=true&output=csv";
    const VOICE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSkBOovAHzdZWtA0Z-KRe27h5ZzGFi5Bq2G7Bp0Mv4sQ-2C9urIYy8oR9IaMf7xdSR9M_iww2zMbG-/pub?gid=793239367&single=true&output=csv";

    

// Cache-buster: avoid iOS/edge caching of Google published CSV
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

    async function fetchData() {
        try {
            const [newsRes, voiceRes] = await Promise.all([
                fetch(withCacheBuster(NEWS_CSV_URL), { cache: 'no-store' }),
                fetch(withCacheBuster(VOICE_CSV_URL), { cache: 'no-store' })
            ]);

            if (newsRes.ok && newsContainer) {
                const text = await newsRes.text();
                const newsData = parseCSV(text);
                renderNews(newsData);
            }
            if (voiceRes.ok && voiceWrapper) {
                const text = await voiceRes.text();
                const voiceData = parseCSV(text);
                renderVoice(voiceData);
            }
        } catch (e) {
            console.error("Data load failed:", e);
        }
    }

    // CSV Parser (Handles quotes and commas correctly)
    function parseCSV(text) {
        const rows = [];
        let row = [];
        let cur = "";
        let inQuote = false;
        
        // Remove BOM if present
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

        for (let i = 0; i < text.length; i++) {
            let c = text[i];
            if (inQuote) {
                if (c === '"') {
                    if (i + 1 < text.length && text[i + 1] === '"') {
                        cur += '"'; i++;
                    } else {
                        inQuote = false;
                    }
                } else {
                    cur += c;
                }
            } else {
                if (c === '"') {
                    inQuote = true;
                } else if (c === ',') {
                    row.push(cur.trim()); cur = "";
                } else if (c === '\n' || c === '\r') {
                    row.push(cur.trim()); cur = "";
                    if (row.length > 0) rows.push(row);
                    row = [];
                    if (c === '\r' && text[i + 1] === '\n') i++;
                } else {
                    cur += c;
                }
            }
        }
        if (cur || row.length > 0) { row.push(cur.trim()); rows.push(row); }
        
        // Convert to Array of Objects using header row
        const headers = rows[0];
        const objects = rows.slice(1).map(r => {
            let obj = {};
            headers.forEach((h, idx) => {
                obj[h] = r[idx];
            });
            return obj;
        });
        return objects;
    }

    function renderNews(data) {
        // Filter enabled
        const validItems = data.filter(item => item.enabled && item.enabled.toUpperCase() === 'TRUE');
        
        const html = validItems.map((item, idx) => {
            const date = item.date;
            const body = item[LANG + '_html'] || "";
            const linkText = item[LANG + '_link_text'];
            const linkHref = item[LANG + '_link_href'];
            
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
        // Filter enabled & sort by date descending
        const validItems = data.filter(item => item.enabled && item.enabled.toUpperCase() === 'TRUE');
        validItems.sort((a, b) => {
            const dA = new Date(a.date.replace(/\./g, '/'));
            const dB = new Date(b.date.replace(/\./g, '/'));
            return dB - dA;
        });

        const html = validItems.map(item => {
            const body = item[LANG + '_html'] || "";
            const kind = item.image_kind || "photo";
            const imgClass = (kind === "logo") ? "voice-logo-placeholder" : "voice-photo";
            // Prepend images/ path if just filename is given
            let imgSrc = item.image_src;
            if(imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('images/')) {
                 imgSrc = 'images/' + imgSrc;
            }

            return `
                <div class="swiper-slide voice-slide">
                    <div class="voice-img-box">
                        <img src="${imgSrc}" alt="Voice Image" class="${imgClass}" loading="lazy">
                    </div>
                    <div class="voice-content">
                        <div class="voice-date-text">${item.date}</div>
                        <p class="voice-body">${body}</p>
                    </div>
                </div>
            `;
        }).join("");

        if (html.trim()) {
            voiceWrapper.innerHTML = html;
            // Force update Swiper
            const swiperEl = document.querySelector('.voice-section .swiper-container');
            if(swiperEl && swiperEl.swiper) {
                swiperEl.swiper.update();
                swiperEl.swiper.slideTo(0);
            }
        }
    }

});