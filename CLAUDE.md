# Tử Vi Đẩu Số — Token-First Guide

## Mục tiêu
- Ưu tiên sửa nhanh, đọc ít file nhất, token thấp nhất.

## Luồng đọc mặc định
1. `ARCHITECTURE.md`
2. `src/README.md`
3. Mở đúng file feature liên quan, tránh đọc lan man.

## Entry
- Runtime: `index.html`
- CSS aggregator: `src/styles.css`

## Route task -> file
- Tính lá số: `src/js/core/logic.js` — `TUVI_LOGIC.resolveMethod` mặc định **`trungchau`** khi `input.method` thiếu (test/gọi trực tiếp). Trên web, `controller-core.js` truyền `method` từ `getCurrentAnSaoMethod()` (mặc định UI trong `theme-config.js`: **Thái Thứ Lang**; nếu không có hàm thì fallback `trungchau`). Shared core: `ansao.js` (không an sao, không fallback; chỉ lấy vị trí sao qua `computeStarPositions` do method cung cấp). Phương pháp: `trungchauphai.js` (độc lập, có `computeStarPositions`, Hỏa/Linh: `computeHoaLinhPositions` + `TUVI_DIACHI_UTIL.getNext`/`getNexts`; vòng Tướng Tinh: `computeTuongTinhRing`; vòng Bác Sĩ TCP: `computeBacSiRing`; vòng Thái Tuế TCP: `computeThaiTueRing`; Thiên Thương/Thiên Sứ: `computeThienThuongThienSu`; các bảng hằng số đặt ở đầu file), `thaithulang.js` (độc lập, không dùng code/bảng từ Trung Châu; tự có `TTL_SAO_THEO_*`, `TTL_TU_HOA`, `TTL_SAO_HANH`, `computeStarPositions`; `TTL_SAO_HANH` lấy từ CSV TTL `/Users/ducanhnguyen/Documents/tuvi/data-app/TTL/to mau/to_mau.csv`; có hàm riêng an sao lưu `buildLuuSaoTables` cho `LUU_SAO_THEO_CHI`/`LUU_SAO_THEO_CAN` và thêm `L.Đại Hao`/`L.Tiểu Hao`; vòng Tướng Tinh chỉ an `Hoa Cái` và `Kiếp Sát`; không dùng `Thiên Vu` theo tháng; key sao theo can dùng `Lưu Niên Văn Tinh`). Hai method độc lập hai chiều, chỉ dùng chung `data.js` + `ansao.js`; khi `compute()` sẽ sync bảng active vào `TUVI_DATA` để tương thích module cũ. `Lưu Hà` theo can: Giáp-Dậu … Quý-Dần. Các sao trùng vòng (`Hoa Cái`/`Kiếp Sát`/`Hàm Trì`) tách riêng khỏi an sao theo năm ở Trung Châu; giữ alias `Đào Hoa` để tương thích output.
- Utils: `src/js/utils/diachi.js` (`getNext`, `getNexts`, `toIdx`, …), `thiencan.js`, `cungchuc.js` — global `TUVI_*_UTIL`; `data.js` bắt buộc load sau utils.
- Bảng tra dữ liệu sao: `src/js/core/data.js` (common, không giữ `SAO_THEO_CAN/NAM/GIO`); dữ liệu riêng từng phương pháp đặt ở file method tương ứng (`trungchauphai.js` / `thaithulang.js`)
- Render từ JSON + highlight + pills (xem hạn chỉ active khi đã chọn năm; center hiển thị Năm hạn; pill engine + center renderer nằm ở module shared): `src/js/render/tuvi-render.js` + `src/js/render/tuvi-render-modules.js`
- Rule matcher/dialog: `src/js/render/tuvi-render-modules.js`
- Rule runtime data: `src/js/rules/rules-data.js`
- Rule nguồn editable: `src/rules/*.txt`
- Đồng bộ txt -> runtime rules: `python3 scripts/sync_rules.py`
- Đổi Dương↔Âm + kiểm tra ngày Dương/Âm trước khi Lập lá số (dialog `#lapSoValidationOverlay`); với tab DL, giờ sinh `23:00-23:59` thì cộng 1 ngày dương trước khi đổi sang âm: `src/js/features/lunar-calendar.js` + `src/js/features/lap-so-dialog.js` + `src/js/features/theme-config.js`; `lapLaSo`: `src/js/app/controller-core.js`
- Mũi tên giờ + nhảy ngày/tháng/năm ÂL + init ngày/giờ hiện tại (giờ nav độc lập xem hạn; bind click theo id `#btnGioXemPrev/#btnGioXemNext`): `src/js/features/gio-controls.js`
- Năm xem hạn (bind click theo id `#btnNamXemPrev/#btnNamXemNext`): `src/js/features/han-controls.js`
- Chatbot (desktop đang ẩn, nút dưới cùng cột trái disabled vì chưa hỗ trợ bật lại): `src/js/features/chatbot.js`
- Prompt/JSON export: `src/js/features/prompt-export.js`
- Tab tìm kiếm lá số (ngày DL nhập Ngày/Tháng/Năm + «Số ngày» + quét 12 giờ sinh + nav `a/b` (mũi tên lá số bind theo id `#btnLasoPrev/#btnLasoNext`) + auto clear khi rời Search hoặc bấm Lập lá số + lỗi validate mở dialog trên desktop, message plain không đánh số + mobile hiển thị dialog tóm tắt sau khi quét xong + item có cát/hung mục tiêu [hung gồm Hóa Kỵ; so sánh theo `name` có dấu + lowercase, chỉ bỏ marker miếu/vượng/đắc/hãm; regex marker M/V/Đ/B/H áp dụng theo token rời], chủ tinh kèm `(M/V/Đ/B/H)`, giờ sinh dạng khoảng (`1h-3h`), badge Tuần/Triệt nền đen và trừ 20 điểm cát khí nếu có Tuần/Triệt tại Mệnh, cờ Cô/Quả chỉ hiện khi có; sort theo điểm giảm dần, nếu bằng điểm thì ưu tiên hiệu số cát-hung lớn hơn rồi mới gần ngày bắt đầu; mỗi item có toggle sao để đánh dấu lưu, `#listLaso` luôn mở danh sách đầy đủ, `#listLasoStar` luôn mở danh sách item đã sao (web + mobile); item trong overlay list (`listLaso`/`listLasoStar`) đồng bộ layout hiển thị với card desktop (cát/hung, điểm cát khí, badge Tuần/Triệt, cờ Cô/Quả, nút sao); có thể bật/tắt sao ngay trong overlay mà không làm đóng hoặc mất danh sách; danh sách sao render trong overlay riêng nên không đổi/scroll `searchResultList` hiện tại; toggle sao trong list chính không tự chuyển sang star-view; có chọn tất cả/bỏ chọn tất cả tổ hợp chính tinh Mệnh; đã bỏ filter phụ Cát/Hung/Tuần-Triệt khỏi UI; khi phương pháp an sao là `lyso.vn` thì vẫn tìm bằng thuật toán local (Thái Thứ Lang) nhưng mở từng kết quả sẽ hiển thị ảnh API): `src/js/features/search-laso.js`
- Theme/config: `src/js/features/theme-config.js` (`#anSaoMethodSelect`: mặc định **Thái Thứ Lang**, kèm lyso.vn và Trung Châu; template màu mặc định `tuvivietnam`; hiện trên tab Dương lịch, Âm lịch và Tìm lá số, ngay trên nút Lập lá số / Tìm lá số, không còn trong tab Cấu hình; `window._ansaoMethod` là biến toàn cục, select các tab đồng bộ, chỉ render lá số của tab đang mở; tab Cấu hình không bấm được khi đang chọn lyso.vn; thứ tự tab: Dương lịch, Âm lịch, Tìm lá số, Cấu hình; tab mở mặc định là Dương lịch; đổi method gọi `lapLaSo()` sau sự kiện change để option vừa chọn không bị nhảy về; bỏ template `dark`; template `tuvivietnam` đặt nền ô cung `rgb(232, 232, 225)` và cỡ cát/hung `12px`, ảnh nền ô giữa mặc định Âm Dương vector khi chưa lưu lựa chọn; tab Cấu hình không còn ô màu nền, màu sao, màu viền; lyso.vn khóa chỉnh tay, render ảnh API, URL có năm xem hạn; ẩn `#luuModeBar`; nền ô giữa: `LASO_BG_RAW_BASE` + `LASO_BG_FILES` → `--laso-center-bg`, class `laso-center-wallpaper-on` / `laso-center-decor-yinyang` / `laso-center-plain`; `laso-center-width-priority` cho ảnh; SVG Âm Dương không quẻ; chữ dọc `.center-slogan` (`dich_hoc_tinh_hoa3.png`) neo dưới phải ô giữa, cao 2/5 `.center-bg`, cách mép phải 5px; dưới chữ là `an_tin_icon3.png` (`.center-antin`, rộng bằng chữ dọc, `padding-top` 5px, cách mép dưới 10px), nổi trên bảng info; không áp khi khóa lyso API)
- Responsive/layout: `src/js/features/layout-scale.js` (web: zoom lá số để chiều cao lá số + `#hanNavBar` + 10px nằm trong khung cửa sổ đang mở, không phải full màn hình; mobile không đổi công thức lá số = khung cửa sổ − `#hanNavBar` − 10px), `layout-responsive.js`, `layout-resize.js`; mobile: `form-mobile-pickers.js` + `forms.css` (select ngày/tháng/giờ; reserve top `--laso-overflow-top-reserve` (mặc định 50px) để khi nhiều sao thì lá số dồn lên trên)

