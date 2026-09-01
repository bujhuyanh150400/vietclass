# Lịch cố định theo lớp

Last Verified: 2026-09-01
Related Task: `.tasks/schedule-phase-2-templates.md`, `.tasks/schedule-phase-3-projection.md`

## Tổng quan

Lịch cố định là khai báo "lớp này học vào thứ mấy, từ giờ nào tới giờ nào, ở phòng nào, ai dạy, và áp dụng trong khoảng ngày nào". Một lớp học hai buổi một tuần có hai lịch cố định.

Đây là nền cho [buổi học theo ngày](buoi-hoc.md): hệ thống không sinh sẵn buổi học nào, mà suy ra từng buổi từ lịch cố định khi có người đọc lịch theo khoảng ngày.

Chức năng hiện chỉ có API quản trị dưới tiền tố `/api/v1`, chưa có màn hình quản trị.

## Người dùng và điều kiện

- Quản trị viên xem, tạo, sửa, đổi giáo viên, đóng và xóa lịch cố định.
- Giáo viên chỉ xem được danh sách lịch cố định của một lớp, và **chỉ thấy những lịch có tên mình**, bất kể mình là giáo viên chính hay trợ giảng. Mọi endpoint ghi trả `403` với giáo viên.
- Tài khoản giáo viên chưa có hồ sơ thì danh sách trả về rỗng, không trả toàn bộ lớp.
- Cần bearer token hợp lệ; thiếu token trả `401`.

## Quy tắc nghiệp vụ

### Khung giờ và khoảng ngày

- `day_of_week` là số nguyên `0` — **Thứ 2** đến `6` — **Chủ nhật**.
- `end_time` phải **sau** `start_time`. Hai giờ bằng nhau cũng bị từ chối.
- `end_date` **không được trước** `start_date`. Ở đường sửa, mốc so sánh là `effective_date` vì đó chính là ngày bản mới bắt đầu áp dụng.
- `end_date` để trống nghĩa là lịch chạy tới khi lớp kết thúc.
- `start_date` không được trước ngày khai giảng của lớp; `end_date` không được sau ngày kết thúc lớp khi cả hai đều có giá trị.
- Phòng học là bắt buộc — lớp không có phòng riêng để kế thừa.

### Điều kiện của bản ghi liên quan

- Lớp phải đang ở trạng thái **Đang hoạt động** mới xếp hoặc sửa được lịch. Lớp đã kết thúc vẫn xem được lịch sử lịch của mình.
- Phòng học phải đang ở trạng thái **Hoạt động**. Phòng Tạm khóa hoặc Bảo trì bị từ chối.
- Mọi giáo viên trong danh sách phải đang ở trạng thái **Đang làm việc**, kể cả khi chỉ là trợ giảng.

### Chống trùng

Một lịch cố định bị từ chối khi đã có lịch khác **cùng thứ**, **khoảng ngày giao nhau** và **khoảng giờ giao nhau**, mà lại **trùng phòng** hoặc **có ít nhất một giáo viên xuất hiện ở cả hai lịch**.

- Ngoài các lịch cố định khác, lịch còn được so với **những buổi học đã ghi** nằm trong khoảng hiệu lực của nó. Nhờ đó việc đóng một lịch cố định không giải phóng phòng của những buổi đã được ghi dưới nó: buổi đã ghi vẫn giữ phòng và giờ của người dạy.
- Buổi học ở trạng thái **Đã huỷ** không tính là chiếm chỗ.
- Vai trò không làm nhẹ luật: một người là giáo viên chính ở lịch này và trợ giảng ở lịch kia, trùng giờ, vẫn bị chặn — một người không ở hai phòng cùng lúc.
- Khoảng giờ so kiểu nửa mở, nên `08:00–09:30` và `09:30–11:00` **không** coi là trùng.
- `end_date` để trống được hiểu là vô hạn, nên một lịch mở vô hạn chặn cả những khoảng ngày rất xa về sau.
- Đây là chặn cứng, không có cờ ép ghi.

### Sửa lịch đang chạy

Lịch cố định **không bao giờ được sửa tại chỗ**. Endpoint sửa là một lần *ra bản mới*:

1. Bản đang chạy được đóng lại với `end_date` bằng ngày hiệu lực trừ 1.
2. Một bản mới được mở từ ngày hiệu lực với các giá trị mới.

Cả hai bước nằm trong một giao dịch. Ngày hiệu lực không được ở quá khứ. Nếu ngày hiệu lực trùng hoặc trước `start_date` của bản cũ thì bản cũ chưa từng có hiệu lực ngày nào, nên nó bị **xóa** thay vì để lại một dòng vô nghĩa.

Đổi **giáo viên** thì không phải ra bản mới: ai dạy không thuộc phần định nghĩa buổi học đó, nên có endpoint riêng thay toàn bộ danh sách giáo viên và giữ nguyên thứ, giờ, phòng, khoảng ngày.

### Đóng và xóa

