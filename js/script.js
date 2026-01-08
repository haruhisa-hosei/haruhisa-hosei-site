document.addEventListener('DOMContentLoaded', function() {

    // --- UI/Swiper (アーカイブ写真を保護するため既存の設定を維持) ---
    const menuBtn = document.getElementById('menuBtn');
    const navOverlay = document.getElementById('navOverlay');
    if (menuBtn && navOverlay) {
        menuBtn.addEventListener('click', () => {
            const isOpen = menuBtn.classList.toggle('is-open');
            navOverlay.classList.toggle('is-open');
        });
    }

    if (typeof Swiper !== 'undefined') {
        // Voice Swiper
        const voiceEl = document.querySelector('.voice-section .swiper-container');
        if (voiceEl) {
            new Swiper(voiceEl, {
                loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 25,
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
            });
        }
        // Archive Swiper (写真を消さないよう元の設定を保持)
        const archiveEl = document.querySelector('.archive-swiper');
        if (archiveEl) {
            new Swiper(archiveEl, {
                loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 30, speed: 800
            });
        }
    }

    // ===============================================
    // 日付の修正・ソート処理 (ここが最重要)
    // ===============================================
    function parseAndFormatDate(dateStr) {
        const s = String(dateStr || '').trim();
        const parts = (s.match(/\d+/g) || []).map(Number);
        
        if (parts.length < 3) return { time: 0, display: dateStr };

        const [y, m, d] = parts;
        // 比較用：Dateオブジェクト（14日を10日より上にするため）
        const time = new Date(y, m - 1, d).getTime();
        // 表示用：「2026.1.10」形式（0を消す）
        const display = `${y}.${m}.${d}`;

        return { time, display };
    }

    const NEWS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSkBOovAHzdZWtA0Z-KRe27h5ZzGFi5Bq2G7Bp0Mv4sQ-2C9urIYy8oR9IaMf7xdSR9M_iww2zMbG-/pub?gid=0&single=true&output=csv";
    const LANG = document.documentElement.lang === 'en' ? 'en' : 'ja';
    const container = document.querySelector('#news .news-container');

    if (container) {
        fetch(NEWS_CSV)
            .then(res => res.text())
            .then(csvText => {
                // CSV解析（1行目をヘッダーとして処理）
                const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
                const headers = lines[0].split(',').map(h => h.trim());
                
                const data = lines.slice(1).map(line => {
                    const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
                    let obj = {};
                    headers.forEach((h, i) => obj[h] = values[i]);
                    return obj;
                });

                // 1. enabledが"TRUE"のものだけ抽出
                // 2. 日付を解析し、降順（新しい順）にソート
                const sortedItems = data
                    .filter(item => String(item.enabled).toUpperCase() === 'TRUE')
                    .map(item => {
                        const dateObj = parseAndFormatDate(item.date);
                        return { ...item, _time: dateObj.time, _displayDate: dateObj.display };
                    })
                    .sort((a, b) => b._time - a._time);

                // HTML書き出し
                container.innerHTML = sortedItems.map(item => {
                    const body = item[LANG + '_html'] || "";
                    const linkText = item[LANG + '_link_text'];
                    const linkHref = item[LANG + '_link_href'];
                    const linkHtml = (linkText && linkHref) ? `<br><a href="${linkHref}" target="_blank">${linkText}</a>` : "";

                    return `
                        <div class="news-item fade-up is-visible">
                            <span class="news-date">${item._displayDate}</span>
                            <div class="news-text">${body}${linkHtml}</div>
                        </div>
                    `;
                }).join('');
            })
            .catch(err => console.error("News Load Error:", err));
    }

    // --- その他アニメーション ---
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('is-visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up, .fade-in, .slide-left').forEach(el => obs.observe(el));
});
