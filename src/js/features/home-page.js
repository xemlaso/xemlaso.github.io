// src/js/features/home-page.js – Trang chủ (desktop + mobile)
// Bầu trời đêm theo giờ thật, vệt sao quay quanh Bắc Thần, Bắc Đẩu chỉ chi của tháng âm hiện tại,
// can chi hôm nay, lá số gần đây, hiệu ứng mở trang và chuyển sang lá số.
// Desktop: hiện khi body có class "mb-page-home" (menubar.js). Mobile: class "m-page-home" (mobile-cloud.js).
// Ẩn thì dừng vẽ. Mobile chạy bản nhẹ: ít sao, không vệt sao, độ phân giải thấp hơn.
(function () {
    'use strict';
  
    // ═════════ Dữ liệu sao ═════════
    // Bắc Đẩu (toạ độ tương đối theo hình mẫu); tinh quân theo Đạo giáo: Thiên Xu – Tham Lang …
    const BAC_DAU = [
      { ten: 'Thiên Xu',    han: '天樞', quan: 'Tham Lang 貪狼',  y_: 'Chủ phúc họa, dục vọng, tài nghệ', x: 697, y: 150, m: 1.00 },
      { ten: 'Thiên Tuyền', han: '天璇', quan: 'Cự Môn 巨門',     y_: 'Chủ khẩu thiệt, thị phi, ngôn luận', x: 668, y: 303, m: 0.90 },
      { ten: 'Thiên Cơ',    han: '天璣', quan: 'Lộc Tồn 祿存',    y_: 'Chủ tài lộc, bổng lộc',            x: 476, y: 318, m: 0.85 },
      { ten: 'Thiên Quyền', han: '天權', quan: 'Văn Khúc 文曲',   y_: 'Chủ văn chương, khoa danh',         x: 437, y: 195, m: 0.65 },
      { ten: 'Ngọc Hành',   han: '玉衡', quan: 'Liêm Trinh 廉貞', y_: 'Chủ quan lộc, hình ngục',           x: 316, y: 133, m: 1.00 },
      { ten: 'Khai Dương',  han: '開陽', quan: 'Vũ Khúc 武曲',    y_: 'Chủ tài tinh, cương nghị',          x: 217, y:  83, m: 0.90 },
      { ten: 'Dao Quang',   han: '搖光', quan: 'Phá Quân 破軍',   y_: 'Chủ hao tán, phá cũ lập mới',       x:  68, y: 118, m: 0.95 },
    ];
    const BD_NOI = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];
    // Bắc Thần: kéo dài Thiên Tuyền → Thiên Xu (rút ngắn so với thực tế để Bắc Đẩu to, rõ)
    const BAC_THAN = { x: 697 + 2.2 * 29, y: 150 - 2.2 * 153 };
    const BAC_THAN_INFO = { ten: 'Bắc Thần', han: '北辰', quan: 'ngôi Tử Vi 紫微', y_: 'Đế tinh chòm Bắc đẩu' };
  
  
    const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tị', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    const CHI_HAN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
    const CAN_HAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const THANG_TEN = ['', 'Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Một', 'Chạp'];
  
    // ═════════ Tham số ═════════
    const VONG_QUAY = 240;              // giây / vòng của bầu trời
    const INTRO_MS = 6000;              // hiệu ứng mở trang (lần đầu)
    const LEAVE_MS = 1100;              // hiệu ứng chuyển sang lá số
    const SWAY = 0.12, SWAY_MS = 50000; // Bắc Đẩu đung đưa quanh hướng tháng
    const FPS = 30;                     // sao di chuyển chậm: 30 khung hình/giây là đủ mượt
    let lastVe = 0;
    const isMob = () => document.body.dataset.layout === 'mobile';
    const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const FONT_HAN = '"Noto Serif CJK SC", "Songti SC", "SimSun", serif';
    const FONT_VN = '"Playfair Display", Georgia, serif';
  
    // ═════════ Âm lịch (thuật toán Hồ Ngọc Đức, múi giờ +7) ═════════
    const INT = Math.floor, PI = Math.PI;
    function jdFromDate(dd, mm, yy) {
      const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
      let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
      if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
      return jd;
    }
    function newMoon(k) {
      const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
      let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
      jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
      const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
      const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
      const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
      let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
      C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
      C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
      C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
      C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
      C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
      C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
      const deltat = T < -11
        ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
        : -0.000278 + 0.000265 * T + 0.000262 * T2;
      return jd1 + C1 - deltat;
    }
    function sunLongitude(jdn) {
      const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
      const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
      const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
      let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
      DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
      let L = (L0 + DL) * dr;
      return L - PI * 2 * INT(L / (PI * 2));
    }
    const TZ = 7;
    const newMoonDay = k => INT(newMoon(k) + 0.5 + TZ / 24);
    const sunLongDay = d => INT(sunLongitude(d - 0.5 - TZ / 24) / PI * 6);
    function lunarMonth11(yy) {
      const k = INT((jdFromDate(31, 12, yy) - 2415021) / 29.530588853);
      const nm = newMoonDay(k);
      return sunLongDay(nm) >= 9 ? newMoonDay(k - 1) : nm;
    }
    function leapMonthOffset(a11) {
      const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
      let last, i = 1, arc = sunLongDay(newMoonDay(k + i));
      do { last = arc; i++; arc = sunLongDay(newMoonDay(k + i)); } while (arc !== last && i < 14);
      return i - 1;
    }
    function solar2Lunar(dd, mm, yy) {
      const dn = jdFromDate(dd, mm, yy);
      const k = INT((dn - 2415021.076998695) / 29.530588853);
      let ms = newMoonDay(k + 1);
      if (ms > dn) ms = newMoonDay(k);
      let a11 = lunarMonth11(yy), b11 = a11, y;
      if (a11 >= ms) { y = yy; a11 = lunarMonth11(yy - 1); }
      else { y = yy + 1; b11 = lunarMonth11(yy + 1); }
      const d = dn - ms + 1, diff = INT((ms - a11) / 29);
      let leap = 0, m = diff + 11;
      if (b11 - a11 > 365) {
        const lm = leapMonthOffset(a11);
        if (diff >= lm) { m = diff + 10; if (diff === lm) leap = 1; }
      }
      if (m > 12) m -= 12;
      if (m >= 11 && diff < 4) y -= 1;
      return { d, m, y, leap, jd: dn };
    }
  
    // Hôm nay: ngày âm + can chi năm / tháng / ngày / giờ (23h tính sang ngày hôm sau, như giờ Tý muộn)
    function homNay(now = new Date()) {
      const dd = now.getDate(), mm = now.getMonth() + 1, yy = now.getFullYear(), h = now.getHours();
      const am = solar2Lunar(dd, mm, yy);
      const jdNgay = am.jd + (h === 23 ? 1 : 0);
      const cc = (c, z) => ({ vn: `${CAN[c]} ${CHI[z]}`, han: CAN_HAN[c] + CHI_HAN[z] });
      const canNgay = (jdNgay + 9) % 10, chiGio = INT(((h + 1) % 24) / 2);
      return {
        dd, mm, yy, am,
        nam: cc((am.y + 6) % 10, (am.y + 8) % 12),
        thang: cc((am.y * 12 + am.m + 3) % 10, (am.m + 1) % 12),
        ngay: cc(canNgay, (jdNgay + 1) % 12),
        gio: cc((canNgay * 2 + chiGio) % 10, chiGio),
        chiThang: (am.m + 1) % 12,                 // tháng Giêng kiến Dần
      };
    }
  
    // ═════════ Trạng thái ═════════
    let root, cv, ctx, tipEl, todayEl, chiEl, recentEl, userEl, W = 0, H = 0, dpr = 1, raf = 0, running = false;
    let cx = 0, cy = 0, R = 0, scale = 1, rMax = 0, nen = [], glow = null, ngan = null;
    let saoBang = null, nextBang = 0, chiCu = -1, info = homNay(), tick = 0;
    let introAt = 0, introDone = reduce, leave = null, hover = null, hits = [];
    let mx = 0, my = 0, px = 0, py = 0, sang = 1, lowPower = false, perf = { n: 0, sum: 0, last: 0 };
    const t0 = performance.now();
  
    // ═════════ DOM ═════════
    function build() {
      root = document.createElement('section');
      root.id = 'homePage';
      root.className = 'home-page' + (reduce ? '' : ' home-intro');
      root.setAttribute('aria-label', 'Trang chủ');
      root.innerHTML = `
        <div class="home-nebula"></div>
        <div class="home-horizon"></div>
        <canvas class="home-sky"></canvas>
        <div class="home-user"></div>
        <div class="home-hero">
          <div class="home-kicker">紫 微 斗 數</div>
          <h1 class="home-title">Vận mệnh</h1>
          <div class="home-sub">Tử Vi Đẩu Số</div>
          <div class="home-today"></div>
          <p class="home-quote">Bắc Đẩu xoay vần · Thất tinh chiếu mệnh</p>
          <div class="home-cta">
            <button type="button" class="home-btn home-btn-main" data-go="laso">Lập lá số</button>
            <button type="button" class="home-btn" data-go="search">Tìm lá số</button>
          </div>
          <div class="home-recent"></div>
        </div>
        <div class="home-tip" hidden></div>
        <div class="home-chi"></div>`;
      document.body.appendChild(root);
      cv = root.querySelector('.home-sky');
      ctx = cv.getContext('2d');
      tipEl = root.querySelector('.home-tip');
      todayEl = root.querySelector('.home-today');
      chiEl = root.querySelector('.home-chi');
      recentEl = root.querySelector('.home-recent');
      userEl = root.querySelector('.home-user');
  
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-go]');
        if (b) { roiTrang(b.dataset.go); return; }
        const r = e.target.closest('[data-open]');
        if (r) moLaSo(r.dataset.open);
        if (e.target.closest('[data-acc]')) bamTab('cloud');           // mở bảng Tài khoản (đăng nhập / lá số đã lưu)
      });
      root.addEventListener('mousemove', e => {
        const rc = root.getBoundingClientRect();
        const x = e.clientX - rc.left, y = e.clientY - rc.top;
        mx = (x / W) * 2 - 1; my = (y / H) * 2 - 1;
        timHover(x, y);
      });
      root.addEventListener('mouseleave', () => { mx = my = 0; hover = null; tipEl.hidden = true; });
      // Mobile: chạm vào sao để xem chú thích, tự ẩn sau 3 giây
      let tipTimer = 0;
      root.addEventListener('touchstart', e => {
        if (e.target !== cv) return;
        const rc = root.getBoundingClientRect(), t = e.touches[0];
        timHover(t.clientX - rc.left, t.clientY - rc.top, 26);
        clearTimeout(tipTimer);
        tipTimer = setTimeout(() => { hover = null; tipEl.hidden = true; }, 3000);
      }, { passive: true });
    }
  
    // Bấm tab tương ứng (menubar desktop / thanh đáy mobile): các file đó lo chuyển trang và giữ trạng thái
    const bamTab = p => document.querySelector(isMob() ? `.m-bar [data-go="${p}"]` : `#menuBar [data-page="${p}"]`)?.click();
  
    function huyRoiTrang() {
        if (!leave) return;
        leave = null;
        root.classList.remove('home-leaving');
      }
      document.addEventListener('click', e => {
        if (e.target.closest('.m-bar [data-go="home"], #menuBar [data-page="home"]')) huyRoiTrang();
      }, true);
      
    function roiTrang(p) {
      if (leave) return;
      if (reduce) { bamTab(p); return; }
      introDone = true; root.classList.remove('home-intro');
      leave = { t: performance.now(), p, ms: p === 'laso' ? LEAVE_MS : 450 };
      if (p !== 'laso') root.classList.add('home-leaving');
    }
  
    // ═════════ Lá số gần đây ═════════
    const RECENT_KEY = () => 'homeRecent:' + (window.FB?.auth?.currentUser?.uid || '');
    function docRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY()) || '[]'); } catch (e) { return []; } }
    function ghiRecent(id) {
      if (!id || !window.FB?.auth?.currentUser) return;
      const l = [id, ...docRecent().filter(x => x !== id)].slice(0, 20);
      try { localStorage.setItem(RECENT_KEY(), JSON.stringify(l)); } catch (e) {}
    }
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  
    function veRecent() {
      if (!recentEl) return;
      const all = typeof window.CLOUD_items === 'function' ? window.CLOUD_items() : [];
      if (!all.length) { recentEl.innerHTML = ''; return; }
      const order = docRecent();
      const rank = x => { const i = order.indexOf(x.id); return i < 0 ? 1e9 : i; };
      const list = [...all].sort((a, b) => (rank(a) - rank(b)) || ((b.t || 0) - (a.t || 0))).slice(0, 4);
      recentEl.innerHTML = `<div class="home-recent-title">Lá số gần đây</div><div class="home-recent-list">${list.map(x => {
        const ct = Array.isArray(x.menh?.chinhTinh) && x.menh.chinhTinh.length ? x.menh.chinhTinh.join(', ') : 'Vô chính diệu';
        const menh = x.menh?.chi ? `Mệnh ${esc(x.menh.chi)} · ${esc(ct)}` : '';
        return `<button type="button" class="home-card" data-open="${esc(x.id)}" title="Mở lá số">
          <span class="home-card-name">${esc(x.hoTen || '(không tên)')}</span>
          <span class="home-card-meta">${x.dl?.y ? esc(x.dl.y) : ''}${x.gioiTinh ? ' · ' + (x.gioiTinh === 'nu' ? 'Nữ' : 'Nam') : ''}</span>
          ${menh ? `<span class="home-card-menh">${menh}</span>` : ''}
        </button>`;
      }).join('')}</div>`;
    }
  
    // Mobile: lời chào hoặc nút đăng nhập ở đầu Trang chủ (desktop đã có tài khoản trên menubar)
    function veUser() {
      if (!userEl) return;
      const u = window.FB?.auth?.currentUser;
      if (u) {
        const ten = (u.displayName || (u.email || '').split('@')[0] || 'bạn').trim();
        userEl.innerHTML = `<span class="home-hello">Xin chào, <b>${esc(ten)}</b></span>
          <button type="button" class="home-avatar" data-acc title="Tài khoản">${esc(ten.charAt(0).toUpperCase())}</button>`;
      } else {
        userEl.innerHTML = `<span class="home-hello">Đăng nhập để lưu và xem lại lá số</span>
          <button type="button" class="home-login" data-acc>Đăng nhập</button>`;
      }
    }
  
    function moLaSo(id) {
      bamTab('laso');                                      // sang Xem lá số trước, rồi mới mở (có thể hỏi lưu thay đổi)
      if (typeof window.CLOUD_open === 'function') window.CLOUD_open(id);
    }
  
    // ═════════ Hôm nay, giờ thật ═════════
    function capNhatHomNay() {
      info = homNay();
      const a = info.am;
      const ngayAm = a.d <= 10 ? 'Mùng ' + a.d : String(a.d);
      todayEl.innerHTML = `
        <div class="home-today-date">${info.dd}/${info.mm}/${info.yy} · ${ngayAm} tháng ${THANG_TEN[a.m]}${a.leap ? ' (nhuận)' : ''} năm ${info.nam.vn}</div>
        <div class="home-today-cc">
          <span><i>Năm</i>${info.nam.vn}<b>${info.nam.han}</b></span>
          <span><i>Tháng</i>${info.thang.vn}<b>${info.thang.han}</b></span>
          <span><i>Ngày</i>${info.ngay.vn}<b>${info.ngay.han}</b></span>
          <span><i>Giờ</i>${info.gio.vn}<b>${info.gio.han}</b></span>
        </div>`;
        chiCu = info.chiThang;                                 // hiện ngay, không chờ vòng chi được vẽ
        chiEl.innerHTML = `Tháng ${THANG_TEN[a.m]} âm lịch · Đẩu bính chỉ <b>${CHI[info.chiThang]}</b>`;
        mauTroi();
    }
  
    // Màu trời theo giờ máy: đêm sâu, hửng sáng tím hồng, ngày xanh lam huyền ảo, hoàng hôn cam tím
    function mauTroi() {
      const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
      const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      const day = ss(5.5, 7.5, h) * (1 - ss(17, 19, h));
      const bump = (c, w) => Math.max(0, 1 - Math.abs(h - c) / w);
      const dawn = bump(5.8, 1.4), dusk = bump(18, 1.4);
      const mix = (n, m, t) => n.map((v, i) => Math.round(v + (m[i] - v) * t));
      const rgb = a => `rgb(${a.join(',')})`;
      root.style.setProperty('--home-c1', rgb(mix([22, 32, 74], [44, 66, 128], day)));
      root.style.setProperty('--home-c2', rgb(mix([11, 16, 48], [24, 38, 92], day)));
      root.style.setProperty('--home-c3', rgb(mix([5, 7, 26], [12, 20, 58], day)));
      const hz = dawn >= dusk ? [255, 140, 175] : [255, 140, 80];
      root.style.setProperty('--home-hz', `rgba(${hz.join(',')},${(0.35 * Math.max(dawn, dusk)).toFixed(3)})`);
      sang = 1 - 0.45 * day;                                 // ban ngày sao mờ bớt
    }
  
    // ═════════ Kích thước, ảnh dựng sẵn ═════════
    function resize() {
      const r = root.getBoundingClientRect(), mob = isMob();
      dpr = Math.min(window.devicePixelRatio || 1, mob ? 1.25 : 1.5);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
      if (mob) {                                         // mobile: bầu trời ở nửa trên, chữ ở nửa dưới
        cx = W * 0.5; cy = H * 0.29;
        R = Math.min(W * 0.41, H * 0.22);
        chiEl.style.top = (cy + R + 6) + 'px';
      } else {
        cx = W * 0.64; cy = H * 0.5;                     // tâm quay (Bắc Thần)
        R = Math.min(W * 0.42, H * 0.44);                // bán kính vòng 12 chi
        chiEl.style.top = '';
      }
      const xa = Math.max(...BAC_DAU.map(s => Math.hypot(s.x - BAC_THAN.x, s.y - BAC_THAN.y)));
      scale = (R * 0.9) / xa;
      rMax = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 20;
  
      const n = Math.round((W * H) / (lowPower || mob ? 5200 : 2600));
      nen = Array.from({ length: n }, () => {
        const big = Math.random() < 0.06;
        const o = big ? 0.65 + Math.random() * 0.35 : 0.2 + Math.random() * 0.5;
        return {
          r: Math.sqrt(Math.random()) * rMax, a: Math.random() * PI * 2,
          s: big ? 1.1 + Math.random() * 0.8 : 0.35 + Math.random() * 0.7, o,
          f: 0.4 + Math.random() * 1.6, p: Math.random() * 6.28, z: 0.25 + Math.random() * 0.75,
          trail: !lowPower && !mob && o > 0.55 && Math.random() < 0.3,
          hue: Math.random() < 0.15 ? 'rgb(255,226,190)' : Math.random() < 0.3 ? 'rgb(190,210,255)' : '#fff',
        };
      });
      glow = makeGlow();
      ngan = null;                 // tắt Ngân Hà (bật lại: ngan = makeNganHa();)
    }
  
    function makeGlow() {
      const s = 128, c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d'), m = s / 2;
      const rg = g.createRadialGradient(m, m, 0, m, m, m);
      rg.addColorStop(0, 'rgba(255,255,255,1)');
      rg.addColorStop(0.08, 'rgba(235,245,255,0.95)');
      rg.addColorStop(0.22, 'rgba(150,200,255,0.45)');
      rg.addColorStop(0.5, 'rgba(90,140,255,0.12)');
      rg.addColorStop(1, 'rgba(60,90,200,0)');
      g.fillStyle = rg; g.fillRect(0, 0, s, s);
      return c;
    }
  
    // Ngân Hà: dải sáng dựng sẵn ở nửa độ phân giải, mỗi khung hình chỉ xoay và vẽ lại
    function makeNganHa() {
      const S = Math.ceil(rMax), c = document.createElement('canvas');   // S px ↔ 2·rMax px CSS
      c.width = c.height = S;
      const g = c.getContext('2d'), m = S / 2;
      const phi = 0.62, ux = Math.cos(phi), uy = Math.sin(phi), nx = -uy, ny = ux;
      const off = R * 0.34 / 2, w = R * 0.2 / 2;
      const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += Math.random(); return (s - 2) / 2; };
      // quầng mờ
      for (let i = -6; i <= 6; i++) {
        const t = i * S / 12, x = m + ux * t + nx * off, y = m + uy * t + ny * off;
        const rg = g.createRadialGradient(x, y, 0, x, y, w * 2.4);
        const col = i % 3 === 0 ? '170,140,230' : i % 3 === 1 ? '120,160,240' : '220,170,210';
        rg.addColorStop(0, `rgba(${col},0.17)`); rg.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = rg; g.fillRect(x - w * 2.4, y - w * 2.4, w * 4.8, w * 4.8);
      }
      // bụi sao: hai thùy, giữa có vệt tối (rãnh bụi)
      const N = lowPower ? 2500 : 6000;
      for (let i = 0; i < N; i++) {
        const t = (Math.random() - 0.5) * S * 1.1;
        const side = Math.random() < 0.5 ? -1 : 1;
        const d = side * (0.35 + Math.abs(gauss())) * w;
        const x = m + ux * t + nx * (off + d), y = m + uy * t + ny * (off + d);
        g.globalAlpha = 0.07 + Math.random() * 0.33;
        g.fillStyle = Math.random() < 0.2 ? '#ffe9d0' : '#e6ecff';
        g.beginPath(); g.arc(x, y, 0.15 + Math.random() * 0.35, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
      return c;
    }
  
    // ═════════ Góc quay ═════════
    const gocTroi = now => -((now - t0) / 1000) * (PI * 2 / VONG_QUAY) * (reduce ? 0.15 : 1);
    const gocChi = i => PI / 2 - i * (PI / 6);          // Tý ở dưới, đi ngược kim đồng hồ
    const ease = t => 1 - Math.pow(1 - t, 3);
    const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const clamp01 = x => Math.min(1, Math.max(0, x));
  
    // Bắc Đẩu: cán gáo (Dao Quang) chỉ vào chi của tháng âm hiện tại, đung đưa nhẹ
    function gocBacDau(now) {
      const dq = BAC_DAU[6];
      const theta0 = Math.atan2(dq.y - BAC_THAN.y, dq.x - BAC_THAN.x);
      const aT = gocChi(info.chiThang) - theta0;
      if (reduce) return aT;
      const sway = SWAY * Math.sin((now - t0) * 2 * PI / SWAY_MS);
      if (introDone) return aT + sway;
      const k = clamp01((now - introAt) / INTRO_MS);
      return aT + sway + PI * 1.8 * (1 - ease(k));     // xoay nhanh rồi chậm dần, dừng đúng hướng tháng
    }
  
    function toScreen(p, a) {
      const dx = (p.x - BAC_THAN.x) * scale, dy = (p.y - BAC_THAN.y) * scale;
      const c = Math.cos(a), s = Math.sin(a);
      return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
    }
  
    // Mức sáng từng phần trong hiệu ứng mở trang
    const IN_SAO = i => 300 + (i + 1) * 380;           // i = -1: Bắc Thần
    function lit(i, now) { return introDone ? 1 : clamp01((now - introAt - IN_SAO(i)) / 500); }
    function lineK(i, j, now) { return introDone ? 1 : clamp01((now - introAt - IN_SAO(Math.max(i, j)) - 250) / 450); }
  
    // ═════════ Vẽ ═════════
    function veSaoSang(x, y, size, alpha, spike) {
      if (alpha <= 0) return;
      const d = size * 9;
      ctx.globalAlpha = alpha;
      ctx.drawImage(glow, x - d / 2, y - d / 2, d, d);
      if (spike) {
        const L = size * spike;
        ctx.lineWidth = 0.9;
        [[L, 0], [0, L]].forEach(([dx, dy]) => {
          const g = ctx.createLinearGradient(x - dx, y - dy, x + dx, y + dy);
          g.addColorStop(0, 'rgba(220,235,255,0)');
          g.addColorStop(0.5, 'rgba(235,245,255,0.75)');
          g.addColorStop(1, 'rgba(220,235,255,0)');
          ctx.strokeStyle = g;
          ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke();
        });
      }
      ctx.globalAlpha = 1;
    }
  
    function nhan(txt, x, y, o) {
      if (o <= 0 || W < 600) return;                        // màn hẹp: bỏ tên sao cho đỡ rối (chạm vào sao để xem)
      ctx.globalAlpha = o;
      ctx.font = '11px ' + FONT_VN;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#d8e4ff';
      ctx.fillText(txt, x, y);
      ctx.globalAlpha = 1;
    }
  
    function frame(now) {
      if (!running) return;
      if (now - lastVe < 1000 / FPS - 2) { raf = requestAnimationFrame(frame); return; }
      lastVe = now;
      if (!introDone && now - introAt > INTRO_MS) { introDone = true; }
      if (!introDone && now - introAt > 2600) root.classList.remove('home-intro');
      doHieuNang(now);
  
      const t = now / 1000, aSky = gocTroi(now), aBD = gocBacDau(now);
      px += (mx - px) * 0.05; py += (my - py) * 0.05;     // parallax mượt
      hits = [];
      ctx.clearRect(0, 0, W, H);
  
      // Ngân Hà
      if (ngan) {
        ctx.save();
        ctx.globalAlpha = 0.9 * sang;
        ctx.translate(cx + px * 6, cy + py * 6); ctx.rotate(aSky);
        ctx.drawImage(ngan, -rMax, -rMax, rMax * 2, rMax * 2);
        ctx.restore();
      }
  
      // Sao nền + vệt sao quanh Bắc Thần
      const TRAIL = 0.22;
      for (const s of nen) {
        const ox = px * 14 * s.z, oy = py * 14 * s.z, ang = s.a + aSky;
        const x = cx + ox + s.r * Math.cos(ang), y = cy + oy + s.r * Math.sin(ang);
        if (s.trail) {
          ctx.lineWidth = s.s * 0.9;
          for (let k = 0; k < 3; k++) {
            ctx.globalAlpha = s.o * sang * 0.10 * (1 - k / 3);
            ctx.strokeStyle = s.hue;
            ctx.beginPath();
            ctx.arc(cx + ox, cy + oy, s.r, ang + (TRAIL * k) / 3, ang + (TRAIL * (k + 1)) / 3);
            ctx.stroke();
          }
        }
        if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
        ctx.globalAlpha = s.o * sang * (0.6 + 0.4 * Math.sin(t * s.f + s.p));
        ctx.fillStyle = s.hue;
        ctx.beginPath(); ctx.arc(x, y, s.s, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
  
      const kLeave = leave ? clamp01((now - leave.t) / leave.ms) : 0;
      const ringA = (introDone ? 1 : clamp01((now - introAt - 2400) / 1500)) * (1 - kLeave);
      veVongChi(aBD, t, ringA);
  
      // Bắc Thần
      const lb = lit(-1, now);
      const hBT = hover?.info === BAC_THAN_INFO;
      veSaoSang(cx, cy, (3.4 + 0.3 * Math.sin(t * 1.3)) * (hBT ? 1.5 : 1), 0.95 * lb, 4.5);
      nhan('Bắc Thần', cx + 12, cy - 10, 0.6 * lb);
      hits.push({ x: cx, y: cy, info: BAC_THAN_INFO });
  
      // Bắc Đẩu
      let P = BAC_DAU.map(s => toScreen(s, aBD));
      if (leave && leave.p === 'laso') {                    // bay về khung 12 cung
        const F = khung12();
        const k = easeIO(clamp01(kLeave / 0.6));
        P = P.map((p, i) => ({ x: p.x + (F.o[i].x - p.x) * k, y: p.y + (F.o[i].y - p.y) * k }));
        veKhung12(F, clamp01((kLeave - 0.2) / 0.4));
        if (kLeave >= 0.55) root.classList.add('home-leaving');
      }
  
      ctx.save();                                            // đường chỉ cực
      ctx.setLineDash([3, 7]);
      ctx.strokeStyle = `rgba(200,220,255,${0.16 * lit(1, now) * (1 - kLeave)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(P[1].x, P[1].y); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.restore();
  
      ctx.save();
      ctx.beginPath();
      BD_NOI.forEach(([i, j]) => {
        const k = lineK(i, j, now);
        if (k <= 0) return;
        ctx.moveTo(P[i].x, P[i].y);
        ctx.lineTo(P[i].x + (P[j].x - P[i].x) * k, P[i].y + (P[j].y - P[i].y) * k);
      });
      ctx.strokeStyle = 'rgba(140,190,255,0.18)'; ctx.lineWidth = 5; ctx.stroke();     // quầng sáng giả, thay shadowBlur
      ctx.strokeStyle = 'rgba(205,225,255,0.55)'; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.restore();
  
      P.forEach((p, i) => {
        const s = BAC_DAU[i], on = hover?.info === s;
        const pulse = 0.88 + 0.12 * Math.sin(t * (1.1 + i * 0.17) + i);
        const l = lit(i, now);
        veSaoSang(p.x, p.y, (4.4 * s.m * pulse + 1.6) * (on ? 1.5 : 1) * (0.6 + 0.4 * l), l, 4.5);
        nhan(s.ten, p.x + 10, p.y + (i % 2 ? -10 : 18), 0.55 * l * (1 - kLeave));
        hits.push({ x: p.x, y: p.y, info: s });
      });
  
      veSaoBang(now);
      raf = requestAnimationFrame(frame);
  
      if (leave && kLeave >= 1) {
        const p = leave.p; leave = null;
        bamTab(p);
      }
      if (++tick % 3600 === 0) capNhatHomNay();               // ~1 phút cập nhật giờ, màu trời
    }
  
    // Vòng 12 địa chi; cán gáo chỉ vào chi nào thì chi đó sáng lên
    function veVongChi(a, t, alpha) {
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(230,200,130,0.10)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
      const vt = R < 150 ? 20 : 26;                         // bề rộng vành chữ (mobile hẹp hơn)
      ctx.beginPath(); ctx.arc(cx, cy, R - vt, 0, 6.283); ctx.stroke();
  
      const dq = toScreen(BAC_DAU[6], a);
      const gocCan = Math.atan2(dq.y - cy, dq.x - cx);
      let chiChi = 0, best = 9;
      for (let i = 0; i < 12; i++) {
        const d = Math.abs(Math.atan2(Math.sin(gocCan - gocChi(i)), Math.cos(gocCan - gocChi(i))));
        if (d < best) { best = d; chiChi = i; }
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < 12; i++) {
        const g = gocChi(i), on = i === chiChi;
        const x = cx + (R - vt / 2) * Math.cos(g), y = cy + (R - vt / 2) * Math.sin(g);
        ctx.font = (on ? 'bold ' + (R < 150 ? 14 : 17) + 'px ' : (R < 150 ? 12 : 15) + 'px ') + FONT_HAN;
        ctx.fillStyle = on ? `rgba(255,214,130,${0.85 + 0.15 * Math.sin(t * 2)})` : 'rgba(230,200,140,0.28)';
        if (on) { ctx.shadowColor = 'rgba(255,190,90,0.9)'; ctx.shadowBlur = 14; } else ctx.shadowBlur = 0;
        ctx.fillText(CHI_HAN[i], x, y);
        const gv = g + PI / 12;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(230,200,130,0.10)';
        ctx.beginPath();
        ctx.moveTo(cx + (R - vt) * Math.cos(gv), cy + (R - vt) * Math.sin(gv));
        ctx.lineTo(cx + R * Math.cos(gv), cy + R * Math.sin(gv));
        ctx.stroke();
      }
      const ex = cx + (R - vt - 2) * Math.cos(gocCan), ey = cy + (R - vt - 2) * Math.sin(gocCan);
      const lg = ctx.createLinearGradient(dq.x, dq.y, ex, ey);
      lg.addColorStop(0, 'rgba(255,214,130,0.35)'); lg.addColorStop(1, 'rgba(255,214,130,0)');
      ctx.strokeStyle = lg;
      ctx.beginPath(); ctx.moveTo(dq.x, dq.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.restore();
  
      if (chiChi !== chiCu) {
        chiCu = chiChi;
        const dung = chiChi === info.chiThang;
        chiEl.innerHTML = dung
          ? `Tháng ${THANG_TEN[info.am.m]} âm lịch · Đẩu bính chỉ <b>${CHI[chiChi]}</b>`
          : `Đẩu bính chỉ <b>${CHI[chiChi]}</b>`;
      }
    }
  
    // Khung lá số 12 cung (4×4) để thất tinh bay về khi bấm "Lập lá số"
    function khung12() {
      const S = Math.min(R * 1.5, H * 0.8), c = S / 4, x0 = cx - S / 2, y0 = cy - S / 2;
      const cell = (col, row) => ({ x: x0 + c * (col + 0.5), y: y0 + c * (row + 0.5) });
      const vien = [cell(0, 0), cell(1, 0), cell(2, 0), cell(3, 0), cell(3, 1), cell(3, 2), cell(3, 3),
                    cell(2, 3), cell(1, 3), cell(0, 3), cell(0, 2), cell(0, 1)];
      return { S, c, x0, y0, o: [0, 2, 3, 5, 7, 9, 10].map(i => vien[i]) };
    }
    function veKhung12(F, k) {
      if (k <= 0) return;
      const { S, c, x0, y0 } = F;
      ctx.save();
      ctx.strokeStyle = `rgba(240,205,135,${0.7 * k})`; ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(255,200,110,0.8)'; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.rect(x0, y0, S, S);
      [c, 3 * c].forEach(d => {
        ctx.moveTo(x0 + d, y0); ctx.lineTo(x0 + d, y0 + S);
        ctx.moveTo(x0, y0 + d); ctx.lineTo(x0 + S, y0 + d);
      });
      ctx.moveTo(x0 + 2 * c, y0); ctx.lineTo(x0 + 2 * c, y0 + c);
      ctx.moveTo(x0 + 2 * c, y0 + 3 * c); ctx.lineTo(x0 + 2 * c, y0 + S);
      ctx.moveTo(x0, y0 + 2 * c); ctx.lineTo(x0 + c, y0 + 2 * c);
      ctx.moveTo(x0 + 3 * c, y0 + 2 * c); ctx.lineTo(x0 + S, y0 + 2 * c);
      ctx.stroke();
      ctx.restore();
    }
  
    function veSaoBang(now) {
      if (reduce || leave) return;
      if (!saoBang && now > nextBang) {
        const g0 = PI * (0.15 + Math.random() * 0.2);
        saoBang = { x: Math.random() * W * 0.8, y: Math.random() * H * 0.35, vx: Math.cos(g0), vy: Math.sin(g0),
                    t: now, dur: 900 + Math.random() * 500, len: 120 + Math.random() * 100 };
      }
      if (!saoBang) return;
      const k = (now - saoBang.t) / saoBang.dur;
      if (k >= 1) { saoBang = null; nextBang = now + 5000 + Math.random() * 7000; return; }
      const d = k * 520, x = saoBang.x + saoBang.vx * d, y = saoBang.y + saoBang.vy * d;
      const tx = x - saoBang.vx * saoBang.len, ty = y - saoBang.vy * saoBang.len;
      const g = ctx.createLinearGradient(x, y, tx, ty), o = Math.sin(k * PI);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * o})`); g.addColorStop(1, 'rgba(160,200,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
    }
  
    // ═════════ Rê chuột lên sao ═════════
    function timHover(x, y, ban = 18) {
      let best = null, bd = ban;
      for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } }
      hover = best;
      if (!best) { tipEl.hidden = true; root.style.cursor = ''; return; }
      const i = best.info;
      tipEl.innerHTML = `<div class="home-tip-name">${i.ten} <span>${i.han}</span></div>
        <div class="home-tip-quan">${i.quan}</div><div class="home-tip-y">${i.y_}</div>`;
      tipEl.hidden = false;
      const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
      tipEl.style.left = Math.min(W - tw - 8, best.x + 16) + 'px';
      tipEl.style.top = Math.max(8, Math.min(H - th - 8, best.y - th - 12)) + 'px';
    }
  
    // ═════════ Máy yếu: giảm tải ═════════
    function doHieuNang(now) {
      if (lowPower || !introDone || perf.n > 120) { perf.last = now; return; }
      if (perf.last) { perf.sum += now - perf.last; perf.n++; }
      perf.last = now;
      if (perf.n === 120 && perf.sum / perf.n > (1000 / FPS) * 1.4) {   // không giữ nổi 30 fps
        lowPower = true;
        resize();
      }
    }
  
    // ═════════ Bật / tắt ═════════
    function sync() {
      const b = document.body.classList;
      const on = (isMob() ? b.contains('m-page-home') : b.contains('mb-page-home')) && !document.hidden;
      if (on && !running) {
        running = true;
        root.classList.remove('home-leaving');
        leave = null;
        capNhatHomNay();
        resize();
        veRecent();
        veUser();
        if (!introAt) introAt = performance.now();             // hiệu ứng mở trang: chỉ lần đầu
        nextBang = performance.now() + 2500;
        perf = { n: 0, sum: 0, last: 0 };
        raf = requestAnimationFrame(frame);
      } else if (!on && running) {
        running = false;
        cancelAnimationFrame(raf);
        hover = null; tipEl.hidden = true;
      }
    }
  
    function init() {
      build();
      sync();
      new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-layout'] });
      let rzT = 0;
      new ResizeObserver(() => {                                       // đo lại mỗi khi vùng Trang chủ đổi cỡ
        if (!running) return;
        clearTimeout(rzT); rzT = setTimeout(resize, 60);
      }).observe(root);
      document.addEventListener('visibilitychange', sync);
      document.addEventListener('cloud-opened', e => ghiRecent(e.detail?.id));
      document.addEventListener('cloud-list', () => { if (running) veRecent(); });
      document.addEventListener('cloud-auth', () => { veUser(); if (running) veRecent(); });   // đăng nhập / đăng xuất
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  
    window.HOME_amLich = solar2Lunar;     // tiện kiểm tra trong Console
  })();