- **Đóng** chỉ đặt `end_date`, dùng khi lớp thôi học buổi đó mà không thay bằng buổi khác. Ngày đóng không được trước ngày lịch bắt đầu áp dụng.
- **Xóa** chỉ được phép khi `start_date` còn ở tương lai **và** chưa có buổi học nào đã ghi trỏ vào lịch. Lịch đã có hiệu lực là lịch sử đã diễn ra, phải dùng đường đóng.

### Vết người thao tác

Mọi đường ghi đều ghi lại người thực hiện: tạo mới ghi `created_by` và để `updated_by` trống; sửa, đổi giáo viên và đóng đều ghi `updated_by`.

## Giáo viên chính và trợ giảng

Giáo viên của một lịch cố định được **khai tường minh**, không kế thừa giáo viên của lớp. Nhờ đó "buổi học không có người dạy" là trạng thái hệ thống không biểu diễn được.

- Mỗi lịch cố định có **đúng một** giáo viên chính (`role = 0` — **Giáo viên chính**).
- Số trợ giảng (`role = 1` — **Trợ giảng**) không giới hạn, và có thể không có ai.
- Một người chỉ được xuất hiện **một lần** trong cùng một lịch, dù ở vai trò nào.
- Danh sách giáo viên luôn được gửi **trọn vẹn**, không thêm bớt từng người. Gửi danh sách thiếu sẽ bị từ chối toàn phần chứ không để lịch dở dang.
- Hai luật "đúng một giáo viên chính" và "không ai xuất hiện hai lần" còn được cưỡng chế ở tầng dữ liệu, nên chúng không thể bị lách qua bất kỳ đường ghi nào.
- Giáo viên nghỉ việc không tự động bị gỡ khỏi lịch đã xếp; hệ thống chỉ chặn việc gán mới. Dọn chỗ đó là việc của người xếp lịch.

## Hướng dẫn thao tác

Mọi endpoint cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách lịch của một lớp | `GET /api/v1/classes/{class}/schedule-templates` |
| Tạo lịch cố định | `POST /api/v1/classes/{class}/schedule-templates` với `room_id`, `day_of_week`, `start_time`, `end_time`, `start_date`, `teachers`, tùy chọn `end_date` |
| Sửa (ra bản mới) | `PUT /api/v1/schedule-templates/{template}` với `effective_date`, `room_id`, `day_of_week`, `start_time`, `end_time`, `teachers`, tùy chọn `end_date` |
| Đổi danh sách giáo viên | `PUT /api/v1/schedule-templates/{template}/teachers` với `teachers` |
| Đóng lịch | `PATCH /api/v1/schedule-templates/{template}/close` với `end_date` |
| Xóa lịch chưa có hiệu lực | `DELETE /api/v1/schedule-templates/{template}` |

- `start_time` và `end_time` nhận định dạng `HH:MM` hoặc `HH:MM:SS`.
- `start_date`, `end_date` và `effective_date` nhận định dạng `YYYY-MM-DD`.
- `teachers` là mảng, mỗi phần tử gồm `teacher_profile_id` và `role`, nhiều nhất 20 phần tử.

## Kết quả mong đợi

- Danh sách trả envelope `data` là một mảng, **không có `meta` phân trang**: một lớp chỉ có vài buổi mỗi tuần, và thứ tự cố định theo thứ rồi giờ bắt đầu quan trọng hơn việc chia trang.
- Danh sách bao gồm cả các bản **đã đóng**, để thấy được lịch sử đổi lịch của lớp.
- Mỗi lịch trả `id`, `class_id`, `day_of_week`, `day_of_week_label`, `start_time`, `end_time`, `room_id`, `room_name`, `start_date`, `end_date`, `is_closed`, `main_teacher`, `assistant_teachers`, `teachers`, `created_at`, `updated_at`.
- `start_time` và `end_time` trả về dạng `HH:MM`.
- `main_teacher` là một phần tử, `assistant_teachers` và `teachers` là mảng; mỗi phần tử gồm `teacher_profile_id`, `teacher_name`, `role`, `role_label`.
- Tạo thành công trả `201` cùng lịch mới.
- Sửa trả `200` cùng **bản mới**, không phải bản bị thay thế.
- Đổi giáo viên và đóng lịch trả `200` cùng lịch sau cập nhật.
- Xóa thành công trả `204`.

## Lỗi và trường hợp ngoại lệ

Lỗi định dạng trả `422` và gắn vào đúng trường sai:

- `end_time` không sau `start_time`: `Giờ kết thúc phải sau giờ bắt đầu.`
- `end_date` trước `start_date`: `Ngày kết thúc không được trước ngày bắt đầu.`
- `end_date` trước `effective_date` ở đường sửa: `Ngày kết thúc không được trước ngày hiệu lực.`
- `day_of_week` ngoài `0`–`6`: `Thứ trong tuần không hợp lệ.`
- `teachers` trống hoặc thiếu: `Lịch cố định phải có ít nhất một giáo viên.`
- `role` ngoài hai giá trị đã khai: `Vai trò giáo viên không hợp lệ.`

