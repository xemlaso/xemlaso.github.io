// src/js/cloud/firebase-init.js
// Khởi tạo Firebase (SDK bản compat, nạp sẵn từ src/vendor/firebase/)
(function () {
    'use strict';
    // Cấu hình web app: được phép công khai. Bảo mật nằm ở Firestore Rules + giới hạn domain/API key.
    const firebaseConfig = {
      apiKey: 'AIzaSyCohl888ABvyRv8XDNj4WIkvGkA3H7ep1I',
      authDomain: 'xemlaso-2f4ad.firebaseapp.com',
      projectId: 'xemlaso-2f4ad',
      storageBucket: 'xemlaso-2f4ad.firebasestorage.app',
      messagingSenderId: '249495878287',
      appId: '1:249495878287:web:0a5282d639955c80890efa',
    };
  
    if (typeof firebase === 'undefined') {
      console.warn('[Cloud] Chưa nạp Firebase SDK (src/vendor/firebase/*.js)');
      return;
    }
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    auth.languageCode = 'vi';                 // thư xác minh / đặt lại mật khẩu bằng tiếng Việt
    window.FB = { auth, db: firebase.firestore() };
  })();