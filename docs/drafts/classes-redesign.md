# Bản nháp redesign màn Lớp học

**Trạng thái:** Bản nháp chờ duyệt  
**Phạm vi:** Toàn bộ flow quản lý lớp học  
**OpenDesign project:** `vietclass-polished-redesign`  
**Artifact hiện có:** `classes.html`, `classes-table.html`, `class-detail.html`

> Tài liệu này là đề xuất thiết kế để đọc và góp ý. Chưa thay đổi artifact OpenDesign,
> frontend hoặc API.

## 1. Mục tiêu

Redesign toàn bộ flow lớp học theo cùng ngôn ngữ với các màn Học sinh, Phòng học và
Giáo viên đã được làm mới:

- Lớp học là một danh sách quản trị có thể tìm, lọc và sắp xếp.
- Tạo/sửa lớp là một biểu mẫu rõ ràng, không phải modal nhỏ nhiều trường.
- Chi tiết lớp tập trung vào sĩ số và sổ học sinh.
- Các thao tác ghi danh được đặt gần danh sách học sinh và giải thích đúng hậu quả.
- Không đưa vào giao diện những dữ liệu chưa có trong API hoặc schema.

## 2. Sự thật hiện tại cần bám theo

### Route frontend

- `/academic/classes` — danh sách lớp.
- `/academic/classes/new` — tạo lớp.
- `/academic/classes/[classId]/edit` — sửa lớp.
- `/academic/classes/[classId]` — chi tiết lớp và sổ học sinh.

### Dữ liệu lớp

Frontend/API hiện tại vẫn còn trường `code`, nhưng đây là phần sẽ bỏ trong contract đích.
Thiết kế mới dùng `id` hệ thống làm định danh lớp:

- `id` — ID lớp do hệ thống tự sinh, chỉ đọc; không xuất hiện như input trong form.
- `name`.
- Một `subject_id`.
- Một `teacher_id`, được hiểu là **giáo viên phụ trách**.
- `grade_level`.
- `max_students` và `active_students_count`.
- `status`: `0` Đang hoạt động, `1` Đã kết thúc.
- `start_at`, `end_at`.

Không hiển thị hoặc nhập `code` ở bất kỳ màn nào. ID lớp được hiển thị ở danh sách và
màn chi tiết dưới nhãn `ID lớp`.

Thiết kế đích cần chừa chỗ cho đội ngũ giảng dạy của lớp:

- Một **giáo viên phụ trách** — bắt buộc, là người chính của lớp.
- Không hoặc nhiều **giáo viên phụ lớp / trợ giảng** — các liên kết này sẽ được lưu ở bảng
  riêng, không nhồi vào `teacher_id`.
- Trợ giảng có thể được thêm, gỡ và xem độc lập với thông tin cơ bản của lớp.

Artifact OpenDesign được phép mô phỏng trạng thái đội ngũ đích để chốt hierarchy và
responsive layout; việc nối API và bảng liên kết sẽ làm ở phase dữ liệu riêng.

### Quy tắc quan trọng

- ID lớp do hệ thống tự sinh và không chỉnh sửa.
- Ngày khai giảng không đổi sau khi tạo.
- Môn học mới phải đang hoạt động.
- Giáo viên phụ trách và giáo viên phụ lớp khi được gán phải đang làm việc.
- Giáo viên phụ trách và trợ giảng là hai vai trò khác nhau; một người không hiển thị
  đồng thời ở cả hai vai trò.
- Sĩ số tối đa không được thấp hơn số học sinh đang học.
- Kết thúc lớp sẽ đóng các ghi danh đang mở; mở lại không khôi phục danh sách cũ.
- Lớp đã kết thúc không cho thêm, sửa, chuyển hoặc cho học sinh nghỉ lớp.
- Sổ lớp giữ cả các giai đoạn học sinh đã nghỉ để bảo toàn lịch sử.

### API danh sách đã có

Danh sách lớp ở contract đích cần hỗ trợ:

- Tìm theo tên hoặc ID lớp.
- Lọc theo trạng thái, môn học, giáo viên và khối.
- Phân trang và sắp xếp theo `id`, `name`, `start_at`, `created_at`.

