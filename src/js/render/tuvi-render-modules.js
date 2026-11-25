// src/js/render/tuvi-render-modules.js
window.TUVI_RENDER_SHARED = window.TUVI_RENDER_SHARED || {};

window.TUVI_RENDER_SHARED.constants = {
  
  CHI_MAU: {
    0: '#111118',
    1: '#c8960a',
    2: '#2d6a2d',
    3: '#2d6a2d',
    4: '#c8960a',
    5: '#c0392b',
    6: '#c0392b',
    7: '#c8960a',
    8: '#a8a8b0',
    9: '#a8a8b0',
    10: '#c8960a',
    11: '#111118',
  },
  CAN_VIET_DAU: ['G', 'Ấ', 'B', 'Đ', 'M', 'K', 'C', 'T', 'N', 'Q'],
  CAT_BOLD: ['Thiên Khôi', 'Thiên Việt', 'Tả Phụ', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kị'],
  HUNG_BOLD: ['Đà La', 'Kình Dương', 'Địa Kiếp', 'Địa Không', 'Linh Tinh', 'Hỏa Tinh', 'Hóa Kị', 'Thiên Không', 'Thiên Hình'],
  CHI_GRID_R: {
    5: { r: 1, c: 1 }, 6: { r: 1, c: 2 }, 7: { r: 1, c: 3 }, 8: { r: 1, c: 4 },
    9: { r: 2, c: 4 }, 10: { r: 3, c: 4 },
    11: { r: 4, c: 4 }, 0: { r: 4, c: 3 }, 1: { r: 4, c: 2 }, 2: { r: 4, c: 1 },
    3: { r: 3, c: 1 }, 4: { r: 2, c: 1 },
  },
  // TEN_CUNG_DV: ['ĐV.MỆNH', 'ĐV.PHỤ', 'ĐV.PHÚC', 'ĐV.ĐIỀN', 'ĐV.QUAN', 'ĐV.NÔ', 'ĐV.DI', 'ĐV.TẬT', 'ĐV.TÀI', 'ĐV.TỬ', 'ĐV.PHỐI', 'ĐV.BÀO'],
  TEN_CUNG_DV: ['ĐV.MỆNH'],
  TEN_CUNG_LN: ['L.MỆNH'],
  // TEN_CUNG_LN: ['L.MỆNH', 'L.PHỤ', 'L.PHÚC', 'L.ĐIỀN', 'L.QUAN', 'L.NÔ', 'L.DI', 'L.TẬT', 'L.TÀI', 'L.TỬ', 'L.PHỐI', 'L.BÀO'],
  DV_SAO_THEO_MENH: {
    'ĐV.Thiên Mã': [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5],
  },
  L_SAO_THEO_CHI: {
    'L.Thiên Mã': [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5],
    'L.Cô Thần': [2, 2, 5, 5, 5, 8, 8, 8, 11, 11, 11, 2],
    'L.Quả Tú': [10, 10, 1, 1, 1, 4, 4, 4, 7, 7, 7, 10],
    'L.Hàm Trì': [9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3, 0],
    'L.Hồng Loan': [3, 2, 1, 0, 11, 10, 9, 8, 7, 6, 5, 4],
    'L.Thiên Hỉ': [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11, 10],
  },
  DV_SAO_THEO_CAN: {
    'ĐV.Đà La': [1, 2, 4, 5, 4, 5, 7, 8, 10, 11],
    'ĐV.Lộc Tồn': [2, 3, 5, 6, 5, 6, 8, 9, 11, 0],
    'ĐV.Kình Dương': [3, 4, 6, 7, 6, 7, 9, 10, 0, 1],
    // 'ĐV.Thiên Khôi': [1, 0, 11, 11, 1, 0, 6, 6, 3, 3],
    // 'ĐV.Thiên Việt': [7, 8, 9, 9, 7, 8, 2, 2, 5, 5],
    // 'ĐV.Văn Xương': [5, 6, 8, 9, 8, 9, 11, 0, 2, 3],
    // 'ĐV.Văn Khúc': [9, 8, 6, 5, 6, 5, 3, 2, 0, 11],
  },
  L_SAO_THEO_CAN: {
    'L.Đà La': [1, 2, 4, 5, 4, 5, 7, 8, 10, 11],
    'L.Lộc Tồn': [2, 3, 5, 6, 5, 6, 8, 9, 11, 0],
    'L.Kình Dương': [3, 4, 6, 7, 6, 7, 9, 10, 0, 1],
    'L.Thiên Khôi': [1, 0, 11, 11, 1, 0, 6, 6, 3, 3],
    'L.Thiên Việt': [7, 8, 9, 9, 7, 8, 2, 2, 5, 5],
    'L.Văn Xương': [5, 6, 8, 9, 8, 9, 11, 0, 2, 3],
    'L.Văn Khúc': [9, 8, 6, 5, 6, 5, 3, 2, 0, 11],
  },
};

window.TUVI_RENDER_SHARED.createRuleEngine = function createRuleEngine(deps) {
  const { CHI_STR, chiIdx, doiCung, tamHopGroup, getLastJson } = deps;
  const STAR_GROUPS = {
    'sat tinh': ['kình dương', 'đà la', 'hỏa tinh', 'linh tinh', 'địa không', 'địa kiếp'],
    'luc sat tinh': ['kình dương', 'đà la', 'hỏa tinh', 'linh tinh', 'địa không', 'địa kiếp'],
    'tu sat': ['kình dương', 'đà la', 'hỏa tinh', 'linh tinh'],
  };

  function vnNorm(s) {
    return (s || '')
      .toLowerCase()
      .replace(/đ/g, 'd')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function getRuleTextForCung(cungName) {
    return (typeof TUVI_RULES_TEXT_BY_CUNG !== 'undefined'
      ? (TUVI_RULES_TEXT_BY_CUNG[vnNorm(cungName)] || '')
      : '');
  }
  function parseRuleBlocks(text) {
    const blocks = text.match(/Rule:\s*[\s\S]*?(?=(?:\n\s*Rule:)|\s*$)/g) || [];
    return blocks.map(block => {
      const ruleMatch = block.match(/Rule:\s*([^\n]+)/);
      const explainMatch = block.match(/Explain:\s*([\s\S]*?)(?=(?:\n\s*Raw:)|\s*$)/);
      const rawMatch = block.match(/Raw:\s*([\s\S]*?)\s*$/);
      return {
        rule: (ruleMatch?.[1] || '').trim(),
        explain: (explainMatch?.[1] || '').trim(),
        raw: (rawMatch?.[1] || '').trim(),
      };
    }).filter(x => x.rule && x.explain);
  }
  function parseCondition(condText) {
    const m = condText.trim().match(/^\((.*)\)$/);
    if (!m) return null;
    const parts = m[1].split(',').map(s => s.trim());
    if (parts.length !== 3) return null;
    return { starExpr: parts[0], posExpr: parts[1], relExpr: parts[2] };
  }
  function splitAndOr(expr) {
    const andTerms = expr.split('&').map(t => t.trim()).filter(Boolean);
    return andTerms.map(t => t.split('|').map(x => x.trim()).filter(Boolean));
  }
  function expandStarToken(token) {
    const k = vnNorm(token);
    if (STAR_GROUPS[k]) return STAR_GROUPS[k].map(vnNorm);
    return [k];
  }
  function buildChartIndex(lasoJson) {
    const chiToStars = {};
    const cungNameToChi = {};
    lasoJson.cung.forEach(c => {
      const ci = chiIdx(c.diaChi);
      cungNameToChi[vnNorm(c.cungChuc)] = ci;
      chiToStars[ci] = (c.sao || []).map(s => vnNorm(s.name));
    });
    return { chiToStars, cungNameToChi };
  }
  function resolvePosToken(posToken, contextChi, chartIndex) {
    const k = vnNorm(posToken);
    if (k === '$this') return [contextChi];
    if (k === 'cung menh') {
      const cungMenh = (getLastJson()?.cung || []).find(c => c.isMenh);
      return cungMenh ? [chiIdx(cungMenh.diaChi)] : [];
    }
    if (chartIndex.cungNameToChi[k] !== undefined) return [chartIndex.cungNameToChi[k]];
    const chiPos = CHI_STR.findIndex(x => vnNorm(x) === k);
    if (chiPos >= 0) return [chiPos];
    return [];
  }
  function starsInRelation(posChi, relationName, chartIndex) {
    const rel = vnNorm(relationName);
    let chis = [];
    if (rel === 'toa thu') chis = [posChi];
    else if (rel === 'xung chieu') chis = [doiCung(posChi)];
    else if (rel === 'hoi hop') chis = [posChi, doiCung(posChi), ...tamHopGroup(posChi)];
    else return new Set();
    const set = new Set();
    chis.forEach(chi => (chartIndex.chiToStars[chi] || []).forEach(s => set.add(s)));
    return set;
  }
  function matchStarExpr(starExpr, starSet) {
    const andTerms = splitAndOr(starExpr);
    return andTerms.every(orTerms => orTerms.some(tok => expandStarToken(tok).some(s => starSet.has(s))));
  }
  function relationExprSatisfied(starExpr, relExpr, posChi, chartIndex) {
    const andTerms = splitAndOr(relExpr);
    return andTerms.every(orTerms => orTerms.some(raw => {
      const neg = /^NOT\s+/i.test(raw);
      const relName = raw.replace(/^NOT\s+/i, '').trim();
      const starSet = starsInRelation(posChi, relName, chartIndex);
      if (!starSet.size) return false;
      const yes = matchStarExpr(starExpr, starSet);
      return neg ? !yes : yes;
    }));
  }
  function conditionSatisfied(cond, contextChi, chartIndex) {
    const posAndTerms = splitAndOr(cond.posExpr);
    return posAndTerms.every(orTerms => {
      const posCandidates = new Set();
      orTerms.forEach(tok => resolvePosToken(tok, contextChi, chartIndex).forEach(p => posCandidates.add(p)));
      if (!posCandidates.size) return false;
      for (const pos of posCandidates) {
        if (relationExprSatisfied(cond.starExpr, cond.relExpr, pos, chartIndex)) return true;
      }
      return false;
    });
  }
  function conditionReferencesContext(cond, contextChi, chartIndex) {
    const posAndTerms = splitAndOr(cond.posExpr);
    return posAndTerms.some(orTerms => orTerms.some(tok => {
      if (vnNorm(tok) === '$this') return true;
      const resolved = resolvePosToken(tok, contextChi, chartIndex);
      return resolved.includes(contextChi);
    }));
  }
  function evaluateRulesForCung(contextChi, cungName, lasoJson, onlyStarName = '') {
    const chartIndex = buildChartIndex(lasoJson);
    const rules = parseRuleBlocks(getRuleTextForCung(cungName));
    const starNeed = vnNorm(onlyStarName);
    const hits = [];
    rules.forEach(r => {
      const conds = r.rule.split(';').map(s => s.trim()).filter(Boolean).map(parseCondition).filter(Boolean);
      if (!conds.length) return;
      if (!conds.some(c => conditionReferencesContext(c, contextChi, chartIndex))) return;
      const ok = conds.every(c => conditionSatisfied(c, contextChi, chartIndex));
      if (!ok) return;
      if (starNeed) {
        const matchedStarToken = conds.some(c => vnNorm(c.starExpr).includes(starNeed));
        if (!matchedStarToken) return;
      }
      hits.push({ ...r });
    });
    return hits;
  }
  function renderRuleHitsHtml(cungData, hits, onlyStarName = '') {
    const starTitle = onlyStarName ? ` cho chính tinh <b>${onlyStarName}</b>` : '';
    if (!hits.length) return `<div>Không có rule nào khớp cho cung <b>${cungData.cungChuc}</b> (${cungData.diaChi})${starTitle}.</div>`;
    const list = hits.map((h, i) => `
      <div class="rule-hit">
        <div><b>Rule ${i + 1}</b> - ${h.explain}</div>
        <div class="rule-hit-rule">Rule: ${h.rule}</div>
        ${h.raw ? `<div style="margin-top:6px;color:#5a4630;"><i>Raw: ${h.raw}</i></div>` : ''}
      </div>
    `).join('');
    return `<div style="margin-bottom:8px;color:#6e4d1a;">Tìm thấy <b>${hits.length}</b> rule khớp${starTitle}.</div>${list}`;
  }
  function openRuleModalForChi(chi, onlyStarName = '') {
    const lastJson = getLastJson();
    if (!lastJson || !lastJson.cung) return;
    const cungData = lastJson.cung.find(c => chiIdx(c.diaChi) === chi);
    if (!cungData) return;
    const hits = evaluateRulesForCung(chi, cungData.cungChuc, lastJson, onlyStarName);
    const titleEl = document.getElementById('ruleModalTitle');
    const bodyEl = document.getElementById('ruleModalBody');
    if (!titleEl || !bodyEl) return;
    titleEl.textContent = `Luận cung ${cungData.cungChuc} (${cungData.diaChi})`;
    bodyEl.innerHTML = renderRuleHitsHtml(cungData, hits, onlyStarName);
    document.getElementById('ruleOverlay')?.classList.add('open');
  }
  function onCungTitleLeftClick(event, chi) {
    if (event && event.button !== 0) return;
    if (event) { event.preventDefault(); event.stopPropagation(); }
    openRuleModalForChi(chi);
  }
  function onChinhTinhClick(event, chi, starName) {
    if (event && event.button !== 0) return;
    if (event) { event.preventDefault(); event.stopPropagation(); }
    openRuleModalForChi(chi, starName);
  }
  return { onCungTitleLeftClick, onChinhTinhClick };
};

window.TUVI_RENDER_SHARED.createPillEngine = function createPillEngine(deps) {
  const { CHI_GRID_R } = deps;

  function getScale() {
    const scaler = document.getElementById('gridScaler');
    if (!scaler) return 1;
    const m = new DOMMatrix(getComputedStyle(scaler).transform);
    return m.a || 1;
  }

  const ANCHOR = {
    5: [1, 1], 8: [0, 1], 11: [0, 0], 2: [1, 0],
    6: [0.5, 1], 7: [0.5, 1],
    9: [0, 0.5], 10: [0, 0.5],
    0: [0.5, 0], 1: [0.5, 0],
    3: [1, 0.5], 4: [1, 0.5],
  };
  const CHI_LIST = ['Tý','Sửu','Dần','Mão','Thìn','Tị','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];

  function anchorPoint(chi, gridEl, scale) {
    const el = gridEl.querySelector(`.cung[data-chi="${chi}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect(), g = gridEl.getBoundingClientRect();
    const [fx, fy] = ANCHOR[chi];
    return {
      x: (r.left - g.left + r.width * fx) / scale,
      y: (r.top - g.top + r.height * fy) / scale,
    };
  }

  function renderTamHop(gridEl) {
    gridEl.querySelector('.tamhop-svg')?.remove();
    const cung = (typeof _lastJson !== 'undefined' && _lastJson) ? _lastJson.cung : [];
    const chis = ['Mệnh', 'Tài Bạch', 'Quan Lộc']
      .map(t => cung.find(c => c.cungChuc === t))
      .filter(Boolean)
      .map(c => CHI_LIST.indexOf(c.diaChi));
    if (chis.length !== 3) return;
    const scale = getScale();
    const pts = chis.map(ch => anchorPoint(ch, gridEl, scale));
    if (pts.some(p => !p)) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'tamhop-svg');
    svg.innerHTML = `<polygon points="${pts.map(p => `${p.x},${p.y}`).join(' ')}"
      fill="none" stroke="#888" stroke-opacity="0.35" stroke-width="1.2"/>`;
    gridEl.appendChild(svg);
  }

  const HOA = [
    { ten: 'Lộc',   mau: '#2e8b57' },
    { ten: 'Quyền', mau: '#c0392b' },
    { ten: 'Khoa',  mau: '#7d3c98' },
    { ten: 'Kị',    mau: '#222222' },
  ];
  let _fly = null; // { arrows: [{ from, to, hoa, label }] }

  function renderTuHoa(gridEl) {
    gridEl.querySelector('.tuhoa-svg')?.remove();
    if (!_fly || !_fly.arrows || !_fly.arrows.length) return;
    const cEl = gridEl.querySelector('.center');
    if (!cEl) return;

    const scale = getScale();
    const gr = gridEl.getBoundingClientRect(), cr = cEl.getBoundingClientRect();
    const box = {
      l: (cr.left - gr.left) / scale, t: (cr.top - gr.top) / scale,
      r: (cr.right - gr.left) / scale, b: (cr.bottom - gr.top) / scale,
    };
    const mx = (box.l + box.r) / 2, my = (box.t + box.b) / 2;
    const M = 12;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const rand = seed => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
    const placed = [];
    const overlaps = (x, y) => placed.some(p => Math.abs(p.x - x) < 38 && Math.abs(p.y - y) < 18);
    const label = (x, y, mau, text) =>
      `<text x="${x}" y="${y}" fill="${mau}" font-size="11" font-weight="bold"
        text-anchor="middle" dominant-baseline="middle" class="th-label">${text}</text>`;

    // ── Thông số hiệu ứng dòng chảy (truy tung) ──
    const FLOW = !!_fly.flow;
    const STEP = 0.7;   // giây giữa 2 mũi tên liên tiếp
    const DRAW = 0.6;   // giây vẽ 1 mũi tên
    const MOVE = 0.8;   // giây chấm sáng chạy hết 1 mũi tên
    const badge = (x, y, mau, n, delay) =>
      `<g class="tt-fade" style="--d:${delay}s">
        <circle cx="${x}" cy="${y}" r="8" fill="${mau}" stroke="#fff" stroke-width="1.5"/>
        <text x="${x}" y="${y}" fill="#fff" font-size="10" font-weight="bold"
          text-anchor="middle" dominant-baseline="central">${n}</text></g>`;
    const flowPaths = [];   // [{ idx, mau }] các mũi tên có đường để chấm sáng chạy

    const defs = HOA.map((h, i) =>
      `<marker id="th-arrow-${i}" viewBox="0 0 10 10" refX="9" refY="5"
        markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${h.mau}"/></marker>`).join('');
    let body = '';
    const selfCount = {};

    _fly.arrows.forEach((ar, idx) => {
      const h = HOA[ar.hoa];
      const p0 = anchorPoint(ar.from, gridEl, scale);
      if (!p0) return;

            // Tự hóa: vòng cong đi vào phía tâm rồi quay về chính cung đó
            if (ar.to === ar.from) {
              const n = selfCount[ar.from] = (selfCount[ar.from] || 0) + 1;
              let vx = mx - p0.x, vy = my - p0.y;
              const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;   // hướng vào tâm
              const wx = -vy, wy = vx;                                  // hướng vuông góc
              const R = 38 + (n - 1) * 18;                              // kích thước vòng, vòng sau to hơn
              const g = 5;                                              // tách điểm đầu / điểm cuối
              const sx = p0.x + wx * g, sy = p0.y + wy * g;
              const ex = p0.x - wx * g, ey = p0.y - wy * g;
              const c1x = p0.x + vx * R + wx * R * 0.9, c1y = p0.y + vy * R + wy * R * 0.9;
              const c2x = p0.x + vx * R - wx * R * 0.9, c2y = p0.y + vy * R - wy * R * 0.9;
              const d = `M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`;
              const lx = p0.x + vx * R * 0.75, ly = p0.y + vy * R * 0.75;   // đỉnh vòng
              placed.push({ x: lx, y: ly });
      
              if (FLOW) {
                const hx = ex - c2x, hy = ey - c2y, hl = Math.hypot(hx, hy) || 1;
                const ux = hx / hl, uy = hy / hl, s = 8, w = 0.55;
                const head = `M${ex},${ey}
                  L${ex - ux * s - uy * s * w},${ey - uy * s + ux * s * w}
                  L${ex - ux * s + uy * s * w},${ey - uy * s - ux * s * w} Z`;
                const delay = idx * STEP;
                body += `<path id="tt-p${idx}" class="tt-line" style="--d:${delay}s" d="${d}" fill="none"
                    stroke="${h.mau}" stroke-width="1.8" stroke-opacity="0.9"/>
                  <path class="tt-fade" style="--d:${delay + DRAW}s" d="${head}" fill="${h.mau}"/>`
                  + badge(lx, ly, h.mau, ar.step, delay + DRAW);
                flowPaths.push({ idx, mau: h.mau });
              } else {
                body += `<path d="${d}" fill="none" stroke="${h.mau}" stroke-width="1.6"
                    stroke-opacity="0.85" marker-end="url(#th-arrow-${ar.hoa})"/>`
                  + (ar.label ? label(lx, ly, h.mau, ar.label) : '');
              }
              return;
            }

      const p2 = anchorPoint(ar.to, gridEl, scale);
      if (!p2) return;
      const dx = p2.x - p0.x, dy = p2.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const midx = (p0.x + p2.x) / 2, midy = (p0.y + p2.y) / 2;
      let nx = -dy / len, ny = dx / len;
      if (nx * (mx - midx) + ny * (my - midy) < 0) { nx = -nx; ny = -ny; }

      // Số mũi tên trước đó nối cùng cặp cung (kể cả chiều ngược lại)
      const j = _fly.arrows.slice(0, idx).filter(x =>
        (x.from === ar.from && x.to === ar.to) || (x.from === ar.to && x.to === ar.from)).length;

      const seed = ar.from * 1000 + ar.to * 10 + ar.hoa + idx * 7 + 1;
      let cx, cy, lx, ly;
      for (let a = 0; a < 6; a++) {
        const k = 0.08 + rand(seed + a * 17) * 0.30;            // độ cong
        const off = Math.max(18, len * k) + j * 40 + a * 12;
        cx = clamp(midx + nx * off, box.l + M, box.r - M);
        cy = clamp(midy + ny * off, box.t + M, box.b - M);
        const t = 0.35 + rand(seed + a * 31) * 0.30;
        const u = 1 - t;
        lx = u * u * p0.x + 2 * u * t * cx + t * t * p2.x;
        ly = u * u * p0.y + 2 * u * t * cy + t * t * p2.y;
        if (!overlaps(lx, ly)) break;
      }
      placed.push({ x: lx, y: ly });
      const d = `M${p0.x},${p0.y} Q${cx},${cy} ${p2.x},${p2.y}`;

      if (FLOW) {
        // Đầu mũi tên vẽ tay (hiện sau khi đường vẽ xong), hướng theo tiếp tuyến tại điểm cuối
        const hx = p2.x - cx, hy = p2.y - cy, hl = Math.hypot(hx, hy) || 1;
        const ux = hx / hl, uy = hy / hl, s = 8, w = 0.55;
        const head = `M${p2.x},${p2.y}
          L${p2.x - ux * s - uy * s * w},${p2.y - uy * s + ux * s * w}
          L${p2.x - ux * s + uy * s * w},${p2.y - uy * s - ux * s * w} Z`;
        const delay = idx * STEP;
        body += `<path id="tt-p${idx}" class="tt-line" style="--d:${delay}s" d="${d}" fill="none"
            stroke="${h.mau}" stroke-width="1.8" stroke-opacity="0.9"/>
          <path class="tt-fade" style="--d:${delay + DRAW}s" d="${head}" fill="${h.mau}"/>`
          + badge(lx, ly, h.mau, ar.step, delay + DRAW);
        flowPaths.push({ idx, mau: h.mau });
      } else {
        body += `<path d="${d}" fill="none"
          stroke="${h.mau}" stroke-width="1.6" stroke-opacity="0.85" marker-end="url(#th-arrow-${ar.hoa})"/>`
          + (ar.label ? label(lx, ly, h.mau, ar.label) : '');
      }
    });

    // Chấm sáng chạy lần lượt qua từng mũi tên, lặp lại liên tục
    if (FLOW && flowPaths.length) {
      const startAt = (_fly.arrows.length - 1) * STEP + DRAW;   // bắt đầu khi đã vẽ xong cả chuỗi
      const last = flowPaths[flowPaths.length - 1].idx;
      flowPaths.forEach((fp, k) => {
        const begin = k === 0
          ? `${startAt}s; fm${last}.end+0.5s`
          : `fm${flowPaths[k - 1].idx}.end`;
        body += `<circle r="4.5" fill="#ffd54f" stroke="${fp.mau}" stroke-width="1.5" opacity="0">
            <set attributeName="opacity" to="1" begin="fm${fp.idx}.begin" end="fm${fp.idx}.end"/>
            <animateMotion id="fm${fp.idx}" dur="${MOVE}s" begin="${begin}" fill="remove">
              <mpath href="#tt-p${fp.idx}" xlink:href="#tt-p${fp.idx}"/>
            </animateMotion>
          </circle>`;
      });
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'tuhoa-svg');
    svg.innerHTML = `<defs>${defs}</defs>${body}`;
    gridEl.appendChild(svg);

    if (FLOW) {
      // Độ dài từng đường để hiệu ứng "vẽ dần"
      svg.querySelectorAll('.tt-line').forEach(p => p.style.setProperty('--len', p.getTotalLength()));
      svg.setCurrentTime?.(0);
    }

    // Nền đen mờ cho nhãn chữ (chế độ phi tứ hóa)
    svg.querySelectorAll('.th-label').forEach(t => {
      const b = t.getBBox(), pad = 3;
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', b.x - pad);
      r.setAttribute('y', b.y - pad);
      r.setAttribute('width', b.width + pad * 2);
      r.setAttribute('height', b.height + pad * 2);
      r.setAttribute('rx', 3);
      r.setAttribute('fill', '#000');
      r.setAttribute('fill-opacity', '0.6');
      t.parentNode.insertBefore(r, t);
    });
  }

  function setTuHoa(state, gridEl) {
    _fly = state;
    if (gridEl) {
      gridEl.querySelector('.center')?.classList.toggle('dim', !!state);
      renderTuHoa(gridEl);
      renderXuat(gridEl);          // ← THÊM
    }
  }

    // ── Hóa xuất: can cung hóa sao nằm ở cung xung chiếu ──
    let _xuat = [];                 // [{ from, to, hoa }]
  
  
    function setXuat(list) { _xuat = list || []; }
  
    const XUAT_LEN = 30;                                    // độ dài mũi tên (px)
    const XUAT_MAU = '#555';                                // màu mũi tên: đen nhạt
    const XUAT_KH = ['A', 'B', 'C', 'D'];                   // Lộc, Quyền, Khoa, Kỵ
    const XUAT_KH_MAU = ['#2e8b57', '#c0392b', '#7d3c98', '#000'];
  
    function renderXuat(gridEl) {
      gridEl.querySelector('.xuat-svg')?.remove();
      if (_fly || !_xuat.length) return;          // đang xem phi hóa/truy tung thì ẩn
      const scale = getScale();
  
      // Gom theo cung xuất phát: { from, to, hoas: [0..3] }
      const groups = {};
      _xuat.forEach(x => {
        (groups[x.from] ||= { from: x.from, to: x.to, hoas: [] }).hoas.push(x.hoa);
      });
  
      let body = '';
      Object.values(groups).forEach(g => {
        const p0 = anchorPoint(g.from, gridEl, scale);
        const p2 = anchorPoint(g.to, gridEl, scale);
        if (!p0 || !p2) return;
        const dx = p2.x - p0.x, dy = p2.y - p0.y, len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const L = Math.min(XUAT_LEN, len);
        const ex = p0.x + ux * L, ey = p0.y + uy * L;
  
        body += `<line x1="${p0.x}" y1="${p0.y}" x2="${ex}" y2="${ey}"
          stroke="${XUAT_MAU}" stroke-width="1.4" stroke-opacity="0.8" marker-end="url(#xu-arrow)"/>`;
  
        // Nhãn: hàng vòng tròn ngay sau đầu mũi tên, xếp vuông góc với hướng mũi tên
        const R = 8, gap = 2;
        const cx = ex + ux * (R + 3), cy = ey + uy * (R + 3);
        const px = -uy, py = ux;                          // hướng vuông góc
        const hoas = g.hoas.sort();
        hoas.forEach((h, i) => {
          const s = (i - (hoas.length - 1) / 2) * (R * 2 + gap);
          const bx = cx + px * s, by = cy + py * s;
          body += `<circle cx="${bx}" cy="${by}" r="${R}" fill="${XUAT_KH_MAU[h]}"/>
            <text x="${bx}" y="${by}" fill="#fff" font-size="12" font-weight="bold"
              text-anchor="middle" dominant-baseline="central">${XUAT_KH[h]}</text>`;
        });
      });
  
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'xuat-svg');
      svg.innerHTML = `<defs><marker id="xu-arrow" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${XUAT_MAU}"/></marker></defs>${body}`;
      gridEl.appendChild(svg);
    }
  function pillPos(c1, c2, gridEl) {
    const g1 = CHI_GRID_R[c1], g2 = CHI_GRID_R[c2];
    if (!g1 || !g2) return null;
    const el1 = gridEl.querySelector(`.cung[data-chi="${c1}"]`);
    const el2 = gridEl.querySelector(`.cung[data-chi="${c2}"]`);
    if (!el1 || !el2) return null;
    const gr = gridEl.getBoundingClientRect();
    const scale = getScale();
    const isSameRow = g1.r === g2.r;
    let left; let top;
    if (isSameRow) {
      const lEl = g1.c < g2.c ? el1 : el2;
      const rEl = g1.c < g2.c ? el2 : el1;
      const lR = lEl.getBoundingClientRect();
      const rR = rEl.getBoundingClientRect();
      left = (((lR.right + rR.left) / 2) - gr.left) / scale;
      top = g1.r === 1 ? (lR.bottom - gr.top) / scale : (lR.top - gr.top) / scale;
    } else {
      const tEl = g1.r < g2.r ? el1 : el2;
      const bEl = g1.r < g2.r ? el2 : el1;
      const tR = tEl.getBoundingClientRect();
      const bR = bEl.getBoundingClientRect();
      left = ((tR.left + tR.right) / 2 - gr.left) / scale;
      top = ((tR.bottom + bR.top) / 2 - gr.top) / scale;
    }
    return { left, top };
  }

  function findPillAt(pos, gridEl) {
    const pills = gridEl.querySelectorAll('.triet-pill,.tuan-pill,.tuantriet-pill,.luu-triet-pill,.luu-tuan-pill');
    for (const p of pills) {
      if (Math.abs(parseFloat(p.style.left) - pos.left) < 5 &&
        Math.abs(parseFloat(p.style.top) - pos.top) < 5) return p;
    }
    return null;
  }

  function renderTriet(viTriTriet, gridEl) {
    const pos = pillPos(viTriTriet[0], viTriTriet[1], gridEl);
    if (!pos) return;
    const pill = document.createElement('div');
    pill.className = 'triet-pill';
    pill.dataset.left = pos.left;
    pill.dataset.top = pos.top;
    pill.textContent = 'Triệt';
    pill.style.left = pos.left + 'px';
    pill.style.top = pos.top + 'px';
    gridEl.appendChild(pill);
  }

  function renderTuan(viTriTuan, gridEl) {
    if (!viTriTuan) return;
    const pos = pillPos(viTriTuan[0], viTriTuan[1], gridEl);
    if (!pos) return;
    const trietPill = gridEl.querySelector('.triet-pill');
    if (trietPill) {
      const tLeft = parseFloat(trietPill.dataset.left);
      const tTop = parseFloat(trietPill.dataset.top);
      if (Math.abs(tLeft - pos.left) < 5 && Math.abs(tTop - pos.top) < 5) {
        trietPill.textContent = 'Tuần-Triệt';
        trietPill.className = 'tuantriet-pill';
        return;
      }
    }
    const pill = document.createElement('div');
    pill.className = 'tuan-pill';
    pill.textContent = 'Tuần';
    pill.style.left = pos.left + 'px';
    pill.style.top = pos.top + 'px';
    gridEl.appendChild(pill);
  }

  function renderLuuTriet(chis, gridEl) {
    if (!chis) return;
    const pos = pillPos(chis[0], chis[1], gridEl);
    if (!pos) return;
    const existing = findPillAt(pos, gridEl);
    if (existing) { existing.textContent += '·L.Triệt'; return; }
    const pill = document.createElement('div');
    pill.className = 'luu-triet-pill';
    pill.textContent = 'L.Triệt';
    pill.style.left = pos.left + 'px';
    pill.style.top = pos.top + 'px';
    gridEl.appendChild(pill);
  }

  function renderLuuTuan(chis, gridEl) {
    if (!chis) return;
    const pos = pillPos(chis[0], chis[1], gridEl);
    if (!pos) return;
    const existing = findPillAt(pos, gridEl);
    if (existing) { existing.textContent += '·L.Tuần'; return; }
    const pill = document.createElement('div');
    pill.className = 'luu-tuan-pill';
    pill.textContent = 'L.Tuần';
    pill.style.left = pos.left + 'px';
    pill.style.top = pos.top + 'px';
    gridEl.appendChild(pill);
  }

  function render(meta, gridEl, luuPills) {
    gridEl.querySelectorAll('.triet-pill,.tuan-pill,.tuantriet-pill,.luu-triet-pill,.luu-tuan-pill').forEach(p => p.remove());
    if (meta.viTriTriet) renderTriet(meta.viTriTriet, gridEl);
    if (meta.viTriTuan) renderTuan(meta.viTriTuan, gridEl);
    const xemHan = document.getElementById('chkXemHan')?.checked ?? true;
    if (xemHan) {
      if (luuPills?.triet) renderLuuTriet(luuPills.triet, gridEl);
      if (luuPills?.tuan) renderLuuTuan(luuPills.tuan, gridEl);
    }
    renderTamHop(gridEl);   // ← THÊM DÒNG NÀY
    renderTuHoa(gridEl);
    renderXuat(gridEl);          // ← THÊM
  }

  return { render,setTuHoa,setXuat };
};

window.TUVI_RENDER_SHARED.createCenterRenderer = function createCenterRenderer(deps) {
  const { chiIdx, cucSo, getLastJson } = deps;

  function renderCenter(meta) {
    const { hoTen, ngayAL, thangAL, namAL, canNam, chiNam, gioSinh, tenChiGio,
      gioiTinh, chiCungMenh, tenCuc, thuanChieu, napAm } = meta;

    const canChi = `${canNam} ${chiNam}`;
    const amDuong = gioiTinh === 'nam'
      ? (thuanChieu ? 'Dương Nam' : 'Âm Nam')
      : (thuanChieu ? 'Âm Nữ' : 'Dương Nữ');

    const V = getLastJson() ? getLastJson().cung : null;
    const chiMenhIdx = chiIdx(chiCungMenh);
    const MENH_CHU = ['Tham Lang', 'Cự Môn', 'Lộc Tồn', 'Văn Khúc', 'Liêm Trinh', 'Vũ Khúc', 'Phá Quân'];
    const cungMenhSao = chiMenhIdx >= 0
      ? MENH_CHU[Math.min(chiMenhIdx, 12 - chiMenhIdx)]
      : '—';
    // Index theo CHI_STR: Tý, Sửu, Dần, Mão, Thìn, Tị, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi
    const THAN_CHU = [
      'Linh Tinh',   // Tý
      'Thiên Tướng', // Sửu
      'Thiên Lương', // Dần
      'Thiên Đồng',  // Mão
      'Văn Xương',   // Thìn
      'Thiên Cơ',    // Tị
      'Hỏa Tinh',    // Ngọ
      'Thiên Tướng', // Mùi
      'Thiên Lương', // Thân
      'Thiên Đồng',  // Dậu
      'Văn Xương',   // Tuất
      'Thiên Cơ'     // Hợi
    ];
    const chiNamIdx = chiIdx(chiNam);
    const cungThanSao = chiNamIdx >= 0 ? THAN_CHU[chiNamIdx] : '—';

    const chiMenhAmDuong = chiMenhIdx % 2 === 1 ? 'am' : 'duong';
    const nguoiAmDuong = (amDuong === 'Âm Nam' || amDuong === 'Âm Nữ') ? 'am' : 'duong';
    const thuanLy = (nguoiAmDuong === 'am' && chiMenhAmDuong === 'am')
      || (nguoiAmDuong === 'duong' && chiMenhAmDuong === 'duong');
    const amDuongLy = thuanLy ? 'Âm Dương Thuận Lý' : 'Âm Dương Nghịch Lý';

    const hanhNapAm = (napAm || '').split(' ').pop().toLowerCase()
      .replace('kim', 'kim').replace('thủy', 'thuy').replace('mộc', 'moc')
      .replace('hỏa', 'hoa').replace('thổ', 'tho');
    const hanhCuc = { 2: 'thuy', 3: 'moc', 4: 'kim', 5: 'tho', 6: 'hoa' }[cucSo(tenCuc)] || '';
    function quanheMenhCuc(menh, cuc) {
      const sinh = { kim: 'thuy', thuy: 'moc', moc: 'hoa', hoa: 'tho', tho: 'kim' };
      const khac = { kim: 'moc', thuy: 'hoa', moc: 'tho', hoa: 'kim', tho: 'thuy' };
      if (sinh[menh] === cuc) return 'Mệnh Sinh Cục';
      if (sinh[cuc] === menh) return 'Cục Sinh Mệnh';
      if (khac[menh] === cuc) return 'Mệnh Khắc Cục';
      if (khac[cuc] === menh) return 'Cục Khắc Mệnh';
      return 'Mệnh Cục Bình Hòa';
    }
    const quanHeMenhCuc = quanheMenhCuc(hanhNapAm, hanhCuc);
    const thanCu = V ? (V.find(c => c.isThan)?.cungChuc || '—') : '—';
    let ngayDLText = '—';
    if (typeof lunar2Solar === 'function') {
      const sol = lunar2Solar(ngayAL, thangAL, namAL, 0);
      if (sol && sol[0] && sol[1] && sol[2]) ngayDLText = `${sol[0]}/${sol[1]}/${sol[2]}`;
    }

    const isMono = getComputedStyle(document.documentElement).getPropertyValue('--mono-mode').trim() === '1';
    const bl = isMono ? '#000000' : 'rgb(51,47,142)';
    const namXemEl = document.getElementById('namXem');
    const namXem = namXemEl ? (parseInt(namXemEl.dataset.val) || 0) : 0;
    const showNamHan = (document.getElementById('chkXemHan')?.checked ?? true) && namXem > 0;

    const bq = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" fill="#1a1008"/>
      <path d="M100,10 A90,90 0 0,1 100,190 A45,45 0 0,1 100,100 A45,45 0 0,0 100,10Z" fill="#fff"/>
      <circle cx="100" cy="55" r="15" fill="#1a1008"/>
      <circle cx="100" cy="145" r="15" fill="#fff"/>
      <circle cx="100" cy="100" r="90" fill="none" stroke="#1a1008" stroke-width="2"/>
    </svg>`;

    const row = (label, val, extra = '') => `
      <tr>
        <td style="font-weight:bold;color:#111;white-space:nowrap;padding:1.5px 8px 1.5px 0;vertical-align:top;">${label}</td>
        <td style="color:${bl};padding:1.5px 0;vertical-align:top;">${val}</td>
        ${extra ? `<td style="color:${bl};padding:1.5px 0 1.5px 6px;vertical-align:top;">${extra}</td>` : '<td></td>'}
      </tr>`;

    return `<div class="center" style="grid-row:2/4;grid-column:2/4;align-items:center;justify-content:center;padding:0;overflow-y:auto;text-align:left;">
      <div class="center-bg">${bq}<div class="center-mark"><img class="center-slogan" src="resources/sologan-laso/dich_hoc_tinh_hoa3.png" alt=""><img class="center-antin" src="resources/sologan-antin/an_tin_icon3.png" alt=""></div></div>
      <div style="width:67%;position:relative;z-index:1;margin:auto;">
      <div style="text-align:center;width:100%;margin-bottom:6px;">
        <div style="font-family:'Playfair Display',serif;font-size:15px;font-weight:900;color:${bl};letter-spacing:2px;">LÁ SỐ TỬ VI</div>
      </div>
      <div style="text-align:center;width:100%;margin-bottom:6px;">
        <div style="font-family:'Playfair Display',serif;font-size:12px;font-weight:400;font-style:italic;color:${bl};letter-spacing:2px;">Tận nhân lực, tri thiên mệnh</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;width:100%;margin:2px 0 8px;">
  <div style="flex:1;height:1px;background:linear-gradient(to right,transparent,${bl});"></div>
  <span style="color:${bl};font-size:9px;line-height:1;">✦</span>
  <div style="flex:1;height:1px;background:linear-gradient(to left,transparent,${bl});"></div>
</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;font-family:Arial,sans-serif;">
      ${row('Họ tên:', hoTen ? `<span style="color:#c0392b;font-weight:bold;">${hoTen}</span>` : '—')}
        ${row('Năm:', `${namAL} - ${canChi}`)}
        ${row('Ngày DL:', ngayDLText)}
        ${row('Ngày AL:', `${ngayAL}/${thangAL}/${namAL}`)}
        ${row('Giờ:', `${gioSinh} (${tenChiGio})`)}
      
        ${row('Âm Dương:', amDuong)}
        ${row('Nạp Âm:', napAm || '—')}
        ${row('Cục:', tenCuc)}
        <tr><td colspan="3" style="padding:1.5px 0;font-size:13px;line-height:1.2;">&nbsp;</td></tr>
        ${row('Chủ Mệnh:', cungMenhSao)}
        ${row('Chủ Thân:', cungThanSao)}
        
        <tr><td colspan="3" style="padding:1.5px 0;font-size:13px;line-height:1.2;">&nbsp;</td></tr>
        <tr><td></td><td colspan="2" style="color:${bl};font-size:13px;padding:1.5px 0;font-weight:bold;">${amDuongLy}</td></tr>
        <tr><td></td><td colspan="2" style="color:${bl};font-size:13px;padding:1.5px 0;font-weight:bold;">${quanHeMenhCuc}</td></tr>
        <tr><td></td><td colspan="2" style="color:${bl};font-size:13px;padding:1.5px 0;font-weight:bold;">Thân cư ${thanCu}</td></tr>
        <tr><td colspan="3" style="padding:1.5px 0;font-size:13px;line-height:1.2;">&nbsp;</td></tr>
        ${showNamHan ? `<tr>
          <td style="font-weight:bold;color:#111;white-space:nowrap;padding:1.5px 8px 1.5px 0;vertical-align:top;">Năm hạn:</td>
          <td colspan="2" style="color:#c0392b;padding:1.5px 0;vertical-align:top;font-weight:700;font-size:18px;">${namXem} (${Number(namXem) - Number(namAL) + 1} tuổi)</td>
        </tr>` : ''}
      </table>
      </div>
    </div>`;
  }

  return { renderCenter };
};
