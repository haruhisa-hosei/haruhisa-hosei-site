document.addEventListener('DOMContentLoaded', function() {

    // --- 1. UI (ハンバーガーメニュー等) ---
    const menuBtn = document.getElementById('menuBtn');
    const navOverlay = document.getElementById('navOverlay');
    if (menuBtn && navOverlay) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('is-open');
            navOverlay.classList.toggle('is-open');
        });
    }

    // --- 2. Swiper初期化 (既存のアーカイブとVoiceを保護) ---
    function initSwipers() {
        if (typeof Swiper === 'undefined') return;
        // Archive
        if (document.querySelector('.archive-swiper')) {
            new Swiper('.archive-swiper', {
                loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 30, speed: 800
            });
        }
        // Voice
        if (document.querySelector('.voice-section .swiper-container')) {
            new Swiper('.voice-section .swiper-container', {
                loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 25,
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
            });
        }
    }
    initSwipers();

    // --- 3. NEWSデータ取得・徹底修正ロジック ---
    const NEWS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSkBOovAHzdZWtA0Z-KRe27h5ZzGFi5Bq2G7Bp0Mv4sQ-2C9urIYy8oR9IaMf7xdSR9M_iww2zMbG-/pub?gid=0&single=true&output=csv";
    const newsContainer = document.querySelector('#news .news-container');
    const LANG = document.documentElement.lang === 'en' ? 'en' : 'ja';

    if (newsContainer) {
        fetch(NEWS_URL)
            .then(res => res.text())
            .then(csvText => {
                // CSVパース（カンマや改行を考慮した堅牢なパース）
                const rows = [];
                let curRow = [];
                let curCell = "";
                let inQuote = false;
                
                for (let i = 0; i < csvText.length; i++) {
                    let c = csvText[i];
                    if (inQuote) {
                        if (c === '"') {
                            if (csvText[i+1] === '"') { curCell += '"'; i++; }
                            else { inQuote = false; }
                        } else { curCell += c; }
                    } else {
                        if (c === '"') { inQuote = true; }
                        else if (c === ',') { curRow.push(curCell.trim()); curCell = ""; }
                        else if (c === '\n' || c === '\r') {
                            curRow.push(curCell.trim()); curCell = "";
                            if (curRow.length > 1) rows.push(curRow);
                            curRow = [];
                            if (c === '\r' && csvText[i+1] === '\n') i++;
                        } else { curCell += c; }
                    }
                }
                if (curRow.length > 0) { curRow.push(curCell.trim()); rows.push(curRow); }

                const headers = rows[0];
                const items = rows.slice(1).map(r => {
                    let obj = {};
                    headers.forEach((h, idx) => { obj[h] = r[idx] || ""; });
                    return obj;
                });

                // 【最重要】日付の正規化とソート
                const processed = items
                    .filter(item => String(item.enabled).toUpperCase() === 'TRUE')
                    .map(item => {
                        const d = (item.date || "").match(/\d+/g);
                        if (!d || d.length < 3) return null;
                        const y = parseInt(d[0], 10);
                        const m = parseInt(d[1], 10);
                        const day = parseInt(d[2], 10);
                        return {
                            ...item,
                            _time: new Date(y, m - 1, day).getTime(),
                            _display: `${y}.${m}.${day}` // ここで 01 -> 1 になる
                        };
                    })
                    .filter(i => i !== null)
                    .sort((a, b) => b._time - a._time); // 降順（最新が上）

                // HTML反映
                newsContainer.innerHTML = processed.map(item => {
                    const body = item[LANG + '_html'] || "";
                    const lText = item[LANG + '_link_text'];
                    const lHref = item[LANG + '_link_href'];
                    const link = (lText && lHref) ? `<br><a href="${lHref}" target="_blank">${lText}</a>` : "";
                    return `
                        <div class="news-item fade-up is-visible">
                            <span class="news-date">${item._display}</span>
                            <div class="news-text">${body}${link}</div>
                        </div>`;
                }).join('');
            });
    }

    // --- 4. アニメーション ---
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('is-visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up, .fade-in').forEach(el => observer.observe(el));
});