Việc bỏ `code` là thay đổi contract cần cập nhật ở phase dữ liệu/API; phase hiện tại chỉ
chốt cách hiển thị và không triển khai migration. Thiết kế trợ giảng cũng không thay đổi
API hiện tại trong phase này; chỉ xác định UI và vị trí của quan hệ để không phải làm lại
hierarchy sau này.

## 3. Nguyên tắc thị giác

- Dùng `ListSheet` cho danh sách và `FormSheet` cho biểu mẫu.
- Page heading là `h2` dưới tiêu đề route của app shell.
- Control cao `44px`, `rounded-control`, viền control đậm.
- Sheet dùng `rounded-sheet`, viền notebook-rule và shadow của design system.
- Nút chính có solid offset shadow, không dùng nút phẳng đơn thuần.
- Be Vietnam Pro cho giao diện; Geist Mono cho ID lớp, sĩ số và dữ liệu ngắn cố định.
- Màu cam là hành động chính; badge trạng thái dùng màu success/destructive/neutral.
- Mặc định là chế độ bảng trên desktop; người dùng có thể chuyển sang chế độ thẻ ở mọi kích thước.
  Khi màn hình dưới `1024px`, chế độ bảng tự fallback sang card, không đo viewport bằng JavaScript.
- Không để viewport có overflow ngang; nếu bảng desktop cần rộng hơn, chỉ wrapper bảng được
  phép scroll ngang.

## 4. Màn danh sách lớp

### Page heading

- Tiêu đề: **Lớp học**.
- Chip tổng số: `{N} lớp`.
- Mô tả: `Quản lý lớp, đội ngũ giảng dạy và sĩ số học sinh.`
- Nút chính: **Tạo lớp học**.

### Toolbar

Một `ListSheet` gồm các vùng:

1. Ô tìm kiếm: `Tìm tên hoặc ID lớp…`.
2. Bộ lọc:
   - Trạng thái: Đang hoạt động / Đã kết thúc.
   - Khối.
   - Môn học.
   - Giáo viên.
3. Sắp xếp:
   - Mới tạo gần đây.
   - Tên A–Z.
   - Tên Z–A.
   - Ngày khai giảng gần nhất.
4. Chế độ xem:
   - **Bảng** — mặc định, phù hợp khi cần so sánh nhiều lớp và xem nhanh sĩ số/thời gian.
   - **Thẻ** — card view, phù hợp khi muốn đọc từng lớp như một hồ sơ ngắn.
5. Conditions bar với chip bỏ được từng điều kiện và nút **Xóa tất cả**.

Nút chế độ xem dùng `ViewPopover` giống các màn danh sách khác. Trạng thái `table`/`grid`,
filter, sort, page và page size nằm trên URL để tải lại hoặc chia sẻ được đường dẫn.
Ở chế độ bảng, pager cho chọn số dòng (10/20/50/100). Ở chế độ thẻ dùng trang cố định
20 mục để card không biến thành một danh sách quá dài.

### Chế độ xem

- **Bảng** là chế độ mặc định trên desktop. Dưới `1024px`, cùng dữ liệu tự đọc dưới dạng
  card để không ép bảng tràn ngang.
- **Thẻ** luôn hiển thị card, kể cả desktop; phù hợp khi cần xem nhanh đội ngũ, sĩ số và
  trạng thái từng lớp.
- Hai cây render cùng dữ liệu nhưng chỉ một cây xuất hiện trong accessibility tree bằng
  `display: none`, không đo viewport bằng JavaScript.

### Bảng desktop

Thứ tự cột:

1. **Lớp học** — tên lớp và `ID lớp` hiển thị bằng mono.
2. **Môn học**.
3. **Khối** — badge `Khối 9`, v.v.
4. **Đội ngũ giảng dạy** — giáo viên phụ trách hiển thị đầu tiên với nhãn `Phụ trách`;
   nếu có trợ giảng thì hiển thị thêm avatar/chip `+N trợ giảng`. Bấm vào phần này mở danh
   sách đầy đủ.
