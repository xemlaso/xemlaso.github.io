// src/js/cloud/laso-cloud.js
// ── Lá số đã lưu: danh sách + tìm kiếm, mở, lưu/cập nhật, xóa (Firestore) ──
//   Dữ liệu: users/{uid}/laso/{id}        – thông tin đầu vào, canh giờ, cung Mệnh, note (mở lại thì tính lại lá số)
//            users/{uid}/laso/{id}/anh/{a} – mỗi ảnh một bản ghi (đã nén, dạng data URL)
(function () {
    'use strict';
  
    const $ = id => document.getElementById(id);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const noDau = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
  
    let user = null;          // người đang đăng nhập (đã xác minh email)
    let unsub = null;         // huỷ theo dõi Firestore
    let items = [];           // [{ id, ...data }] – đang hiển thị (đã bỏ lá số chờ xóa)
    let allItems = [];        // toàn bộ lá số nhận từ Firestore
    let loaded = false;
    let query = '';
    let currentId = null;     // lá số đang mở (đã lưu)
    let savedForm = null;     // ảnh chụp form lúc mở/lưu → so để biết đã sửa chưa
    let savedNote = '';       // note lúc mở/lưu
    let busy = false;
    // Ảnh của lá số đang mở: [{ id, data, isNew }] – chỉ ghi lên Firebase khi bấm Lưu
    let images = [];
    let deletedImageIds = [];
    const MAX_IMAGES = 10;
  
    const col = () => window.FB.db.collection('users').doc(user.uid).collection('laso');
    const ts = () => firebase.firestore.FieldValue.serverTimestamp();
  
    // ── Popup chọn (dùng khung .rc-overlay/.rc-box) ─────────────
    // buttons: [{ key, label, kind: 'ok'|'danger'|'' }] → Promise<key | null>
    function askChoice(title, text, buttons) {
      return new Promise(resolve => {
        const ov = document.createElement('div');
        ov.className = 'rc-overlay';
        ov.innerHTML = `<div class="rc-box cl-ask" role="dialog" aria-modal="true">
            <div class="rc-title">${esc(title)}</div>
            <div class="rc-text">${text}</div>
            <div class="rc-actions">${buttons.map(b =>
              `<button type="button" data-key="${b.key}" class="${b.kind === 'ok' ? 'rc-ok cl-ok' : b.kind === 'danger' ? 'rc-ok cl-danger' : 'rc-cancel'}">${esc(b.label)}</button>`).join('')}
            </div></div>`;
        const done = key => { ov.remove(); document.removeEventListener('keydown', onKey, true); resolve(key); };
        const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); done(null); } };
        ov.addEventListener('click', e => {
          if (e.target === ov) return done(null);
          const b = e.target.closest('[data-key]');
          if (b) done(b.dataset.key);
        });
        document.addEventListener('keydown', onKey, true);
        document.body.appendChild(ov);
        (ov.querySelector('.rc-cancel') || ov.querySelector('button'))?.focus();
      });
    }
  
    function toast(msg) {
      const t = document.createElement('div');
      t.className = 'cl-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3500);
    }
  
    // ── Note: làm sạch HTML (chỉ giữ định dạng của thanh công cụ note) ──
    const NOTE_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'H1', 'H2', 'H3', 'H4', 'P', 'DIV',
      'BR', 'UL', 'OL', 'LI', 'FONT', 'SPAN', 'BLOCKQUOTE', 'IMG']);
    function cleanNote(html) {
      const tpl = document.createElement('template');
      tpl.innerHTML = String(html ?? '');
      const walk = node => {
        [...node.childNodes].forEach(n => {
          if (n.nodeType === 8) { n.remove(); return; }                 // comment
          if (n.nodeType !== 1) return;
          if (!NOTE_TAGS.has(n.tagName)) {                               // thẻ lạ: bỏ thẻ, giữ chữ
            if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META)$/.test(n.tagName)) { n.remove(); return; }
            walk(n);
            n.replaceWith(...n.childNodes);
            return;
          }
          if (n.tagName === 'IMG') {                                     // ảnh trong note: chỉ giữ mã ảnh
            const id = n.getAttribute('data-anh');
            if (!/^[A-Za-z0-9_-]{1,40}$/.test(id || '')) { n.remove(); return; }
            [...n.attributes].forEach(a => { if (a.name !== 'data-anh') n.removeAttribute(a.name); });
            n.className = 'note-img';
            return;
          }
          [...n.attributes].forEach(a => {
            const name = a.name.toLowerCase();
            if (n.tagName === 'FONT' && name === 'color' && /^#[0-9a-f]{3,8}$|^[a-z]+$/i.test(a.value)) return;
            if (name === 'style') {                                      // chỉ giữ màu chữ / màu nền
              const keep = [];
              const color = n.style.color, bg = n.style.backgroundColor;
              n.removeAttribute('style');
              if (color) keep.push('color:' + color);
              if (bg) keep.push('background-color:' + bg);
              if (keep.length) n.setAttribute('style', keep.join(';'));
              return;
            }
            n.removeAttribute(a.name);
          });
          walk(n);
        });
      };
      walk(tpl.content);
      return tpl.innerHTML;
    }
    const noteEl = () => $('noteEditor');
    const getNote = () => {
      const ed = noteEl();
      if (!ed || (!ed.textContent.replace(/\s+/g, '') && !ed.querySelector('img'))) return '';
      return cleanNote(ed.innerHTML);
    };
    // Gắn dữ liệu ảnh vào các <img data-anh> trong note
    function hydrateNoteImages() {
      const ed = noteEl();
      if (!ed) return;
      ed.querySelectorAll('img[data-anh]').forEach(img => {
        const im = images.find(x => x.id === img.dataset.anh);
        img.className = 'note-img';
        if (im) { img.src = im.data; img.alt = ''; }
        else { img.removeAttribute('src'); img.alt = '(ảnh đã xóa)'; }
      });
    }
    function setNote(html) {
      const ed = noteEl();
      if (!ed) return;
      ed.innerHTML = cleanNote(html || '');
      hydrateNoteImages();
      renderGallery();
         // Không tự mở/đóng cột Note: bật/tắt Note là lựa chọn chung của người dùng (note-panel.js)
    }
  
    // ── Form ⇄ dữ liệu ──────────────────────────────────────────
    const val = id => String($(id)?.value ?? '').trim();
    const curTab = () => (window._currentTab === 'AL' ? 'AL' : 'DL');
  

      // Giờ Tý muộn (23h–24h) thuộc ngày âm hôm sau → ngày DL thật lúc sinh = (ngày DL quy từ ngày âm) − 1
  function dlThuc(d, m, y) {
    if (val('gio') !== '23:00') return [d, m, y];
    const t = new Date(y, m - 1, d - 1);
    return [t.getDate(), t.getMonth() + 1, t.getFullYear()];
  }

    // Ảnh chụp form để biết đã sửa chưa: so theo ngày sinh thực (quy về dương lịch),
    // không phụ thuộc đang đứng ở tab Dương lịch hay Âm lịch
    function formSnap() {
      let d;
      if (curTab() === 'AL') {
        const s = typeof lunar2Solar === 'function' ? lunar2Solar(+val('ngay'), +val('thang'), +val('nam'), 0) : null;
        d = s && s[2] ? dlThuc(+s[0], +s[1], +s[2]) : ['AL', val('ngay'), val('thang'), val('nam')];
      } else {
        d = [+val('ngayDL'), +val('thangDL'), +val('namDL')];
      }
      return JSON.stringify({ hoTen: val('hoTen'), gt: val('gt'), gio: val('gio'), d });
    }
  
    // Dữ liệu ghi lên Firestore (lấy ngày ÂL/DL từ lá số vừa lập để luôn đúng & đủ cả hai)
    function buildDoc() {
      const m = (typeof _lastJson !== 'undefined' && _lastJson) ? _lastJson.meta : null;
      if (!m) throw new Error('Chưa lập được lá số từ thông tin trong form.');
      let dl = null;
      if (typeof lunar2Solar === 'function') {
        const s = lunar2Solar(m.ngayAL, m.thangAL, m.namAL, 0);
        if (s && s[2]) { const t = dlThuc(+s[0], +s[1], +s[2]); dl = { d: t[0], m: t[1], y: t[2] }; }
      }
      if (!dl) dl = { d: +val('ngayDL'), m: +val('thangDL'), y: +val('namDL') };
      const hoTen = val('hoTen').slice(0, 100);
      const note = getNote();
      if (note.length > 200000) throw new Error('Note quá dài (giới hạn khoảng 200.000 ký tự).');
      return {
        hoTen,
        hoTenKhongDau: noDau(hoTen).slice(0, 100),
        gioiTinh: val('gt') === 'nu' ? 'nu' : 'nam',
        lichNhap: curTab(),
        dl,
        al: { d: +m.ngayAL, m: +m.thangAL, y: +m.namAL },
        gio: val('gio').slice(0, 5),
        canhGio: (window.canhGioInfo?.(val('gio'))?.ten || String(m.tenChiGio || '')).slice(0, 10),
        menh: menhInfo(),
        soAnh: images.length,
        note,
      };
    }
  
    // Cung Mệnh của lá số vừa lập: địa chi + chính tinh (để sau này tìm kiếm)
    function menhInfo() {
      const j = (typeof _lastJson !== 'undefined') ? _lastJson : null;
      const c = j?.cung?.find(x => x.isMenh) || j?.cung?.find(x => x.diaChi === j?.meta?.chiCungMenh);
      return {
        chi: String(c?.diaChi || j?.meta?.chiCungMenh || '').slice(0, 10),
        chinhTinh: (c?.sao || []).filter(s => s.type === 'chinh').map(s => String(s.name).slice(0, 30)).slice(0, 4),
      };
    }
  
    function setField(id, v) {
      const el = $(id);
      if (!el) return;
      v = String(v ?? '');
      if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === v)) el.add(new Option(v, v));
      el.value = v;
    }
  
    // Lập lá số từ form, bỏ qua popup "đã sửa" (dùng nội bộ)
    let silent = false;
    function lapSilent() {
      silent = true;
      try { if (typeof lapLaSo === 'function') lapLaSo(); } finally { silent = false; }
    }
  
    function fillForm(d) {
      if (typeof switchTab === 'function') switchTab(d.lichNhap === 'AL' ? 'AL' : 'DL');
      setField('hoTen', d.hoTen);
      setField('gt', d.gioiTinh);
      setField('gio', d.gio);
      // Điền cả hai tab, xem ở tab nào cũng đúng
      if (d.al) { setField('ngay', d.al.d); setField('thang', d.al.m); setField('nam', d.al.y); }
      if (d.dl) { setField('ngayDL', d.dl.d); setField('thangDL', d.dl.m); setField('namDL', d.dl.y); }
    }
  
    // ── Trạng thái "đã sửa" ─────────────────────────────────────
    const formDirty = () => !!currentId && savedForm !== null && formSnap() !== savedForm;
    const noteDirty = () => getNote() !== savedNote;
    const imagesDirty = () => deletedImageIds.length > 0 || images.some(x => x.isNew);
    const isDirty = () => formDirty() || imagesDirty() || (currentId ? noteDirty() : !!getNote());
    window.CLOUD_isDirty = isDirty;
    window.CLOUD_hasLinked = () => !!currentId;
  
    function markSaved() {
      savedForm = formSnap();
      savedNote = getNote();
      images.forEach(x => { x.isNew = false; });
      deletedImageIds = [];
      renderList();
      renderGallery();
    }
  
    // ── Firestore ───────────────────────────────────────────────
    async function createDoc(data) {
      const ref = await col().add({ ...data, createdAt: ts(), updatedAt: ts(), v: 1 });
      return ref.id;
    }
    async function updateDoc(id, data) {
      await col().doc(id).update({ ...data, updatedAt: ts(), v: 1 });
    }
  
    const anhCol = lasoId => col().doc(lasoId).collection('anh');
    async function loadImages(lasoId) {
      const snap = await anhCol(lasoId).get();
      return snap.docs.map(d => ({ id: d.id, data: d.data().data, created: d.data().createdAt?.toMillis?.() || 0, isNew: false }))
        .filter(x => typeof x.data === 'string' && x.data.startsWith('data:image/'))
        .sort((a, b) => a.created - b.created);
    }
    // Ghi ảnh mới, xóa ảnh đã bỏ (sau khi đã có id lá số)
    async function syncImages(lasoId, allNew) {
      const ac = anhCol(lasoId);
      for (const im of images) {
        if (allNew || im.isNew) await ac.doc(im.id).set({ data: im.data, createdAt: ts() });
      }
      if (!allNew) for (const id of deletedImageIds) await ac.doc(id).delete();
    }
  
    function subscribe() {
      unsub?.();
      loaded = false;
      items = []; allItems = [];
      renderList();
      unsub = col().onSnapshot(snap => {
        allItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        applyPending();
        loaded = true;
        if (currentId && !items.some(x => x.id === currentId)) { currentId = null; savedForm = null; }
        renderList();
      }, err => {
        console.warn('[Lá số đã lưu]', err);
        loaded = true;
        renderList('Không tải được danh sách: ' + (err.code === 'permission-denied' ? 'không có quyền truy cập.' : err.message));
      });
    }
  
    // ── Lưu (nút "Lưu lá số") ───────────────────────────────────
    async function saveFlow(forceMode) {
      if (busy) return false;
      if (!window.FB?.auth.currentUser) { toast('Đăng nhập để lưu lá số.'); return false; }
      if (!user) { toast('Cần xác minh email trước khi lưu lá số.'); return false; }

      const hoTenEl = $('hoTen');
      if (!(hoTenEl?.value || '').trim()) {                 // chưa nhập họ tên → báo, đưa con trỏ tới ô Họ tên
        toast('Chưa nhập họ tên. Nhập họ tên rồi bấm Lưu.');
        window.MCLOUD_closeSheet?.();                       // mobile: đóng bảng Note / Lá số để thấy ô Họ tên
        if (hoTenEl) {
          hoTenEl.classList.add('cl-missing');
          hoTenEl.addEventListener('input', () => hoTenEl.classList.remove('cl-missing'), { once: true });
          hoTenEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          setTimeout(() => hoTenEl.focus({ preventScroll: true }), 50);
        }
        return false;
      }


      let mode = forceMode || 'new';
      if (!forceMode && currentId) {
        const cur = items.find(x => x.id === currentId);
        const key = await askChoice('Lưu lá số',
          `Đang mở lá số <b>${esc(cur?.hoTen || '(không tên)')}</b>. Bạn muốn:`,
          [{ key: 'cancel', label: 'Hủy' }, { key: 'new', label: 'Lưu thành lá số mới' }, { key: 'update', label: 'Cập nhật', kind: 'ok' }]);
        if (!key || key === 'cancel') return false;
        mode = key;
      }
      busy = true;
      try {
        lapSilent();                                  // đảm bảo lá số khớp với form
        const data = buildDoc();
        if (mode === 'update' && currentId) {
          await updateDoc(currentId, data);
          await syncImages(currentId, false);
        } else {
          currentId = await createDoc(data);
          await syncImages(currentId, true);           // lá số mới: ghi toàn bộ ảnh đang có
        }
        markSaved();
        toast(mode === 'update' ? 'Đã cập nhật lá số.' : 'Đã lưu lá số.');
        return true;
      } catch (err) {
        console.warn('[Lưu lá số]', err);
        toast('Không lưu được: ' + (err.code === 'permission-denied' ? 'không có quyền (email chưa xác minh?).' : err.message));
        return false;
      } finally {
        busy = false;
      }
    }
    window.saveLaso = () => saveFlow();
  
    // ── Hỏi khi còn thay đổi chưa lưu (chuyển lá số, đăng xuất) ──
    async function confirmLeave() {
      if (!isDirty()) return true;
      const key = await askChoice('Có thay đổi chưa lưu',
        'Thông tin lá số hoặc note đang mở có thay đổi chưa lưu.',
        [{ key: 'stay', label: 'Ở lại' }, { key: 'discard', label: 'Bỏ thay đổi' }, { key: 'save', label: 'Lưu rồi tiếp tục', kind: 'ok' }]);
      if (key === 'discard') return true;
      if (key === 'save') return currentId ? saveFlow('update') : saveFlow('new');
      return false;
    }