## CSS modules
- `src/css/base.css`: variables + reset + shell layout (toàn page padding 2px; sidebar desktop nền slate, 100vh/100dvh)
- `src/css/chat.css`: chatbot UI
- `src/css/forms.css`: form + tab + wrapper + search nav class-based responsive + margin-bottom 2px cho grid mobile + tab bar sticky desktop khi cuộn + reserve top `--laso-overflow-top-reserve` (mặc định 50px); nút Lập lá số một hàng riêng; form mobile dùng chung màu slate với sidebar desktop
- `src/css/grid.css`: grid/cung/sao/highlight/pills + han-nav class-based responsive + tăng z-index khu chính tinh, cân width vị trí 1/3 để vị trí 2 centered và tránh overlap + cát tinh cho phép overflow, sao hung vị trí 6 căn phải theo cột hung, một dòng và canh mép phải ổn định để không đè viền
- `src/css/modals.css`: prompt/rule modal

## Quy tắc chỉnh sửa
- Chỉ sửa đúng module liên quan task.
- Không nhúng lại rule lớn vào `tuvi-render.js`.
- Sửa rule ở `src/rules/*.txt`, sau đó chạy sync script.
- Mobile và desktop phải có layout riêng, xử lý độc lập; không giả định một bản sửa UI áp dụng giống nhau cho cả hai.
- Khi fix giao diện mà chưa rõ target là mobile hay desktop, phải hỏi lại để xác nhận trước khi sửa.
- Mỗi lần báo thay đổi giao diện phải ghi rõ phạm vi đang sửa: `mobile` hay `web/desktop`.
- Sau mọi sửa JS: kiểm tra syntax trước khi kết thúc.
- Sau mọi thay đổi tính năng/cấu trúc: **bắt buộc cập nhật docs tương ứng** (`README.md`, `ARCHITECTURE.md`, `CLAUDE.md` khi cần).
- Check docs sync trước khi kết thúc:
  - `python3 scripts/check_docs_sync.py`
- Chạy regression tests trước khi kết thúc:
  - `node tests/run-tests.js`
- Nếu thay đổi logic (lịch/an sao/compute): bắt buộc chạy lại test và đảm bảo pass.