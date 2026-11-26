// src/js/cloud/auth-ui.js
// Đăng nhập (Google / email) – đăng xuất, khối trạng thái ở sidebar (#cloudPanel)
(function () {
    'use strict';
  
    const $ = id => document.getElementById(id);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  
    const ERR = {
      'auth/invalid-email': 'Email không hợp lệ.',
      'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
      'auth/invalid-login-credentials': 'Email hoặc mật khẩu không đúng.',
      'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
      'auth/user-not-found': 'Email hoặc mật khẩu không đúng.',
      'auth/missing-password': 'Chưa nhập mật khẩu.',
      'auth/email-already-in-use': 'Email này đã có tài khoản. Hãy đăng nhập, hoặc dùng "Quên mật khẩu".',
      'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 8 ký tự).',
      'auth/password-does-not-meet-requirements': 'Mật khẩu chưa đạt yêu cầu (tối thiểu 8 ký tự).',
      'auth/too-many-requests': 'Thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.',
      'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup cho trang này.',
      'auth/popup-closed-by-user': '',
      'auth/cancelled-popup-request': '',
      'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối rồi thử lại.',
      'auth/unauthorized-domain': 'Tên miền này chưa được phép đăng nhập (Authorized domains).',
      'auth/operation-not-allowed': 'Cách đăng nhập này chưa được bật trên Firebase.',
      'auth/requires-recent-login': 'Vui lòng đăng nhập lại.',
    };
    const errMsg = e => (e && e.code in ERR) ? ERR[e.code] : ('Lỗi: ' + (e?.message || e));
  
    function toast(msg) {
      if (!msg) return;
      const t = document.createElement('div');
      t.className = 'cl-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 4000);
    }
  
    // ── Khối trạng thái ở sidebar ───────────────────────────────
    function renderPanel(user) {
      const p = $('cloudPanel');
      if (!p) return;
      if (!user) {
        p.innerHTML = `
          <div class="cl-head">Lá số đã lưu</div>
          <div class="cl-hint">Đăng nhập để lưu và mở lại lá số.</div>
          <div class="cl-btns">
            <button type="button" class="cl-btn" data-act="google">Đăng nhập Google</button>
            <button type="button" class="cl-btn cl-btn-2" data-act="email">Đăng nhập email</button>
          </div>`;
        return;
      }
      p.innerHTML = `
        <div class="cl-head">Lá số đã lưu</div>
        <div class="cl-user">
          <span class="cl-email" title="${esc(user.email)}">${esc(user.email || user.displayName || 'Đã đăng nhập')}</span>
          <button type="button" class="cl-link" data-act="logout">Đăng xuất</button>
        </div>
        ${user.emailVerified ? '' : `
        <div class="cl-warn">
          Email chưa xác minh nên chưa lưu được lá số. Mở hộp thư, bấm link xác minh rồi
          <button type="button" class="cl-link" data-act="reload">bấm vào đây</button>.
          <button type="button" class="cl-link" data-act="resend">Gửi lại thư</button>
        </div>`}
        <div id="cloudList"></div>`;
    }
  
    async function onPanelClick(e) {
        const b = e.target.closest('[data-act]');
        if (b) await runAuthAct(b.dataset.act);
      }
  
      // Dùng chung cho khối "Lá số đã lưu" (mobile) và menubar (desktop)
      async function runAuthAct(act) {
        if (!window.FB) return;
        const { auth } = window.FB;
        try {
        if (act === 'google') {
          const provider = new firebase.auth.GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await auth.signInWithPopup(provider);
        } else if (act === 'email') {
          openEmailDialog();
        } else if (act === 'logout') {
          // Bước sau: hỏi nếu note/form còn thay đổi chưa lưu
          const ok = typeof window.CLOUD_beforeLogout === 'function' ? await window.CLOUD_beforeLogout() : true;
          if (ok) await auth.signOut();
        } else if (act === 'reload') {
          await auth.currentUser.reload();
          await auth.currentUser.getIdToken(true);          // lấy token mới: Firestore Rules thấy email đã xác minh
          renderPanel(auth.currentUser);
          fireAuth(auth.currentUser);
          if (!auth.currentUser.emailVerified) toast('Email vẫn chưa được xác minh.');
        } else if (act === 'resend') {
          await auth.currentUser.sendEmailVerification();
          toast('Đã gửi lại thư xác minh. Kiểm tra cả mục Spam.');
        }
      } catch (err) {
        toast(errMsg(err));
      }
    }
  
    window.CLOUD_authAct = runAuthAct;
    // ── Hộp đăng nhập email ─────────────────────────────────────
    function openEmailDialog() {
      if ($('clEmailDlg')) return;
      const ov = document.createElement('div');
      ov.id = 'clEmailDlg';
      ov.className = 'rc-overlay';
      ov.innerHTML = `
        <div class="rc-box cl-dialog" role="dialog" aria-modal="true">
          <div class="cl-tabs">
            <button type="button" data-tab="login" class="on">Đăng nhập</button>
            <button type="button" data-tab="register">Đăng ký</button>
            <button type="button" data-tab="reset">Quên mật khẩu</button>
          </div>
          <form novalidate>
            <label class="cl-field">Email
              <input type="email" name="email" autocomplete="email" required></label>
            <label class="cl-field cl-pw">Mật khẩu
              <input type="password" name="pw" autocomplete="current-password"></label>
            <label class="cl-field cl-pw2">Nhập lại mật khẩu
              <input type="password" name="pw2" autocomplete="new-password"></label>
            <div class="cl-msg" aria-live="polite"></div>
            <div class="rc-actions">
              <button type="button" class="rc-cancel">Đóng</button>
              <button type="submit" class="rc-ok cl-submit">Đăng nhập</button>
            </div>
          </form>
        </div>`;
      document.body.appendChild(ov);
  
      const form = ov.querySelector('form');
      const msg = ov.querySelector('.cl-msg');
      const submit = ov.querySelector('.cl-submit');
      let tab = 'login';
      const LABEL = { login: 'Đăng nhập', register: 'Đăng ký', reset: 'Gửi thư đặt lại' };
  
      const setTab = t => {
        tab = t;
        ov.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
        ov.querySelector('.cl-pw').style.display = t === 'reset' ? 'none' : '';
        ov.querySelector('.cl-pw2').style.display = t === 'register' ? '' : 'none';
        form.pw.autocomplete = t === 'register' ? 'new-password' : 'current-password';
        submit.textContent = LABEL[t];
        setMsg('');
      };
      const setMsg = (t, ok) => { msg.textContent = t; msg.classList.toggle('ok', !!ok); };
      const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
      const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  
      ov.addEventListener('click', e => {
        if (e.target === ov || e.target.closest('.rc-cancel')) close();
        const tb = e.target.closest('[data-tab]');
        if (tb) setTab(tb.dataset.tab);
      });
      document.addEventListener('keydown', onKey, true);
  
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const { auth } = window.FB;
        const email = form.email.value.trim();
        const pw = form.pw.value;
        if (!email) return setMsg('Chưa nhập email.');
        submit.disabled = true;
        try {
          if (tab === 'login') {
            await auth.signInWithEmailAndPassword(email, pw);
            close();
          } else if (tab === 'register') {
            if (pw.length < 8) return setMsg('Mật khẩu tối thiểu 8 ký tự.');
            if (pw !== form.pw2.value) return setMsg('Hai lần nhập mật khẩu không khớp.');
            const cred = await auth.createUserWithEmailAndPassword(email, pw);
            await cred.user.sendEmailVerification();
            setMsg('Đã tạo tài khoản và gửi thư xác minh tới ' + email + '. Mở thư, bấm link xác minh rồi quay lại trang.', true);
            submit.style.display = 'none';
          } else {
            await auth.sendPasswordResetEmail(email);
            // Bật "Email enumeration protection" nên không báo email có tồn tại hay không
            setMsg('Nếu email này đã đăng ký, thư đặt lại mật khẩu đã được gửi. Kiểm tra cả mục Spam.', true);
          }
        } catch (err) {
          setMsg(errMsg(err));
        } finally {
          submit.disabled = false;
        }
      });
  
      setTab('login');
      form.email.focus();
    }
  
    // Báo cho các phần khác (danh sách lá số…) biết trạng thái đăng nhập
    function fireAuth(user) {
      document.dispatchEvent(new CustomEvent('cloud-auth', { detail: { user } }));
    }
  
    function init() {
      const p = $('cloudPanel');
      if (p) p.addEventListener('click', onPanelClick);
      if (!window.FB) { renderPanel(null); return; }
      window.FB.auth.onAuthStateChanged(user => { renderPanel(user); fireAuth(user); });
    }
  
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();