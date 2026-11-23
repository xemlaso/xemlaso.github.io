// ── Responsive scale lá số ───────────────────────────────
    function browserWindowHeight() {
      // Chiều cao khung cửa sổ đang mở, không phải chiều cao màn hình.
      return document.documentElement.clientHeight || window.innerHeight || 0;
    }

    function scaleGrid() {
      const outer = document.getElementById('gridScalerOuter');
      const scaler = document.getElementById('gridScaler');
      const grid = document.getElementById('grid');
      const wrap = document.getElementById('lasoWrap');
      if (!scaler || !grid || !outer || !wrap) return;

      scaler.style.zoom = '';
      scaler.style.transform = 'scale(1)';
      outer.style.height = '';
      outer.style.maxHeight = '';
      outer.style.overflow = '';

      const gridW = grid.offsetWidth;
      const gridH = grid.offsetHeight;
      if (!gridW || !gridH) return;

      const hanNav = document.getElementById('hanNavBar');
      const hanH = hanNav ? hanNav.offsetHeight : 0;
      const isDesktop = document.body.dataset.layout === 'desktop';

      if (!isDesktop) {
        const targetH = Math.max(0, window.innerHeight - hanH - 10);
        const scale = Math.min(outer.clientWidth / gridW, targetH / gridH);
        scaler.style.transformOrigin = 'top center';
        scaler.style.transform = `scale(${scale})`;
        outer.style.height = (gridH * scale) + 'px';
        if (typeof TUVI_RENDER !== 'undefined') TUVI_RENDER.reRenderPills();
        return;
      }

      const viewH = browserWindowHeight();
      const spaceAbove = Math.max(0, outer.getBoundingClientRect().top + window.scrollY);
      const hanCss = hanNav ? getComputedStyle(hanNav) : null;
      const hanMargin = hanCss ? (parseFloat(hanCss.marginTop) || 0) + (parseFloat(hanCss.marginBottom) || 0) : 0;
      const targetH = Math.max(0, viewH - spaceAbove - hanH - hanMargin - 10);
      let scale = Math.min(outer.clientWidth / gridW, targetH / gridH);

      const applyZoom = (nextScale) => {
        const h = Math.max(0, gridH * nextScale);
        scaler.style.transformOrigin = 'top center';
        scaler.style.transform = `scale(${nextScale})`;
        outer.style.height = h + 'px';
        outer.style.maxHeight = h + 'px';
        outer.style.overflow = 'hidden';
      };
      applyZoom(scale);

      if (hanNav) {
        const bottom = hanNav.getBoundingClientRect().bottom + (parseFloat(getComputedStyle(hanNav).marginBottom) || 0);
        const limit = viewH - 10;
        if (bottom > limit + 0.5 && gridH > 0) {
          scale = Math.max(0, (gridH * scale - (bottom - limit)) / gridH);
          applyZoom(scale);
        }
      }

      if (typeof TUVI_RENDER !== 'undefined') TUVI_RENDER.reRenderPills();
    }

    window.addEventListener('resize', scaleGrid);
