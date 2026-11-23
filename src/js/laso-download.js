/* ══════════════════════════════════════════════════════════════════
 *  Tải ảnh lá số (PNG) — desktop + mobile
 *  Phụ thuộc: html-to-image (global `htmlToImage`)
 *
 *  Luồng:
 *   1. Bật chế độ chụp (.capturing): tắt animation, hiện trạng thái cuối
 *   2. Chụp #grid (kích thước thật, không bị transform:scale của #gridScaler)
 *      - Safari / iOS: chụp 2 lần (lần 1 để "mồi" ảnh trong foreignObject)
 *      - Lỗi nhúng font → chụp lại không nhúng font
 *   3. Xuất:
 *      - Trình duyệt trong app (Zalo, Facebook…)  → lớp xem ảnh "nhấn giữ để lưu"
 *      - Mobile có Web Share (files)              → bảng chia sẻ (Lưu hình ảnh)
 *      - Desktop / còn lại                        → tải file trực tiếp
 *      - iOS không share được                     → lớp xem ảnh "nhấn giữ để lưu"
 * ══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
  
    const CFG = {
        margin: 2,                            // ← viền trắng bao quanh lá số (px)
      targetSelector: '#grid',              // phần tử cần chụp (bên trong #gridScaler)
      background: '#ffffff',
      maxPixels: 16 * 1000 * 1000,          // giới hạn canvas an toàn cho iOS
      desktopRatio: 2,
      mobileMaxRatio: 2.5,
      excludeClasses: ['box-copy', 'sidebar-toggle', 'laso-download-btn'],
      // ảnh 1×1 trong suốt thay cho ảnh không tải được (vd. mở bằng file://)
      imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    };
  
    // ── Nhận diện môi trường ──────────────────────────────────────
    const UA = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(UA);
    const isMobile = isIOS || /Android|Mobi/i.test(UA);
    const isInApp = /FBAN|FBAV|FB_IAB|Instagram|Zalo|Line\/|Messenger|MicroMessenger|; wv\)/i.test(UA);
  
    // ── Tiện ích ──────────────────────────────────────────────────
    const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  
    function slug(s) {
      return String(s || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        .toLowerCase();
    }
  
    function fileName() {
      const ten = (typeof _lastJson !== 'undefined' && _lastJson?.meta?.hoTen) || document.getElementById('hoTen')?.value;
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      return `la-so-${slug(ten) || 'tu-vi'}-${stamp}.png`;
    }
  
    function pickRatio(node) {
      const w = node.scrollWidth, h = node.scrollHeight;
      let r = isMobile ? Math.min(window.devicePixelRatio || 2, CFG.mobileMaxRatio) : CFG.desktopRatio;
      while (r > 1 && w * h * r * r > CFG.maxPixels) r -= 0.25;   // không vượt giới hạn canvas
      return Math.max(1, r);
    }
  
    function filterNode(el) {
      if (!el.classList) return true;
      return !CFG.excludeClasses.some(c => el.classList.contains(c));
    }
  
      // Thêm viền trắng quanh ảnh (margin tính theo px CSS, nhân theo pixelRatio)
  async function addMargin(blob, marginCss, ratio, color) {
    if (!blob || !marginCss) return blob;
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });
      const m = Math.round(marginCss * ratio);
      const c = document.createElement('canvas');
      c.width = img.naturalWidth + m * 2;
      c.height = img.naturalHeight + m * 2;
      const ctx = c.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, m, m);
      return await new Promise(res => c.toBlob(res, 'image/png'));
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function capture(node) {
    const ratio = pickRatio(node);
    const base = {
      pixelRatio: ratio,
      filter: filterNode,
      imagePlaceholder: CFG.imagePlaceholder,
      cacheBust: false,
    };

    const run = async (opt) => {
      if (isSafari || isIOS) await htmlToImage.toBlob(node, opt);   // lần "mồi" cho Safari
      return htmlToImage.toBlob(node, opt);
    };

    let blob;
    try {
      blob = await run(base);
    } catch (e) {
      console.warn('[laso-download] Chụp có nhúng font lỗi, thử lại không nhúng font:', e);
      blob = await run({ ...base, skipFonts: true });
    }
    return addMargin(blob, CFG.margin, ratio, CFG.background);
  }
  
    // ── Xuất ảnh ──────────────────────────────────────────────────
    function downloadBlob(blob, name) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
  
    function showPreview(blob, hint) {
      document.querySelector('.laso-dl-overlay')?.remove();
      const url = URL.createObjectURL(blob);
      const ov = document.createElement('div');
      ov.className = 'laso-dl-overlay';
      ov.innerHTML = `
        <div class="laso-dl-panel">
          <div class="laso-dl-hint">${hint}</div>
          <img class="laso-dl-img" src="${url}" alt="Lá số Tử Vi">
          <button type="button" class="laso-dl-close">Đóng</button>
        </div>`;
      const close = () => { ov.remove(); URL.revokeObjectURL(url); };
      ov.addEventListener('click', e => {
        if (e.target === ov || e.target.classList.contains('laso-dl-close')) close();
      });
      document.body.appendChild(ov);
    }
  
    async function deliver(blob) {
      const name = fileName();
  
      if (isInApp) {
        showPreview(blob, 'Nhấn giữ ảnh để lưu. Nếu không được, hãy mở trang bằng Safari / Chrome.');
        return;
      }
  
      if (isMobile) {
        const file = new File([blob], name, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Lá số Tử Vi' });
            return;
          } catch (e) {
            if (e.name === 'AbortError') return;              // người dùng tự đóng bảng chia sẻ
            console.warn('[laso-download] Share lỗi, chuyển sang cách khác:', e);
          }
        }
        if (isIOS) {
          showPreview(blob, 'Nhấn giữ ảnh rồi chọn “Lưu vào Ảnh”.');
          return;
        }
      }
  
      downloadBlob(blob, name);
    }
  
    // ── Hàm chính ─────────────────────────────────────────────────
    async function downloadLasoImage(btn) {
      if (typeof htmlToImage === 'undefined') {
        alert('Chưa tải được thư viện tạo ảnh (html-to-image).');
        return;
      }
      const node = document.querySelector(CFG.targetSelector);
      if (!node || !node.children.length) {
        alert('Chưa có lá số để tải. Hãy lập lá số trước.');
        return;
      }
      if (location.protocol === 'file:') {
        console.warn('[laso-download] Trang đang mở bằng file:// — ảnh nền/slogan có thể bị thiếu trong file tải về.');
      }
  
      const oldText = btn?.textContent;
      if (btn) { btn.disabled = true; btn.textContent = 'Đang tạo ảnh…'; }
      document.body.classList.add('capturing');
  
      try {
        if (document.fonts?.ready) await document.fonts.ready;
        await nextFrame();                                   // áp dụng .capturing trước khi chụp
        const blob = await capture(node);
        if (!blob) throw new Error('Không tạo được ảnh.');
        document.body.classList.remove('capturing');
        await deliver(blob);
      } catch (e) {
        console.error('[laso-download]', e);
        alert('Không tạo được ảnh lá số: ' + (e?.message || e));
      } finally {
        document.body.classList.remove('capturing');
        if (btn) { btn.disabled = false; btn.textContent = oldText; }
      }
    }
  
    window.downloadLasoImage = downloadLasoImage;
  })();