Lỗi nghiệp vụ trả mã và trạng thái sau:

| Mã | HTTP | Trường hợp |
| --- | --- | --- |
| `SCHEDULE-001` | `404` | Không tìm thấy lịch cố định. |
| `SCHEDULE-002` | `409` | Phòng học đã có lịch cố định khác trùng thứ và trùng giờ. |
| `SCHEDULE-003` | `409` | Giáo viên đã có lịch cố định khác trùng thứ và trùng giờ. |
| `SCHEDULE-004` | `422` | Danh sách giáo viên không có giáo viên chính. |
| `SCHEDULE-005` | `422` | Danh sách giáo viên có nhiều hơn một giáo viên chính. |
| `SCHEDULE-006` | `422` | Một giáo viên xuất hiện hai lần trong cùng danh sách. |
| `SCHEDULE-007` | `422` | Lịch bắt đầu trước ngày khai giảng của lớp. |
| `SCHEDULE-008` | `422` | Lịch kéo dài sau ngày kết thúc lớp. |
| `SCHEDULE-009` | `422` | Ngày hiệu lực của bản sửa ở quá khứ. |
| `SCHEDULE-010` | `409` | Lịch đã có hiệu lực, phải đóng thay vì xóa. |
| `SCHEDULE-011` | `422` | Ngày đóng lịch trước ngày lịch bắt đầu áp dụng. |
| `SCHEDULE-012` | `409` | Còn buổi học đã ghi trỏ vào lịch, nên không xóa được. |

Các bản ghi thuộc Học vụ giữ mã lỗi của Học vụ thay vì được đặt lại tên trong module Lịch học:

| Mã | HTTP | Trường hợp |
| --- | --- | --- |
| `ACADEMIC-004` | `404` | Không tìm thấy giáo viên được nêu trong danh sách. |
| `ACADEMIC-005` | `422` | Giáo viên đã nghỉ việc, không xếp vào lịch được. |
| `ACADEMIC-006` | `404` | Không tìm thấy lớp học. |
| `ACADEMIC-007` | `409` | Lớp học đã kết thúc, không xếp lịch được. |
| `ACADEMIC-018` | `404` | Không tìm thấy phòng học. |
| `ACADEMIC-020` | `422` | Phòng học đang Tạm khóa hoặc Bảo trì. |

Không đủ quyền trả `403`; thiếu token trả `401`.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai gọi được từng endpoint lịch cố định. | Giáo viên xem được danh sách, mọi thao tác ghi trả `403`. |
| [Quản lý lớp học](../academic/lop-hoc.md) | Tiên quyết | Lớp phải đang hoạt động mới xếp được lịch, và khoảng ngày của lịch phải nằm trong ngày khai giảng và kết thúc lớp. | Lớp đã kết thúc thì tạo hay sửa lịch trả `409`. |
| [Quản lý phòng học](../academic/phong-hoc.md) | Tiên quyết và hạ nguồn | Lịch cố định phải chọn một phòng đang Hoạt động, và ngược lại phòng còn lịch cố định trỏ vào thì không xóa được. | Xóa phòng đang có lịch trả `409` kèm số lịch đang dùng. |
| [Quản lý giáo viên](../identity/giao-vien.md) | Tiên quyết | Chỉ giáo viên đang làm việc được xếp vào lịch, ở cả hai vai trò. | Chọn giáo viên đã nghỉ trả `422` kèm tên người đó. |
| [Buổi học theo ngày](buoi-hoc.md) | Hạ nguồn | Từng buổi học được chiếu ra từ lịch cố định và sao chép danh sách giáo viên của nó; ngược lại buổi đã ghi chặn việc xóa lịch và giữ phòng kể cả sau khi lịch đóng. | Đóng lịch rồi vẫn thấy các buổi đã ghi; xóa lịch còn buổi trả `409`. |

## Giới hạn hiện tại

- Chưa có màn hình quản trị cho lịch cố định.
- Không sửa được lịch tại chỗ theo thiết kế. Một lần sửa luôn để lại thêm một dòng lịch sử.
- Ra bản mới **chưa dọn** các buổi đã ghi của bản cũ từ ngày hiệu lực trở đi, nên một buổi đã ghi có thể mô tả thứ, giờ hoặc phòng mà lịch cố định không còn khai nữa.
- Lớp kết thúc chưa tự động đóng các lịch cố định đang mở.
- Hai luật "đúng một giáo viên chính" và "không ai hai lần" được kiểm trước khi ghi để trả lỗi tiếng Việt; nếu có hai yêu cầu ghi chen nhau đúng thời điểm thì ràng buộc dữ liệu vẫn chặn, nhưng lỗi trả về sẽ là lỗi hệ thống `500`.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Schedule/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/ScheduleTemplateTest.php`, `api/tests/Behavioral/ScheduleConflictTest.php`
- Schema: `.docs/database.md`, mục **Schedule**
