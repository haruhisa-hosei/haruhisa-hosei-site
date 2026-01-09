document.addEventListener('DOMContentLoaded', function() {
    // ------------------------------
    // Date helpers (display + sort)
    // Accepts: "YYYY.MM.DD", "YYYY.M.D", "YYYY-MM-DD", "YYYY/M/D"
    // ------------------------------
    function parseDateForSort(s) {
        s = String(s || '').trim();
        if (!s) return null;
        const t = s.replace(/[\/\-]/g, '.');
        const m = t.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
        if (!m) return null;
        const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
        if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
        return new Date(y, mo - 1, d).getTime();
    }
    function formatDateYYYYMD(s) {
        // Returns "YYYY.M.D" (no zero padding). If parse fails, returns original string.
        s = String(s || '').trim();
        const t = s.replace(/[\/\-]/g, '.');
        const m = t.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
        if (!m) return s;
        return `${Number(m[1])}.${Number(m[2])}.${Number(m[3])}`;
    }



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
                fetch(NEWS_CSV_URL),
                fetch(VOICE_CSV_URL)
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

    function renderNews(newsItems) {
        // Sort by "date" (desc). Display prefers "view_date" if present, otherwise formats "date".
        const sorted = [...newsItems].sort((a, b) => {
            const ta = parseDateForSort(a.date);
            const tb = parseDateForSort(b.date);
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;
            return tb - ta;
        });

        newsContainer.innerHTML = '';

        sorted.forEach(item => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';

            const dateTextRaw = item.view_date || item.viewDate || item.view || item.date;
            const dateText = formatDateYYYYMD(dateTextRaw);

            const dateDiv = document.createElement('div');
            dateDiv.className = 'news-date';
            dateDiv.textContent = dateText;
            newsItem.appendChild(dateDiv);

            const jaHtmlDiv = document.createElement('div');
            jaHtmlDiv.className = 'news-content';
            jaHtmlDiv.innerHTML = item.ja_html || '';
            newsItem.appendChild(jaHtmlDiv);

            if (item.ja_link_text && item.ja_link_href) {
                const link = document.createElement('a');
                link.href = item.ja_link_href;
                link.textContent = item.ja_link_text;
                link.className = 'news-link';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                newsItem.appendChild(link);
            }

            const enHtmlDiv = document.createElement('div');
            enHtmlDiv.className = 'news-content';
            enHtmlDiv.innerHTML = item.en_html || '';
            newsItem.appendChild(enHtmlDiv);

            if (item.en_link_text && item.en_link_href) {
                const link = document.createElement('a');
                link.href = item.en_link_href;
                link.textContent = item.en_link_text;
                link.className = 'news-link';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                newsItem.appendChild(link);
            }

            newsContainer.appendChild(newsItem);
        });
    }

    function renderVoice(voiceItems) {
        // Sort by "date" (desc). Display prefers "view_date" if present, otherwise formats "date".
        const sorted = [...voiceItems].sort((a, b) => {
            const ta = parseDateForSort(a.date);
            const tb = parseDateForSort(b.date);
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;
            return tb - ta;
        });

        voiceWrapper.innerHTML = '';

        sorted.forEach(item => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';

            const dateTextRaw = item.view_date || item.viewDate || item.view || item.date;
            const dateText = formatDateYYYYMD(dateTextRaw);

            const dateP = document.createElement('p');
            dateP.className = 'voice-date';
            dateP.textContent = dateText;
            slide.appendChild(dateP);

            if (item.image_src) {
                const img = document.createElement('img');
                img.src = `images/${item.image_src}`;
                img.alt = '';
                img.className = 'voice-image';
                slide.appendChild(img);
            }

            const jaDiv = document.createElement('div');
            jaDiv.className = 'voice-content';
            jaDiv.innerHTML = item.ja_html || '';
            slide.appendChild(jaDiv);

            const enDiv = document.createElement('div');
            enDiv.className = 'voice-content';
            enDiv.innerHTML = item.en_html || '';
            slide.appendChild(enDiv);

            voiceWrapper.appendChild(slide);
        });

        if (window.voiceSwiper && typeof window.voiceSwiper.update === 'function') {
            window.voiceSwiper.update();
        }
    }

});