const TUVI_RENDER = (() => {
      const SHARED = window.TUVI_RENDER_SHARED || {};
      const SHARED_CONST = SHARED.constants || {};

      // ── Lookup helpers: infer số từ string ───────────────────
      const CHI_STR  = ['Tý','Sửu','Dần','Mão','Thìn','Tị','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
      const CAN_STR  = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
      const CUNG_STR = ['Mệnh','Phụ Mẫu','Phúc Đức','Điền Trạch','Quan Lộc','Nô Bộc','Thiên Di','Tật Ách','Tài Bạch','Tử Tức','Phu Thê','Huynh Đệ'];
      const CUC_SO   = { 'Thủy Nhị Cục':2,'Mộc Tam Cục':3,'Kim Tứ Cục':4,'Thổ Ngũ Cục':5,'Hỏa Lục Cục':6 };

      function chiIdx(str)  { return CHI_STR.indexOf(str); }
      function canIdx(str)  { return CAN_STR.indexOf(str); }
      function cungIdx(str) { return CUNG_STR.indexOf(str); }
      function cucSo(str)   { return CUC_SO[str] ?? 0; }

      const SM_CLASS = { 'M': 'sm-m', 'V': 'sm-v', 'B': 'sm-b', 'H': 'sm-h' };

      // ── Tên hiển thị rút gọn ─────────────────────────────────
      const DISPLAY_NAME = { 'Lưu Niên Văn Tinh': 'LN. Văn Tinh' };
      function dn(name) { return DISPLAY_NAME[name] || name; }

      // ── Màu ngũ hành (render tự tính từ nguHanh trong JSON) ──
      const HANH_COLOR = {
        kim: '#76767b',  // bạc
        moc: '#2d6a2d',  // xanh lá
        thuy: '#111118',  // đen
        hoa: '#c0392b',  // đỏ
        tho: '#c8960a',  // vàng
      };
      function hanhStyle(nguHanh) {
        // Mono mode: bỏ màu ngũ hành
        if (getComputedStyle(document.documentElement).getPropertyValue('--mono-mode').trim() === '1') return '';
        if (!nguHanh) return '';
        const c = HANH_COLOR[nguHanh];
        return c ? `color:${c}` : '';
      }

      // sucManh hiển thị dạng "(M)" inline, màu sẽ do parent div quyết định
      const SM_LABEL = { 'M': '(M)', 'V': '(V)', 'Đ': '(D)', 'B': '(B)', 'H': '(H)' };
      function smTag(star) {
        return star.sucManh && SM_LABEL[star.sucManh]
          ? `<span class="sm-inline">${SM_LABEL[star.sucManh]}</span>` : '';
      }
      // Tam hợp: Thân-Tý-Thìn, Tị-Dậu-Sửu, Dần-Ngọ-Tuất, Hợi-Mão-Mùi
      const TAM_HOP = [
        [8, 0, 4],   // Thân Tý Thìn
        [5, 9, 1],   // Tị  Dậu Sửu
        [2, 6, 10],  // Dần Ngọ Tuất
        [11, 3, 7],  // Hợi Mão Mùi
      ];
      // Đối cung: cách nhau 6
      function doiCung(chi) { return (chi + 6) % 12; }
      function tamHopGroup(chi) { return TAM_HOP.find(g => g.includes(chi)) || []; }

      const RULE_ENGINE = SHARED.createRuleEngine
        ? SHARED.createRuleEngine({
          CHI_STR,
          chiIdx,
          doiCung,
          tamHopGroup,
          getLastJson: () => (typeof _lastJson !== 'undefined' ? _lastJson : null),
        })
        : {
          onCungTitleLeftClick: () => {},
          onChinhTinhClick: () => {},
        };
      const PILL_ENGINE = SHARED.createPillEngine
        ? SHARED.createPillEngine({ CHI_GRID_R: SHARED_CONST.CHI_GRID_R || {} })
        : { render: () => {} };
      const CENTER_RENDERER = SHARED.createCenterRenderer
        ? SHARED.createCenterRenderer({
          chiIdx,
          cucSo,
          getLastJson: () => (typeof _lastJson !== 'undefined' ? _lastJson : null),
        })
        : { renderCenter: () => '' };

      // ── Màu địa chi theo ngũ hành ───────────────────────────
      // Tý=0,Sửu=1,Dần=2,Mão=3,Thìn=4,Tị=5,Ngọ=6,Mùi=7,Thân=8,Dậu=9,Tuất=10,Hợi=11
      const CHI_MAU = SHARED_CONST.CHI_MAU || {};

      // ── Render header (TOP) ─────────────────────────────────
      // Chữ cái đầu thiên can
      const CAN_VIET_DAU = SHARED_CONST.CAN_VIET_DAU || ['G', 'Ấ', 'B', 'Đ', 'M', 'K', 'C', 'T', 'N', 'Q'];

      function renderHeader({ cungChuc, diaChi, daiVan, isThan, canCung, tenThang,  tuHoa = []  }) {
        const badge = isThan ? `<span class="badge badge-t">THÂN</span>` : '';
        const TU_HOA_TEN = ['Lộc', 'Quyền', 'Khoa', 'Kỵ'];
        const tuKyHtml = tuHoa.length
          ? `<span class="tu-hoa">${tuHoa.map(h =>
              `<span class="th-${h}" title="Tự hóa ${TU_HOA_TEN[h]}">${'ABCD'[h]}</span>`).join('')}</span>`
          : '';
        const isMono = getComputedStyle(document.documentElement).getPropertyValue('--mono-mode').trim() === '1';
        const ci = chiIdx(diaChi);
        const chiColor = (!isMono && CHI_MAU[ci]) ? ` style="color:${CHI_MAU[ci]}"` : '';
        const canStr = canCung !== undefined ? `${CAN_VIET_DAU[canCung]}.` : '';
        const thangBadge = tenThang ? `<span class="top-thang-inner">${tenThang}</span>` : '';
        return `<div class="cung-top">
      <span class="top-chi"${chiColor}>${canStr}${diaChi}${tuKyHtml}</span>
      <span class="top-ten" title="Click để luận cung"
        onclick="TUVI_RENDER.onCungTitleLeftClick(event, ${ci})">${cungChuc.toUpperCase()}${badge}</span>
      <span class="top-dh">${daiVan !== null ? daiVan : ''}${thangBadge ? `<span class="top-thang">${thangBadge}</span>` : ''}</span>
    </div>`;
      }

      // ── Sao in đậm ──────────────────────────────────────────
      const CAT_BOLD = new Set(SHARED_CONST.CAT_BOLD || []);
      const HUNG_BOLD = new Set(SHARED_CONST.HUNG_BOLD || []);

      // ── Render MIDDLE ────────────────────────────────────────
      function renderMiddle(saoCung, dvSao = [], chi) {
        const chinh = saoCung.filter(s => s.type === 'chinh');
        const cat = saoCung.filter(s => s.type === 'cat');
        const hung = saoCung.filter(s => s.type === 'hung');
        const trung = saoCung.filter(s => s.type === 'trung');

        const chinhLines = ['', ''];
        chinh.forEach((s, i) => {
          if (i < 2) {
            const _ms = hanhStyle(s.nguHanh);
            const safeStar = String(s.name || '').replace(/"/g, '&quot;');
            chinhLines[i] = `<div class="sao-chinh" title="Click để luận theo chính tinh"
            onclick="TUVI_RENDER.onChinhTinhClick(event, ${chi}, &quot;${safeStar}&quot;)"${_ms ? ` style="${_ms}"` : ''}>${s.name.toUpperCase()}${smTag(s)}</div>`;
          }
        });
        const chinhHtml = `<div class="mid-chinh">
      <div class="chinh-row">${chinhLines[0] || '<div class="chinh-empty"></div>'}</div>
      <div class="chinh-row">${chinhLines[1] || '<div class="chinh-empty"></div>'}</div>
    </div>`;

        const catList = [...cat, ...trung].sort((a, b) => (CAT_BOLD.has(b.name) ? 1 : 0) - (CAT_BOLD.has(a.name) ? 1 : 0));
        const hungList = hung.sort((a, b) => (HUNG_BOLD.has(b.name) ? 1 : 0) - (HUNG_BOLD.has(a.name) ? 1 : 0));

        const catHtml = catList.map(s => {
          const bold = CAT_BOLD.has(s.name) ? ' bold' : '';
          const _ms = hanhStyle(s.nguHanh);
          return `<div class="sao-cat${bold}"${_ms ? ` style="${_ms}"` : ''}>${dn(s.name)}${smTag(s)}</div>`;
        }).join('');
        const hungHtml = hungList.map(s => {
          if (s.name === 'Triệt') return '';
          const bold = HUNG_BOLD.has(s.name) ? ' bold' : '';
          const _ms = hanhStyle(s.nguHanh);
          return `<div class="sao-hung${bold}"${_ms ? ` style="${_ms}"` : ''}>${dn(s.name)}${smTag(s)}</div>`;
        }).join('');

        // Sao lưu ĐV - bỏ "ĐV." lấy tên thật, tra SAO_META/SAO_HANH để lấy class và màu
        let dvSaoCatHtml = '', dvSaoHungHtml = '';
        dvSao.forEach(t => {
          const tenThat = t.replace(/^(ĐV\.|L\.)/, '');
          const meta2 = TUVI_DATA.SAO_META[tenThat];
          const hanhRaw = TUVI_DATA.SAO_HANH[tenThat] || '';
          const hanh = hanhRaw.split('-')[0];
          const isHung = meta2?.type === 'hung';
          const isBold = isHung ? HUNG_BOLD.has(tenThat) : CAT_BOLD.has(tenThat);
          const cls = (isHung ? 'sao-hung' : 'sao-cat') + (isBold ? ' bold' : '');
          const _ms = hanhStyle(hanh);
          const html2 = `<div class="${cls}"${_ms ? ` style="${_ms}"` : ''}>${t}</div>`;
          if (isHung) dvSaoHungHtml += html2;
          else dvSaoCatHtml += html2;
        });

        return `<div class="cung-mid">${chinhHtml}<div class="mid-cathung-wrap"><div class="mid-cathung">
      <div class="col-cat">${catHtml}${dvSaoCatHtml}</div>
      <div class="col-hung">${hungHtml}${dvSaoHungHtml}</div>
    </div></div></div>`;
      }

      // ── Render footer (BOTTOM) ──────────────────────────────
      function renderFooter({ truongSinh, thang, daiHan, tenDV, tenLN,isLNDV }) {
        const lndvHtml = isLNDV ? `<div class="bot-ln bot-lndv"><span class="bot-ln-inner">LNĐV</span></div>` : '';

        const dvHtml = tenDV
          ? `<span class="bot-dv"><span class="bot-dv-inner">${tenDV}</span></span>`
          : `<span class="bot-dv"></span>`;
        const lnHtml = tenLN ? `<div class="bot-ln"><span class="bot-ln-inner">${tenLN}</span></div>` : '';
        return `<div class="cung-bot">
      <div class="bot-left-col">${dvHtml}</div>
      <span class="bot-ts">${truongSinh}</span>
      <div class="bot-right-col">
        ${lnHtml}${lndvHtml}
      </div>
    </div>`;
      }

      // ── Render một ô cung ───────────────────────────────────
      function renderCung(cungData) {
        const { diaChi, gridRow, gridCol, sao, dvSao = [] } = cungData;
        const ci = chiIdx(diaChi);
        return `<div class="cung" data-chi="${ci}"
        style="grid-row:${gridRow};grid-column:${gridCol}"
        onclick="TUVI_RENDER.clickCung(${ci})">
      ${renderHeader(cungData)}
      ${renderMiddle(sao, dvSao, ci)}
      ${renderFooter(cungData)}
    </div>`;
      }

      // ── Click cung: highlight tam phương tứ chính ───────────
      let _selectedChi = null;

      const HOA_TEN_NGAN = ['Lộc', 'Quyền', 'Khoa', 'Kị'];

      // Cung `chi` phi hóa thứ `hoa` (0=Lộc,1=Quyền,2=Khoa,3=Kị) → chi cung đích, hoặc null
      function phiHoa(chi, hoa) {
        const json = (typeof _lastJson !== 'undefined') ? _lastJson : null;
        if (!json) return null;
        const can = TUVI_DATA.BANG_THIENCAN_CUNGMENH[canIdx(json.meta.canNam)][chi];
        const tenSao = TUVI_DATA.TU_HOA[can][hoa];
        const c = json.cung.find(c => c.sao.some(s => s.name === tenSao));
        return c ? chiIdx(c.diaChi) : null;
      }

      // Phi tứ hóa: 4 mũi tên từ cung được chọn
      function tinhTuHoaCung(chi) {
        const arrows = [];
        for (let h = 0; h < 4; h++) {
          const to = phiHoa(chi, h);
          if (to === null) continue;
          arrows.push({ from: chi, to, hoa: h,
            label: to === chi ? `Tự hóa ${HOA_TEN_NGAN[h]}` : HOA_TEN_NGAN[h] });
        }
        return { arrows };
      }

           // Lộc Kỵ truy tung (theo phi tinh phái, 祿隨忌走):
      //   cung chọn phi Lộc → X; can X phi Kỵ → Y; can Y phi Kỵ → Z …
      // Dừng khi: Kỵ nhập/xung Mệnh · về cung đã qua · cung nhận tự hóa Kỵ · gặp Kỵ sinh niên
      //           · hoặc đủ MAX_KY bước Kỵ
      const MAX_KY = 3;
      function tinhTruyTung(chi) {
        const json = (typeof _lastJson !== 'undefined') ? _lastJson : null;
        const arrows = [];
        let step = 1;
        const add = (from, to, hoa) => arrows.push({ from, to, hoa, label: '', step: step++ });
        if (!json) return { arrows, flow: true, endReason: '' };

        const a = phiHoa(chi, 0);
        if (a === null) return { arrows, flow: true, endReason: 'Không tìm thấy sao hóa Lộc' };
        add(chi, a, 0);

        const menh = chiIdx(json.meta.chiCungMenh);
        const xungMenh = doiCung(menh);
        // Cung có Kỵ sinh niên = cung đang chứa sao "Hóa Kị" trên lá số
        const cKySN = json.cung.find(c => c.sao.some(s => s.name === 'Hóa Kị'));
        const chiKySN = cKySN ? chiIdx(cKySN.diaChi) : null;
        if (a === chiKySN) return { arrows, flow: true, endReason: 'Lộc nhập cung Kỵ sinh niên' };
        const visited = new Set([chi, a]);
        let from = a, endReason = '';
        for (let n = 0; n < MAX_KY; n++) {
          const to = phiHoa(from, 3);
          if (to === null) { endReason = 'Không tìm thấy sao hóa Kỵ'; break; }
          add(from, to, 3);

          const reasons = [];
          if (to === from) reasons.push('Tự hóa Kỵ');
          if (to === menh) reasons.push('Kỵ nhập Mệnh');
          if (to === xungMenh) reasons.push('Kỵ xung Mệnh');
          if (to === chiKySN) reasons.push('Gặp Kỵ sinh niên');
          if (to !== from && visited.has(to)) reasons.push('Về cung đã qua');
          if (to !== from && phiHoa(to, 3) === to) {           // cung nhận tự hóa Kỵ
            add(to, to, 3);
            reasons.push('Cung nhận tự hóa Kỵ');
          }
          if (reasons.length) { endReason = reasons.join(' · '); break; }

          visited.add(to);
          from = to;
          if (n === MAX_KY - 1) endReason = `Đủ ${MAX_KY} bước Kỵ`;
        }
        return { arrows, flow: true, endReason };
      }

      function tinhFly(chi) {
        const phi = document.getElementById('chkPhiHoa')?.checked;
        const truyTung = document.getElementById('chkTruyTung')?.checked;
        if (truyTung) {
          const s = tinhTruyTung(chi);
          s.showPhi = phi;          // có hiện thêm box Phi hóa không
          return s;
        }
        if (phi) {
          const s = tinhTuHoaCung(chi);
          s.showPhi = true;
          return s;
        }
        return null;                // cả hai đều tắt → không vẽ gì
      }
     
      
      const MAU_HOA = ['#2e8b57', '#d35400', '#2471a3', '#222222'];

      // "Tài Bạch (Ngọ)"
      function tenCung(chi) {
        const json = (typeof _lastJson !== 'undefined') ? _lastJson : null;
        const c = json?.cung.find(c => chiIdx(c.diaChi) === chi);
        return c ? `${c.cungChuc} <span class="tt-chi">(${c.diaChi})</span>` : CHI_STR[chi];
      }

      // Box Phi hóa của cung được click
      function buildPhiHoaBox(chi) {
        const json = (typeof _lastJson !== 'undefined') ? _lastJson : null;
        if (!json) return '';
        const can = TUVI_DATA.BANG_THIENCAN_CUNGMENH[canIdx(json.meta.canNam)][chi];
        const rows = TUVI_DATA.TU_HOA[can].map((tenSao, h) => {
          const to = phiHoa(chi, h);
          const dich = to === null ? '—' : (to === chi ? '<i>tự hóa</i>' : tenCung(to));
          return `<div class="tt-row ph-row">
            <span class="ph-tag" style="background:${MAU_HOA[h]}">${HOA_TEN_NGAN[h]}</span>
            ${tenSao} → ${dich}</div>`;
        }).join('');
        return `<div class="tt-chain ph-box">
          <div class="tt-title">Phi hóa</div>
          <div class="tt-row tt-cung">${tenCung(chi)} <span class="tt-chi">· can ${CAN_STR[can]}</span></div>
          ${rows}</div>`;
      }

      // Box chuỗi Lộc Kỵ truy tung
      function buildChainBox(state) {
        const STEP = 0.7, DRAW = 0.6;   // khớp với renderTuHoa
        const rows = [{ html: tenCung(state.arrows[0].from), cung: true, d: 0 }];
        state.arrows.forEach((ar, i) => {
          const self = ar.to === ar.from;
          const d = i * STEP + DRAW;
          rows.push({ d, html:
            `<span class="tt-badge" style="background:${MAU_HOA[ar.hoa]}">${ar.step}</span>
             <span style="color:${MAU_HOA[ar.hoa]}">↓ ${self ? 'Tự hóa ' : ''}${HOA_TEN_NGAN[ar.hoa]}</span>` });
          if (!self) rows.push({ html: tenCung(ar.to), cung: true, d });
        });
        rows[rows.map(r => r.cung).lastIndexOf(true)].end = true;

        return `<div class="tt-chain">
          <div class="tt-title">Lộc Kỵ truy tung</div>` + rows.map(r =>
          `<div class="tt-row tt-fade${r.cung ? ' tt-cung' : ' tt-link'}${r.end ? ' tt-end' : ''}" style="--d:${r.d}s">
              ${r.html}${r.end ? ` <span class="tt-stop">■ ${state.endReason || 'kết thúc'}</span>` : ''}</div>`).join('') + `</div>`;
      }

      // Hiện box ở giữa lá số: luôn có box Phi hóa, thêm box truy tung nếu đang bật
      function showFlyBoxes(state, chi, gridEl) {
        gridEl?.querySelector('.fly-boxes')?.remove();
        const center = gridEl?.querySelector('.center');
        if (!center || !state || chi === null) return;

        const wrap = document.createElement('div');
        wrap.className = 'fly-boxes';
        const html = (state.showPhi ? buildPhiHoaBox(chi) : '')
        + (state.flow && state.arrows.length ? buildChainBox(state) : '');
      if (!html) return;
      wrap.innerHTML = html;

        // Gắn vào #grid, đặt đúng tâm ô trung tâm
        wrap.style.position = 'absolute';
        wrap.style.left = (center.offsetLeft + center.offsetWidth / 2) + 'px';
        wrap.style.top = (center.offsetTop + center.offsetHeight / 2) + 'px';
        wrap.style.transform = 'translate(-50%, -50%)';
        wrap.style.maxWidth = (center.offsetWidth - 16) + 'px';
        wrap.style.zIndex = 4;
        gridEl.appendChild(wrap);
      }

      // Vẽ mũi tên + box cùng lúc
      function applyFly(state, gridEl) {
        PILL_ENGINE.setTuHoa?.(state, gridEl);
        showFlyBoxes(state, _selectedChi, gridEl);
      }

      function refreshFly() {
        if (_selectedChi === null) return;
        applyFly(tinhFly(_selectedChi), document.getElementById('grid'));
      }
      
      function clickCung(chi) {
        const gridEl = document.getElementById('grid');   // ← phải là dòng ĐẦU TIÊN trong hàm

        if (_selectedChi === chi) {
          _selectedChi = null;
          clearHighlight();
          applyFly(null, gridEl);
          return;
        }
        _selectedChi = chi;
        clearHighlight();
        applyFly(tinhFly(chi), gridEl);

        // Tam phương tứ chính: cung chọn + đối cung + 2 tam hợp → cùng 1 màu
        const doi = doiCung(chi);
        const tamH = tamHopGroup(chi);
        setCungClass(chi, 'hl-selected');
        setCungClass(doi, 'hl-selected');
        tamH.forEach(c => { if (c !== chi) setCungClass(c, 'hl-selected'); });
      }

      function clearHighlight() {
        document.querySelectorAll('.cung').forEach(el => {
          el.classList.remove('hl-selected', 'hl-doi', 'hl-tamhop');
        });
      }

      function setCungClass(chi, cls) {
        const el = document.querySelector(`.cung[data-chi="${chi}"]`);
        if (el) el.classList.add(cls);
      }

      let _lastMeta = null;
      let _lastLuuPills = { triet: null, tuan: null };

      // Thứ tự tên ĐV theo thứ tự cung chức (Mệnh=0, Phụ Mẫu=1, ...)
      const TEN_CUNG_DV = SHARED_CONST.TEN_CUNG_DV || [];
      const TEN_CUNG_LN = SHARED_CONST.TEN_CUNG_LN || [];
      // Ánh xạ tên cung chức → index thứ tự
      const CUNG_CHUC_IDX = { 'Mệnh': 0, 'Phụ Mẫu': 1, 'Phúc Đức': 2, 'Điền Trạch': 3, 'Quan Lộc': 4, 'Nô Bộc': 5, 'Thiên Di': 6, 'Tật Ách': 7, 'Tài Bạch': 8, 'Tử Tức': 9, 'Phu Thê': 10, 'Huynh Đệ': 11 };

      // Sao an theo địa chi cung ĐV.Mệnh (Tý=0..Hợi=11)
      // Sao an theo địa chi cung ĐV.Mệnh (chi: Tý=0..Hợi=11)
      const DV_SAO_THEO_MENH = SHARED_CONST.DV_SAO_THEO_MENH || {};

      // Sao L. an theo địa chi năm xem hạn (Tý=0..Hợi=11)
      const L_SAO_THEO_CHI = SHARED_CONST.L_SAO_THEO_CHI || {};

      // Sao an theo thiên can cung ĐV.Mệnh (can: Giáp=0..Quý=9)
      const DV_SAO_THEO_CAN = SHARED_CONST.DV_SAO_THEO_CAN || {};

      // Sao L. an theo thiên can năm xem hạn (cùng bảng, khác tiền tố)
      const L_SAO_THEO_CAN = SHARED_CONST.L_SAO_THEO_CAN || {};

      function tinhCungDVHienTai(meta, namXem) {
        const { tenCuc, chiCungMenh, thuanChieu, namAL: namSinh } = meta;
        const soCucVal = cucSo(tenCuc);
        const chiMenhIdx = chiIdx(chiCungMenh);
        const tuoi = namXem - namSinh + 1;
        if (tuoi < 0) return null;
        let sttDV = 0;
        while (true) {
          const start = soCucVal + sttDV * 10;
          const end = start + 9;
          if (tuoi < start) return null;
          if (tuoi >= start && tuoi <= end) break;
          sttDV++;
        }
        const chiDVMenh = thuanChieu
          ? (chiMenhIdx + sttDV) % 12
          : (chiMenhIdx - sttDV + 12 * 10) % 12;
        return chiDVMenh;
      }

      // ── Lưu Đại Vận (LNĐV) ──────────────────────────────────
      // k = số năm đã qua trong đại vận (0..9), dir = +1 (Dương Nam/Âm Nữ) hoặc -1 (Âm Nam/Dương Nữ)
      //   k=0: cung gốc (cung đại vận)
      //   k=1: cung xung chiếu
      //   k=2: từ xung chiếu lùi 1 cung (DN/AN) hoặc tiến 1 cung (ÂN/DN)
      //   k=3: trở lại xung chiếu
      //   k>=4: từ xung chiếu đi theo chiều dir, mỗi năm 1 cung
      function tinhCungLuuDaiVan(meta, namXem) {
        const chiGoc = tinhCungDVHienTai(meta, namXem);
        if (chiGoc === null) return null;
        const tuoi = Number(namXem) - Number(meta.namAL) + 1;
        const k = (tuoi - cucSo(meta.tenCuc)) % 10;
        const dir = meta.thuanChieu ? 1 : -1;
        const xung = doiCung(chiGoc);
        let chi;
        if (k === 0) chi = chiGoc;
        else if (k === 1 || k === 3) chi = xung;
        else if (k === 2) chi = xung - dir;
        else chi = xung + dir * (k - 3);
        return ((chi % 12) + 12) % 12;
      }


      function render(lasoJson, gridEl) {
        _selectedChi = null;
        PILL_ENGINE.setTuHoa?.(null);
        _lastMeta = lasoJson.meta;
        const { meta, cung } = lasoJson;

        // Tính cung ĐV hiện tại từ năm xem
        const namXemEl = document.getElementById('namXem');
        const namXem = namXemEl ? (parseInt(namXemEl.dataset.val) || 0) : 0;
        const xemHanChecked = document.getElementById('chkXemHan')?.checked ?? true;
        const xemHan = xemHanChecked && namXem > 0;
        const luuMode = document.querySelector('input[name="luuMode"]:checked')?.value || 'qt';

        // Reset lưu pills
        _lastLuuPills = { triet: null, tuan: null };

        // Sao lưu quan trọng
        const SAOQT = new Set([
          'ĐV.Hóa Lộc', 'ĐV.Hóa Quyền', 'ĐV.Hóa Khoa', 'ĐV.Hóa Kị',
          'L.Hóa Lộc', 'L.Hóa Quyền', 'L.Hóa Khoa', 'L.Hóa Kị',
          'L.Đào Hoa', 'L.Hồng Loan', 'L.Thiên Hỉ',
          'L.Kình Dương', 'L.Đà La', 'ĐV.Kình Dương', 'ĐV.Đà La',
          'L.Thiên Khôi', 'L.Thiên Việt',
          'L.Tang Môn', 'L.Bạch Hổ', 'L.Thiên Khốc', 'L.Thiên Hư',
          'L.Đại Hao', 'L.Tiểu Hao',
        ]);
        const chiDVMenh = xemHan ? tinhCungDVHienTai(meta, namXem) : null;
        const chiLNDV = xemHan ? tinhCungLuuDaiVan(meta, namXem) : null;

        // Map chiIndex → tên ĐV dựa trên tên cung chức
        const dvMap = {};
        if (chiDVMenh !== null) {
          // Tìm cung có chi = chiDVMenh → đó là cung Mệnh ĐV
          // Từ đó ánh xạ: cung có ten X → TEN_CUNG_DV[CUNG_CHUC_IDX[X] offset từ Mệnh ĐV]
          // Thực chất: cung chiDVMenh là ĐV.MỆNH, cung kế tiếp (thuận) là ĐV.PHỤ...
          // Thứ tự cung chức đi thuận chiều từ cung Mệnh ĐV
          for (let i = 0; i < 12; i++) {
            dvMap[(chiDVMenh + i) % 12] = TEN_CUNG_DV[i];
          }
        }

        // An sao lưu theo địa chi cung ĐV.Mệnh
        // Cung lưu niên: L.Mệnh = địa chi năm xem, đi thuận
        const chiLNMenh = namXem % 12;
        const chiNamXem = ((namXem - 4) % 12 + 12) % 12;
        const lnMap = {};
        const thangMap = {};
        if (xemHan) {
          for (let i = 0; i < 12; i++) lnMap[(chiNamXem + i) % 12] = TEN_CUNG_LN[i];
          const delta = Math.abs(namXem - 1900) % 12;
          let chiThang = (delta - (meta.thangAL - 1) + 12 * 12) % 12;
          chiThang = (chiThang + chiIdx(meta.tenChiGio)) % 12;
          for (let i = 0; i < 12; i++) thangMap[(chiThang + i) % 12] = `T${i + 1}`;
        }

        const currentMethod = (typeof getCurrentAnSaoMethod === 'function') ? getCurrentAnSaoMethod() : 'trungchau';
        const ttlLuuTheoChi = (typeof ANSAO_THAITHULANG !== 'undefined'
          && ANSAO_THAITHULANG.TABLES
          && ANSAO_THAITHULANG.TABLES.LUU_SAO_THEO_CHI)
          ? ANSAO_THAITHULANG.TABLES.LUU_SAO_THEO_CHI
          : {};
        const ttlLuuTheoCan = (typeof ANSAO_THAITHULANG !== 'undefined'
          && ANSAO_THAITHULANG.TABLES
          && ANSAO_THAITHULANG.TABLES.LUU_SAO_THEO_CAN)
          ? ANSAO_THAITHULANG.TABLES.LUU_SAO_THEO_CAN
          : {};
        const lSaoTheoChiMethod = currentMethod === 'thaithulang'
          ? {
            ...L_SAO_THEO_CHI,
            // TTL: bổ sung sao lưu theo đúng quy tắc hiện dùng của Vương Đình Chi
            'L.Thái Tuế': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            'L.Đào Hoa': [9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3, 0],
            ...ttlLuuTheoChi,
          }
          : L_SAO_THEO_CHI;
        const lSaoTheoCanMethod = currentMethod === 'thaithulang'
          ? { ...L_SAO_THEO_CAN, ...ttlLuuTheoCan }
          : L_SAO_THEO_CAN;

        const dvSaoMap = {}; // chiIndex → [tên sao lưu]
        if (chiDVMenh !== null) {
          // Theo địa chi
          Object.entries(DV_SAO_THEO_MENH).forEach(([tenSao, arr]) => {
            const chiSao = arr[chiDVMenh];
            if (!dvSaoMap[chiSao]) dvSaoMap[chiSao] = [];
            dvSaoMap[chiSao].push(tenSao);
          });
          // Theo thiên can: lấy can của cung ĐV.Mệnh = BANG_THIENCAN_CUNGMENH[canNam][chiDVMenh]
          const canDVMenh = TUVI_DATA.BANG_THIENCAN_CUNGMENH[canIdx(meta.canNam)][chiDVMenh];
          Object.entries(DV_SAO_THEO_CAN).forEach(([tenSao, arr]) => {
            const chiSao = arr[canDVMenh];
            if (!dvSaoMap[chiSao]) dvSaoMap[chiSao] = [];
            dvSaoMap[chiSao].push(tenSao);
          });
          // An sao L. theo thiên can năm xem hạn
          const canNamXem = ((namXem - 4) % 10 + 10) % 10;
          Object.entries(lSaoTheoCanMethod).forEach(([tenSao, arr]) => {
            const chiSao = arr[canNamXem];
            if (!dvSaoMap[chiSao]) dvSaoMap[chiSao] = [];
            dvSaoMap[chiSao].push(tenSao);
          });
          // An sao N. theo địa chi năm xem hạn
          Object.entries(lSaoTheoChiMethod).forEach(([tenSao, arr]) => {
            const chiSao = arr[chiNamXem];
            if (!dvSaoMap[chiSao]) dvSaoMap[chiSao] = [];
            dvSaoMap[chiSao].push(tenSao);
          });

          // ĐV.Tứ Hóa: theo thiên can cung ĐV.Mệnh
          const HOA_TEN = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kị'];
          // Lookup: tên sao → chiIndex của cung chứa sao đó (từ cung[])
          const chiCuaSao = (tenSao) => {
            const c = cung.find(c => c.sao.some(s => s.name === tenSao));
            return c ? chiIdx(c.diaChi) : undefined;
          };
          TUVI_DATA.TU_HOA[canDVMenh].forEach((tenSaoHoa, i) => {
            const chiSao = chiCuaSao(tenSaoHoa);
            if (chiSao !== undefined) {
              if (!dvSaoMap[chiSao]) dvSaoMap[chiSao] = [];
              dvSaoMap[chiSao].push(`ĐV.${HOA_TEN[i]}`);
            }
          });

          // L.Tứ Hóa: theo thiên can năm xem hạn
          TUVI_DATA.TU_HOA[canNamXem].forEach((tenSaoHoa, i) => {
            const chiSao = chiCuaSao(tenSaoHoa);
            if (chiSao !== undefined) {
              if (!dvSaoMap[chiSao]) dvSaoMap[chiSao] = [];
              dvSaoMap[chiSao].push(`L.${HOA_TEN[i]}`);
            }
          });

        }

        // Lưu Triệt: theo thiên can NĂM XEM (canNamXem)
        // Lưu Tuần: theo địa chi + thiên can NĂM XEM
        if (xemHan) {
          const canNamXemForPill = ((namXem - 4) % 10 + 10) % 10;
          _lastLuuPills.triet = TUVI_DATA.TRIET[canNamXemForPill] || null;
          _lastLuuPills.tuan = TUVI_DATA.TUAN[chiNamXem]?.[canNamXemForPill] || null;
        }

        let html = '';
        cung.forEach(c => {
          const ci = chiIdx(c.diaChi);
          const canCung = TUVI_DATA.BANG_THIENCAN_CUNGMENH[canIdx(meta.canNam)][ci];
          const saoKy = TUVI_DATA.TU_HOA[canCung]?.[3];                       // ← THÊM
          const isTuKy = !!saoKy && c.sao.some(s => s.name === saoKy);        // ← THÊM
          // Tự hóa: danh sách loại hóa (0=Lộc,1=Quyền,2=Khoa,3=Kị) có sao nằm ngay trong cung này
          const tuHoa = (TUVI_DATA.TU_HOA[canCung] || [])
          .map((tenSao, h) => c.sao.some(s => s.name === tenSao) ? h : -1)
          .filter(h => h >= 0);

          // Lọc sao lưu theo chế độ
          let rawDvSao = dvSaoMap[ci] || [];
          if (luuMode === 'dv') rawDvSao = rawDvSao.filter(t => t.startsWith('ĐV.'));
          if (luuMode === 'ln') rawDvSao = rawDvSao.filter(t => t.startsWith('L.'));
          if (luuMode === 'qt') rawDvSao = rawDvSao.filter(t => SAOQT.has(t));
          // luuMode === 'all': giữ nguyên không lọc
          html += renderCung({ ...c, tenDV: dvMap[ci] || '', tenLN: lnMap[ci] || '', tenThang: thangMap[ci] || '', dvSao: rawDvSao, canCung, isLNDV: ci === chiLNDV, tuHoa });
          
        });

        // Hóa xuất: can cung hóa sao nằm ở cung xung chiếu
        const xuat = [];
        cung.forEach(c => {
          const ci = chiIdx(c.diaChi);
          const can = TUVI_DATA.BANG_THIENCAN_CUNGMENH[canIdx(meta.canNam)][ci];
          const doi = cung.find(x => chiIdx(x.diaChi) === doiCung(ci));
          (TUVI_DATA.TU_HOA[can] || []).forEach((tenSao, h) => {
            if (doi?.sao.some(s => s.name === tenSao)) xuat.push({ from: ci, to: doiCung(ci), hoa: h });
          });
        });
        PILL_ENGINE.setXuat?.(xuat);

        html += CENTER_RENDERER.renderCenter(meta);
        gridEl.innerHTML = html;
        requestAnimationFrame(() => PILL_ENGINE.render(meta, gridEl, _lastLuuPills));
      }

      function reRenderPills() {
        if (!_lastMeta) return;
        const gridEl = document.getElementById('grid');
        if (gridEl) requestAnimationFrame(() => PILL_ENGINE.render(_lastMeta, gridEl, _lastLuuPills));
      }

      return {
        render,
        clickCung,
        reRenderPills,
        refreshFly,          // ← THÊM
        onCungTitleLeftClick: RULE_ENGINE.onCungTitleLeftClick,
        onChinhTinhClick: RULE_ENGINE.onChinhTinhClick,
      };
    })();
