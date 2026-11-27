// src/js/features/home-page.js – Trang chủ (desktop): bầu trời đêm, Bắc Đẩu thất tinh xoay quanh Bắc Thần.
// Hiện khi body có class "mb-page-home" (menubar.js bật/tắt). Ẩn thì dừng vẽ để không tốn CPU.
(function () {
    'use strict';
  
    // ── Thất tinh (toạ độ tương đối, lấy theo hình mẫu) ─────────────
    const THAT_TINH = [
      { ten: 'Thiên Xu',    x: 697, y: 150, m: 1.00 },   // α – đầu gáo, sao chỉ cực
      { ten: 'Thiên Tuyền', x: 668, y: 303, m: 0.90 },   // β
      { ten: 'Thiên Cơ',    x: 476, y: 318, m: 0.85 },   // γ
      { ten: 'Thiên Quyền', x: 437, y: 195, m: 0.65 },   // δ – mờ nhất trong bảy sao
      { ten: 'Ngọc Hành',   x: 316, y: 133, m: 1.00 },   // ε
      { ten: 'Khai Dương',  x: 217, y:  83, m: 0.90 },   // ζ
      { ten: 'Dao Quang',   x:  68, y: 118, m: 0.95 },   // η – cuối cán (đẩu bính)
    ];
    const DUONG_NOI = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];
    // Bắc Thần (sao Bắc Cực): kéo dài Thiên Tuyền → Thiên Xu (rút ngắn so với thực tế để Bắc Đẩu to, rõ)
    const BAC_THAN = { x: 697 + 2.2 * 29, y: 150 - 2.2 * 153 };
    const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tị', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    const CHI_HAN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  
    const VONG_QUAY = 240;            // giây cho 1 vòng
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  
    let root, cv, ctx, chiEl, W = 0, H = 0, dpr = 1, raf = 0, running = false;
    let cx = 0, cy = 0, R = 0, scale = 1, nen = [], sprite = null, saoBang = null, nextBang = 0, chiCu = -1;
    const t0 = performance.now() - Math.random() * VONG_QUAY * 1000;
  
    // ── Dựng DOM ──────────────────────────────────────────────────
    function build() {
      root = document.createElement('section');
      root.id = 'homePage';
      root.className = 'home-page';
      root.setAttribute('aria-label', 'Trang chủ');
      root.innerHTML = `
        <div class="home-nebula"></div>
        <canvas class="home-sky"></canvas>
        <div class="home-hero">
          <div class="home-kicker">紫 微 斗 數</div>
          <h1 class="home-title">Vận mệnh</h1>
          <div class="home-sub">Tử Vi Đẩu Số</div>
          <p class="home-quote">Bắc Đẩu xoay vần · Thất tinh chiếu mệnh</p>
          <div class="home-cta">
            <button type="button" class="home-btn home-btn-main" data-go="laso">Lập lá số</button>
            <button type="button" class="home-btn" data-go="search">Tìm lá số</button>
          </div>
        </div>
        <div class="home-chi" aria-live="off"></div>`;
      document.body.appendChild(root);
      cv = root.querySelector('.home-sky');
      ctx = cv.getContext('2d');
      chiEl = root.querySelector('.home-chi');
  
      // Nút → bấm đúng tab trên menubar, để menubar.js lo chuyển trang và giữ trạng thái
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-go]');
        if (b) document.querySelector(`#menuBar [data-page="${b.dataset.go}"]`)?.click();
      });
    }
  
    // ── Kích thước, sprite ánh sáng, nền sao ──────────────────────
    function resize() {
      const r = root.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
      cx = W * 0.64; cy = H * 0.5;                       // tâm quay (Bắc Thần)
      R = Math.min(W * 0.42, H * 0.44);                  // bán kính vòng 12 chi
      const xa = Math.max(...THAT_TINH.map(s => Math.hypot(s.x - BAC_THAN.x, s.y - BAC_THAN.y)));
      scale = (R * 0.9) / xa;
  
      // Nền sao: phủ kín màn hình ở mọi góc quay
      const rMax = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
      const n = Math.round((W * H) / 2600);
      nen = Array.from({ length: n }, () => {
        const big = Math.random() < 0.06;
        return {
          r: Math.sqrt(Math.random()) * rMax, a: Math.random() * Math.PI * 2,
          s: big ? 1.1 + Math.random() * 0.8 : 0.35 + Math.random() * 0.7,
          o: big ? 0.65 + Math.random() * 0.35 : 0.2 + Math.random() * 0.5,
          f: 0.4 + Math.random() * 1.6, p: Math.random() * 6.28,
          hue: Math.random() < 0.15 ? 'rgb(255,226,190)' : Math.random() < 0.3 ? 'rgb(190,210,255)' : '#fff',
        };
      });
      sprite = makeGlow();
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
  
    // ── Vẽ ────────────────────────────────────────────────────────
    const goc = now => -((now - t0) / 1000) * (Math.PI * 2 / VONG_QUAY) * (reduce ? 0.15 : 1);   // ngược kim đồng hồ
  
    function toScreen(p, a) {
      const dx = (p.x - BAC_THAN.x) * scale, dy = (p.y - BAC_THAN.y) * scale;
      const c = Math.cos(a), s = Math.sin(a);
      return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
    }
  
    function veSaoSang(x, y, size, alpha, spike) {
      const d = size * 9;
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, x - d / 2, y - d / 2, d, d);
      if (spike) {                                          // tia chữ thập
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
  
    function frame(now) {
      if (!running) return;
      const t = now / 1000, a = goc(now);
      ctx.clearRect(0, 0, W, H);
  
      // Nền sao xoay quanh Bắc Thần, lấp lánh
      for (const s of nen) {
        const x = cx + s.r * Math.cos(s.a + a), y = cy + s.r * Math.sin(s.a + a);
        if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
        ctx.globalAlpha = s.o * (0.6 + 0.4 * Math.sin(t * s.f + s.p));
        ctx.fillStyle = s.hue;
        ctx.beginPath(); ctx.arc(x, y, s.s, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
  
      veVongChi(a, t);
  
      // Bắc Thần
      veSaoSang(cx, cy, 3.4 + 0.3 * Math.sin(t * 1.3), 0.95, 4.5);
      nhan('Bắc Thần', cx + 12, cy - 10, 0.6);
  
      // Thất tinh
      const P = THAT_TINH.map(s => toScreen(s, a));
      // Đường chỉ cực: Thiên Tuyền → Thiên Xu → Bắc Thần
      ctx.save();
      ctx.setLineDash([3, 7]);
      ctx.strokeStyle = 'rgba(200,220,255,0.16)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(P[1].x, P[1].y); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.restore();
  
      ctx.save();
      ctx.strokeStyle = 'rgba(205,225,255,0.55)'; ctx.lineWidth = 1.3;
      ctx.shadowColor = 'rgba(140,190,255,0.9)'; ctx.shadowBlur = 8;
      ctx.beginPath();
      DUONG_NOI.forEach(([i, j]) => { ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); });
      ctx.stroke();
      ctx.restore();
  
      P.forEach((p, i) => {
        const s = THAT_TINH[i];
        const pulse = 0.88 + 0.12 * Math.sin(t * (1.1 + i * 0.17) + i);
        veSaoSang(p.x, p.y, 4.4 * s.m * pulse + 1.6, 1, 4.5);
        nhan(s.ten, p.x + 10, p.y + (i % 2 ? -10 : 18), 0.55);         // so le trên/dưới cho khỏi đè chữ
      });
  
      veSaoBang(now);
      raf = requestAnimationFrame(frame);
    }
  
    function nhan(txt, x, y, o) {
      ctx.globalAlpha = o;
      ctx.font = '11px "Playfair Display", Georgia, serif';
      ctx.fillStyle = '#d8e4ff';
      ctx.fillText(txt, x, y);
      ctx.globalAlpha = 1;
    }
  
    // Vòng 12 địa chi quanh Bắc Thần; cán gáo (Dao Quang) chỉ vào chi nào thì chi đó sáng lên
    function veVongChi(a, t) {
      ctx.save();
      ctx.strokeStyle = 'rgba(230,200,130,0.10)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R - 26, 0, 6.283); ctx.stroke();
  
      const dq = toScreen(THAT_TINH[6], a);
      const gocCan = Math.atan2(dq.y - cy, dq.x - cx);
      // Tý ở dưới (90°), các chi tiếp theo đi ngược kim đồng hồ – cùng chiều quay của Bắc Đẩu
      const gocChi = i => Math.PI / 2 - i * (Math.PI / 6);
      let chiChi = 0, best = 9;
      for (let i = 0; i < 12; i++) {
        const d = Math.abs(Math.atan2(Math.sin(gocCan - gocChi(i)), Math.cos(gocCan - gocChi(i))));
        if (d < best) { best = d; chiChi = i; }
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < 12; i++) {
        const g = gocChi(i), on = i === chiChi;
        const x = cx + (R - 13) * Math.cos(g), y = cy + (R - 13) * Math.sin(g);
        ctx.font = (on ? 'bold 17px' : '15px') + ' "Noto Serif CJK SC", "Songti SC", "SimSun", serif';
        ctx.fillStyle = on ? `rgba(255,214,130,${0.85 + 0.15 * Math.sin(t * 2)})` : 'rgba(230,200,140,0.28)';
        if (on) { ctx.shadowColor = 'rgba(255,190,90,0.9)'; ctx.shadowBlur = 14; } else ctx.shadowBlur = 0;
        ctx.fillText(CHI_HAN[i], x, y);
        // vạch chia
        const gv = g + Math.PI / 12;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(230,200,130,0.10)';
        ctx.beginPath();
        ctx.moveTo(cx + (R - 26) * Math.cos(gv), cy + (R - 26) * Math.sin(gv));
        ctx.lineTo(cx + R * Math.cos(gv), cy + R * Math.sin(gv));
        ctx.stroke();
      }
      // tia cán gáo chỉ ra vòng chi
      const g = gradLine(dq.x, dq.y, cx + (R - 28) * Math.cos(gocCan), cy + (R - 28) * Math.sin(gocCan));
      ctx.strokeStyle = g; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(dq.x, dq.y);
      ctx.lineTo(cx + (R - 28) * Math.cos(gocCan), cy + (R - 28) * Math.sin(gocCan)); ctx.stroke();
      ctx.restore();
  
      if (chiChi !== chiCu) {
        chiCu = chiChi;
        chiEl.innerHTML = `Đẩu bính chỉ <b>${CHI[chiChi]}</b>`;
      }
    }
  
    function gradLine(x1, y1, x2, y2) {
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, 'rgba(255,214,130,0.35)');
      g.addColorStop(1, 'rgba(255,214,130,0)');
      return g;
    }
  
    // Sao băng thỉnh thoảng vụt qua
    function veSaoBang(now) {
      if (reduce) return;
      if (!saoBang && now > nextBang) {
        const goc0 = Math.PI * (0.15 + Math.random() * 0.2);
        saoBang = { x: Math.random() * W * 0.8, y: Math.random() * H * 0.35, vx: Math.cos(goc0), vy: Math.sin(goc0),
                    t: now, dur: 900 + Math.random() * 500, len: 120 + Math.random() * 100 };
      }
      if (!saoBang) return;
      const k = (now - saoBang.t) / saoBang.dur;
      if (k >= 1) { saoBang = null; nextBang = now + 5000 + Math.random() * 7000; return; }
      const d = k * 520, x = saoBang.x + saoBang.vx * d, y = saoBang.y + saoBang.vy * d;
      const tx = x - saoBang.vx * saoBang.len, ty = y - saoBang.vy * saoBang.len;
      const g = ctx.createLinearGradient(x, y, tx, ty);
      const o = Math.sin(k * Math.PI);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * o})`);
      g.addColorStop(1, 'rgba(160,200,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
    }
  
    // ── Bật / tắt theo class của body ─────────────────────────────
    function sync() {
      const on = document.body.classList.contains('mb-page-home');
      if (on && !running) {
        running = true;
        resize();
        nextBang = performance.now() + 2500;
        raf = requestAnimationFrame(frame);
      } else if (!on && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }
  
    function init() {
      build();
      sync();
      new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
      window.addEventListener('resize', () => { if (running) resize(); });
      document.addEventListener('visibilitychange', () => {        // tab trình duyệt bị ẩn → dừng vẽ
        if (document.hidden && running) { running = false; cancelAnimationFrame(raf); }
        else if (!document.hidden) sync();
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();