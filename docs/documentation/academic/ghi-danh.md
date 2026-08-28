# Ghi danh vào lớp

Last Verified: 2026-08-28

## Tổng quan

Ghi danh nối một học sinh với một lớp trong một khoảng thời gian. Một học sinh có thể có **nhiều** bản ghi ghi danh trong cùng một lớp: rời lớp rồi quay lại tạo bản ghi mới và giữ nguyên giai đoạn đã học trước đó.

Chức năng dùng được cả qua API lẫn màn hình quản trị: mở một lớp tại `/academic/classes/{id}` để thấy danh sách học sinh và mọi thao tác ghi danh.

## Người dùng và điều kiện

- Chỉ vai trò Quản trị viên. Các vai trò khác nhận `403`.
- Lớp phải đang hoạt động. Lớp đã kết thúc khóa mọi thao tác ghi danh.
- Học sinh phải có tài khoản chưa bị khóa.

## Quy tắc nghiệp vụ

### Quy tắc "đang học"

Một bản ghi ghi danh được coi là **đang học** khi `left_at` rỗng, hoặc `left_at` sau ngày hôm nay. Rời lớp đúng ngày hôm nay tức là đã nghỉ.

Mỗi cặp (lớp, học sinh) chỉ được có tối đa **một** bản ghi đang học tại một thời điểm. Quy tắc này phụ thuộc ngày hiện tại nên không diễn đạt được bằng ràng buộc cơ sở dữ liệu; hệ thống kiểm tra khi thao tác.

### Thêm học sinh vào lớp

- Thêm được nhiều học sinh cùng lúc, dùng chung một ngày vào lớp.
- Ngày vào lớp không được trước ngày khai giảng của lớp.
- Sĩ số được kiểm tra **một lần cho cả lô**: nếu cả lô làm vượt sĩ số tối đa thì toàn bộ yêu cầu bị từ chối, không thêm một phần.
- Học sinh đang học trong lớp thì không thêm lại được. Học sinh **đã rời lớp** thì thêm lại được.
- Cùng một học sinh gửi trùng trong một yêu cầu chỉ được ghi danh một lần.

### Sửa thông tin ghi danh

- Sửa được ngày vào lớp, ngày rời lớp và ghi chú.
- Khác với chuyển lớp và cho nghỉ, thao tác này áp dụng được cả cho bản ghi **đã đóng**, vì mục đích của nó là sửa dữ liệu nhập sai.
- Ngày vào lớp không được trước ngày khai giảng; ngày rời lớp không được trước ngày vào lớp.
- Mở lại một bản ghi đã đóng bị từ chối nếu học sinh đang có một bản ghi khác còn mở trong cùng lớp.

### Chuyển lớp

- Chỉ áp dụng cho bản ghi đang học.
- Lớp đích phải đang hoạt động và **cùng môn học** với lớp đang rời.
- Lớp đích phải còn chỗ và học sinh chưa đang học ở đó.
- Ngày chuyển không được trước ngày vào lớp cũ, cũng không được trước ngày khai giảng của lớp đích.
- Bản ghi cũ được đóng vào ngày chuyển và ghi chú thêm `[Chuyển sang lớp: MÃ]`; bản ghi mới mở ra **cùng ngày đó**, nên lịch sử không có khoảng trống.
- Chuyển lớp thất bại thì không thay đổi gì cả.

### Cho nghỉ lớp

- Chỉ áp dụng cho bản ghi đang học.
- **Bắt buộc nhập lý do.** Lý do được ghi nối vào ghi chú dưới dạng `[Nghỉ học]: ...`.
- Ngày nghỉ không được trước ngày vào lớp.
- Bản ghi được giữ lại chứ không xóa, để giai đoạn học sinh đã theo học vẫn còn trên hồ sơ.

## Hướng dẫn thao tác