5. **Sĩ số** — `12 / 30`, số đang học dùng mono; thanh tiến độ nhỏ.
6. **Thời gian học** — ngày khai giảng và ngày kết thúc.
7. **Trạng thái**.
8. Menu `⋯`.

Bảng dùng `table-fixed`, cột thao tác cố định và wrapper `overflow-x-auto`. Hàng có hover
và focus state; cả hàng có thể mở chi tiết nhưng nút menu vẫn hoạt động độc lập.

### Menu dòng

- **Xem lớp và học sinh**.
- **Sửa lớp**.
- **Kết thúc lớp** hoặc **Mở lại lớp**.

Kết thúc lớp luôn mở hộp thoại xác nhận, nói rõ số học sinh bị đóng ghi danh và cảnh báo
mở lại sẽ không khôi phục danh sách. Mở lại cũng có xác nhận ngắn, nói rõ cần thêm lại
học sinh nếu muốn.

### Card view / card mobile

Mỗi card hiển thị:

- Tên lớp, ID lớp và menu.
- Badge khối, môn học, trạng thái.
- Giáo viên phụ trách với nhãn `Phụ trách`.
- Danh sách trợ giảng rút gọn hoặc chip `+N trợ giảng`.
- Sĩ số và số chỗ còn lại.
- Ngày khai giảng – ngày kết thúc.

Card mở chi tiết bằng nút tên lớp; không dùng toàn card làm một link để menu thao tác
không bị lồng link. Card view không được bỏ mất các thông tin có trong bảng; chỉ thay đổi
cách xếp chúng thành các nhóm dễ quét.

### Các trạng thái

- Đang tải: skeleton theo đúng tỉ lệ các cột.
- Chưa có lớp: ảnh `empty_1.png`, nút **Tạo lớp học**.
- Không có kết quả: ảnh `empty_2.png`, nút **Xóa điều kiện**.
- Lỗi tải: `error.webp`, thông báo máy chủ và nút **Thử lại**.

Toolbar và điều kiện đang áp dụng vẫn giữ nguyên khi không có kết quả hoặc tải lỗi.

## 5. Màn tạo và sửa lớp

Dùng một `FormSheet` chung cho hai chế độ, bố cục một cột hoặc hai cột tùy chiều rộng.

### Khối `01` — Thông tin lớp

- Tên lớp — bắt buộc.

ID lớp do hệ thống tạo sau khi lưu, không xuất hiện trong form tạo hoặc sửa. Người dùng
chỉ xem ID lớp ở danh sách và màn chi tiết.

### Khối `02` — Môn học và đội ngũ giảng dạy

- Môn học — async select, chỉ hiển thị môn đang hoạt động.
- Giáo viên phụ trách — async select, bắt buộc, chỉ hiển thị giáo viên đang làm việc.
- Giáo viên phụ lớp / trợ giảng — multi-select tùy chọn; các lựa chọn đã chọn hiển thị
  thành từng hàng/chip có nút gỡ.
- Khối lớp — select từ Tiền tiểu học đến Lớp 12.

Trợ giảng không được chọn trùng giáo viên phụ trách và không được lặp trong danh sách.
Danh sách trợ giảng trong artifact phải thể hiện rõ đây là vai trò `Trợ giảng`, không dùng
nhãn `Giáo viên phụ trách` cho tất cả.

Ở chế độ sửa, nếu môn hoặc giáo viên phụ trách hiện tại đã bị khóa/nghỉ, lựa chọn hiện tại
vẫn phải được hiển thị để người dùng giữ nguyên. Khi đổi sang lựa chọn khác, chỉ cho chọn
các mục đang hợp lệ. Với trợ giảng, các liên kết hiện tại vẫn hiển thị; liên kết không còn
hợp lệ cần có cảnh báo nhưng không tự ý biến mất khỏi form.

### Khối `03` — Sĩ số và thời gian

- Sĩ số tối đa — bắt buộc, số nguyên dương.
- Ngày khai giảng — bắt buộc khi tạo; disabled khi sửa.
- Ngày kết thúc — tùy chọn, không được trước ngày khai giảng.

Hint khi sửa sĩ số:
`Không đặt thấp hơn {N} học sinh đang học.`

