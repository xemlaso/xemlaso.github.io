// src/js/render/tuvi-render.js
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
        moc: '#21883a',  // xanh lá
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
      // Tạm tắt click vào tên cung (mở luận cung). Đổi thành true để bật lại.
      const TEN_CUNG_CLICK = false;

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
            <span class="top-ten"${TEN_CUNG_CLICK
        ? ` title="Click để luận cung" onclick="TUVI_RENDER.onCungTitleLeftClick(event, ${ci})"`
        : ` onclick="TUVI_RENDER.onTenCungClick(event, ${ci})"`}>${cungChuc.toUpperCase()}${badge}</span>
      <span class="top-dh">${daiVan !== null ? daiVan : ''}${thangBadge ? `<span class="top-thang">${thangBadge}</span>` : ''}</span>
    </div>`;
      }

      // ── Sao in đậm ──────────────────────────────────────────
      const CAT_BOLD = new Set(SHARED_CONST.CAT_BOLD || []);
      const HUNG_BOLD = new Set(SHARED_CONST.HUNG_BOLD || []);

            // Thứ tự ưu tiên trong cột cát/hung: Tứ hóa → Lục sát → Thiên Hình → các sao khác
            const SAO_UU_TIEN = [
              'Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kị',
              'Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp',
              'Thiên Hình'
            ];
            const rankSao = n => { const i = SAO_UU_TIEN.indexOf(n); return i < 0 ? SAO_UU_TIEN.length : i; };
            const soSao = bold => (a, b) =>
              (rankSao(a.name) - rankSao(b.name)) ||
              ((bold.has(b.name) ? 1 : 0) - (bold.has(a.name) ? 1 : 0));

      // Tạm tắt click vào tên chính tinh (mở luận theo chính tinh). Đổi thành true để bật lại.
      const CHINH_TINH_CLICK = false;
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
            const clickAttr = CHINH_TINH_CLICK
            ? ` title="Click để luận theo chính tinh" onclick="TUVI_RENDER.onChinhTinhClick(event, ${chi}, &quot;${safeStar}&quot;)"`
            : '';
          chinhLines[i] = `<div class="sao-chinh"${clickAttr}${_ms ? ` style="${_ms}"` : ''}>${s.name.toUpperCase()}${smTag(s)}</div>`;
          }
        });
        const chinhHtml = `<div class="mid-chinh">
      <div class="chinh-row">${chinhLines[0] || '<div class="chinh-empty"></div>'}</div>
      <div class="chinh-row">${chinhLines[1] || '<div class="chinh-empty"></div>'}</div>
    </div>`;

    const catList = [...cat, ...trung].sort(soSao(CAT_BOLD));
    const CUOI_HUNG = ['Thiên La', 'Địa Võng', 'Thiên Thương', 'Thiên Sứ'];          // luôn ở cuối cột hung (sau cả sao lưu)
    const hungList = hung.filter(s => !CUOI_HUNG.includes(s.name))
      .sort(soSao(HUNG_BOLD));
    const hungCuoi = CUOI_HUNG.map(t => hung.find(s => s.name === t)).filter(Boolean);

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


        const hungCuoiHtml = hungCuoi.map(s => {
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
            <div class="col-hung">${hungHtml}${dvSaoHungHtml}${hungCuoiHtml}</div>
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
        const { diaChi, gridRow, gridCol, sao, dvSao = [], fire = '' } = cungData;
        const ci = chiIdx(diaChi);
        return `<div class="cung" data-chi="${ci}"
        style="grid-row:${gridRow};grid-column:${gridCol}"
        onclick="TUVI_RENDER.clickCung(${ci})">
      ${renderHeader(cungData)}
      ${renderMiddle(sao, dvSao, ci)}
      ${renderFooter(cungData)}
      ${fire ? `<span class="dv-fire" title="${fire}">🔥</span>` : ''}
    </div>`;
      }
      let _lastKy3 = [];

           // 🔥 nằm ngay dưới số đại vận; nhãn tháng (nếu có) dời xuống dưới 🔥
           function positionFires(gridEl) {
            gridEl.querySelectorAll('.dv-fire').forEach(f => {
              const cell = f.closest('.cung');
              const dh = cell.querySelector('.top-dh');
              const th = cell.querySelector('.top-thang');
              if (!dh) return;
              f.style.top = (dh.offsetTop + dh.offsetHeight) + 'px';
              f.style.right = '3px';
              if (th) th.style.top = `calc(100% + ${f.offsetHeight}px)`;
            });
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
          // arrows.push({ from: chi, to, hoa: h,
            // label: to === chi ? `Tự hóa ${HOA_TEN_NGAN[h]}` : HOA_TEN_NGAN[h] });
          arrows.push({ from: chi, to, hoa: h, label: '' });
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
     
      
      const MAU_HOA = ['#2e8b57', '#c0392b', '#7d3c98', '#222222'];

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
        const tenNgan = chi => json.cung.find(c => chiIdx(c.diaChi) === chi)?.cungChuc || CHI_STR[chi];
        const rows = TUVI_DATA.TU_HOA[can].map((tenSao, h) => {
          const to = phiHoa(chi, h);
          const noiDung = to === null
            ? `Phi hóa ${HOA_TEN_NGAN[h]}: không tìm thấy sao`
            : to === chi
              ? `Tự hóa ${HOA_TEN_NGAN[h]}`
              : `Phi Hóa ${HOA_TEN_NGAN[h]} nhập ${tenNgan(to)}`;
          return `<div class="tt-row ph-row">
            <span class="ph-tag" style="background:${MAU_HOA[h]}">${HOA_TEN_NGAN[h]}</span>
            ${noiDung}</div>`;
        }).join('');
        
        return `<div class="tt-chain ph-box"><button class="box-copy" title="Sao chép">⧉</button>
                            <button type="button" class="ph-toggle" title="Chuyển dạng ngắn gọn / chi tiết">${_phdShow ? 'Ngắn gọn' : 'Chi tiết'}</button>
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

        return `<div class="tt-chain"><button class="box-copy" title="Sao chép">⧉</button>
          <div class="tt-title">Lộc Kỵ truy tung</div>` + rows.map(r =>
          `<div class="tt-row tt-fade${r.cung ? ' tt-cung' : ' tt-link'}${r.end ? ' tt-end' : ''}" style="--d:${r.d}s">
              ${r.html}${r.end ? ` <span class="tt-stop">■ ${state.endReason || 'kết thúc'}</span>` : ''}</div>`).join('') + `</div>`;
      }

            // ── Luận phi hóa: nội dung lấy từ resources/phi hoa/<cung chức> phi hoá.json ──
      //   Mỗi tệp = 1 cung chức, chứa cả 4 loại phi hóa (Lộc, Quyền, Khoa, Kị)
      //   Key (fields[0]): "<Cung> phi hoá <tứ hóa> nhập <Cung>" hoặc "<Cung> tự hoá <tứ hóa>"
      //   So khớp: bỏ thẻ HTML + &nbsp;, gộp khoảng trắng, không phân biệt hoa/thường,
      //            coi "hóa" = "hoá", "kỵ" = "kị"; so bằng toàn bộ key.
      const PHD_DIR = 'resources/phi hoa';
      const _phdCache = new Map();    // tên cung (thường) → Promise<{ file, idx: Map(key → html) } | null>
      let _phdToken = 0;              // tăng mỗi lần dựng lại box → bỏ kết quả tải cũ
      let _phdTab = 0;                // tab đang xem (giữ khi vẽ lại cùng cung)
      let _phdTabChi = null;
      let _phdShow = (() => { try { return localStorage.getItem('phdShow') !== '0'; } catch (e) { return true; } })();

      function phdEscape(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch =>
          ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
      }

      // <template> để parse HTML mà không chạy script / không tải ảnh
      function phdNormKey(html) {
        const tpl = document.createElement('template');
        tpl.innerHTML = String(html ?? '');
        return (tpl.content.textContent || '')
          .normalize('NFC')
          .replace(/[\s\u00a0]+/g, ' ')
          .trim()
          .toLowerCase()
          .replace(/hóa/g, 'hoá')
          .replace(/kỵ/g, 'kị');
      }

      // Tên tệp "<cung chức> phi hoá.json", không phân biệt hoa/thường.
      // Máy chủ tĩnh (GitHub Pages) lại phân biệt, nên thử lần lượt các cách viết thường gặp.
      function phdFileCandidates(cungChuc) {
        const ten = String(cungChuc).normalize('NFC').trim();
        const lower = ten.toLowerCase();
        const sentence = lower.charAt(0).toUpperCase() + lower.slice(1);   // "Phu thê"
        const bases = [sentence, ten, lower];                               // "Phu thê", "Phu Thê", "phu thê"
        const names = bases.flatMap(t => [`${t} phi hoá.json`, `${t} phi hóa.json`]);
        // Thêm dạng Unicode tổ hợp (NFD): Unikey "Unicode tổ hợp"/macOS có thể lưu tên tệp kiểu này
        return [...new Set([...names, ...names.map(n => n.normalize('NFD'))])];
      }

            // Làm sạch HTML nội dung: Anki hay dán kèm style (cỡ chữ, đậm, flex/cột…) làm vỡ bố cục box.
      // Bỏ thẻ style/script…, bỏ thuộc tính style/class/id/kích thước/on*; giữ nguyên cấu trúc ul/li/b…
      const PHD_DROP_ATTR = new Set(['style', 'class', 'id', 'width', 'height', 'align', 'size', 'face', 'color', 'bgcolor']);
      function phdCleanHtml(html) {
        const tpl = document.createElement('template');
        tpl.innerHTML = String(html ?? '');
        tpl.content.querySelectorAll('style, script, link, meta, iframe, object, embed').forEach(e => e.remove());
        tpl.content.querySelectorAll('*').forEach(el => {
          [...el.attributes].forEach(a => {
            const n = a.name.toLowerCase();
            if (PHD_DROP_ATTR.has(n) || n.startsWith('on')) el.removeAttribute(a.name);
          });
        });
        return tpl.innerHTML;
      }

      function phdBuildIndex(data, fileName) {
        const idx = new Map();
        (Array.isArray(data?.notes) ? data.notes : []).forEach(n => {
          const f = n?.fields;
          if (!Array.isArray(f) || f.length < 2) return;
          const k = phdNormKey(f[0]);
          if (!k) return;
          if (idx.has(k)) { console.warn(`[Phi hóa] Key trùng trong ${fileName}: "${k}" (giữ mục đầu)`); return; }
          idx.set(k, phdCleanHtml(f[1]));
        });
        return idx;
      }

      function phdLoad(cungChuc) {
        const cacheKey = String(cungChuc).normalize('NFC').toLowerCase();
        if (!_phdCache.has(cacheKey)) {
          _phdCache.set(cacheKey, (async () => {
            const dir = PHD_DIR.split('/').map(encodeURIComponent).join('/');
            const tried = [];
            for (const name of phdFileCandidates(cungChuc)) {
              let r;
              try { r = await fetch(`${dir}/${encodeURIComponent(name)}`); }
              catch (err) { tried.push(`${name} → lỗi mạng (${err.message})`); continue; }
              if (!r.ok) { tried.push(`${name} → HTTP ${r.status}`); continue; }
              try { return { file: name, idx: phdBuildIndex(JSON.parse(await r.text()), name) }; }
              catch (err) {
                console.warn(`[Phi hóa] JSON lỗi trong ${name}:`, err);
                return { error: `Tệp "${name}" không phải JSON hợp lệ: ${err.message}` };
              }
            }
            console.warn(`[Phi hóa] Không tìm thấy tệp cho cung "${cungChuc}". Đã thử:\n` + tried.join('\n'));
            return {
              error: location.protocol === 'file:'
                ? 'Trang đang mở bằng file:// nên trình duyệt chặn đọc JSON. Bật server.'
                : `Chưa có dữ liệu`,
            };
          })());
        }
        return _phdCache.get(cacheKey);
      }

      function phdKeyText(fromTen, h, toTen, self) {
        return self
          ? `${fromTen} tự hoá ${HOA_TEN_NGAN[h]}`
          : `${fromTen} phi hoá ${HOA_TEN_NGAN[h]} nhập ${toTen}`;
      }

    // Tên cung rút gọn hiện trên tab
    const PHD_CUNG_NGAN = {
      'Mệnh': 'Mệnh', 'Phụ Mẫu': 'Phụ', 'Phúc Đức': 'Phúc', 'Điền Trạch': 'Điền',
      'Quan Lộc': 'Quan', 'Nô Bộc': 'Nô', 'Thiên Di': 'Di', 'Tật Ách': 'Tật',
      'Tài Bạch': 'Tài', 'Tử Tức': 'Tử', 'Phu Thê': 'Phối', 'Huynh Đệ': 'Bào',
    };

      // Khung box: 4 tab + 4 panel (nội dung nạp sau)
      function buildPhiHoaDetailBox(chi) {
        const json = (typeof _lastJson !== 'undefined') ? _lastJson : null;
        if (!json) return '';
        const tab = _phdTabChi === chi ? _phdTab : 0;
        const tenNganOf = ch => {
          const ten = json.cung.find(c => chiIdx(c.diaChi) === ch)?.cungChuc;
          return PHD_CUNG_NGAN[ten] || ten || CHI_STR[ch];
        };
        const tabs = HOA_TEN_NGAN.map((t, h) => {
          const to = phiHoa(chi, h);
          const dich = to === null ? '—' : to === chi ? 'Tự hoá' : tenNganOf(to);
          return `<button type="button" class="phd-tab${h === tab ? ' active' : ''}" data-h="${h}" style="--c:${MAU_HOA[h]}">`
            + `<span class="phd-tab-hoa">${t}</span><span class="phd-tab-cung">${dich}</span></button>`;
        }).join('');
        const panels = HOA_TEN_NGAN.map((_, h) =>
          `<div class="phd-panel" data-h="${h}"><div class="phd-msg">Đang tải…</div></div>`).join('');
        return `<div class="phd-box" data-chi="${chi}" data-tab="${tab}">
            <div class="phd-tabs">${tabs}</div>
            <div class="phd-viewport"><div class="phd-track" style="transform:translateX(${-tab * 100}%)">${panels}</div></div>
          </div>`;
      }

          // Nạp nội dung cho 4 panel (1 tệp cho cả 4 tứ hóa)
          function fillPhiHoaDetail(box, chi, token) {
            const json = (typeof _lastJson !== 'undefined') ? _lastJson : null;
            const cungPhat = json?.cung.find(c => chiIdx(c.diaChi) === chi);
            if (!cungPhat) return;
            const tenOf = ch => json.cung.find(c => chiIdx(c.diaChi) === ch)?.cungChuc || CHI_STR[ch];
            const msg = t => `<div class="phd-msg">${phdEscape(t)}</div>`;
    
            phdLoad(cungPhat.cungChuc).then(res => {
              if (token !== _phdToken || !box.isConnected) return;   // box đã bị thay
              HOA_TEN_NGAN.forEach((tenHoa, h) => {
                const panel = box.querySelector(`.phd-panel[data-h="${h}"]`);
                if (!panel) return;
                const to = phiHoa(chi, h);
                if (to === null) { panel.innerHTML = msg(`Phi hóa ${tenHoa}: không tìm thấy sao trên lá số.`); return; }
                const key = phdKeyText(cungPhat.cungChuc, h, tenOf(to), to === chi);
                const head = `<div class="phd-key">${phdEscape(key)}</div>`;
                if (!res || res.error) {
                  panel.innerHTML = head + msg(res?.error || 'Không tải được dữ liệu.');
                  return;
                }
                const content = res.idx.get(phdNormKey(key));
                panel.innerHTML = head + (content != null
                  ? `<div class="phd-content">${content}</div>`
                  : msg('Chưa có nội dung cho mục này.'));
                panel.scrollTop = 0;
              });
            });
          }
      // Vuốt ngang / bấm tab để đổi tứ hóa; vuốt dọc trong panel để cuộn
      function bindPhiHoaDetail(box) {
        const vp = box.querySelector('.phd-viewport');
        const track = box.querySelector('.phd-track');
        if (!vp || !track) return;
        const N = HOA_TEN_NGAN.length;
        const cur = () => Number(box.dataset.tab) || 0;
        const setTab = i => {
          i = Math.max(0, Math.min(N - 1, i));
          box.dataset.tab = i;
          _phdTab = i;
          _phdTabChi = Number(box.dataset.chi);
          // let _phdShow = (() => { try { return localStorage.getItem('phdShow') !== '0'; } catch (e) { return true; } })();
          track.style.transition = '';
          track.style.transform = `translateX(${-i * 100}%)`;
          box.querySelectorAll('.phd-tab').forEach(b => b.classList.toggle('active', Number(b.dataset.h) === i));
        };

        box.querySelectorAll('.phd-tab').forEach(b => b.addEventListener('click', e => {
          e.stopPropagation();
          setTab(Number(b.dataset.h));
        }));

        let id = null, sx = 0, sy = 0, mode = null, scale = 1;
        vp.addEventListener('pointerdown', e => {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          id = e.pointerId; sx = e.clientX; sy = e.clientY; mode = null;
          // Lá số bị scale bằng transform → đổi px màn hình sang px layout
          scale = (vp.getBoundingClientRect().width / (vp.offsetWidth || 1)) || 1;
        });
        vp.addEventListener('pointermove', e => {
          if (e.pointerId !== id) return;
          const dx = e.clientX - sx, dy = e.clientY - sy;
          if (!mode) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            mode = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
            if (mode === 'h') {
              try { vp.setPointerCapture(id); } catch (err) {}
              track.style.transition = 'none';
            }
          }
          if (mode !== 'h') return;
          e.preventDefault();
          const i = cur();
          let off = dx / scale;
          if ((i === 0 && off > 0) || (i === N - 1 && off < 0)) off /= 3;   // kéo quá đầu/cuối: dính lại
          track.style.transform = `translateX(calc(${-i * 100}% + ${off}px))`;
        });
        vp.addEventListener('pointerup', e => {
          if (e.pointerId !== id) return;
          if (mode === 'h') {
            const dx = (e.clientX - sx) / scale;
            const thr = Math.min(60, vp.offsetWidth * 0.2);
            setTab(dx < -thr ? cur() + 1 : dx > thr ? cur() - 1 : cur());
            window.getSelection?.()?.removeAllRanges();
          }
          id = null; mode = null;
        });
        vp.addEventListener('pointercancel', e => {
          if (e.pointerId !== id) return;
          if (mode === 'h') setTab(cur());
          id = null; mode = null;
        });

        // Trackpad: vuốt ngang 2 ngón
        let wheelLock = 0;
        vp.addEventListener('wheel', e => {
          if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 20) return;
          e.preventDefault();
          const now = Date.now();
          if (now < wheelLock) return;
          wheelLock = now + 450;
          setTab(cur() + (e.deltaX > 0 ? 1 : -1));
        }, { passive: false });
      }

         // Kích thước khi ở dạng chi tiết: rộng theo dạng rút gọn (hoặc cả ô giữa nếu chỉ có Phi hóa)
         function fitPhiHoaDetail(phd, box, center, hasChain, shortW) {
          const vp = phd.querySelector('.phd-viewport');
          if (!vp) return;
          box.style.width = (center.offsetWidth - 36) + 'px';       // luôn cùng bề rộng, có bật Lộc Kị hay không
          const extra = box.offsetHeight - vp.offsetHeight;          // tiêu đề, dòng cung, tab, lề
          const h = Math.max(60, Math.round(center.offsetHeight * 5 / 7) - extra);   // cả box = 2/5 ô giữa
          vp.style.height = h + 'px';
          phd.style.setProperty('--phd-max', h + 'px');              // panel dài hơn thì cuộn dọc
        }

      // Box Phi hóa dạng chi tiết: ẩn các dòng ngắn gọn, gắn phần luận vào cùng box
      function mountPhiHoaDetail(wrap, chi, center) {
        const box = wrap.querySelector('.ph-box');
        if (!box || box.querySelector('.phd-box')) return;
        const shortW = box.offsetWidth;            // đo khi còn ở dạng ngắn gọn
        box.classList.add('is-detail');
        box.insertAdjacentHTML('beforeend', buildPhiHoaDetailBox(chi));
        const phd = box.querySelector('.phd-box');
        if (!phd) return;
        fitPhiHoaDetail(phd, box, center, !!wrap.querySelector('.tt-chain:not(.ph-box)'), shortW);
        bindPhiHoaDetail(phd);
        fillPhiHoaDetail(phd, chi, _phdToken);
      }

      // Box Phi hóa dạng ngắn gọn
      function unmountPhiHoaDetail(wrap) {
        const box = wrap.querySelector('.ph-box');
        if (!box) return;
        box.querySelector('.phd-box')?.remove();
        box.classList.remove('is-detail');
        box.style.width = '';
      }

      // Nút Chi tiết / Ngắn gọn trong box Phi hóa
      function bindPhiHoaToggle(wrap, chi, center) {
        const btn = wrap.querySelector('.ph-toggle');
        if (!btn) return;
        btn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          _phdShow = !_phdShow;
          try { localStorage.setItem('phdShow', _phdShow ? '1' : '0'); } catch (err) {}
          btn.textContent = _phdShow ? 'Rút gọn' : 'Chi tiết';
          if (_phdShow) mountPhiHoaDetail(wrap, chi, center);
          else unmountPhiHoaDetail(wrap);
        });
      }
      // Hiện box ở giữa lá số: luôn có box Phi hóa, thêm box truy tung nếu đang bật
      function showFlyBoxes(state, chi, gridEl) {
        gridEl?.querySelector('.fly-boxes')?.remove();
        ++_phdToken;
        const center = gridEl?.querySelector('.center');
        if (!center || !state || chi === null) return;

        const wrap = document.createElement('div');
        wrap.className = 'fly-boxes';
        const phBoxHtml = state.showPhi ? buildPhiHoaBox(chi) : '';
        const chainHtml = state.flow && state.arrows.length ? buildChainBox(state) : '';
        const html = phBoxHtml + chainHtml;
        
      if (!html) return;
      wrap.innerHTML = html;

        // Gắn vào #grid, đặt đúng tâm ô trung tâm
        wrap.style.position = 'absolute';
        wrap.style.left = (center.offsetLeft + center.offsetWidth / 2) + 'px';
        wrap.style.top = (center.offsetTop + center.offsetHeight / 2) + 'px';
        wrap.style.transform = 'translate(-50%, -50%)';
        wrap.style.maxWidth = (center.offsetWidth - 16) + 'px';
        wrap.style.zIndex = 20;
        gridEl.appendChild(wrap);

        if (wrap.querySelector('.ph-box')) {
          bindPhiHoaToggle(wrap, chi, center);
          if (_phdShow) mountPhiHoaDetail(wrap, chi, center);
        }
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
      
      // ── Tương tác tứ hóa (theo 忌星棋譜, phi tinh phái) ─────────
      const LUC_THAN = ['Mệnh', 'Huynh Đệ', 'Phu Thê', 'Tử Tức', 'Nô Bộc', 'Phụ Mẫu'];

      function tinhTuongTac() {
        const json = (typeof _lastJson !== 'undefined') ? _lastJson : null;
        if (!json) return {};
        const res = {};
        const push = (chi, html) => { (res[chi] ||= new Set()).add(html); };
        const ten = chi => json.cung.find(c => chiIdx(c.diaChi) === chi)?.cungChuc || CHI_STR[chi];
        const tag = (cls, txt) => `<b class="tg ${cls}">${txt}</b>`;

        const ky = [], loc = [];
        for (let c = 0; c < 12; c++) { ky[c] = phiHoa(c, 3); loc[c] = phiHoa(c, 0); }

        // 1. Lưu xuất Kỵ: A phi Kỵ vào cung đối diện
        for (let a = 0; a < 12; a++) {
          if (ky[a] === doiCung(a)) push(a, `${tag('tg-xuat', 'Xuất Kị')} sang ${ten(ky[a])}`);
        }

        // 2. Tuần hoàn Kỵ: A, B đều lục thân; Kỵ A → B và Kỵ B → A
        for (let a = 0; a < 12; a++) for (let b = a + 1; b < 12; b++) {
          if (ky[a] === b && ky[b] === a && LUC_THAN.includes(ten(a)) && LUC_THAN.includes(ten(b))) {
            push(a, `${tag('tg-tuan', 'Tuần hoàn Kị')} với ${ten(b)}`);
            push(b, `${tag('tg-tuan', 'Tuần hoàn Kị')} với ${ten(a)}`);
          }
        }

        // 3. Thị phi Kỵ: A, B không đối nhau; Lộc A → B, Kỵ B → A
        for (let a = 0; a < 12; a++) {
          const b = loc[a];
          if (b === null || b === a || b === doiCung(a)) continue;
          if (ky[b] === a && LUC_THAN.includes(ten(a)) && LUC_THAN.includes(ten(b))) {   // chỉ xét lục thân
            push(a, `${tag('tg-thi', 'Thị phi Kị')} với ${ten(b)}`);
            push(b, `${tag('tg-thi', 'Thị phi Kị')} với ${ten(a)}`);
          }
        }

        // 4. Hỗ xung Kỵ: Kỵ của 2 cung khác nhau rơi vào 2 cung đối diện
        const kyVao = {};                                    // cung nhận → [cung phát]
        for (let a = 0; a < 12; a++) if (ky[a] !== null) (kyVao[ky[a]] ||= []).push(a);
        for (let p = 0; p < 6; p++) {
          const q = p + 6;
          (kyVao[p] || []).forEach(a => (kyVao[q] || []).forEach(b => {
            if (a === b) return;
            if (!LUC_THAN.includes(ten(a)) || !LUC_THAN.includes(ten(b))) return;   // chỉ xét lục thân
            push(a, `${tag('tg-xung', 'Hỗ xung Kị')} với ${ten(b)}`);
            push(b, `${tag('tg-xung', 'Hỗ xung Kị')} với ${ten(a)}`);
          }));
        }

        Object.keys(res).forEach(k => { res[k] = [...res[k]]; });
        return res;
      }

      function showTuongTac(gridEl) {
        gridEl = gridEl || document.getElementById('grid');
        if (!gridEl) return;
        gridEl.querySelectorAll('.tg-box').forEach(e => e.remove());
        if (!document.getElementById('chkTuongTac')?.checked) return;

        const data = tinhTuongTac();
        Object.entries(data).forEach(([chi, lines]) => {
          const cell = gridEl.querySelector(`.cung[data-chi="${chi}"]`);
          if (!cell || !lines.length) return;
          const box = document.createElement('div');
          box.className = 'tg-box';
          const c = _lastJson?.cung.find(c => chiIdx(c.diaChi) === Number(chi));
          box.dataset.title = c ? `${c.cungChuc} (${c.diaChi}):` : '';
          box.innerHTML = `<button class="box-copy" title="Sao chép">⧉</button>`
            + lines.map(l => `<div class="tg-line">${l}</div>`).join('');
          box.style.left = (cell.offsetLeft + cell.offsetWidth / 2) + 'px';
          box.style.top = (cell.offsetTop + cell.offsetHeight / 2) + 'px';
          box.style.width = (cell.offsetWidth - 14) + 'px';   // hẹp hơn ô 14px
          gridEl.appendChild(box);
        });
      }


          // ── Hàm nghĩa cung ──
      //   Chưa chọn cung: resources/lap-cuc/lap-cuc.json        { "<cung>": "<hàm nghĩa>" }
      //   Đã chọn cung X: resources/lap-cuc/lap-cuc-12cung.json  { "<X>": { chu_the, cac_cung: { "<Y>": { vai_tro, y_nghia } } } }
      const HN_URL = 'resources/lap-cuc/lap-cuc.json';
      const HN12_URL = 'resources/lap-cuc/lap-cuc-12cung.json';
      const HN_ALIAS = { 'Tử Tức': 'Tử Nữ' };     // tên trên lá số → tên trong JSON (nếu khác)
      let _hnData = null;                           // Promise<Map(tên thường → nội dung) | null>
      let _hn12Data = null;                         // Promise<Map(tên thường → { chuThe, cac: Map }) | null>
      let _hnToken = 0;
      let _hnChi = null;                            // cung đang làm thái cực (null = hàm nghĩa gốc)

      const hnKey = t => String(t || '').normalize('NFC').trim().toLowerCase();
      // Tra theo tên trên lá số, không có thì thử tên bí danh (Tử Tức → Tử Nữ)
      const hnGet = (map, ten) => map?.get(hnKey(ten)) ?? map?.get(hnKey(HN_ALIAS[ten]));

      function hnFetchJson(url, tag) {
        return fetch(url)
          .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .catch(err => { console.warn(`[${tag}] Không tải được ${url}:`, err); return null; });
      }

      function hnLoad() {
        if (!_hnData) {
          _hnData = hnFetchJson(HN_URL, 'Hàm nghĩa').then(obj => {
            if (!obj) { _hnData = null; return null; }          // lỗi → lần sau tải lại
            return new Map(Object.entries(obj).map(([k, v]) => [hnKey(k), String(v ?? '')]));
          });
        }
        return _hnData;
      }

      function hn12Load() {
        if (!_hn12Data) {
          _hn12Data = hnFetchJson(HN12_URL, 'Lập cực').then(obj => {
            if (!obj) { _hn12Data = null; return null; }
            return new Map(Object.entries(obj).map(([k, v]) => [hnKey(k), {
              chuThe: String(v?.chu_the ?? ''),
              cac: new Map(Object.entries(v?.cac_cung || {}).map(([k2, v2]) => [hnKey(k2), {
                vaiTro: String(v2?.vai_tro ?? ''),
                yNghia: String(v2?.y_nghia ?? ''),
              }])),
            }]));
          });
        }
        return _hn12Data;
      }

      // Nội dung 1 box (dựng bằng DOM, không dùng innerHTML → an toàn với ký tự đặc biệt)
      function hnFill(box, title, body) {
        if (title) {
          const t = document.createElement('div');
          t.className = 'hn-title';
          t.textContent = title;
          box.appendChild(t);
        }
        const d = document.createElement('div');
        d.textContent = body;
        box.appendChild(d);
      }

      function showHamNghia(gridEl) {
        gridEl = gridEl || document.getElementById('grid');
        if (!gridEl) return;
        const token = ++_hnToken;
        gridEl.querySelectorAll('.hn-box').forEach(e => e.remove());
        gridEl.querySelectorAll('.top-ten.hn-active').forEach(e => e.classList.remove('hn-active'));
        if (!document.getElementById('chkHamNghia')?.checked) return;

        const sel = _hnChi;                                     // cung thái cực (click tên cung)
        if (sel !== null) gridEl.querySelector(`.cung[data-chi="${sel}"] .top-ten`)?.classList.add('hn-active');
        Promise.all([hnLoad(), sel !== null ? hn12Load() : null]).then(([map, map12]) => {
          if (token !== _hnToken) return;                       // đã tắt / vẽ lại trong lúc tải
          const json = (typeof _lastJson !== 'undefined') ? _lastJson : null;
          if (!json) return;
          const tenOf = ch => json.cung.find(c => chiIdx(c.diaChi) === ch)?.cungChuc;
          const tenX = sel !== null ? tenOf(sel) : null;
          const lapCuc = sel !== null ? hnGet(map12, tenX) : null;

          gridEl.querySelectorAll('.cung[data-chi]').forEach(cell => {
            const chi = Number(cell.dataset.chi);
            const ten = tenOf(chi);
            if (!ten) return;
            const box = document.createElement('div');
            box.className = 'hn-box';

            if (sel === null) {                                 // chưa chọn cung: hàm nghĩa gốc
              const text = hnGet(map, ten);
              hnFill(box, '', text ?? (map ? 'Chưa có nội dung.' : `Không tải được ${HN_URL}`));
            } else if (!map12) {
              hnFill(box, '', `Không tải được ${HN12_URL}`);
            } else if (!lapCuc) {
              hnFill(box, '', `Chưa có lập cực cho cung ${tenX}.`);
            } else if (chi === sel) {                           // chính cung thái cực
              box.classList.add('hn-self');
              hnFill(box, `Thái cực: ${tenX}`, lapCuc.chuThe ? `Chủ thể: ${lapCuc.chuThe}` : '');
            } else {
              const e = hnGet(lapCuc.cac, ten);
              if (e) hnFill(box, e.vaiTro, e.yNghia);
              else hnFill(box, '', 'Chưa có nội dung.');
            }

            // Bắt đầu ngay dưới khu chính tinh (2 hàng); không có thì dưới hàng tên cung
            const anchor = cell.querySelector('.mid-chinh') || cell.querySelector('.cung-top');
            box.style.top = (anchor ? anchor.offsetTop + anchor.offsetHeight + 2 : 0) + 'px';
            // Bấm/cuộn/bôi đen trong box không chọn cung
            box.addEventListener('click', e => e.stopPropagation());
            cell.appendChild(box);
          });
        });
      }

            // Click tên cung: hiệu ứng 1.5s; nếu đang bật Hàm nghĩa cung thì đổi hiển thị
      //   hàm nghĩa gốc ⇄ lập cực theo cung này (không chọn cung)
      function onTenCungClick(event, chi) {
        const el = event?.currentTarget;
        if (el) {
          el.classList.remove('hn-flash');
          void el.offsetWidth;                                  // chạy lại hiệu ứng khi click liên tiếp
          el.classList.add('hn-flash');
          clearTimeout(el._hnFlashT);
          el._hnFlashT = setTimeout(() => el.classList.remove('hn-flash'), 1500);
        }
        if (!document.getElementById('chkHamNghia')?.checked) return;   // tắt Hàm nghĩa: chọn cung như cũ
        event?.stopPropagation();
        _hnChi = _hnChi === chi ? null : chi;
        showHamNghia();
      }

            // Hàm nghĩa cung và Tương tác tứ hóa: chỉ bật 1 trong 2
            function onHamNghiaToggle(el) {
              const tt = document.getElementById('chkTuongTac');
              if (el?.checked && tt?.checked) { tt.checked = false; showTuongTac(); }
              showHamNghia();
            }
            function onTuongTacToggle(el) {
              const hn = document.getElementById('chkHamNghia');
              if (el?.checked && hn?.checked) { hn.checked = false; showHamNghia(); }
              showTuongTac();
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
          const themSao = (chiSao, tenSao) => {
            if (chiSao === undefined || chiSao === null) return;
            if (!dvSaoMap[chiSao]) dvSaoMap[chiSao] = [];
            dvSaoMap[chiSao].push(tenSao);
          };
          const HOA_TEN = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kị'];
          // Lookup: tên sao → chiIndex của cung chứa sao đó (từ cung[])
          const chiCuaSao = (tenSao) => {
            const c = cung.find(c => c.sao.some(s => s.name === tenSao));
            return c ? chiIdx(c.diaChi) : undefined;
          };
  
          // ── Sao ĐV.: chỉ khi đã vào đại vận (tuổi xem ≥ số cục) ──
          if (chiDVMenh !== null) {
            // Theo địa chi cung ĐV.Mệnh
            Object.entries(DV_SAO_THEO_MENH).forEach(([tenSao, arr]) => themSao(arr[chiDVMenh], tenSao));
            // Theo thiên can cung ĐV.Mệnh = BANG_THIENCAN_CUNGMENH[canNam][chiDVMenh]
            const canDVMenh = TUVI_DATA.BANG_THIENCAN_CUNGMENH[canIdx(meta.canNam)][chiDVMenh];
            Object.entries(DV_SAO_THEO_CAN).forEach(([tenSao, arr]) => themSao(arr[canDVMenh], tenSao));
            // ĐV.Tứ Hóa: theo thiên can cung ĐV.Mệnh
            TUVI_DATA.TU_HOA[canDVMenh].forEach((tenSaoHoa, i) => themSao(chiCuaSao(tenSaoHoa), `ĐV.${HOA_TEN[i]}`));
          }
  
          // ── Sao L. (lưu niên): theo can chi năm xem, KHÔNG phụ thuộc đại vận ──
          //    An cả khi tuổi xem < số cục; chỉ không an khi xem đúng năm sinh (hoặc trước năm sinh)
          const tuoiXem = namXem - Number(meta.namAL) + 1;
          if (xemHan && tuoiXem >= 2) {
            const canNamXem = ((namXem - 4) % 10 + 10) % 10;
            // Theo thiên can năm xem hạn
            Object.entries(lSaoTheoCanMethod).forEach(([tenSao, arr]) => themSao(arr[canNamXem], tenSao));
            // Theo địa chi năm xem hạn
            Object.entries(lSaoTheoChiMethod).forEach(([tenSao, arr]) => themSao(arr[chiNamXem], tenSao));
            // L.Tứ Hóa: theo thiên can năm xem hạn
            TUVI_DATA.TU_HOA[canNamXem].forEach((tenSaoHoa, i) => themSao(chiCuaSao(tenSaoHoa), `L.${HOA_TEN[i]}`));
          }

        // Lưu Triệt: theo thiên can NĂM XEM (canNamXem)
        // Lưu Tuần: theo địa chi + thiên can NĂM XEM
        if (xemHan) {
          const canNamXemForPill = ((namXem - 4) % 10 + 10) % 10;
          _lastLuuPills.triet = TUVI_DATA.TRIET[canNamXemForPill] || null;
          _lastLuuPills.tuan = TUVI_DATA.TUAN[chiNamXem]?.[canNamXemForPill] || null;
        }

        let html = '';

                // ── Kỵ ba tầng: Thiên bàn / Đại vận / Lưu niên ──────────
                const fireMap = {};                    // chi của ô ĐV.X → chú thích
                _lastKy3 = [];
                if (chiDVMenh !== null) {
                  const canNamI = canIdx(meta.canNam);
                  const chiMenh = chiIdx(meta.chiCungMenh);
                  const kyCua = chi => {               // cung `chi` phi Hóa Kỵ (can cung) → chi đích
                    const tenSao = TUVI_DATA.TU_HOA[TUVI_DATA.BANG_THIENCAN_CUNGMENH[canNamI][chi]]?.[3];
                    const c = cung.find(c => c.sao.some(s => s.name === tenSao));
                    return c ? chiIdx(c.diaChi) : null;
                  };
        
                  CUNG_STR.forEach((tenCung, k) => {
                    const lv = [
                      ['TB', (chiMenh + k) % 12],
                      ['ĐV', (chiDVMenh + k) % 12],
                      ['L', (chiNamXem + k) % 12],
                    ];
                    const tenMuc = chi => lv.filter(([, c]) => c === chi).map(([m]) => m + '.' + tenCung).join('/');
                    let diem = 0;
                    const ghiChu = [];
                    const row = { cung: tenCung };
                    lv.forEach(([muc, chi]) => {
                      const ky = kyCua(chi);
                      row[muc] = CHI_STR[chi];
                      row['Kỵ ' + muc] = ky === null ? '—' : CHI_STR[ky];
                      if (ky === null) return;
                      const nhap = lv.some(([, c]) => c === ky);
                      const xung = lv.some(([, c]) => c === doiCung(ky));
                      if (nhap) ghiChu.push(`${muc} Kỵ nhập ${tenMuc(ky)}`);
                      else if (xung) ghiChu.push(`${muc} Kỵ xung ${tenMuc(doiCung(ky))}`);
                      if (nhap || xung) diem++;
                    });
                    row.diem = diem;
                    _lastKy3.push(row);
                    if (diem === 3) fireMap[lv[1][1]] = `${tenCung} – 3 điểm: ${ghiChu.join('; ')}`;
                  });
                }


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
          html += renderCung({ ...c, tenDV: dvMap[ci] || '', tenLN: lnMap[ci] || '', tenThang: thangMap[ci] || '', dvSao: rawDvSao, canCung, isLNDV: ci === chiLNDV, tuHoa
            , fire: fireMap[ci] || ''  });
          
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
        requestAnimationFrame(() => { showTuongTac(gridEl); showHamNghia(gridEl); positionFires(gridEl); });
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
        refreshTuongTac: () => showTuongTac(),
        refreshHamNghia: () => showHamNghia(),
        onHamNghiaToggle,
        onTenCungClick,
        onTuongTacToggle,
      };
    })();