// ═══════════ TẢI LÁ SỐ VỀ MÁY (.zip) — chỉ desktop ═══════════
  // Mỗi lá số 1 thư mục "<tên>-<giờ>-<phút>-<nam|nu>-<ngày>-<tháng>-<năm>DL" gồm:
  //   laso.json : đủ dữ liệu, dùng để NHẬP LẠI (giữ nguyên Note, ảnh, mã ảnh)
  //   note.html : mở bằng trình duyệt để xem Note kèm ảnh
  //   note.txt  : chữ của Note, đọc nhanh
  //   anh/      : ảnh của lá số
  const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  let jszipLoading = null;
  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return jszipLoading || (jszipLoading = new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = JSZIP_URL;
      s.onload = () => ok(window.JSZip);
      s.onerror = () => { jszipLoading = null; fail(new Error('không tải được thư viện nén .zip (kiểm tra mạng)')); };
      document.head.appendChild(s);
    }));
  }

  const xuatTen = s => String(s || '').normalize('NFC').replace(/[\/\\:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ').trim().slice(0, 80) || 'khong-ten';
  function tenThuMuc(x) {
    const [h, mi] = String(x.gio || '00:00').split(':').map(n => parseInt(n, 10) || 0);
    const dl = x.dl || {};
    return `${xuatTen(x.hoTen)}-${h}-${String(mi).padStart(2, '0')}-${x.gioiTinh === 'nu' ? 'nu' : 'nam'}-${dl.d}-${dl.m}-${dl.y}DL`;
  }
  function xuatNoteTxt(html) {
    const t = document.createElement('template');
    t.innerHTML = String(html || '').replace(/<(div|p|br|li|h[1-4]|blockquote)\b/gi, '\n<$1');
    return t.content.textContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  function noteHtmlFile(x, map) {
    const body = String(x.note || '').replace(/<img\b[^>]*\bdata-anh="([^"]+)"[^>]*>/gi,
      (m, id) => (map[id] ? `<img src="${map[id]}" style="max-width:100%;border-radius:6px">` : ''));
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(x.hoTen || '')}</title></head>`
      + `<body style="font:15px/1.6 Arial,sans-serif;max-width:820px;margin:24px auto;padding:0 16px">`
      + `<h2 style="margin:0 0 4px">${esc(x.hoTen || '')}</h2>`
      + `<div style="color:#666;margin-bottom:16px">${x.dl?.d}/${x.dl?.m}/${x.dl?.y} DL · ${esc(x.canhGio || '')} · ${x.gioiTinh === 'nu' ? 'Nữ' : 'Nam'}</div>`
      + body + '</body></html>';
  }
  const isoTime = t => (t?.toDate ? t.toDate().toISOString() : null);

  async function xuatZip(list, tenZip, onTienDo) {
    const JSZip = await loadJSZip();
    const zip = new JSZip(), used = new Set();
    let i = 0;
    for (const x of list) {
      onTienDo?.(++i, list.length);
      const goc = tenThuMuc(x);
      let dir = goc;
      for (let k = 2; used.has(dir); k++) dir = `${goc} (${k})`;      // trùng tên thư mục trong cùng tệp
      used.add(dir);
      const f = zip.folder(dir);
      const imgs = (x.soAnh ?? 1) > 0 ? await loadImages(x.id) : [];
      const anh = [], map = {};
      imgs.forEach(im => {
        const m = String(im.data).match(/^data:image\/([a-z0-9.+-]+);base64,(.+)$/i);
        if (!m) return;
        const ext = m[1].toLowerCase().replace('jpeg', 'jpg').replace(/\+.*$/, '');
        const tep = `anh/${im.id}.${ext}`;
        f.file(tep, m[2], { base64: true });
        anh.push({ id: im.id, tep });
        map[im.id] = tep;
      });
      f.file('laso.json', JSON.stringify({
        dinhDang: 'xemlaso-laso', phienBan: 1, xuatLuc: new Date().toISOString(),
        hoTen: x.hoTen || '', gioiTinh: x.gioiTinh || 'nam', lichNhap: x.lichNhap || 'DL',
        dl: x.dl || null, al: x.al || null, gio: x.gio || '', canhGio: x.canhGio || '', menh: x.menh || null,
        note: x.note || '', anh,
        taoLuc: isoTime(x.createdAt), suaLuc: isoTime(x.updatedAt),
      }, null, 2));
      f.file('note.html', noteHtmlFile(x, map));
      f.file('note.txt', xuatNoteTxt(x.note));
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tenZip;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  }

   // Hàng nút dưới danh sách lá số (chỉ hiện trên desktop, xem cloud.css)
   function ensureExportRow(box) {
    let row = box.querySelector('.cl-export');
    if (!row) {
      row = document.createElement('div');
      row.className = 'cl-export ui-btn-row';
      row.innerHTML = `<button type="button" class="ui-btn ui-btn-ghost ui-btn-sm" data-icon="download" data-xuat="mo">Tải lá số đang mở</button>
        <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm" data-icon="download" data-xuat="all">Tải tất cả (.zip)</button>
        <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm" data-icon="plus" data-xuat="nhap">Nhập từ .zip</button>
        <input type="file" accept=".zip,application/zip" hidden>`;
      const inp = row.querySelector('input[type="file"]');
      row.addEventListener('click', e => {
        const b = e.target.closest('[data-xuat]');
        if (!b) return;
        if (b.dataset.xuat === 'nhap') { if (!nhapDangChay && !xuatDangChay) inp.click(); }
        else xuatClick(b.dataset.xuat, b);
      });
      inp.addEventListener('change', () => {
        const f = inp.files[0];
        inp.value = '';                                              // chọn lại cùng tệp vẫn chạy
        if (f) nhapZipClick(f, row.querySelector('[data-xuat="nhap"]'));
      });
    }
    box.appendChild(row);                                            // luôn nằm cuối danh sách
    if (!xuatDangChay) {
      row.querySelector('[data-xuat="mo"]').disabled = !currentId;
      row.querySelector('[data-xuat="all"]').disabled = !items.length;
    }
    row.hidden = !loaded;
  }

  let xuatDangChay = false;
  async function xuatClick(k, btn) {
    if (xuatDangChay || nhapDangChay) return;
    xuatDangChay = true;
    const label = btn.textContent;
    btn.disabled = true;
    try {
      const ngay = new Date().toISOString().slice(0, 10);
      const tienDo = (i, n) => { btn.textContent = n > 1 ? `Đang tạo… ${i}/${n}` : 'Đang tạo…'; };
      if (k === 'mo') {
        const x = items.find(it => it.id === currentId);
        if (!x) throw new Error('chưa mở lá số đã lưu nào.');
        if (isDirty()) toast('Lưu ý: tệp tải về là bản ĐÃ LƯU, chưa gồm thay đổi chưa lưu.');
        await xuatZip([x], `${tenThuMuc(x)}.zip`, tienDo);
      } else {
        if (!items.length) throw new Error('chưa có lá số nào.');
        await xuatZip(items, `laso-${ngay}.zip`, tienDo);
      }
      toast('Đã tạo tệp tải về.');
    } catch (err) {
      toast('Không tải được: ' + err.message);
    } finally {
      xuatDangChay = false;
      btn.textContent = label;
      btn.disabled = k === 'mo' ? !currentId : !items.length;
    }
  }


  // ═══════════ NHẬP LẠI LÁ SỐ TỪ TỆP .zip ĐÃ TẢI VỀ — chỉ desktop, dùng lâu dài ═══════════
  // Đọc đúng tệp do "Tải lá số đang mở" / "Tải tất cả" tạo ra (mỗi thư mục có laso.json + anh/).
  // Chấp nhận cả .zip nén lại bằng Finder/Windows (có thêm thư mục ngoài cùng, __MACOSX).
  // Bỏ qua lá số trùng: cùng tên + ngày/tháng/năm DL + canh giờ (so với tài khoản và trong chính tệp).
  const NHAP_MAX_ZIP = 300 * 1024 * 1024;
  const NHAP_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
  const nhapKey = (ten, dl, gio) => [
    String(ten || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim(),
    +dl?.d, +dl?.m, +dl?.y,
    window.canhGioInfo?.(gio)?.ten || String(gio || ''),
  ].join('|');
  const nhapDs = (arr, n = 30) => `<ul class="cl-nhap-ds">${arr.slice(0, n).map(s => `<li>${esc(s)}</li>`).join('')}`
    + `${arr.length > n ? `<li>… và ${arr.length - n} mục khác</li>` : ''}</ul>`;

  function nhapNgay(o) {
    const d = Math.trunc(+o?.d), m = Math.trunc(+o?.m), y = Math.trunc(+o?.y);
    return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1 && y <= 9999 ? { d, m, y } : null;
  }

  // Đọc .zip → danh sách lá số hợp lệ (chưa ghi gì lên Firebase)
  async function nhapDocZip(file) {
    if (file.size > NHAP_MAX_ZIP) throw new Error('tệp lớn hơn 300 MB.');
    const JSZip = await loadJSZip();
    let zip;
    try { zip = await JSZip.loadAsync(file); } catch { throw new Error('không phải tệp .zip hợp lệ.'); }
    const bo = p => /(^|\/)__MACOSX\//.test(p) || /(^|\/)\._/.test(p);
    const paths = Object.keys(zip.files).filter(p => !zip.files[p].dir && !bo(p) && /(^|\/)laso\.json$/i.test(p));
    const ok = [], bad = [];
    for (const p of paths) {
      const dir = p.slice(0, p.length - 'laso.json'.length);            // "" hoặc ".../<thư mục>/"
      const nhan = dir.replace(/\/$/, '').split('/').pop() || file.name;
      try {
        const j = JSON.parse(await zip.file(p).async('string'));
        if (j?.dinhDang !== 'xemlaso-laso') throw new Error('laso.json không đúng định dạng');
        if (+j.phienBan > 1) throw new Error('tệp tạo bởi phiên bản mới hơn, hãy tải lại trang');
        const dl = nhapNgay(j.dl), al = nhapNgay(j.al), gio = String(j.gio || '').slice(0, 5);
        if (!dl || !al || !/^\d{2}:\d{2}$/.test(gio)) throw new Error('thiếu ngày hoặc giờ');
        const hoTen = String(j.hoTen || '').normalize('NFC').trim().slice(0, 100);
        ok.push({ nhan, j, zip, dir, hoTen, dl, al, gio, key: nhapKey(hoTen, dl, gio) });
      } catch (err) {
        bad.push(`${nhan} — ${err.message}`);
      }
    }
    return { ok, bad };
  }

  // Ghi 1 lá số: tạo tài liệu mới + ảnh (giữ mã ảnh → ảnh trong Note vẫn đúng chỗ)
  async function nhapMot(x) {
    const j = x.j;
    const data = {
      hoTen: x.hoTen,
      hoTenKhongDau: noDau(x.hoTen).slice(0, 100),
      gioiTinh: j.gioiTinh === 'nu' ? 'nu' : 'nam',
      lichNhap: j.lichNhap === 'AL' ? 'AL' : 'DL',
      dl: x.dl, al: x.al,
      gio: x.gio,
      canhGio: String(j.canhGio || window.canhGioInfo?.(x.gio)?.ten || '').slice(0, 10),
      menh: {
        chi: String(j.menh?.chi || '').slice(0, 10),
        chinhTinh: (Array.isArray(j.menh?.chinhTinh) ? j.menh.chinhTinh : []).map(s => String(s).slice(0, 30)).slice(0, 4),
      },
      note: cleanNote(String(j.note || '')),
      soAnh: 0,
    };
    if (data.note.length > 200000) throw new Error('Note quá dài');
    const anh = [];
    for (const a of (Array.isArray(j.anh) ? j.anh : []).slice(0, MAX_IMAGES)) {
      const tep = String(a?.tep || '');
      const ext = (tep.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(a?.id || '') || !/^anh\/[^/]+$/.test(tep) || !NHAP_MIME[ext]) continue;
      const f = x.zip.file(x.dir + tep);
      if (!f) continue;
      const url = `data:${NHAP_MIME[ext]};base64,` + await f.async('base64');
      if (url.length > 1000000) throw new Error(`ảnh ${tep} quá lớn`);
      anh.push({ id: a.id, data: url });
    }
    data.soAnh = anh.length;
    const id = await createDoc(data);
    for (const a of anh) await anhCol(id).doc(a.id).set({ data: a.data, createdAt: ts() });
  }

  let nhapDangChay = false;
  async function nhapZipClick(file, btn) {
    if (nhapDangChay || xuatDangChay) return;
    if (!user || !window.FB?.auth?.currentUser) { toast('Đăng nhập trước khi nhập lá số.'); return; }
    if (!loaded) { toast('Danh sách lá số chưa tải xong, thử lại sau vài giây.'); return; }
    nhapDangChay = true;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Đang đọc tệp…';
    try {
      const { ok, bad } = await nhapDocZip(file);
      const daCo = new Set(items.map(x => nhapKey(x.hoTen, x.dl, x.gio)));
      const moi = [], trung = [], trongTep = new Set();
      for (const x of ok) {
        if (daCo.has(x.key) || trongTep.has(x.key)) { trung.push(`${x.hoTen} · ${x.dl.d}/${x.dl.m}/${x.dl.y} · ${window.canhGioInfo?.(x.gio)?.ten || x.gio}`); continue; }
        trongTep.add(x.key);
        moi.push(x);
      }
      const tom = `<div>Tệp: <b>${esc(file.name)}</b></div>
        <div>Sẽ nhập: <b>${moi.length}</b> lá số mới</div>
        <div>Trùng, bỏ qua: <b>${trung.length}</b>${bad.length ? ` · Lỗi: <b>${bad.length}</b>` : ''}</div>`
        + (trung.length ? `<div style="margin-top:6px">Trùng (cùng tên, ngày DL, canh giờ):</div>${nhapDs(trung)}` : '')
        + (bad.length ? `<div style="margin-top:6px">Lỗi:</div>${nhapDs(bad)}` : '');
      if (!moi.length) {
        await askChoice('Nhập lá số', tom + (ok.length || bad.length ? '' : '<div style="margin-top:6px">Tệp không có lá số nào (cần tệp .zip tải từ ứng dụng).</div>'),
          [{ key: 'x', label: 'Đóng', kind: 'ok' }]);
        return;
      }
      if ((await askChoice('Nhập lá số', tom, [{ key: 'no', label: 'Hủy' }, { key: 'yes', label: `Nhập ${moi.length} lá số`, kind: 'ok' }])) !== 'yes') return;
      const loi = [];
      let n = 0;
      for (const x of moi) {
        btn.textContent = `Đang nhập… ${n + loi.length + 1}/${moi.length}`;
        try { await nhapMot(x); n++; } catch (err) { loi.push(`${x.nhan} — ${err.message}`); }
      }
      if (loi.length) {
        await askChoice('Nhập lá số', `<div>Đã nhập <b>${n}</b> lá số. Lỗi <b>${loi.length}</b>:</div>${nhapDs(loi)}`, [{ key: 'x', label: 'Đóng', kind: 'ok' }]);
      } else {
        toast(`Đã nhập ${n} lá số.`);
      }
    } catch (err) {
      toast('Không nhập được: ' + err.message);
    } finally {
      nhapDangChay = false;
      btn.textContent = label;
      btn.disabled = false;
    }
  }

  // ═══════════ ĐĂNG XUẤT ═══════════
    window.CLOUD_beforeLogout = async () => {
        const ok = await confirmLeave();
        if (ok) await flushDeletes();                     // đăng xuất: xóa luôn các lá số đang chờ hoàn tác
        return ok;
      };
  
        // Nút "Hiện tại": hỏi lưu nếu có thay đổi → bỏ liên kết lá số đang mở (Note, ảnh) để form lập lá số mới
  window.CLOUD_closeCurrent = async () => {
    if (!(await confirmLeave())) return false;
    currentId = null;
    images = []; deletedImageIds = [];
    setNote('');
    savedForm = null; savedNote = '';
    renderList(); renderGallery();
    return true;
  };

    // ── Mở một lá số ────────────────────────────────────────────
    const announceOpened = id => document.dispatchEvent(new CustomEvent('cloud-opened', { detail: { id } }));
    async function openLaso(id) {
      if (id === currentId) { announceOpened(id); return; }
      const d = items.find(x => x.id === id);
      if (!d) return;
      if (!(await confirmLeave())) return;
      fillForm(d);
      lapSilent();
      try { images = (d.soAnh ?? 1) > 0 ? await loadImages(id) : []; }
      catch (err) { images = []; toast('Không tải được ảnh: ' + err.message); }
      deletedImageIds = [];
      setNote(d.note);
      currentId = id;
      markSaved();
      announceOpened(id);
    }
  
    // ── Xóa lá số: hỏi → ẩn khỏi danh sách → "Hoàn tác" trong 8 giây → mới xóa thật ──
    const UNDO_MS = 8000;
    const pendingDel = new Map();   // id → { timer, toast, restore }
    const goneIds = new Set();      // đã xóa xong, chờ Firestore báo về
    function applyPending() { items = allItems.filter(x => !pendingDel.has(x.id) && !goneIds.has(x.id)); }
  
    const noteHasContent = html => /<img/i.test(html || '') ||
      !!String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  
      let askingDel = false;
      async function deleteLaso(id) {
        if (askingDel || document.querySelector('.rc-overlay')) return;     // đang có hộp thoại → không mở thêm
        const d = items.find(x => x.id === id);
        if (!d) return;
        askingDel = true;
        try { await deleteLasoAsk(id, d); } finally { askingDel = false; }
      }
      async function deleteLasoAsk(id, d) {
      const info = [];
      if (d.soAnh > 0) info.push(d.soAnh + ' ảnh');
      info.push(noteHasContent(d.note) ? 'có ghi chú' : 'không có ghi chú');
      const isCur = id === currentId;
      const key = await askChoice('Xóa lá số',
        `<div class="cl-del-name"><b>${esc(d.hoTen || '(không tên)')}</b>${d.dl?.y ? ' (' + esc(d.dl.y) + ')' : ''}</div>
         <div class="cl-del-meta">${esc(info.join(' · '))}</div>
         ${isCur ? '<div class="cl-del-note">Lá số này đang mở: nội dung trên màn hình vẫn được giữ, bấm Lưu nếu muốn lưu lại thành lá số mới.</div>' : ''}
         <div class="cl-del-note">Sau khi xóa, bạn có ${UNDO_MS / 1000} giây để hoàn tác.</div>`,
        [{ key: 'cancel', label: 'Hủy' }, { key: 'del', label: 'Xóa', kind: 'danger' }]);
      if (key !== 'del' || !items.some(x => x.id === id)) return;
  
      flushDeletes();                                   // lá số đang chờ xóa trước đó: xóa luôn
  
      // Đang mở đúng lá số này: bỏ liên kết nhưng giữ form, note, ảnh trên màn hình
      let restoreCur = null;
      if (isCur) {
        const prev = {
          savedForm, savedNote,
          deleted: deletedImageIds.slice(),
          oldIds: new Set(images.filter(x => !x.isNew).map(x => x.id)),
        };
        currentId = null; savedForm = null; savedNote = '';
        images.forEach(x => { x.isNew = true; });       // "Lưu" sau đó sẽ ghi lại toàn bộ ảnh vào lá số mới
        deletedImageIds = [];
        restoreCur = () => {
          if (currentId !== null) return;               // đã lưu / mở lá số khác trong lúc chờ → không liên kết lại
          currentId = id;
          savedForm = prev.savedForm; savedNote = prev.savedNote;
          images.forEach(x => { if (prev.oldIds.has(x.id)) x.isNew = false; });
          deletedImageIds = prev.deleted.concat([...prev.oldIds].filter(oid => !images.some(x => x.id === oid) && !prev.deleted.includes(oid)));
        };
      }
  
      const p = { restore: restoreCur };
      pendingDel.set(id, p);
      applyPending(); renderList(); renderGallery();
      p.toast = undoToast(`Đã xóa <b>${esc(d.hoTen || '(không tên)')}</b>.`, () => undoDelete(id), UNDO_MS);
      p.timer = setTimeout(() => commitDelete(id), UNDO_MS);
    }
  
    function undoDelete(id) {
      const p = pendingDel.get(id);
      if (!p) return;
      clearTimeout(p.timer);
      p.toast?.close();
      pendingDel.delete(id);
      p.restore?.();
      applyPending(); renderList(); renderGallery();
      toast('Đã hoàn tác.');
    }
  
    async function commitDelete(id) {
      const p = pendingDel.get(id);
      if (!p) return;
      clearTimeout(p.timer);
      p.toast?.close();
      pendingDel.delete(id);
      goneIds.add(id);
      applyPending(); renderList();
      try {
        const anh = await anhCol(id).get();               // Firestore không tự xóa dữ liệu con
        const batch = window.FB.db.batch();               // ảnh + lá số xóa cùng lúc: xong hết hoặc không gì cả
        anh.docs.forEach(a => batch.delete(a.ref));
        batch.delete(col().doc(id));
        await batch.commit();
      } catch (err) {
        console.warn('[Xóa lá số]', err);
        goneIds.delete(id);
        p.restore?.();
        applyPending(); renderList(); renderGallery();
        toast('Không xóa được: ' + (err.code === 'permission-denied' ? 'không có quyền.' : err.message));
      }
    }
    const flushDeletes = () => Promise.all([...pendingDel.keys()].map(commitDelete));
    // Đóng / tải lại trang khi còn lá số chờ xóa: cố gửi lệnh xóa (nếu không kịp, lá số vẫn còn – không mất dữ liệu)
    window.addEventListener('pagehide', () => { if (pendingDel.size) flushDeletes(); });
  
    // Thông báo có nút "Hoàn tác"
    function undoToast(html, onUndo, ms) {
      const t = document.createElement('div');
      t.className = 'cl-toast cl-toast-undo';
      t.innerHTML = `<span>${html}</span><button type="button">Hoàn tác</button><i style="animation-duration:${ms}ms"></i>`;
      const close = () => t.remove();
      t.querySelector('button').addEventListener('click', () => { close(); onUndo(); });
      document.body.appendChild(t);
      return { close };
    }
  
    // ── Nút "Lập lá số": đang mở lá số đã lưu mà form đã sửa → hỏi ──
    document.addEventListener('click', async e => {
      const btn = e.target.closest('#formWrap .fg-lap-laso [data-lap]');
      if (!btn || silent || !formDirty()) return;
      e.preventDefault();
      e.stopPropagation();                     // chặn onclick="lapLaSo()" của nút, xử lý tại đây
      const cur = items.find(x => x.id === currentId);
      const key = await askChoice('Thông tin lá số đã thay đổi',
        `Bạn đã sửa thông tin của lá số <b>${esc(cur?.hoTen || '(không tên)')}</b>.`,
        [{ key: 'view', label: 'Chỉ xem, không lưu' }, { key: 'new', label: 'Lưu thành lá số mới' }, { key: 'update', label: 'Cập nhật lá số này', kind: 'ok' }]);
      if (!key) return;
      if (key === 'view') lapSilent();
      else await saveFlow(key);
    }, true);
  
    // ── Danh sách: tìm kiếm, bộ lọc, sắp xếp, phím mũi tên ────────
    const CHINH_TINH = ['Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh', 'Thiên Phủ',
      'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân'];
    const DIA_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tị', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    const VCD = '__vcd__';                                     // Vô chính diệu
    const SORTS = { 'ten': 'Tên A→Z', 'ten-desc': 'Tên Z→A', 'nam': 'Năm sinh tăng', 'nam-desc': 'Năm sinh giảm', 'moi': 'Mới lưu gần đây' };
    let filterSao = '', filterCung = '';
    let sortBy = (() => { try { const v = localStorage.getItem('lasoSort'); return SORTS[v] ? v : 'ten'; } catch (e) { return 'ten'; } })();
    let cursorId = null;                                       // vệt chọn bằng phím mũi tên
  
    // Chữ thuần của note (bỏ thẻ), giữ nguyên độ dài khi bỏ dấu để cắt đoạn trích cho đúng chỗ
    const noteTextCache = new Map();
    function noteText(x) {
      const key = x.id + '|' + (x.note || '').length;
      if (!noteTextCache.has(key)) {
        const tpl = document.createElement('template');
        tpl.innerHTML = String(x.note || '').replace(/<(br|\/p|\/div|\/li|\/h\d)>/gi, ' $&');
        const raw = (tpl.content.textContent || '').replace(/\s+/g, ' ').trim();
        const norm = Array.from(raw).map(ch => noDau(ch) || ch).join('');   // cùng độ dài với raw
        noteTextCache.set(key, { raw: Array.from(raw), norm });
      }
      return noteTextCache.get(key);
    }
    const yearOf = x => Number(x.dl?.y) || 0;
    const timeOf = x => x.updatedAt?.toMillis?.() || x.createdAt?.toMillis?.() || 0;
    const cmpName = (a, b) => String(a.hoTen || '').localeCompare(String(b.hoTen || ''), 'vi', { sensitivity: 'base' });
    // Cho Trang chủ: danh sách rút gọn và mở một lá số
    window.CLOUD_items = () => items.map(x => ({ id: x.id, hoTen: x.hoTen, dl: x.dl, gioiTinh: x.gioiTinh, menh: x.menh, t: timeOf(x) }));
    window.CLOUD_open = id => openLaso(id);
    function filtered() {
      const q = noDau(query);
      const years = q.match(/\b\d{4}\b/g) || [];
      const words = q.replace(/\b\d{4}\b/g, ' ').replace(/\s+/g, ' ').trim();
      const out = [];
      for (const x of items) {
        if (years.length && !years.includes(String(yearOf(x)))) continue;
        if (filterCung && x.menh?.chi !== filterCung) continue;
        if (filterSao) {
          const ct = x.menh?.chinhTinh;
          if (!Array.isArray(ct)) continue;                            // lá số lưu khi chưa có thông tin cung Mệnh
          if (filterSao === VCD ? ct.length > 0 : !ct.includes(filterSao)) continue;
        }
        let snippet = '';
        if (words) {
          const inName = (x.hoTenKhongDau || noDau(x.hoTen)).includes(words);
          if (!inName) {
            const nt = noteText(x);
            const i = nt.norm.indexOf(words);
            if (i < 0) continue;
            const from = Math.max(0, i - 25), to = Math.min(nt.raw.length, i + words.length + 35);
            snippet = (from > 0 ? '…' : '') + esc(nt.raw.slice(from, i).join(''))
              + '<mark>' + esc(nt.raw.slice(i, i + words.length).join('')) + '</mark>'
              + esc(nt.raw.slice(i + words.length, to).join('')) + (to < nt.raw.length ? '…' : '');
          }
        }
        out.push({ x, snippet });
      }
      const by = {
        'ten': (a, b) => cmpName(a.x, b.x),
        'ten-desc': (a, b) => cmpName(b.x, a.x),
        'nam': (a, b) => yearOf(a.x) - yearOf(b.x) || cmpName(a.x, b.x),
        'nam-desc': (a, b) => yearOf(b.x) - yearOf(a.x) || cmpName(a.x, b.x),
        'moi': (a, b) => timeOf(b.x) - timeOf(a.x) || cmpName(a.x, b.x),
      }[sortBy];
      return out.sort(by);
    }
  
    function buildListControls(box) {
      box.innerHTML = `
        <div class="cl-row">
          <input type="search" class="cl-search" placeholder="Tìm tên, năm sinh, nội dung note…" autocomplete="off">
          <select class="cl-sort" title="Sắp xếp">${Object.entries(SORTS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        </div>
        <div class="cl-row">
          <select class="cl-f-sao" title="Chính tinh cung Mệnh">
            <option value="">Chính tinh Mệnh: tất cả</option>
            ${CHINH_TINH.map(t => `<option value="${t}">${t}</option>`).join('')}
            <option value="${VCD}">Vô chính diệu</option>
          </select>
          <select class="cl-f-cung" title="Cung Mệnh tại">
            <option value="">Mệnh tại: tất cả</option>
            ${DIA_CHI.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="cl-count"></div>
        <div class="cl-items" tabindex="0" aria-label="Danh sách lá số (↑↓ để chọn, Enter để mở)"></div>`;
      const inp = box.querySelector('.cl-search');
      const sort = box.querySelector('.cl-sort');
      const fSao = box.querySelector('.cl-f-sao');
      const fCung = box.querySelector('.cl-f-cung');
      const list = box.querySelector('.cl-items');
      inp.value = query; sort.value = sortBy; fSao.value = filterSao; fCung.value = filterCung;
  
      inp.addEventListener('input', () => { query = inp.value; renderList(); });
      sort.addEventListener('change', () => {
        sortBy = sort.value;
        try { localStorage.setItem('lasoSort', sortBy); } catch (e) {}
        renderList();
      });
      fSao.addEventListener('change', () => { filterSao = fSao.value; renderList(); });
      fCung.addEventListener('change', () => { filterCung = fCung.value; renderList(); });
      // Từ ô tìm: ↓ để xuống danh sách
      inp.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); list.focus(); moveCursor(cursorId ? 0 : 1); }
        if (e.key === 'Enter') { e.preventDefault(); list.focus(); moveCursor(cursorId ? 0 : 1); }
      });
  
      list.addEventListener('click', e => {
        const row = e.target.closest('.cl-item');
        if (!row) return;
        list.focus({ preventScroll: true });
        setCursor(row.dataset.id);
        if (e.target.closest('.cl-del')) deleteLaso(row.dataset.id);
        else openLaso(row.dataset.id);
      });
      list.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveCursor(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveCursor(-1); }
        else if (e.key === 'Home') { e.preventDefault(); moveCursor(-Infinity); }
        else if (e.key === 'End') { e.preventDefault(); moveCursor(Infinity); }
        else if (e.key === 'Enter' && cursorId) { e.preventDefault(); openLaso(cursorId); }
      });
    }
  
    function setCursor(id) {
      cursorId = id;
      const list = $('cloudList')?.querySelector('.cl-items');
      if (!list) return;
      list.querySelectorAll('.cl-item').forEach(r => r.classList.toggle('cursor', r.dataset.id === id));
      list.querySelector('.cl-item.cursor')?.scrollIntoView({ block: 'nearest' });
    }
    function moveCursor(step) {
      const rows = [...($('cloudList')?.querySelectorAll('.cl-item') || [])];
      if (!rows.length) return;
      let i = rows.findIndex(r => r.dataset.id === cursorId);
      if (i < 0) i = rows.findIndex(r => r.dataset.id === currentId);
      if (step === -Infinity) i = 0;
      else if (step === Infinity) i = rows.length - 1;
      else i = i < 0 ? 0 : Math.max(0, Math.min(rows.length - 1, i + step));
      setCursor(rows[i].dataset.id);
    }
  
    function renderList(errorMsg) {
      const box = $('cloudList');
      if (!box) return;
      const authUser = window.FB?.auth.currentUser;
      if (!authUser || !authUser.emailVerified) { box.innerHTML = ''; return; }
      if (!box.querySelector('.cl-items')) buildListControls(box);
      const list = box.querySelector('.cl-items');
      ensureExportRow(box);                                     // nút "Tải lá số đang mở" / "Tải tất cả (.zip)"
      const count = box.querySelector('.cl-count');
      count.textContent = '';
      if (errorMsg) { list.innerHTML = `<div class="cl-empty">${esc(errorMsg)}</div>`; return; }
      if (!loaded) { list.innerHTML = '<div class="cl-empty">Đang tải…</div>'; return; }
      if (!items.length) { list.innerHTML = '<div class="cl-empty">Chưa có lá số nào. Lập lá số rồi bấm "Lưu lá số".</div>'; return; }
      const rows = filtered();
      const filtering = !!(query.trim() || filterSao || filterCung);
      count.textContent = filtering ? `${rows.length} / ${items.length} lá số` : `${items.length} lá số`;
      if (!rows.length) { list.innerHTML = '<div class="cl-empty">Không có lá số phù hợp.</div>'; return; }
      if (cursorId && !rows.some(r => r.x.id === cursorId)) cursorId = null;
      const dirty = isDirty();
      list.innerHTML = rows.map(({ x, snippet }) => `
        <div class="cl-item${x.id === currentId ? ' active' : ''}${x.id === cursorId ? ' cursor' : ''}" data-id="${esc(x.id)}" title="Bấm hoặc Enter để mở">
          <div class="cl-main">
            <span class="cl-name">${esc(x.hoTen || '(không tên)')}${x.id === currentId && dirty ? ' <span class="cl-dirty" title="Có thay đổi chưa lưu">●</span>' : ''}</span>
            ${snippet ? `<span class="cl-snip">${snippet}</span>` : ''}
          </div>
                  <span class="cl-gt">${x.gioiTinh === 'nu' ? 'Nữ' : x.gioiTinh === 'nam' ? 'Nam' : ''}</span>
          <span class="cl-year">${esc(x.dl?.y ?? '')}</span>
          <button type="button" class="cl-del" title="Xóa lá số" tabindex="-1">🗑</button>
        </div>`).join('');
    }
  
    // Cập nhật dấu "● chưa lưu" khi sửa form / note
    let dirtyT = 0;
    const refreshDirty = () => { clearTimeout(dirtyT); dirtyT = setTimeout(() => currentId && renderList(), 300); };
    document.addEventListener('input', e => { if (e.target.closest('#formWrap, #noteEditor')) refreshDirty(); });
    document.addEventListener('change', e => { if (e.target.closest('#formWrap')) refreshDirty(); });
  
    // ── Ảnh: nén, dải ảnh cuối cột note, dán/kéo thả vào note ──
    function newImageId() {
      return (window.FB?.db ? window.FB.db.collection('_').doc().id
        : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    }
  
    // Thu nhỏ & nén ảnh → data URL JPEG ≤ ~650KB (vừa 1 bản ghi Firestore)
    async function compressImage(file) {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
        let max = 1600, q = 0.82, out = '';
        for (let k = 0; k < 6; k++) {
          const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.naturalWidth * s));
          c.height = Math.max(1, Math.round(img.naturalHeight * s));
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);     // nền trắng cho ảnh trong suốt
          ctx.drawImage(img, 0, 0, c.width, c.height);
          out = c.toDataURL('image/jpeg', q);
          if (out.length <= 870000) return out;                               // ~650KB sau base64
          if (q > 0.6) q -= 0.12; else max = Math.round(max * 0.8);
        }
        return out.length <= 1000000 ? out : null;
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  
    async function addImageFiles(files, insertInline) {
      const list = [...files].filter(f => /^image\//.test(f.type));
      if (!list.length) return;
      const room = MAX_IMAGES - images.length;
      if (room <= 0) { toast(`Mỗi lá số tối đa ${MAX_IMAGES} ảnh.`); return; }
      if (list.length > room) toast(`Chỉ thêm được ${room} ảnh nữa (tối đa ${MAX_IMAGES}).`);
      for (const f of list.slice(0, room)) {
        let data = null;
        try { data = await compressImage(f); } catch (e) { /* ảnh lỗi */ }
        if (!data) { toast('Không đọc được ảnh: ' + f.name); continue; }
        const im = { id: newImageId(), data, isNew: true };
        images.push(im);
        if (insertInline) insertImageInNote(im.id);
      }
      renderGallery();
      refreshDirty();
    }
  
    function insertImageInNote(id) {
      const ed = noteEl();
      if (!ed) return;
      if (!document.body.classList.contains('note-open') && typeof window.toggleNote === 'function') window.toggleNote();
      ed.focus();
      const sel = window.getSelection();
      if (!sel.rangeCount || !ed.contains(sel.anchorNode)) {               // chưa đặt con trỏ trong note → cuối note
        const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
        sel.removeAllRanges(); sel.addRange(r);
      }
      document.execCommand('insertHTML', false, `<img data-anh="${id}" class="note-img">`);
      hydrateNoteImages();
    }
  
    function removeImage(id) {
      const im = images.find(x => x.id === id);
      if (!im) return;
      images = images.filter(x => x !== im);
      if (!im.isNew) deletedImageIds.push(id);
      noteEl()?.querySelectorAll(`img[data-anh="${id}"]`).forEach(e => e.remove());
      renderGallery();
      refreshDirty();
    }
  
    function openLightbox(id) {
      const im = images.find(x => x.id === id);
      if (!im) return;
      const ov = document.createElement('div');
      ov.className = 'cl-lightbox';
      ov.innerHTML = `<img src="${im.data}" alt="">`;
      const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
      const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
      ov.addEventListener('click', close);
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(ov);
    }
  
    function renderGallery() {
      const panel = $('notePanel');
      if (!panel) return;
      let g = $('noteGallery');
      if (!g) {
        g = document.createElement('div');
        g.id = 'noteGallery';
        g.className = 'note-gallery';
        panel.appendChild(g);
        g.addEventListener('click', e => {
          const b = e.target.closest('[data-gact]');
          const id = e.target.closest('.ng-item')?.dataset.id;
          if (b?.dataset.gact === 'add') g.querySelector('input[type=file]').click();
          else if (b?.dataset.gact === 'del' && id) removeImage(id);
          else if (b?.dataset.gact === 'ins' && id) insertImageInNote(id);
          else if (id) openLightbox(id);
        });
        // Giữ vị trí con trỏ trong note khi bấm nút "chèn"
        g.addEventListener('mousedown', e => { if (e.target.closest('[data-gact="ins"]')) e.preventDefault(); });
        g.addEventListener('change', e => {
          if (e.target.type === 'file') { addImageFiles(e.target.files, false); e.target.value = ''; }
        });
      }
      g.innerHTML = `
        <div class="ng-head">
          <span>Ảnh (${images.length}/${MAX_IMAGES})</span>
          <button type="button" class="ng-add" data-gact="add" ${images.length >= MAX_IMAGES ? 'disabled' : ''}>+ Ảnh</button>
          <input type="file" accept="image/*" multiple hidden>
        </div>
        <div class="ng-strip">${images.map(im => `
          <div class="ng-item${im.isNew ? ' new' : ''}" data-id="${im.id}" title="Bấm để xem lớn">
            <img src="${im.data}" alt="">
            <button type="button" class="ng-btn ng-ins" data-gact="ins" title="Chèn vào note tại con trỏ">↵</button>
            <button type="button" class="ng-btn ng-del" data-gact="del" title="Xóa ảnh">✕</button>
          </div>`).join('') || '<span class="ng-empty">Dán (Ctrl+V) hoặc kéo ảnh vào note, hoặc bấm "+ Ảnh".</span>'}
        </div>`;
    }
  
    // Dán / kéo thả ảnh vào note → ảnh nằm trong note + có ở dải ảnh
    // (bắt ở pha capture để đi trước xử lý "dán chữ trơn" của note-panel.js)
    document.addEventListener('paste', e => {
      if (!e.target.closest?.('#noteEditor')) return;
      const files = [...(e.clipboardData?.files || [])].filter(f => /^image\//.test(f.type));
      if (!files.length) return;
      e.preventDefault();
      e.stopPropagation();
      addImageFiles(files, true);
    }, true);
    document.addEventListener('dragover', e => {
      if (e.target.closest?.('#noteEditor, #noteGallery') && [...(e.dataTransfer?.types || [])].includes('Files')) e.preventDefault();
    });
    document.addEventListener('drop', e => {
      const inEditor = e.target.closest?.('#noteEditor');
      if (!inEditor && !e.target.closest?.('#noteGallery')) return;
      const files = [...(e.dataTransfer?.files || [])].filter(f => /^image\//.test(f.type));
      if (!files.length) return;
      e.preventDefault();
      if (inEditor && document.caretRangeFromPoint) {                       // đặt con trỏ tại chỗ thả
        const r = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (r) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      }
      addImageFiles(files, !!inEditor);
    });
  
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderGallery);
    else renderGallery();
  
    // ── Đăng nhập / đăng xuất ───────────────────────────────────
    document.addEventListener('cloud-auth', e => {
      const u = e.detail.user;
      const ok = u && u.emailVerified;
      if (ok && user && user.uid === u.uid) { renderList(); return; }   // khung được vẽ lại, cùng người dùng
      unsub?.(); unsub = null;
      user = ok ? u : null;
      if (!u) {                                    // đăng xuất: xóa liên kết và note khỏi màn hình
        if (currentId || savedForm) { images = []; setNote(''); }
        pendingDel.forEach(p => { clearTimeout(p.timer); p.toast?.close(); }); pendingDel.clear(); goneIds.clear();
        currentId = null; savedForm = null; savedNote = ''; items = []; allItems = []; query = '';
        images = []; deletedImageIds = []; renderGallery();
      }
      if (user) subscribe();
      else renderList();
    });
  })();