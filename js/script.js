document.addEventListener('DOMContentLoaded', function() {

    // ===============================================
    // 1. UI & Animations (共通)
    // ===============================================

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
                setTimeout(() => {
                    menuBtn.classList.remove('is-open');
                    navOverlay.classList.remove('is-open');
                    menuBtn.setAttribute('aria-expanded', 'false');
                }, 600);
            });
        });
    }

    // 言語メニュー
    const langToggle = document.getElementById('langToggle');
    const langMenu = document.getElementById('langMenu');
    if (langToggle && langMenu) {
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            langMenu.classList.toggle('is-open');
        });
        document.addEventListener('click', (e) => {
            if (!langToggle.contains(e.target) && !langMenu.contains(e.target)) {
                langMenu.classList.remove('is-open');
            }
        });
    }

    // スクロールエフェクト
    const sunLight = document.getElementById('sunLight');
    if (sunLight && menuBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                sunLight.classList.add('is-active');
                menuBtn.classList.add('is-active-scroll');
            } else {
                sunLight.classList.remove('is-active');
                menuBtn.classList.remove('is-active-scroll');
            }
        });
    }

    // アニメーション監視
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.fade-up, .fade-in, .slide-left').forEach(el => observer.observe(el));

    // プロフィールアニメ
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
            setTimeout(tick, frameDurations[fi]);
            fi = (fi + 1) % personFrames.length;
        };
        setTimeout(tick, 60);
    }

    // Swiper初期化 (アーカイブ写真を消さないよう保護)
    if (typeof Swiper !== 'undefined') {
        const voiceEl = document.querySelector('.voice-section .swiper-container');
        if (voiceEl) {
            new Swiper(voiceEl, {
                loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 25, speed: 600,
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
            });
        }
        const archiveEl = document.querySelector('.archive-swiper');
        if (archiveEl) {
            new Swiper(archiveEl, {
                loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 30, speed: 800
            });
        }
    }

    // ===============================================
    // 2. データ取得・解析 (NEWS & VOICE)
    // ===============================================
    const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSkBOovAHzdZWtA0Z-KRe27h5ZzGFi5Bq2G7Bp0Mv4sQ-2C9urIYy8oR9IaMf7xdSR9M_iww2zMbG-/pub?gid=0&single=true&output=csv";
    const VOICE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSkBOovAHzdZWtA0Z-KRe27h5ZzGFi5Bq2G7Bp0Mv4sQ-2C9urIYy8oR9IaMf7xdSR9M_iww2zMbG-/pub?gid=793239367&single=true&output=csv";

    const LANG = document.documentElement.lang === 'en' ? 'en' : 'ja';
    const newsContainer = document.querySelector('#news .news-container');
    const voiceWrapper = document.querySelector('#voice .swiper-wrapper');

    // 日付処理ヘルパー (2026.1.10 形式 & ソート用)
    function parseDate(dateStr) {
        const s = String(dateStr || '').trim();
        const parts = (s.match(/\d+/g) || []).map(Number);
        if (parts.length < 3) return { display: dateStr, time: 0 };
        const [y, m, d] = parts;
        return {
            display: `${y}.${m}.${d}`, // 「01」を「1」にする
            time: new Date(y, m - 1, d).getTime()
        };
    }

    async function fetchData() {
        try {
            const [newsRes, voiceRes] = await Promise.all([
                fetch(NEWS_CSV_URL),
                fetch(VOICE_CSV_URL)
            ]);
            if (newsRes.ok && newsContainer) renderNews(parseCSV(await newsRes.text()));
            if (voiceRes.ok && voiceWrapper) renderVoice(parseCSV(await voiceRes.text()));
        } catch (e) { console.error(e); }
    }

    function parseCSV(text) {
        const lines = text.split(/\r?\n/);
        const headers = lines[0].split(',');
        return lines.slice(1).filter(line => line).map(line => {
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            let obj = {};
            headers.forEach((h, i) => { obj[h.trim()] = (values[i] || "").replace(/^"|"$/g, ''); });
            return obj;
        });
    }

    function renderNews(data) {
        // 1. 有効なデータのみ抽出し、日付の降順(新しい順)でソート
        const items = data
            .filter(d => String(d.enabled).toUpperCase() === 'TRUE')
            .map(d => ({ ...d, _dateObj: parseDate(d.date) }))
            .sort((a, b) => b._dateObj.time - a._dateObj.time);

        newsContainer.innerHTML = items.map((item, idx) => {
            const body = item[LANG + '_html'] || "";
            const linkText = item[LANG + '_link_text'];
            const linkHref = item[LANG + '_link_href'];
            const linkHtml = (linkText && linkHref) ? `<br><a href="${linkHref}" target="_blank">${linkText}</a>` : "";
            return `
                <div class="news-item fade-up is-visible" style="transition-delay: ${idx * 100}ms">
                    <span class="news-date">${item._dateObj.display}</span>
                    <div class="news-text">${body}${linkHtml}</div>
                </div>`;
        }).join("");
    }

    function renderVoice(data) {
        const items = data
            .filter(d => String(d.enabled).toUpperCase() === 'TRUE')
            .map(d => ({ ...d, _dateObj: parseDate(d.date) }))
            .sort((a, b) => b._dateObj.time - a._dateObj.time);

        voiceWrapper.innerHTML = items.map(item => {
            let imgSrc = item.image_src;
            if(imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('images/')) imgSrc = 'images/' + imgSrc;
            return `
                <div class="swiper-slide voice-slide">
                    <div class="voice-img-box"><img src="${imgSrc}" class="voice-photo" loading="lazy"></div>
                    <div class="voice-content">
                        <div class="voice-date-text">${item._dateObj.display}</div>
                        <p class="voice-body">${item[LANG + '_html']}</p>
                    </div>
                </div>`;
        }).join("");
        if (voiceWrapper.parentElement.swiper) voiceWrapper.parentElement.swiper.update();
    }

    if (newsContainer || voiceWrapper) fetchData();
});