### Nút và trạng thái form

- Tạo: **Tạo lớp học**.
- Sửa: **Lưu thay đổi**.
- Nút phụ: **Hủy** hoặc quay lại danh sách.
- Hàng nút bám đáy sheet trên màn hình hẹp.
- Lỗi validation gắn đúng trường; lỗi cấp form dùng `aria-live`.
- Toast thành công:
  - `Đã tạo lớp học.`
  - `Đã lưu thay đổi lớp học.`

Trạng thái lớp không nằm trong form. Đổi trạng thái là một thao tác riêng có xác nhận vì
kết thúc lớp ảnh hưởng tới toàn bộ ghi danh.

## 6. Màn chi tiết lớp và sổ lớp

### Header và summary

- BackLink: **Danh sách lớp học**.
- Tên lớp, `ID lớp` và badge trạng thái.
- Nút **Sửa lớp**.
- Nút **Kết thúc lớp** hoặc **Mở lại lớp**.
- Nếu lớp đã kết thúc, hiển thị cảnh báo cố định:
  `Lớp đã kết thúc, không thể thay đổi danh sách học sinh.`

Summary sheet hiển thị:

- Môn học.
- Khối.
- **Đội ngũ giảng dạy**:
  - Giáo viên phụ trách hiển thị nổi bật, có nhãn riêng.
  - Danh sách trợ giảng hiển thị bên dưới bằng avatar/chip; nhiều người thì gộp bằng
    `+N` và mở dialog xem đầy đủ.
  - Nút **Quản lý trợ giảng** đặt cạnh tiêu đề nhóm, không trộn với nút sửa thông tin lớp.
- Ngày khai giảng.
- Ngày kết thúc.
- Sĩ số đang học / tối đa.
- Số chỗ còn lại và thanh tiến độ.

Không đưa lịch học, phòng học hoặc lịch dự kiến vào summary vì các module đó chưa tồn
tại trong backend.

### Sổ học sinh

Dùng một `ListSheet` riêng:

- Heading: **Danh sách học sinh** + số lượng.
- Ô tìm: tìm theo tên học sinh.
- Bộ chuyển: **Tất cả** / **Đang học**.
- Nút **Thêm học sinh** chỉ hiển thị khi lớp đang hoạt động và còn chỗ.

Cột:

1. Học sinh.
2. Ngày vào lớp.
3. Ngày rời lớp.
4. Trạng thái: Đang học / Đã nghỉ.
5. Ghi chú.
6. Menu thao tác.

Mặc định hiển thị toàn bộ lịch sử ghi danh. Bản ghi đã đóng vẫn có thể mở dialog sửa dữ
liệu nhập; không cho chuyển hoặc cho nghỉ lại. Lớp đã kết thúc ẩn toàn bộ thao tác ghi danh.

### Menu ghi danh

Với bản ghi đang học:

- **Sửa thông tin ghi danh**.
- **Chuyển lớp**.
- **Cho nghỉ lớp**.

Với bản ghi đã nghỉ:

- **Sửa thông tin ghi danh**.

## 7. Các dialog cần redesign

### Thêm học sinh

- Tiêu đề và mô tả sĩ số còn lại.
- Tìm theo tên hoặc số điện thoại.
- Danh sách checkbox có tên, khối, số điện thoại.
- Ngày vào lớp dùng chung cho cả lô.
- Hiển thị `Đã chọn N học sinh`.
- Phân trang nếu danh sách dài.
- Disable submit khi chưa chọn ai.
- Nếu vượt sĩ số, hiển thị lỗi rõ ràng và không thêm một phần.

### Sửa thông tin ghi danh

- Ngày vào lớp.
- Ngày rời lớp, để trống nghĩa là còn đang học.
- Ghi chú.

### Chuyển lớp

- Lớp đích.
- Ngày chuyển.
- Ghi chú cho lớp mới.
- Nói rõ chỉ chuyển được sang lớp cùng môn.

### Cho nghỉ lớp

- Ngày nghỉ.
- Lý do nghỉ — bắt buộc.
- Nút destructive và mô tả rằng lịch sử vẫn được giữ lại.

