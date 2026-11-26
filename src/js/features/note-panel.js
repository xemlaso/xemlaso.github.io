// src/js/features/note-panel.js
// ── Ghi chú bên phải lá số (chỉ giao diện desktop) ─────────────
//   Bật: lá số dời sang trái (mặc định 70%), note bên phải (30%), kéo separator để đổi tỉ lệ.
//   Tỉ lệ được nhớ (localStorage 'noteRatio'); nội dung note KHÔNG lưu (tải lại trang là mất).
(function () {
    'use strict';
  
    const RATIO_KEY = 'noteRatio';
    const RATIO_DEFAULT = 0.70;           // phần dành cho lá số
    const RATIO_MIN = 0.35, RATIO_MAX = 0.85;
  
    const $ = id => document.getElementById(id);
    const isDesktop = () => document.body.dataset.layout === 'desktop';
  
    function loadRatio() {
      try {
        const v = parseFloat(localStorage.getItem(RATIO_KEY));
        if (v >= RATIO_MIN && v <= RATIO_MAX) return v;
      } catch (e) {}
      return RATIO_DEFAULT;
    }
    function saveRatio(v) { try { localStorage.setItem(RATIO_KEY, String(v)); } catch (e) {} }
  
    function setRatio(v) {
      const row = $('lasoRow');
      if (row) row.style.setProperty('--note-w', ((1 - v) * 100).toFixed(2) + '%');
    }
  
    // Vẽ lại lá số theo bề rộng mới (giống khi ẩn/hiện sidebar)
    function relayout(full) {
      if (full && typeof rerenderLaso === 'function') { rerenderLaso(); return; }
      if (typeof scaleGrid === 'function') scaleGrid();
    }
  
    // Bật/tắt Note là lựa chọn chung cho mọi lá số (không phụ thuộc lá số có note hay không),
    // nhớ qua các lần mở trang (localStorage 'noteOpen')
    const OPEN_KEY = 'noteOpen';
    const loadOpen = () => { try { return localStorage.getItem(OPEN_KEY) === '1'; } catch (e) { return false; } };
    const saveOpen = v => { try { localStorage.setItem(OPEN_KEY, v ? '1' : '0'); } catch (e) {} };

    // opts.save: ghi nhớ lựa chọn (chỉ khi người dùng bấm); opts.focus: đặt con trỏ vào note
    function setNoteOpen(open, opts = {}) {
      if (open && !isDesktop()) return;
      if (opts.save) saveOpen(open);
      document.body.classList.toggle('note-open', open);
      const btn = $('btnToggleNote');
      if (btn) btn.classList.toggle('active', open);
      relayout(true);
      if (open && opts.focus) $('noteEditor')?.focus();
    }
  
       // Chỉ nút Note (#btnToggleNote) mới mở/tắt được Note.
    // Mọi chỗ khác gọi toggleNote() (vd. mở lá số có note) → bỏ qua.
    let fromNoteBtn = false;
    document.addEventListener('click', e => {
      if (!e.target.closest?.('#btnToggleNote')) return;
      fromNoteBtn = true;                                   // chạy TRƯỚC onclick="toggleNote()" của nút
      setTimeout(() => { fromNoteBtn = false; }, 0);
    }, true);
    window.toggleNote = function () {
      if (!fromNoteBtn) return;
      fromNoteBtn = false;
      setNoteOpen(!document.body.classList.contains('note-open'), { save: true, focus: true });
    };
 
  
    // ── Kéo separator ────────────────────────────────────────────
    function bindSeparator() {
      const sep = $('noteSep'), row = $('lasoRow');
      if (!sep || !row) return;
      let dragging = false, raf = 0, ratio = loadRatio();
  
      sep.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        dragging = true;
        sep.setPointerCapture(e.pointerId);
        document.body.classList.add('note-dragging');      // chặn bôi đen chữ khi kéo
        e.preventDefault();
      });
      sep.addEventListener('pointermove', e => {
        if (!dragging) return;
        const r = row.getBoundingClientRect();
        ratio = Math.min(RATIO_MAX, Math.max(RATIO_MIN, (e.clientX - r.left) / r.width));
        setRatio(ratio);
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; relayout(false); });
      });
      const end = () => {
        if (!dragging) return;
        dragging = false;
        document.body.classList.remove('note-dragging');
        saveRatio(ratio);
        relayout(true);
      };
      sep.addEventListener('pointerup', end);
      sep.addEventListener('pointercancel', end);
      // Nháy đúp: về lại 70/30
      sep.addEventListener('dblclick', () => {
        ratio = RATIO_DEFAULT;
        setRatio(ratio); saveRatio(ratio); relayout(true);
      });
    }
  
    // ── Thanh định dạng ─────────────────────────────────────────
    function bindToolbar() {
      const bar = $('noteToolbar'), ed = $('noteEditor');
      if (!bar || !ed) return;
  
      // Giữ vùng chọn trong note khi bấm nút
      bar.addEventListener('mousedown', e => {
        if (e.target.closest('button')) e.preventDefault();
      });
  
      bar.addEventListener('click', e => {
        const b = e.target.closest('button[data-cmd]');
        if (!b) return;
        ed.focus();
        const cmd = b.dataset.cmd, val = b.dataset.val || null;
        if (cmd === 'formatBlock') {
          // Bấm lại tiêu đề đang dùng → về đoạn thường
          const cur = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
          document.execCommand('formatBlock', false, cur === val ? 'p' : val);
        } else {
          document.execCommand(cmd, false, val);
        }
        updateToolbar();
      });
  
      // Dán: chỉ lấy chữ trơn để không kéo theo style lạ làm vỡ bố cục
      ed.addEventListener('paste', e => {
        const text = e.clipboardData?.getData('text/plain');
        if (text == null) return;
        e.preventDefault();
        document.execCommand('insertText', false, text);
      });
  
      ['keyup', 'mouseup', 'input'].forEach(t => ed.addEventListener(t, updateToolbar));
      document.addEventListener('selectionchange', () => {
        if (document.activeElement === ed) updateToolbar();
      });
  
      function updateToolbar() {
        bar.querySelectorAll('button[data-cmd]').forEach(b => {
          const cmd = b.dataset.cmd;
          let on = false;
          try {
            if (cmd === 'formatBlock') {
              on = String(document.queryCommandValue('formatBlock') || '').toLowerCase() === b.dataset.val;
            } else if (['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'].includes(cmd)) {
              on = document.queryCommandState(cmd);
            }
          } catch (err) {}
          b.classList.toggle('on', on);
        });
      }
    }
  
    function init() {
      setRatio(loadRatio());
      bindSeparator();
      bindToolbar();
            // Desktop: mở lại theo lựa chọn đã nhớ. Sang mobile thì đóng (không đổi lựa chọn đã nhớ),
      // về lại desktop thì mở lại nếu trước đó đang bật
      const syncLayout = () => {
        const open = document.body.classList.contains('note-open');
        if (!isDesktop()) { if (open) setNoteOpen(false); }
        else if (loadOpen() !== open) setNoteOpen(loadOpen());
      };
      syncLayout();
      new MutationObserver(syncLayout).observe(document.body, { attributes: true, attributeFilter: ['data-layout'] });
    }
  
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();