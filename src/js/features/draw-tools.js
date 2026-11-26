// src/js/features/draw-tools.js
// ── Vẽ trên lá số (bật/tắt trong menu ⚙, desktop) ──────────────
//   Lớp SVG nằm trong #grid → bám theo lá số khi thu phóng, có trong ảnh tải về.
//   Tắt vẽ = xóa hết nét. Lá số vẽ lại (lập lá số mới, đổi năm/giờ xem) = xóa hết nét.
(function () {
    'use strict';
  
    const NS = 'http://www.w3.org/2000/svg';
    const $ = id => document.getElementById(id);
    const st = { on: false, tool: 'free', color: '#c0392b', width: 3 };
    let svg = null, layer = null, cur = null, start = null;
  
    // ── Lớp vẽ ──────────────────────────────────────────────────
    function ensureOverlay() {
      const g = $('grid');
      if (!g || !st.on) return;
      if (svg && svg.parentNode === g) return;
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'draw-svg');
      layer = document.createElementNS(NS, 'g');
      svg.appendChild(layer);
      g.appendChild(svg);
      svg.addEventListener('pointerdown', onDown);
      svg.addEventListener('pointermove', onMove);
      svg.addEventListener('pointerup', onUp);
      svg.addEventListener('pointercancel', onUp);
    }
  
    function removeOverlay() {
      svg?.remove();
      svg = layer = cur = null;
    }
  
    // Toạ độ chuột → toạ độ bố cục trong #grid (lá số đang bị transform: scale)
    function toPoint(e) {
      const g = $('grid');
      const r = g.getBoundingClientRect();
      const s = (r.width / (g.offsetWidth || 1)) || 1;
      return { x: (e.clientX - r.left) / s - g.clientLeft, y: (e.clientY - r.top) / s - g.clientTop };
    }
  
    function el(tag, attrs) {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      return n;
    }
    const strokeAttrs = () => ({
      stroke: st.color, 'stroke-width': st.width, fill: 'none',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    });
  
    // ── Vẽ ──────────────────────────────────────────────────────
    function onDown(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      svg.setPointerCapture(e.pointerId);
      start = toPoint(e);
      const f = n => n.toFixed(1);
      if (st.tool === 'free') {
        cur = el('path', { ...strokeAttrs(), d: `M${f(start.x)},${f(start.y)}` });
      } else if (st.tool === 'arrow') {
        cur = el('g', {});
        cur.append(el('line', { ...strokeAttrs(), x1: start.x, y1: start.y, x2: start.x, y2: start.y }),
                   el('path', { fill: st.color, stroke: 'none' }));
      } else if (st.tool === 'ellipse') {
        cur = el('ellipse', { ...strokeAttrs(), cx: start.x, cy: start.y, rx: 0, ry: 0 });
      } else {
        cur = el('rect', { ...strokeAttrs(), x: start.x, y: start.y, width: 0, height: 0 });
      }
      layer.appendChild(cur);
    }
  
    function onMove(e) {
      if (!cur) return;
      const p = toPoint(e);
      if (st.tool === 'free') {
        cur.setAttribute('d', cur.getAttribute('d') + ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`);
        return;
      }
      if (st.tool === 'arrow') { drawArrow(cur, start, p); return; }
      let dx = p.x - start.x, dy = p.y - start.y;
      if (e.shiftKey) {                                   // giữ Shift: tròn đều / vuông đều
        const m = Math.max(Math.abs(dx), Math.abs(dy));
        dx = Math.sign(dx || 1) * m;
        dy = Math.sign(dy || 1) * m;
      }
      if (st.tool === 'ellipse') {
        cur.setAttribute('cx', start.x + dx / 2);
        cur.setAttribute('cy', start.y + dy / 2);
        cur.setAttribute('rx', Math.abs(dx / 2));
        cur.setAttribute('ry', Math.abs(dy / 2));
      } else {
        cur.setAttribute('x', Math.min(start.x, start.x + dx));
        cur.setAttribute('y', Math.min(start.y, start.y + dy));
        cur.setAttribute('width', Math.abs(dx));
        cur.setAttribute('height', Math.abs(dy));
      }
    }
  
    // Thân mũi tên + đầu tam giác đặc, cỡ đầu theo độ dày nét
    function drawArrow(g, a, b) {
      const line = g.firstChild, head = g.lastChild;
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const w = parseFloat(line.getAttribute('stroke-width')) || 2;
      const s = Math.min(len, Math.max(10, w * 3.5)), hw = s * 0.5;
      const bx = b.x - ux * s, by = b.y - uy * s;          // chân đầu mũi tên
      line.setAttribute('x2', bx + ux * 0.5);
      line.setAttribute('y2', by + uy * 0.5);
      head.setAttribute('d', `M${b.x},${b.y} L${bx - uy * hw},${by + ux * hw} L${bx + uy * hw},${by - ux * hw} Z`);
    }
  
    function onUp() {
      if (!cur) return;
      const bb = cur.getBBox?.();
      if (bb && bb.width < 2 && bb.height < 2) cur.remove();   // click nhầm, không kéo
      cur = null;
    }
  
    // ── Bật / tắt ───────────────────────────────────────────────
    function setOn(on) {
      st.on = on;
      document.body.classList.toggle('draw-on', on);
      $('menuDraw')?.classList.toggle('checked', on);
      if (on) ensureOverlay();
      else removeOverlay();                                   // tắt = xóa hết nét
      // Thanh công cụ làm thanh dưới cao lên/thấp xuống → căn lại thanh & lá số
      window.dispatchEvent(new Event('resize'));
    }
  
    window.settingsToggleDraw = function () {
      $('settingsMenu')?.classList.remove('open');
      $('btnSettings')?.classList.remove('active');
      setOn(!st.on);
    };
  
    function undo() { layer?.lastChild?.remove(); }
    function clearAll() { layer?.replaceChildren(); }
  
    // ── Thanh công cụ ───────────────────────────────────────────
    function bindToolbar() {
      const bar = $('drawToolbar');
      if (!bar) return;
  
      bar.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.tool) {
          st.tool = b.dataset.tool;
          bar.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x === b));
        } else if (b.dataset.color) {
          setColor(b.dataset.color);
        } else if (b.dataset.act === 'undo') undo();
        else if (b.dataset.act === 'clear') clearAll();
        else if (b.dataset.act === 'close') setOn(false);
      });
  
      const colorInput = $('drawColor');
      colorInput?.addEventListener('input', () => setColor(colorInput.value));
  
      const w = $('drawWidth'), wv = $('drawWidthVal');
      w?.addEventListener('input', () => {
        st.width = Number(w.value) || 3;
        if (wv) wv.textContent = st.width;
      });
  
      function setColor(c) {
        st.color = c;
        if (colorInput) colorInput.value = c;
        bar.querySelectorAll('[data-color]').forEach(x => x.classList.toggle('on', x.dataset.color.toLowerCase() === c.toLowerCase()));
      }
      setColor(st.color);
    }
  
    // Ctrl/Cmd+Z: hoàn tác (không đụng tới việc gõ trong ô nhập, note…)
    document.addEventListener('keydown', e => {
      if (!st.on) return;
      const t = e.target;
      const typing = t && (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'
        || (t.tagName === 'INPUT' && !/^(range|color|checkbox|radio|button)$/i.test(t.type)));
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if (e.key === 'Escape' && cur) { cur.remove(); cur = null; }
    });
  
    function init() {
      bindToolbar();
      // Lá số được vẽ lại (innerHTML thay mới) → lớp vẽ cũ mất; đang bật vẽ thì tạo lớp mới (trống)
      const g = $('grid');
      if (g) new MutationObserver(() => { if (st.on) ensureOverlay(); }).observe(g, { childList: true });
      // Chuyển sang mobile → tắt vẽ
      new MutationObserver(() => {
        if (st.on && document.body.dataset.layout !== 'desktop') setOn(false);
      }).observe(document.body, { attributes: true, attributeFilter: ['data-layout'] });
    }
  
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();