Mọi endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách lớp | `GET /classes/{id}/enrollments` |
| Xem học sinh có thể thêm | `GET /classes/{id}/available-students` |
| Thêm học sinh | `POST /classes/{id}/enrollments` với `student_ids`, `enrolled_at` |
| Sửa thông tin ghi danh | `PUT /enrollments/{id}` với `enrolled_at`, tùy chọn `left_at`, `note` |
| Chuyển lớp | `POST /enrollments/{id}/transfer` với `class_id`, `left_at` |
| Cho nghỉ lớp | `POST /enrollments/{id}/leave` với `left_at`, `reason` |

Danh sách lớp nhận thêm `active_only=1` để chỉ lấy bản ghi đang học, `q` để tìm theo tên học sinh, cùng `page`, `per_page`, `sort`, `direction`. Cột sắp xếp cho phép: `id`, `enrolled_at`, `left_at`.

## Kết quả mong đợi

- Danh sách lớp trả về **mọi** giai đoạn, kể cả đã rời, kèm `is_active` cho từng bản ghi.
- Danh sách học sinh có thể thêm loại bỏ người đang học trong lớp và người bị khóa tài khoản, nhưng **vẫn giữ** người đã từng rời lớp.
- Thêm học sinh trả `201` cùng mảng các bản ghi vừa tạo.
- Chuyển lớp trả `201` cùng bản ghi mới ở lớp đích.
- Sửa và cho nghỉ trả `200` cùng bản ghi sau khi cập nhật.

## Lỗi và trường hợp ngoại lệ

- Ngày vào lớp trước ngày khai giảng trả `422`: `Ngày vào lớp không thể trước ngày khai giảng (dd/mm/yyyy).`
- Vượt sĩ số trả `409`: `Lớp đã đạt sĩ số tối đa (N/M học sinh), không thể thêm.`
- Học sinh đang học trong lớp trả `409`: `Học sinh {tên} đang học trong lớp này rồi.`
- Lớp đã kết thúc trả `409`: `Lớp đã kết thúc, không thể thay đổi danh sách học sinh.`
- Thao tác trên bản ghi đã đóng trả `409`: `Học sinh không còn học trong lớp này.`
- Mở lại bản ghi khi đã có bản ghi khác đang mở trả `409`: `Học sinh đã có một bản ghi đang học khác trong lớp này.`
- Ngày rời trước ngày vào trả `422`: `Ngày rời lớp không thể trước ngày vào lớp (dd/mm/yyyy).`
- Lớp đích khác môn trả `422`: `Chỉ được chuyển học sinh sang lớp cùng môn học.`
- Lớp đích đã kết thúc trả `422`: `Lớp học mới không ở trạng thái đang hoạt động.`
- Thiếu lý do khi cho nghỉ trả `422` gắn vào `reason`: `Vui lòng nhập lý do nghỉ học.`
- Không tìm thấy bản ghi trả `404`: `Không tìm thấy bản ghi ghi danh.` Không tìm thấy lớp trả `Không tìm thấy lớp học.`
- Không đủ quyền trả `403`; thiếu token trả `401`.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Quản lý lớp học](lop-hoc.md) | Tiên quyết | Lớp phải đang hoạt động và còn chỗ. | Lớp kết thúc thì mọi thao tác ghi danh bị chặn. |
| [Quản lý học sinh](../identity/hoc-sinh.md) | Tiên quyết | Học sinh phải có hồ sơ và tài khoản chưa khóa. | Học sinh bị khóa không xuất hiện trong danh sách chọn. |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Mỗi thao tác ghi danh có một quyền riêng. | Không đủ quyền thì nhận `403`. |

## Giới hạn hiện tại

- **Chưa kiểm tra trùng lịch.** Một học sinh có thể được ghi danh vào hai lớp học cùng khung giờ mà hệ thống không phát hiện, cho tới khi có module Lịch học.
- Chưa có học phí riêng theo học sinh. Không có cột tiền nào trên bảng `class_enrollments`; module tài chính sau này sẽ tự thêm cột riêng khi cần.
- Chuyển lớp luôn thực hiện ngay, chưa có luồng chờ duyệt như fork.
- Không có chức năng xóa bản ghi ghi danh.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Academic/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/AcademicEnrollmentTest.php`, `api/tests/Security/AcademicAuthorizationTest.php`
- Schema: `.docs/database.md`
