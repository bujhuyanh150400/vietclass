# OpenDesign reference

Last verified: 2026-09-09

Tài liệu tham chiếu cho công việc thiết kế trong OpenDesign (self-host local). Mô tả những gì hiện có trong instance: project duy nhất được dùng, design system nào đang hoạt động, asset nào đã có, và những chỗ design system cố ý khác với frontend đang chạy. Quy trình làm việc nằm ở `.agents/skills/opendesign-redesign/SKILL.md`; hiện trạng token của frontend nằm ở `docs/design.md`.

OpenDesign chạy local, URL và cổng đổi theo từng phiên daemon. Không hard-code `127.0.0.1` vào artifact hay tài liệu; truy cập qua MCP bằng project id.

## 1. Project duy nhất

`vietclass-polished-redesign` — "VietClass Polished Product Redesign" — là project thiết kế **duy nhất**. Mọi việc redesign màn hình làm trên project này. Không tạo project mới, kể cả để thử một hướng thị giác khác: dựng biến thể thành file mới trong chính project này.

Entry file: `vietclass-prototype.html`. Đây là prototype nhiều màn, dùng hash route và dữ liệu minh họa trong bộ nhớ.

Lý do chọn nó: nó đọc IA và asset thật của repo thay vì bịa, dùng đúng hex thương hiệu đã convert sang OKLCH, self-host font nên render được offline, và là bản mà hướng thị giác hiện tại của design system được dựng từ đó.

Hai điểm cần biết khi sửa file này:

- Nó chứa các block `@font-face` base64 lớn (Be Vietnam Pro 400/500/600, Silkscreen 400). Sửa surgical, giữ nguyên các block đó. Regenerate cả file sẽ mất font self-host.
- State của vùng dữ liệu do một máy trạng thái trong file điều khiển (`ready`, `loading`, `empty`, `noresult`, `error`), và panel error dùng hàm chung cho nhiều màn. Sửa hàm chung thay vì nhân bản panel.

Nếu instance xuất hiện project khác mang tên VietClasses, đó là tàn dư của lần thử trước — không dựng tiếp trên nó và không dùng nó làm tham chiếu.

## 2. Design system

Id: `user:vietclasses-design-system`, tên "VietClasses Design System".

Một run của OpenDesign **chỉ nhận `DESIGN.md`** làm ngữ cảnh thị giác. `brand.json`, `system/tokens*.json`, `system/variables*.css` và component kit không được nạp vào prompt. Hệ quả thực tế:

- Bất cứ quy tắc nào cần agent tuân thủ phải viết vào `DESIGN.md`, kèm đường dẫn file thật. Mô tả bằng văn xuôi ("dùng linh vật cú vẫy tay") mà không có đường dẫn thì agent không có file nào để trỏ tới và sẽ tự vẽ hình thay thế.
- Lớp phái sinh (`brand.json`, `tokens.default.json`, bộ dark kit) hiện còn dấu vết của bản trích xuất generic ban đầu, kể cả font `Inter` và một dark theme. Chúng không ảnh hưởng tới kết quả run, chỉ sai ở màn brand kit trong giao diện OpenDesign. Không coi chúng là nguồn tham chiếu.
- Bản canonical của `DESIGN.md` nằm trong design system store, không nằm trong một project. Đó là bản mà run đọc, và là bản duy nhất cần sửa.
- Nếu instance còn một project import của design system, `DESIGN.md` trong đó chỉ là bản mirror. Sửa bản canonical trước; mirror có thể lệch mà không ảnh hưởng run.

## 3. Asset thương hiệu

Asset gốc nằm trong repo tại `frontend/public/images/`, và được copy vào design system store. Khi dựng artifact thì copy tiếp vào project dưới dạng `assets/` rồi tham chiếu tương đối.

| Asset | File trong repo | Dùng cho |
| --- | --- | --- |
| Logo / app mark (128px) | `brand-mark.png` | Lockup thương hiệu ở sidebar, cạnh wordmark Silkscreen |
| Cú đọc sách | `character-panel-login.webp` | Đăng nhập, onboarding, hero trang chủ workspace |
| Cú vẫy tay | `empty_1.png` | Trạng thái chưa có dữ liệu |
| Cú cầm kính lúp | `empty_2.png` | Trạng thái lọc không ra kết quả |
| Cú hoa mắt | `error.webp` | Trạng thái lỗi và tải thất bại |

Ba ảnh trạng thái (vẫy tay, kính lúp, hoa mắt) đều là art gốc 1254x1254. Trong panel trạng thái render khoảng 96-160px với `image-rendering: pixelated`; làm hero thì render lớn. Mọi ảnh cần `alt` tiếng Việt.

Ngoài ra có `frontend/public/animations/vietclass-owl-reading-thinking-loop.lottie` làm tham chiếu chuyển động.

## 4. Chỗ design system cố ý khác frontend

Design system đang chạy trước frontend về hình học. Đây là hướng đã được chốt, chưa triển khai.

| Hạng mục | Design system | Frontend đang chạy |
| --- | --- | --- |
| Radius | 5px control, 8px panel, 10px page sheet | 3px |
| Viền | 1px, hai tông (control edge đậm cho phần tương tác, notebook rule nhạt cho divider) | 2px ink |
| Elevation | Solid offset cho phần bấm được; blur chỉ cho panel/dialog nổi | Solid offset |

Vì vậy quyền quyết định bị chia đôi, và đừng "sửa" lẫn nhau:

- `docs/design.md` là canonical cho màu thương hiệu, font, hành vi sản phẩm, route, và quy tắc nội dung tiếng Việt.
- Design system trong OpenDesign là canonical cho hình học và craft: radius, độ dày viền, elevation, bộ icon, tỉ lệ hình ảnh, độ phủ trạng thái.

Không kéo 5px/1px trong artifact về lại 3px/2px. Nhưng vẫn phải sửa mọi trôi dạt về hex thương hiệu, Be Vietnam Pro, quy tắc Silkscreen-chỉ-cho-wordmark, và Geist Mono.

Khi frontend được rework token theo hình học mới, cập nhật `docs/design.md` cho khớp hiện trạng mới và xóa bảng khác biệt ở trên.

## 5. Skill id của OpenDesign

Dùng đúng id thật; `od-design-refine` không tồn tại.

| Skill | Khi nào dùng |
| --- | --- |
| `frontend-design` | Màn mới hoặc hướng thị giác mới. Cho kết quả mạnh nhất trên repo này. |
| `impeccable-design-polish` | Vòng polish hoặc chỉnh cho khớp design system trên artifact đã có. |
| `design-review` | Khi chỉ cần audit, không sửa. |
| `redesign-existing-projects` | Nâng cấp toàn bộ một màn đã có. |


## 6. Chưa xác định

- Frontend chưa được rework token theo hình học mới, nên `docs/design.md` và design system còn lệch ở bảng mục 4.
- `error.webp` mới thêm vào `frontend/public/images/` và chưa được commit vào git.
- Prototype của project chính chưa được duyệt chính thức để triển khai vào `frontend/`.
- Chưa kiểm chứng: `metadata.json` của design system store có trường `projectId` trỏ tới project import. Sau khi project đó bị xóa, trường này thành tham chiếu treo. Run vẫn đọc được `DESIGN.md` từ store nên không bị ảnh hưởng, nhưng chưa rõ giao diện OpenDesign còn mở được design system để sửa trực tiếp hay không. Nếu mất, sửa `DESIGN.md` bằng file là đủ.
