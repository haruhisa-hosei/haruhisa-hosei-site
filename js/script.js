document.addEventListener('DOMContentLoaded', function() {

    // ===============================================
    // 1. UI & Swiper (既存のアーカイブ機能を守る)
    // ===============================================
    const menuBtn = document.getElementById('menuBtn');
    const navOverlay = document.getElementById('navOverlay');
    if (menuBtn && navOverlay) {
        menuBtn.addEventListener('click', () => {
            const isOpen = menuBtn.classList.toggle('is-open');
            navOverlay.classList.toggle('is-open');
        });
    }

    // アーカイブ等のSwiper初期化（ここには一切触れません）
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

    // ===============================================
    // 2. 日付処理の心臓部 (0埋めなし & 正確なソート)
    // ===============================================
    
    // 「2026.01.10」を解析して数値化し、表示用には「2026.1.10」を返す
    function processDate(dateStr) {
        if (!dateStr) return { time: 0, display: "" };
        // 数字だけを抜き出す (2026, 01, 14 など)
        const parts = String(dateStr).match(/\d+/g);
        if (!parts || parts.length < 3) return { time: 0, display: dateStr };

        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);

        return {
            time: new Date(y, m - 1, d).getTime(), // 比較用
            display: `${y}.${m}.${d}`              // 表示用 (0埋めなし)
        };
    }

    // ===============================================
    // 3. データ取得 & 描画
    // ===============================================
    const NEWS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSkBOovAHzdZWtA0Z-KRe27h5ZzGFi5Bq2G7Bp0Mv4sQ-2C9urIYy8oR9IaMf7xdSR9M_iww2zMbG-/pub?gid=0&single=true&output=csv";
    const LANG = document.documentElement.lang === 'en' ? 'en' : 'ja';
    const newsContainer = document.querySelector('#news .news-container');

    if (newsContainer) {
        fetch(NEWS_CSV)
            .then(res => res.text())
            .then(text => {
                const rows = text.split('\n').slice(1); // ヘッダー飛ばし
                const data = rows.map(row => {
                    const cols = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
                    return {
                        date: cols[0],
                        enabled: cols[1],
                        ja_html: cols[2],
                        en_html: cols[3],
                        link_text: cols[4],
                        link_href: cols[5]
                    };
                });

                // 1. 有効なものだけ残す
                // 2. 日付を解析し、降順（新しい順）に並べ替える
                const sortedData = data
                    .filter(item => item.enabled && item.enabled.toUpperCase() === 'TRUE')
                    .map(item => ({ ...item, _d: processDate(item.date) }))
                    .sort((a, b) => b._d.time - a._d.time);

                // HTML生成
                newsContainer.innerHTML = sortedData.map(item => {
                    const body = (LANG === 'ja' ? item.ja_html : item.en_html) || "";
                    // スプレッドシート側の列名に合わせて調整
                    const lText = item.link_text;
                    const lHref = item.link_href;
                    const link = (lText && lHref) ? `<br><a href="${lHref}" target="_blank">${lText}</a>` : "";

                    return `
                        <div class="news-item fade-up is-visible">
                            <span class="news-date">${item._d.display}</span>
                            <div class="news-text">${body}${link}</div>
                        </div>`;
                }).join('');
            });
    }

    // Intersection Observer などのアニメーション設定 (共通)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up, .fade-in').forEach(el => observer.observe(el));
});
