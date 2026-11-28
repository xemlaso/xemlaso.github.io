// src/js/features/laso-3d.js – Xem lá số 3D (desktop)
// Đọc lá số đang mở (_lastJson), dựng 12 cung thành la bàn tròn / bàn vuông 4×4 bằng Three.js.
// Chỉ ĐỌC dữ liệu, không sửa lá số 2D. Hiện khi body có class "mb-page-p3d" (menubar.js bật/tắt).
(function () {
    'use strict';
  
    const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
  
    const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tị', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
    const HANH = { kim: '#d9dde6', moc: '#7fdc8e', thuy: '#8cbcff', hoa: '#ff8f78', tho: '#f2c86e' };
    const HOA = [
      { ten: 'Lộc', c: '#4fd18b' }, { ten: 'Quyền', c: '#ff6b5a' },
      { ten: 'Khoa', c: '#c890ff' }, { ten: 'Kỵ', c: '#b9bdd0' },
    ];
    const NGUON = { sn: 'Sinh niên', dv: 'Đại vận', ln: 'Lưu niên' };
    // Bàn vuông: vị trí (cột, hàng) như lá số giấy
    const GRID = { 5: [0, 0], 6: [1, 0], 7: [2, 0], 8: [3, 0], 4: [0, 1], 9: [3, 1],
                   3: [0, 2], 10: [3, 2], 2: [0, 3], 1: [1, 3], 0: [2, 3], 11: [3, 3] };
    const UU_TIEN = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kị', 'Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Thiên Hình'];
    const CUOI = ['Thiên La', 'Địa Võng'];
    const BO_QUA = new Set(['Triệt', 'Tuần']);
  
    const R_TRON = 9.6, CELL = 4.3, PLAQ = 4.0;           // kích thước (đơn vị 3D)
    const FONT_VN = '"Playfair Display", Georgia, serif';
    const FONT_UI = 'Arial, "Helvetica Neue", sans-serif';
  
    let T = null, loading = null;
    let root, host, msgEl, detailEl, yearEl, renderer, scene, camera, raf = 0, running = false;
    let W = 1, H = 1, data = null, builtFrom = undefined;
    let plaques = [], decorTron = [], decorVuong = [], beams = [], links = null, markers = {}, sky = null, tiers = null;
    let layout = 0, layoutTo = 0;                         // 0 = tròn, 1 = vuông
    let selected = -1, hovered = -1, idleAt = 0, lastT = 0, beamsDirty = true;
    let opts = { sn: true, dv: false, ln: false }, namXem = new Date().getFullYear();
    const cam = { tx: 0, ty: 0, tz: 1.2, az: 0, el: 1.02, dist: 33 };
    let camAnim = null;
  
    // ═════════ DOM ═════════
    function build() {
      root = document.createElement('section');
      root.id = 'laso3dPage';
      root.className = 'l3d-page';
      root.setAttribute('aria-label', 'Lá số 3D');
      root.innerHTML = `
        <div class="l3d-bg"></div>
        <div class="l3d-canvas"></div>
        <div class="l3d-msg" hidden></div>
        <div class="l3d-bar">
          <div class="l3d-seg">
            <button type="button" data-layout="0" class="on">◯ La bàn</button>
            <button type="button" data-layout="1">▦ Bàn vuông</button>
          </div>
          <span class="l3d-sep"></span>
          <span class="l3d-lbl">Tứ hóa</span>
          <label class="l3d-chk"><input type="checkbox" data-opt="sn" checked><i style="--c:#f2d38a"></i>Sinh niên</label>
          <label class="l3d-chk"><input type="checkbox" data-opt="dv"><i style="--c:#8fd0ff"></i>Đại vận</label>
          <label class="l3d-chk"><input type="checkbox" data-opt="ln"><i style="--c:#ff9fd0"></i>Lưu niên</label>
          <span class="l3d-sep"></span>
          <div class="l3d-year" title="Năm xem (đại vận, lưu niên)">
            <button type="button" data-year="-1">◀</button><span></span><button type="button" data-year="1">▶</button>
          </div>
          <span class="l3d-sep"></span>
          <button type="button" class="l3d-btn" data-act="reset" title="Về góc nhìn ban đầu">⟲</button>
        </div>
        <div class="l3d-detail" hidden></div>
        <div class="l3d-hint">Kéo để xoay · Cuộn để phóng to · Bấm vào cung để xem chi tiết · Esc để quay lại</div>`;
      document.body.appendChild(root);
      host = root.querySelector('.l3d-canvas');
      msgEl = root.querySelector('.l3d-msg');
      detailEl = root.querySelector('.l3d-detail');
      yearEl = root.querySelector('.l3d-year span');
  
      root.querySelector('.l3d-bar').addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.layout) setLayout(+b.dataset.layout);
        else if (b.dataset.year) setYear(namXem + +b.dataset.year);
        else if (b.dataset.act === 'reset') { chonCung(-1); flyHome(); }
      });
      root.querySelector('.l3d-bar').addEventListener('change', e => {
        const k = e.target.dataset.opt;
        if (k) { opts[k] = e.target.checked; beamsDirty = true; }
      });
      detailEl.addEventListener('click', e => { if (e.target.closest('[data-close]')) chonCung(-1); });
      msgEl.addEventListener('click', e => { if (e.target.closest('[data-go]')) document.querySelector('#menuBar [data-page="laso"]')?.click(); });
      document.addEventListener('keydown', e => { if (running && e.key === 'Escape' && selected >= 0) chonCung(-1); });
    }
  
    function setLayout(v) {
      layoutTo = v;
      root.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('on', +b.dataset.layout === v));
      if (selected >= 0) setTimeout(() => flyToCung(selected), 50);
    }
  
    function setYear(y) {
      namXem = y;
      yearEl.textContent = `${y} · ${CAN[((y - 4) % 10 + 10) % 10]} ${CHI[((y - 4) % 12 + 12) % 12]}`;
      if (data) { tinhHan(); veDetail(); }
      beamsDirty = true;
    }
  
    // ═════════ Dữ liệu từ lá số đang mở ═════════
    const lastJson = () => (typeof _lastJson !== 'undefined' ? _lastJson : null);
    const TD = () => (typeof TUVI_DATA !== 'undefined' ? TUVI_DATA : window.TUVI_DATA) || {};
    const idxCan = v => typeof v === 'number' ? v : CAN.indexOf(String(v || '').trim());
    const rank = n => { const i = UU_TIEN.indexOf(n); return i < 0 ? UU_TIEN.length : i; };
    const xep = arr => arr.filter(s => !CUOI.includes(s.name)).sort((a, b) => rank(a.name) - rank(b.name))
      .concat(CUOI.map(n => arr.find(s => s.name === n)).filter(Boolean));
  
    function docDuLieu(j) {
      const meta = j.meta || {};
      const cung = Array.from({ length: 12 }, (_, i) => ({ i, chi: CHI[i], ten: '', sao: [] }));
      (j.cung || []).forEach(c => {
        const i = CHI.indexOf(c.diaChi);
        if (i < 0) return;
        const sao = (c.sao || []).filter(s => !BO_QUA.has(s.name));
        Object.assign(cung[i], {
          ten: c.cungChuc || '', daiVan: c.daiVan, truongSinh: c.truongSinh || '', isThan: !!c.isThan, sao,
          chinh: sao.filter(s => s.type === 'chinh'),
          cat: xep(sao.filter(s => s.type === 'cat' || s.type === 'trung')),
          hung: xep(sao.filter(s => s.type === 'hung')),
        });
      });
      const canNam = idxCan(meta.canNam);
      const bang = TD().BANG_THIENCAN_CUNGMENH?.[canNam];
      cung.forEach(c => { c.can = bang ? bang[c.i] : null; });
      const menh = cung.findIndex(c => c.ten === 'Mệnh');
      return {
        meta, cung, canNam, menh: menh >= 0 ? menh : CHI.indexOf(meta.chiCungMenh),
        hoTen: (j.hoTen || meta.hoTen || document.getElementById('hoTen')?.value || '').trim(),
        gioiTinh: document.getElementById('gt')?.value === 'nu' ? 'Nữ' : 'Nam',
        hoa: [],
      };
    }
  
    // Cung chứa một sao
    const cungCoSao = ten => data.cung.findIndex(c => c.sao.some(s => s.name === ten));
  
    // Tứ hóa sinh niên / đại vận / lưu niên + cung đại vận, lưu niên theo năm xem
    function tinhHan() {
      const d = data, TU_HOA = TD().TU_HOA || [];
      const tuoi = namXem - Number(d.meta.namAL) + 1;
      d.tuoi = tuoi;
      d.dv = d.cung.findIndex(c => c.daiVan != null && c.daiVan !== '' && tuoi >= +c.daiVan && tuoi <= +c.daiVan + 9);
      d.ln = ((namXem - 4) % 12 + 12) % 12;
      const hoa = [];
      const them = (src, can, from) => (TU_HOA[can] || []).forEach((ten, h) => {
        const to = cungCoSao(ten);
        if (to >= 0) hoa.push({ src, h, ten, to, from });
      });
      if (d.canNam >= 0 && TU_HOA[d.canNam]) them('sn', d.canNam, 'center');
      else ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kị'].forEach((n, h) => {      // dự phòng: theo sao Hóa trên lá số
        const to = cungCoSao(n); if (to >= 0) hoa.push({ src: 'sn', h, ten: '', to, from: 'center' });
      });
      if (d.dv >= 0 && d.cung[d.dv].can != null) them('dv', d.cung[d.dv].can, d.dv);
      them('ln', ((namXem - 4) % 10 + 10) % 10, 'ln');
      d.hoa = hoa;
    }
  
    // ═════════ Vẽ chữ lên canvas ═════════
    function canvasTex(w, h, draw) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new T.CanvasTexture(c);
      t.colorSpace = T.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    }
    function fitText(g, txt, maxW, font, size) {
      let s = size;
      do { g.font = font.replace('{s}', s); } while (g.measureText(txt).width > maxW && --s > 10);
    }
    const saoTxt = s => s.name + (s.sucManh ? ` (${s.sucManh})` : '');
    const saoMau = s => HANH[s.nguHanh] || '#e8e4d8';
    function hoaCua(i) { return data.hoa.filter(x => x.to === i && (opts[x.src])); }
  
    // Mặt một cung
    function plaqueTex(c) {
      const isMenh = c.i === data.menh;
      return canvasTex(768, 768, (g, w, h) => {
        const bg = g.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, 'rgba(22,30,70,0.94)'); bg.addColorStop(1, 'rgba(10,14,40,0.94)');
        g.fillStyle = bg; rr(g, 6, 6, w - 12, h - 12, 34); g.fill();
        g.lineWidth = isMenh ? 9 : 4;
        g.strokeStyle = isMenh ? '#f6cf7c' : 'rgba(240,205,135,0.55)';
        rr(g, 6, 6, w - 12, h - 12, 34); g.stroke();
  
        // Hàng đầu: can chi · tên cung · tuổi đại vận
        g.textBaseline = 'top';
        g.fillStyle = '#e8c477'; g.font = `600 44px ${FONT_UI}`; g.textAlign = 'left';
        g.fillText((c.can != null ? CAN[c.can] + ' ' : '') + c.chi, 34, 30);
        g.textAlign = 'right'; g.fillStyle = '#c7d2f5';
        if (c.daiVan != null && c.daiVan !== '') g.fillText(String(c.daiVan), w - 34, 30);
        g.textAlign = 'center';
        g.fillStyle = isMenh ? '#ffe2a0' : '#f4ead2';
        fitText(g, (c.ten || '').toUpperCase(), 420, `bold {s}px ${FONT_VN}`, 62);
        g.fillText((c.ten || '').toUpperCase(), w / 2, 88);
        if (c.isThan) {
          g.font = `bold 26px ${FONT_UI}`; g.fillStyle = '#1b1405';
          const tw = g.measureText('THÂN').width + 22;
          g.fillStyle = '#f2c86e'; rr(g, w / 2 - tw / 2, 160, tw, 36, 10); g.fill();
          g.fillStyle = '#1b1405'; g.fillText('THÂN', w / 2, 165);
        }
  
        // Chính tinh
        let y = c.isThan ? 210 : 178;
        if (!c.chinh?.length) {
          g.font = `italic 34px ${FONT_VN}`; g.fillStyle = 'rgba(220,220,235,0.55)';
          g.fillText('Vô chính diệu', w / 2, y + 10); y += 64;
        }
        (c.chinh || []).slice(0, 2).forEach(s => {
          g.fillStyle = saoMau(s);
          fitText(g, saoTxt(s).toUpperCase(), w - 70, `bold {s}px ${FONT_UI}`, 60);
          g.fillText(saoTxt(s).toUpperCase(), w / 2, y); y += 70;
        });
  
        // Cát (trái) · Hung (phải)
        y += 10;
        g.strokeStyle = 'rgba(240,205,135,0.25)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(w / 2, y); g.lineTo(w / 2, h - 96); g.stroke();
        const cot = (list, x, align) => {
          let yy = y;
          g.textAlign = align;
          for (const s of list) {
            if (yy > h - 130) { g.fillStyle = 'rgba(220,220,235,0.6)'; g.font = `28px ${FONT_UI}`; g.fillText('…', x, yy); break; }
            const bold = rank(s.name) < UU_TIEN.length;
            g.fillStyle = saoMau(s);
            fitText(g, saoTxt(s), w / 2 - 46, `${bold ? 'bold ' : ''}{s}px ${FONT_UI}`, 38);
            g.fillText(saoTxt(s), x, yy); yy += 44;
          }
        };
        cot(c.cat || [], 34, 'left');
        cot(c.hung || [], w - 34, 'right');
  
        // Chân: trường sinh
        g.textAlign = 'center'; g.fillStyle = 'rgba(200,210,240,0.75)'; g.font = `italic 36px ${FONT_VN}`;
        g.fillText(c.truongSinh || '', w / 2, h - 72);
      });
    }
    function rr(g, x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    }
  
    // Nhãn nổi (sprite) luôn quay về camera
    function nhanSprite(lines, opt = {}) {
      const pad = 18, fs = opt.size || 34;
      const tmp = document.createElement('canvas').getContext('2d');
      const fonts = lines.map((l, k) => (l.font || `${k === 0 ? 'bold ' : ''}${l.size || fs}px ${l.ff || FONT_UI}`));
      const ws = lines.map((l, k) => { tmp.font = fonts[k]; return tmp.measureText(l.t).width; });
      const hs = lines.map(l => (l.size || fs) * 1.3);
      const w = Math.ceil(Math.max(...ws) + pad * 2), h = Math.ceil(hs.reduce((a, b) => a + b, 0) + pad * 2);
      const tex = canvasTex(w, h, g => {
        if (opt.bg !== false) {
          g.fillStyle = opt.bg || 'rgba(10,14,40,0.78)'; rr(g, 1, 1, w - 2, h - 2, 14); g.fill();
          g.strokeStyle = opt.border || 'rgba(240,205,135,0.5)'; g.lineWidth = 2; rr(g, 1, 1, w - 2, h - 2, 14); g.stroke();
        }
        g.textAlign = 'center'; g.textBaseline = 'top';
        let y = pad;
        lines.forEach((l, k) => { g.font = fonts[k]; g.fillStyle = l.c || '#f4ead2'; g.fillText(l.t, w / 2, y); y += hs[k]; });
      });
      const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      const k = (opt.scale || 1) / 100;
      sp.scale.set(w * k, h * k, 1);
      return sp;
    }
  
    function glowTex() {
      return canvasTex(128, 128, (g, w) => {
        const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
        r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.2, 'rgba(255,240,210,0.6)');
        r.addColorStop(0.5, 'rgba(255,200,120,0.15)'); r.addColorStop(1, 'rgba(255,200,120,0)');
        g.fillStyle = r; g.fillRect(0, 0, w, w);
      });
    }
  
    // ═════════ Vị trí theo bố cục ═════════
    function posTron(i) { const a = i * Math.PI / 6; return { x: -Math.sin(a) * R_TRON, z: Math.cos(a) * R_TRON }; }
    function posVuong(i) { const [c, r] = GRID[i]; return { x: (c - 1.5) * CELL, z: (r - 1.5) * CELL }; }
    function posCung(i, m = layout) {
      const a = posTron(i), b = posVuong(i);
      return { x: a.x + (b.x - a.x) * m, z: a.z + (b.z - a.z) * m };
    }
    // Hướng ra ngoài của một cung (để đặt mốc ĐV, lưu niên)
    function huongRa(i, m = layout) {
      const a = posTron(i), b = posVuong(i);
      const ta = { x: a.x / R_TRON, z: a.z / R_TRON };
      const tb = Math.abs(b.x) > Math.abs(b.z) + 0.01 ? { x: Math.sign(b.x), z: 0 }
        : Math.abs(b.z) > Math.abs(b.x) + 0.01 ? { x: 0, z: Math.sign(b.z) } : { x: Math.sign(b.x) * 0.707, z: Math.sign(b.z) * 0.707 };
      return { x: ta.x + (tb.x - ta.x) * m, z: ta.z + (tb.z - ta.z) * m };
    }
  
    // ═════════ Dựng cảnh ═════════
    function initThree() {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = T.SRGBColorSpace;
      host.appendChild(renderer.domElement);
      camera = new T.PerspectiveCamera(42, 1, 0.1, 400);
      ganChuot(renderer.domElement);
    }
  
    function dispose(obj) {
      obj.traverse(o => {
        o.geometry?.dispose();
        const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        ms.forEach(m => { m.map?.dispose(); m.dispose(); });
      });
    }
  
    function dungCanh() {
      if (scene) dispose(scene);
      scene = new T.Scene();
      plaques = []; decorTron = []; decorVuong = []; beams = []; links = null; markers = {}; tiers = null;
  
      scene.add(new T.AmbientLight(0x8890c0, 0.9));
      const dl = new T.DirectionalLight(0xfff0d8, 1.1); dl.position.set(8, 20, 12); scene.add(dl);
      const pl = new T.PointLight(0xffd08a, 40, 30); pl.position.set(0, 3, 0); scene.add(pl);
  
      // Bầu sao
      const n = 1800, pos = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) {
        const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 90 + Math.random() * 40;
        const s = Math.sqrt(1 - u * u);
        pos[k * 3] = r * s * Math.cos(th); pos[k * 3 + 1] = r * u; pos[k * 3 + 2] = r * s * Math.sin(th);
      }
      const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(pos, 3));
      sky = new T.Points(sg, new T.PointsMaterial({ color: 0xdfe8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8 }));
      scene.add(sky);
  
      const gold = 0xe8c477;
      // ── Trang trí la bàn tròn ──
      const disk = new T.Mesh(new T.CylinderGeometry(12.2, 12.4, 0.4, 96),
        new T.MeshStandardMaterial({ color: 0x141b3d, metalness: 0.4, roughness: 0.55, transparent: true }));
      disk.position.y = -0.25; decorTron.push(disk);
      [[12.25, 0.06], [5.0, 0.04], [13.7, 0.035]].forEach(([r, t]) => {
        const m = new T.Mesh(new T.TorusGeometry(r, t, 8, 160), new T.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.8 }));
        m.rotation.x = Math.PI / 2; m.position.y = 0; decorTron.push(m);
      });
      for (let i = 0; i < 12; i++) {                                    // vạch chia 12 cung
        const a = (i + 0.5) * Math.PI / 6, g = new T.BufferGeometry().setFromPoints([
          new T.Vector3(-Math.sin(a) * 5.0, 0.01, Math.cos(a) * 5.0), new T.Vector3(-Math.sin(a) * 12.25, 0.01, Math.cos(a) * 12.25)]);
        decorTron.push(new T.Line(g, new T.LineBasicMaterial({ color: gold, transparent: true, opacity: 0.25 })));
      }
      // vòng tuổi đại vận
      data.cung.forEach(c => {
        if (c.daiVan == null || c.daiVan === '') return;
        const sp = nhanSprite([{ t: `${c.daiVan}–${+c.daiVan + 9}`, size: 26, c: '#c7d2f5' }], { bg: false, scale: 1.6 });
        const a = c.i * Math.PI / 6;
        sp.position.set(-Math.sin(a) * 13.0, 0.25, Math.cos(a) * 13.0);
        sp.userData.chi = c.i; sp.userData.dvTuoi = true;
        decorTron.push(sp);
      });
      const dvSeg = new T.Mesh(new T.RingGeometry(12.3, 13.65, 24, 1, 0, Math.PI / 6),
        new T.MeshBasicMaterial({ color: 0xf2c86e, transparent: true, opacity: 0.4, side: T.DoubleSide }));
      dvSeg.rotation.x = -Math.PI / 2; dvSeg.position.y = 0.02;
      markers.dvSeg = dvSeg; decorTron.push(dvSeg);
      decorTron.forEach(o => scene.add(o));
  
      // ── Trang trí bàn vuông ──
      const S = CELL * 4 + 0.6;
      const base = new T.Mesh(new T.BoxGeometry(S, 0.4, S), new T.MeshStandardMaterial({ color: 0x141b3d, metalness: 0.4, roughness: 0.55, transparent: true, opacity: 0 }));
      base.position.y = -0.25; decorVuong.push(base);
      const fr = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(S, 0.4, S)), new T.LineBasicMaterial({ color: gold, transparent: true, opacity: 0 }));
      fr.position.y = -0.25; decorVuong.push(fr);
      const inner = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(CELL * 2 - 0.3, CELL * 2 - 0.3)), new T.LineBasicMaterial({ color: gold, transparent: true, opacity: 0 }));
      inner.rotation.x = -Math.PI / 2; inner.position.y = 0.02; decorVuong.push(inner);
      decorVuong.forEach(o => { o.visible = false; scene.add(o); });
  
      // ── Thái cực ở giữa + thông tin ──
      const orb = new T.Mesh(new T.SphereGeometry(0.55, 32, 16), new T.MeshBasicMaterial({ color: 0xffe3a8 }));
      orb.position.y = 1.4; scene.add(orb);
      const gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      gl.scale.set(5, 5, 1); gl.position.copy(orb.position); scene.add(gl);
      markers.orb = orb; markers.orbGlow = gl;
      const m = data.meta, chiNam = ((+m.namAL - 4) % 12 + 12) % 12;
      const info = nhanSprite([
        { t: data.hoTen || 'Lá số', size: 40, ff: FONT_VN, c: '#ffe2a0' },
        { t: `${m.canNam || ''} ${CHI[chiNam] || ''} · ${data.gioiTinh}${m.thuanChieu === true ? ' · thuận' : m.thuanChieu === false ? ' · nghịch' : ''}`, size: 26, c: '#c7d2f5' },
        { t: `${m.tenCuc || ''}${data.menh >= 0 ? ' · Mệnh tại ' + CHI[data.menh] : ''}`, size: 26, c: '#e8c477' },
      ], { scale: 1.25, bg: 'rgba(10,14,40,0.55)' });
      info.position.set(0, 3.2, 0); scene.add(info);
  
      // ── 12 cung ──
      const edgeGeo = new T.EdgesGeometry(new T.BoxGeometry(PLAQ, 0.18, PLAQ));
      data.cung.forEach(c => {
        const grp = new T.Group();
        const slab = new T.Mesh(new T.BoxGeometry(PLAQ, 0.18, PLAQ),
          new T.MeshStandardMaterial({ color: 0x0e1433, metalness: 0.5, roughness: 0.5 }));
        slab.position.y = -0.09; grp.add(slab);
        const edge = new T.LineSegments(edgeGeo, new T.LineBasicMaterial({ color: c.i === data.menh ? 0xffd27a : 0xb8975a, transparent: true, opacity: 0.7 }));
        edge.position.y = -0.09; grp.add(edge);
        const face = new T.Mesh(new T.PlaneGeometry(PLAQ, PLAQ),
          new T.MeshBasicMaterial({ map: plaqueTex(c), transparent: true }));
        face.rotation.x = -Math.PI / 2; face.position.y = 0.005;
        face.userData.chi = c.i;
        grp.add(face);
        const p = posCung(c.i);
        grp.position.set(p.x, 0, p.z);
        grp.userData = { chi: c.i, h: 0, face, edge, slab, yaw: 0 };
        scene.add(grp);
        plaques[c.i] = grp;
      });
  
      // ── Mốc đại vận / lưu niên ──
      markers.dv = nhanSprite([{ t: 'ĐẠI VẬN', size: 24, c: '#1b1405' }], { bg: '#f2c86e', border: '#ffe2a0', scale: 1.5 });
      markers.ln = new T.Group();
      const lnOrb = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0xff9fd0, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      lnOrb.scale.set(2.2, 2.2, 1); markers.ln.add(lnOrb);
      markers.lnOrb = lnOrb;
      scene.add(markers.dv, markers.ln);
      capNhatMocLN();
  
      beamsDirty = true;
      resize();
    }
  
    function capNhatMocLN() {
      if (markers.lnLbl) { markers.ln.remove(markers.lnLbl); dispose(markers.lnLbl); }
      markers.lnLbl = nhanSprite([{ t: `L.MỆNH ${namXem}`, size: 22, c: '#ffd1ea' }], { bg: 'rgba(40,10,40,0.7)', border: '#ff9fd0', scale: 1.4 });
      markers.lnLbl.position.y = 0.9;
      markers.ln.add(markers.lnLbl);
    }
  
    // ═════════ Tia tứ hóa ═════════
    function diemNguon(b) {
      if (b.from === 'center') return new T.Vector3(0, 1.4, 0);
      const i = b.from === 'ln' ? data.ln : b.from;
      const p = posCung(i), o = huongRa(i);
      return new T.Vector3(p.x + o.x * 3.0, 0.6, p.z + o.z * 3.0);
    }
    function veTia() {
      beams.forEach(b => { scene.remove(b.grp); dispose(b.grp); });
      beams = [];
      if (!data) return;
      const ds = data.hoa.filter(b => opts[b.src]);
      const dem = {};
      ds.forEach(b => {
        const key = b.to; dem[key] = (dem[key] || 0) + 1;
        const p = posCung(b.to), k = dem[key] - 1;
        const end = new T.Vector3(p.x + (k % 2 ? 0.5 : -0.5) * Math.min(k, 2), 0.35, p.z + (k > 1 ? 0.5 : 0));
        const st = diemNguon(b);
        const mid = st.clone().lerp(end, 0.5); mid.y += 2.2 + st.distanceTo(end) * 0.18;
        const curve = new T.QuadraticBezierCurve3(st, mid, end);
        const col = new T.Color(HOA[b.h].c);
        const grp = new T.Group();
        const dash = b.src !== 'sn';
        const core = new T.Mesh(new T.TubeGeometry(curve, 48, dash ? 0.035 : 0.05, 6),
          new T.MeshBasicMaterial({ color: col, transparent: true, opacity: dash ? 0.7 : 0.95 }));
        const halo = new T.Mesh(new T.TubeGeometry(curve, 48, 0.16, 8),
          new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.13, blending: T.AdditiveBlending, depthWrite: false }));
        grp.add(core, halo);
        const spark = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: col, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
        spark.scale.set(0.9, 0.9, 1); grp.add(spark);
        const tag = (b.src === 'dv' ? 'ĐV.' : b.src === 'ln' ? 'L.' : '') + HOA[b.h].ten;
        const lbl = nhanSprite([{ t: tag + (b.ten ? ' · ' + b.ten : ''), size: 24, c: HOA[b.h].c }], { scale: 1.05, border: HOA[b.h].c });
        lbl.position.copy(end).add(new T.Vector3(0, 1.8 + k * 0.6, 0));
        grp.add(lbl);
        scene.add(grp);
        beams.push({ grp, curve, spark, lbl, off: Math.random(), b });
      });
      beamsDirty = false;
    }
  
    // ═════════ Chọn cung: tam hợp, xung chiếu, sao xếp tầng ═════════
    function veLienKet(caTang = false) {
      if (links) { scene.remove(links); dispose(links); links = null; }
      if (caTang && tiers) { scene.remove(tiers); dispose(tiers); tiers = null; }
      if (selected < 0) { if (tiers) { scene.remove(tiers); dispose(tiers); tiers = null; } return; }
      links = new T.Group();
      const P = i => { const p = posCung(i); return new T.Vector3(p.x, 0.25, p.z); };
      const arc = (a, b, h) => { const m = a.clone().lerp(b, 0.5); m.y += h; return new T.QuadraticBezierCurve3(a, m, b); };
      const th = [selected, (selected + 4) % 12, (selected + 8) % 12];
      [[0, 1], [1, 2], [2, 0]].forEach(([x, y]) => {
        const c = arc(P(th[x]), P(th[y]), 0.8);
        links.add(new T.Mesh(new T.TubeGeometry(c, 40, 0.045, 6), new T.MeshBasicMaterial({ color: 0xf2c86e, transparent: true, opacity: 0.85 })));
      });
      const xc = arc(P(selected), P((selected + 6) % 12), 1.2);
      const lg = new T.BufferGeometry().setFromPoints(xc.getPoints(60));
      const ln = new T.Line(lg, new T.LineDashedMaterial({ color: 0xff7a6b, dashSize: 0.35, gapSize: 0.25 }));
      ln.computeLineDistances(); links.add(ln);
      scene.add(links);
      if (!caTang) return;
  
      // Sao xếp tầng phía trên cung: chính tinh trên cùng, cát bên trái, hung bên phải
      const c = data.cung[selected], p = posCung(selected);
      tiers = new T.Group(); tiers.position.set(p.x, 0, p.z);
      const tang = (list, y, dx, mau) => list.slice(0, 6).forEach((s, k) => {
        const sp = nhanSprite([{ t: saoTxt(s), size: 24, c: saoMau(s) }], { bg: 'rgba(10,14,40,0.6)', border: mau, scale: 0.75 });
        sp.position.set(dx, y + k * 0.42, 0); tiers.add(sp);
      });
      (c.chinh || []).forEach((s, k) => {
        const sp = nhanSprite([{ t: saoTxt(s).toUpperCase(), size: 30, c: saoMau(s) }], { scale: 0.95, border: '#f2c86e' });
        sp.position.set(0, 3.9 + k * 0.6, 0); tiers.add(sp);
      });
      tang(c.cat || [], 1.3, -1.7, 'rgba(127,220,142,0.6)');
      tang(c.hung || [], 1.3, 1.7, 'rgba(255,143,120,0.6)');
      scene.add(tiers);
    }
  
    function chonCung(i) {
      if (i === selected) i = -1;
      selected = i;
      veLienKet(true);
      veDetail();
      if (i >= 0) flyToCung(i); else flyHome();
    }
  
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    function veDetail() {
      if (selected < 0 || !data) { detailEl.hidden = true; return; }
      const c = data.cung[selected];
      const saoList = l => `<div>${l.length ? l.map(s => `<span style="color:${saoMau(s)}">${esc(saoTxt(s))}</span>`).join(', ') : '—'}</div>`;
      const hoa = data.hoa.filter(x => x.to === c.i)
        .map(x => `<span class="l3d-hoa" style="--c:${HOA[x.h].c}">${NGUON[x.src]}: Hóa ${HOA[x.h].ten}${x.ten ? ' (' + esc(x.ten) + ')' : ''}</span>`).join('');
      const nhan = [];
      if (c.i === data.menh) nhan.push('Mệnh');
      if (c.isThan) nhan.push('Thân');
      if (c.i === data.dv) nhan.push(`Đại vận ${namXem}`);
      if (c.i === data.ln) nhan.push(`L.Mệnh ${namXem}`);
      detailEl.innerHTML = `
        <button type="button" class="l3d-x" data-close title="Đóng (Esc)">✕</button>
        <div class="l3d-d-head">${esc((c.ten || '').toUpperCase())} <span>${c.can != null ? CAN[c.can] + ' ' : ''}${c.chi}</span></div>
        ${nhan.length ? `<div class="l3d-d-tags">${nhan.map(t => `<b>${t}</b>`).join('')}</div>` : ''}
        <div class="l3d-d-row"><i>Đại vận</i>${c.daiVan != null && c.daiVan !== '' ? `${c.daiVan}–${+c.daiVan + 9} tuổi` : '—'}</div>
        <div class="l3d-d-row"><i>Trường sinh</i>${esc(c.truongSinh) || '—'}</div>
        <div class="l3d-d-row"><i>Chính tinh</i>${c.chinh?.length ? saoList(c.chinh) : '<div><em>Vô chính diệu</em></div>'}</div>
        <div class="l3d-d-row"><i>Cát tinh</i>${saoList(c.cat || [])}</div>
        <div class="l3d-d-row"><i>Hung tinh</i>${saoList(c.hung || [])}</div>
        ${hoa ? `<div class="l3d-d-row"><i>Tứ hóa</i><div>${hoa}</div></div>` : ''}
        <div class="l3d-d-row"><i>Tam hợp</i><div>${CHI[(c.i + 4) % 12]}, ${CHI[(c.i + 8) % 12]}</div></div>
        <div class="l3d-d-row"><i>Xung chiếu</i><div>${CHI[(c.i + 6) % 12]}</div></div>`;
      detailEl.hidden = false;
    }
  
    // ═════════ Camera ═════════
    function flyTo(to, ms = 900) {
      camAnim = { from: { ...cam }, to: { ...cam, ...to }, t0: performance.now(), ms };
      // quay theo đường ngắn nhất
      const d = camAnim.to.az - camAnim.from.az;
      camAnim.to.az = camAnim.from.az + Math.atan2(Math.sin(d), Math.cos(d));
    }
    function flyHome() { flyTo({ tx: 0, ty: 0, tz: 1.2, el: 1.02, dist: 33 }); }
    function flyToCung(i) {
      const p = posCung(i, layoutTo);
      const rx = Math.cos(cam.az), rz = -Math.sin(cam.az);         // lệch tâm nhìn sang phải để cung nằm bên trái bảng chi tiết
      flyTo({ tx: p.x + rx * 2.2, ty: 1.6, tz: p.z + rz * 2.2, el: 0.62, dist: 16 });
    }
    function capNhatCam(now) {
      if (camAnim) {
        let k = Math.min(1, (now - camAnim.t0) / camAnim.ms);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        for (const key of ['tx', 'ty', 'tz', 'az', 'el', 'dist']) cam[key] = camAnim.from[key] + (camAnim.to[key] - camAnim.from[key]) * e;
        if (k >= 1) camAnim = null;
      }
      const ce = Math.cos(cam.el);
      camera.position.set(cam.tx + cam.dist * ce * Math.sin(cam.az), cam.ty + cam.dist * Math.sin(cam.el), cam.tz + cam.dist * ce * Math.cos(cam.az));
      camera.lookAt(cam.tx, cam.ty, cam.tz);
    }
  
    // Chuột: kéo xoay, cuộn phóng to, bấm chọn cung
    function ganChuot(el) {
      let drag = null;
      const ray = new T.Raycaster(), v = new T.Vector2();
      const pick = e => {
        const r = el.getBoundingClientRect();
        v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(v, camera);
        const hit = ray.intersectObjects(plaques.filter(Boolean).map(p => p.userData.face), false)[0];
        return hit ? hit.object.userData.chi : -1;
      };
      el.addEventListener('pointerdown', e => {
        drag = { x: e.clientX, y: e.clientY, az: cam.az, el: cam.el, moved: false };
        el.setPointerCapture(e.pointerId);
        idleAt = performance.now();
      });
      el.addEventListener('pointermove', e => {
        idleAt = performance.now();
        if (drag) {
          const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
          if (drag.moved) {
            camAnim = null;
            cam.az = drag.az - dx * 0.006;
            cam.el = Math.min(1.45, Math.max(0.2, drag.el + dy * 0.005));
          }
          return;
        }
        hovered = pick(e);
        el.style.cursor = hovered >= 0 ? 'pointer' : 'grab';
      });
      el.addEventListener('pointerup', e => {
        if (drag && !drag.moved) {
          const i = pick(e);
          if (i >= 0) chonCung(i); else if (selected >= 0) chonCung(-1);
        }
        drag = null;
      });
      el.addEventListener('wheel', e => {
        e.preventDefault();
        camAnim = null; idleAt = performance.now();
        cam.dist = Math.min(48, Math.max(7, cam.dist * (1 + Math.sign(e.deltaY) * 0.08)));
      }, { passive: false });
      el.addEventListener('pointerleave', () => { hovered = -1; });
    }
  
    // ═════════ Vòng lặp ═════════
    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now;
  
      const j = lastJson();
      if (j !== builtFrom) { if (!dungLaSo(j)) return; }
      if (!scene) return;
  
      // Tự xoay chậm khi để yên ở la bàn tròn
      if (selected < 0 && !camAnim && now - idleAt > 8000 && layoutTo === 0) cam.az += dt * 0.05;
      capNhatCam(now);
      sky.rotation.y += dt * 0.004;
  
      // Chuyển bố cục
      const prev = layout;
      layout += (layoutTo - layout) * Math.min(1, dt * 4);
      if (Math.abs(layoutTo - layout) < 0.002) layout = layoutTo;
      if (layout !== prev) {                       // đang chuyển: ẩn tia và đường liên kết, xong mới vẽ lại
        const xong = layout === layoutTo;
        beams.forEach(b => { b.grp.visible = xong; });
        if (links) links.visible = xong;
        if (tiers && selected >= 0) { const p = posCung(selected); tiers.position.set(p.x, 0, p.z); }
        if (xong) { beamsDirty = true; if (selected >= 0) veLienKet(); }
      }
      decorTron.forEach(o => { setOpa(o, 1 - layout); });
      decorVuong.forEach(o => { setOpa(o, layout); });
  
      // Cung: vị trí, hướng chữ, nổi lên khi rê / chọn
      const yawTron = cam.az, yawVuong = Math.round(cam.az / (Math.PI / 2)) * (Math.PI / 2);
      plaques.forEach((g, i) => {
        if (!g) return;
        const u = g.userData, p = posCung(i);
        g.position.x = p.x; g.position.z = p.z;
        const want = yawTron + (yawVuong - yawTron) * layout;
        const d = Math.atan2(Math.sin(want - u.yaw), Math.cos(want - u.yaw));
        u.yaw += d * Math.min(1, dt * 6);
        g.rotation.y = u.yaw;
        const lien = selected >= 0 && [selected, (selected + 4) % 12, (selected + 8) % 12, (selected + 6) % 12].includes(i);
        const hT = i === selected ? 0.9 : i === hovered ? 0.35 : 0;
        u.h += (hT - u.h) * Math.min(1, dt * 8);
        g.position.y = u.h;
        const dim = selected >= 0 && !lien ? 0.4 : 1;
        u.face.material.opacity += (dim - u.face.material.opacity) * Math.min(1, dt * 6);
        u.edge.material.opacity = i === selected || i === hovered ? 1 : 0.7 * dim;
      });
  
      // Mốc đại vận, lưu niên
      if (data.dv >= 0) {
        const p = posCung(data.dv), o = huongRa(data.dv);
        markers.dv.visible = true;
        markers.dv.position.set(p.x + o.x * 3.0, 0.6 + Math.sin(now / 600) * 0.08, p.z + o.z * 2.6);
        markers.dvSeg.visible = layout < 0.99;
        markers.dvSeg.rotation.z = -(data.dv * Math.PI / 6 + Math.PI / 2) - Math.PI / 12;
      } else { markers.dv.visible = false; markers.dvSeg.visible = false; }
      {
        const p = posCung(data.ln), o = huongRa(data.ln), r = data.dv === data.ln ? 4.1 : 3.0;
        markers.ln.position.set(p.x + o.x * r, 0.5, p.z + o.z * r);
        markers.lnOrb.material.opacity = 0.75 + 0.25 * Math.sin(now / 400);
      }
      markers.orbGlow.material.opacity = 0.75 + 0.25 * Math.sin(now / 900);
  
      if (beamsDirty && layout === layoutTo) veTia();
      if (tiers) tiers.rotation.y = cam.az;                        // sao xếp tầng: trái/phải theo hướng nhìn
      beams.forEach(b => {
        const x = b.b, lq = selected < 0 || x.to === selected || x.from === selected || (x.from === 'ln' && data.ln === selected);
        if (layout === layoutTo) b.grp.visible = lq;                // đang chọn cung: chỉ giữ tia liên quan
        b.lbl.visible = selected < 0;                               // nhãn tia đã có trong bảng chi tiết
        const k = ((now / 1600) + b.off) % 1;
        b.spark.position.copy(b.curve.getPoint(k));
      });
  
      renderer.render(scene, camera);
    }
    function setOpa(o, a) {
      o.visible = a > 0.01;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach(m => {
        if (!m) return;
        if (m.userData.base == null) m.userData.base = m.opacity === 0 ? (m.type === 'MeshStandardMaterial' ? 1 : 0.8) : m.opacity;
        m.opacity = m.userData.base * a;
      });
    }
  
    // Dựng lại khi lá số đổi; trả false nếu không có lá số để xem
    function dungLaSo(j) {
      builtFrom = j;
      selected = -1; hovered = -1; detailEl.hidden = true;
      const lyso = typeof isLysoTemplateActive === 'function' && isLysoTemplateActive();
      if (!j || !Array.isArray(j.cung) || lyso) {
        data = null;
        if (scene) { dispose(scene); scene = null; }
        msgEl.innerHTML = lyso
          ? 'Lá số dạng ảnh (lyso.vn) không xem 3D được.<br>Hãy đổi phương pháp an sao trong Cấu hình.'
          : 'Chưa có lá số để xem.<br><button type="button" data-go>Lập lá số</button>';
        msgEl.hidden = false;
        renderer.clear();
        return false;
      }
      msgEl.hidden = true;
      data = docDuLieu(j);
      tinhHan();
      dungCanh();
      cam.az = 0; cam.el = 1.02; cam.dist = 33; cam.tx = cam.ty = 0; cam.tz = 1.2; camAnim = null;
      idleAt = performance.now();
      return true;
    }
  
    function resize() {
      if (!renderer) return;
      const r = root.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      renderer.setSize(W, H);
      camera.aspect = W / H; camera.updateProjectionMatrix();
    }
  
    // ═════════ Bật / tắt ═════════
    async function start() {
      running = true;
      if (!T) {
        msgEl.innerHTML = 'Đang tải bộ dựng 3D…'; msgEl.hidden = false;
        try {
          loading = loading || import(THREE_URL);
          T = await loading;
          await document.fonts?.ready;
        } catch (e) {
          loading = null;
          msgEl.innerHTML = 'Không tải được thư viện 3D (Three.js). Kiểm tra kết nối mạng rồi mở lại.';
          running = false;
          return;
        }
        if (!running) return;
        initThree();
      }
      // Năm xem: theo "Xem hạn" của lá số 2D nếu đang bật, không thì năm nay
      const nx = parseInt(document.getElementById('namXem')?.dataset.val, 10);
      const on = document.getElementById('chkXemHan')?.checked;
      setYear(on && nx > 0 ? nx : new Date().getFullYear());
      if (on) { opts.dv = opts.ln = true; root.querySelectorAll('[data-opt="dv"],[data-opt="ln"]').forEach(x => { x.checked = true; }); }
      builtFrom = undefined;                       // luôn dựng lại theo lá số hiện tại
      resize();
      lastT = 0;
      raf = requestAnimationFrame(frame);
    }
  
    function sync() {
      const on = document.body.classList.contains('mb-page-p3d') && !document.hidden;
      if (on && !running) start();
      else if (!on && running) { running = false; cancelAnimationFrame(raf); }
    }
  
    function init() {
      build();
      sync();
      new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
      window.addEventListener('resize', () => { if (running) resize(); });
      document.addEventListener('visibilitychange', sync);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();