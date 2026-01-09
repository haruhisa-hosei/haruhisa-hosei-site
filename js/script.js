
document.addEventListener('DOMContentLoaded', function() {
    // ------------------------------
    // Date helpers (display + sort)
    // ------------------------------
    function parseDateForSort(s) {
        s = String(s || '').trim();
        if (!s) return null;
        const t = s.replace(/[\/\-]/g, '.');
        const m = t.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
        if (!m) return null;
        return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
    }

    function formatDateYYYYMD(s) {
        s = String(s || '').trim();
        const t = s.replace(/[\/\-]/g, '.');
        const m = t.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
        if (!m) return s;
        return `${Number(m[1])}.${Number(m[2])}.${Number(m[3])}`;
    }

    // --- Swiper Init (Voice) ---
    if (typeof Swiper !== 'undefined') {
        const voiceEl = document.querySelector('.voice-section .swiper-container');
        if (voiceEl) {
            window.voiceSwiper = new Swiper(voiceEl, {
                loop: true,
                centeredSlides: true,
                slidesPerView: 'auto',
                spaceBetween: 25,
                speed: 600,
                observer: true,
                observeParents: true,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                }
            });
        }
    }

    // --- CSV Fetch ---
    const VOICE_CSV_URL =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSkBOovAHzdZWtA0Z-KRe27h5ZzGFi5Bq2G7Bp0Mv4sQ-2C9urIYy8oR9IaMf7xdSR9M_iww2zMbG-/pub?gid=793239367&single=true&output=csv";

    const voiceWrapper = document.querySelector('#voice .swiper-wrapper');
    if (voiceWrapper) fetch(VOICE_CSV_URL).then(r => r.text()).then(t => renderVoice(parseCSV(t)));

    function parseCSV(text) {
        const rows = text.trim().split(/\r?\n/).map(r => r.split(','));
        const headers = rows.shift();
        return rows.map(r => {
            const o = {};
            headers.forEach((h, i) => o[h] = r[i]);
            return o;
        });
    }

    function renderVoice(items) {
        const sorted = [...items].sort((a, b) => {
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

            const dateP = document.createElement('p');
            dateP.className = 'voice-date';
            dateP.textContent = formatDateYYYYMD(item.view_date || item.date);
            slide.appendChild(dateP);

            if (item.image_src) {
                const img = document.createElement('img');
                img.src = `images/${item.image_src}`;
                img.alt = '';
                img.className = 'voice-image'; // 元のクラスに完全復帰
                slide.appendChild(img);
            }

            const ja = document.createElement('div');
            ja.className = 'voice-content';
            ja.innerHTML = item.ja_html || '';
            slide.appendChild(ja);

            const en = document.createElement('div');
            en.className = 'voice-content';
            en.innerHTML = item.en_html || '';
            slide.appendChild(en);

            voiceWrapper.appendChild(slide);
        });

        if (window.voiceSwiper) window.voiceSwiper.update();
    }
});