### Quản lý trợ giảng

Đây là dialog/flow thiết kế cho bảng liên kết riêng, chưa nối vào API hiện tại:

- Tìm giáo viên đang làm việc.
- Hiển thị danh sách trợ giảng đã liên kết.
- Thêm một hoặc nhiều giáo viên phụ lớp.
- Gỡ liên kết với xác nhận nhẹ nếu đã có dữ liệu liên kết.
- Giáo viên phụ trách hiện tại bị loại khỏi kết quả trợ giảng.
- Nút lưu nói rõ: `Thay đổi trợ giảng chỉ được ghi khi bạn nhấn Lưu thay đổi.`

Trong màn tạo lớp, trợ giảng nằm trong section `02` để người dùng khai báo đội ngũ ngay
khi mở lớp. Trong màn chi tiết, dialog **Quản lý trợ giảng** là lối tắt để chỉnh riêng
bảng liên kết mà không phải sửa lại tên, môn hoặc sĩ số lớp.

Các dialog dùng chung control `size="control"`, lỗi cấp dialog có `aria-live` và chỉ đóng
sau khi thao tác thành công.

## 8. Những thứ loại khỏi prototype hiện tại

Không giữ các chi tiết sau của `classes.html` hoặc `classes-table.html`:

- Cách hiển thị nhiều giáo viên nhưng không phân biệt vai trò. Thiết kế mới phải phân tách
  rõ một giáo viên `Phụ trách` và các giáo viên `Trợ giảng`; trợ giảng là quan hệ ở bảng
  liên kết riêng.
- Trạng thái `Sắp diễn ra` — API hiện chỉ có `Đang hoạt động` và `Đã kết thúc`.
- Bộ lọc khoảng ngày — API danh sách lớp hiện chưa có tham số này.
- Lịch dự kiến, thứ học, giờ học, phòng học.
- Dữ liệu minh họa hiển thị như dữ liệu thật.
- Tạo/sửa bằng modal nhỏ nếu modal khiến form không đủ rõ; route frontend thật có trang
  tạo và sửa riêng.
- Xóa lớp — nghiệp vụ hiện không hỗ trợ.

`classes-table.html` được giữ làm tài liệu tham khảo lịch sử, nhưng `classes.html` vẫn là
entry chính của artifact danh sách.

## 9. Mapping dự kiến sang frontend

Các file chính có thể cần đổi sau khi bản thiết kế được duyệt:

- `frontend/src/modules/academic/components/classes-view.tsx`
- `frontend/src/modules/academic/containers/classes-container.tsx`
- `frontend/src/modules/academic/containers/class-form-container.tsx`
- `frontend/src/modules/academic/components/class-summary.tsx`
- `frontend/src/modules/academic/components/roster-view.tsx`
- `frontend/src/modules/academic/containers/add-students-dialog.tsx`
- `frontend/src/modules/academic/containers/enrollment-dialogs.tsx`
- Hook/query state cho filter, sort, page và `active_only` nếu cần.

Ưu tiên tái sử dụng `ListSheet`, `FormSheet`, `StatePanel`, `ConditionsBar`,
`DataTablePagination`, `AsyncSelectField`, `ConfirmActionDialog` và các token hiện có.
Không tạo component abstraction mới nếu component dùng chung hiện tại đã đáp ứng.

## 10. Kiểm tra sau khi triển khai

- OpenDesign preview đủ các route: danh sách, tạo, sửa, chi tiết, dialog ghi danh.
- Kiểm tra desktop `1440px`, tablet `1024px` và mobile `390px`.
- Xác nhận không có overflow ngang ở danh sách hoặc form.
- Kiểm tra keyboard focus, dialog Escape, label, `aria-live` và trạng thái disabled.
- Chạy frontend lint, typecheck, build và `git diff --check`.
- Chạy test API/frontend hiện có; bổ sung test chỉ khi logic filter hoặc UI state mới cần
  bảo vệ.
- Đối chiếu mọi nội dung hiển thị với `docs/documentation/academic/lop-hoc.md` và
  `docs/documentation/academic/ghi-danh.md`.
