document.addEventListener('DOMContentLoaded', function() {

    // --- 1. UI周り (既存の動きを維持) ---
    const menuBtn = document.getElementById('menuBtn');
    const navOverlay = document.getElementById('navOverlay');
    if (menuBtn && navOverlay) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('is-open');
            navOverlay.classList.toggle('is-open');
        });
    }

    // --- 2. Swiper設定 (アーカイブの写真を消さないよう保護) ---
    if (typeof Swiper !== 'undefined') {
        const voiceEl = document.querySelector('.voice-section .swiper-container');
        if (voiceEl) {
            new Swiper(voiceEl, {
                loop: true, centeredSlides: true, slidesPerView: 'auto', spaceBetween: 25,
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

    // --- 3. NEWSデータ取得・徹底修正ロジック ---
    const NEWS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSkBOovAHzdZWtA0Z-KRe27h5ZzGFi5Bq2G7Bp0Mv4sQ-2C9urIYy8oR9IaMf7xdSR9M_iww2zMbG-/pub?gid=0&single=true&output=csv";
    const newsContainer = document.querySelector('#news .news-container');
    const LANG = document.documentElement.lang === 'en' ? 'en' : 'ja';

    if (newsContainer) {
        fetch(NEWS_URL)
            .then(res => res.text())
            .then(csvText => {
                // 文字列を1行ずつ分解し、空行を除去
                const rows = csvText.split(/\r?\n/).filter(row => row.trim());
                // ヘッダー取得
                const headers = rows[0].split(',').map(h => h.trim());
                
                // データをオブジェクト形式に変換
                const rawItems = rows.slice(1).map(row => {
                    const values = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
                    let obj = {};
                    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
                    return obj;
                });

                // 【ここが最重要：日付の再構築とソート】
                const processedItems = rawItems
                    .filter(item => String(item.enabled).toUpperCase() === 'TRUE')
                    .map(item => {
                        // "2026.01.10" や "2026/1/1" などから数字だけを抽出
                        const dateMatch = item.date.match(/\d+/g);
                        if (!dateMatch || dateMatch.length < 3) return null;

                        const y = parseInt(dateMatch[0], 10);
                        const m = parseInt(dateMatch[1], 10);
                        const d = parseInt(dateMatch[2], 10);

                        return {
                            ...item,
                            _sortKey: new Date(y, m - 1, d).getTime(), // ソート用の数値
                            _displayDate: `${y}.${m}.${d}` // 0を消した表示用
                        };
                    })
                    .filter(item => item !== null)
                    // 14日が10日より上に来るように降順ソート
                    .sort((a, b) => b._sortKey - a._sortKey);

                // HTMLに反映
                newsContainer.innerHTML = processedItems.map(item => {
                    const body = (LANG === 'ja' ? item.ja_html : item.en_html) || "";
                    const linkText = item[LANG + '_link_text'] || item.link_text;
                    const linkHref = item[LANG + '_link_href'] || item.link_href;
                    const linkHtml = (linkText && linkHref) ? `<br><a href="${linkHref}" target="_blank">${linkText}</a>` : "";

                    return `
                        <div class="news-item fade-up is-visible">
                            <span class="news-date">${item._displayDate}</span>
                            <div class="news-text">${body}${linkHtml}</div>
                        </div>`;
                }).join('');
            })
            .catch(err => console.error("Data fetch error:", err));
    }

    // アニメーション設定
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('is-visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up, .fade-in, .slide-left').forEach(el => observer.observe(el));
});
