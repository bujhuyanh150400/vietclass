# Quản lý môn học

Last Verified: 2026-09-14

## Tổng quan

Môn học là danh mục nền của học vụ. Mỗi lớp học thuộc đúng một môn, nên môn học phải tồn tại trước khi tạo được lớp.

Chức năng dùng được cả qua API lẫn màn hình quản trị tại `/academic/subjects` (mục **Môn học** trong nhóm Học vụ ở thanh bên).

## Người dùng và điều kiện

- Chỉ vai trò Quản trị viên. Các vai trò khác nhận `403`.
- Cần bearer token hợp lệ.

## Quy tắc nghiệp vụ

- Tên môn học là duy nhất trong toàn hệ thống, tối đa 50 ký tự; mô tả tối đa 500 ký tự.
- Mỗi môn phải chọn ít nhất một khối áp dụng từ Tiền tiểu học (`0`) đến Lớp 12 (`12`).
- Môn học mới mặc định ở trạng thái đang hoạt động.
- Chỉ môn học đang hoạt động mới xuất hiện trong danh sách chọn khi tạo hoặc sửa lớp.
- Không khóa được môn học khi còn lớp **đang hoạt động** dạy môn đó. Lớp đã kết thúc không cản trở việc khóa, vì khóa môn sau khi lớp cuối cùng kết thúc chính là việc nên làm.
- Mở khóa môn học luôn được phép.
- Không xóa được môn học khi còn **bất kỳ** lớp nào tham chiếu, kể cả lớp đã kết thúc.
- Không thể bỏ một khối nếu còn lớp **đang hoạt động** dùng môn ở khối đó. Lớp đã kết thúc vẫn được giữ như lịch sử.
- Tạo hoặc sửa cặp môn/khối của lớp, cũng như mở lại lớp đã kết thúc, chỉ thành công khi môn đang hoạt động và áp dụng cho khối đó.
- Sửa môn học có thể đổi trạng thái; endpoint trạng thái riêng vẫn được giữ cho thao tác nhanh tại danh sách.

## Hướng dẫn thao tác

Mọi endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách | `GET /api/v1/academic/subjects` |
| Lấy danh sách chọn | `GET /api/v1/academic/subjects/options` |
| Tạo | `POST /api/v1/academic/subjects` với `name`, `grade_levels`, tùy chọn `description`, `is_active` |
| Xem chi tiết | `GET /api/v1/academic/subjects/{id}` |
| Sửa | `PUT /api/v1/academic/subjects/{id}` với `name`, `grade_levels`, `is_active`, tùy chọn `description` |
| Khóa hoặc mở | `PATCH /api/v1/academic/subjects/{id}/active` với `is_active` |
| Xóa | `DELETE /api/v1/academic/subjects/{id}` |

Danh sách nhận thêm `q` để tìm theo tên, `is_active` để lọc theo trạng thái, `grade_level` để lọc một khối, cùng `page`, `per_page`, `sort`, `direction`. Cột sắp xếp cho phép: `id`, `name`, `created_at`, `active_classes_count`.

Từ khóa tìm kiếm **bỏ dấu tiếng Việt và không phân biệt hoa thường**: gõ `Hung` tìm ra `Hùng`, gõ `Do Thi Uoc` tìm ra `Đỗ Thị Ước`. Gõ đầy đủ dấu vẫn tìm được như thường. Ký tự `%` và `_` gõ vào được hiểu là ký tự thật, không phải ký tự đại diện.

## Kết quả mong đợi

- Danh sách trả về envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi môn học trong danh sách kèm `grade_levels` và `active_classes_count` — số lớp đang hoạt động dùng môn đó, tức là con số quyết định việc khóa có được phép hay không.
- Tạo thành công trả `201` cùng bản ghi vừa tạo.
- Khóa, mở và sửa trả `200` cùng bản ghi sau khi cập nhật.
- Xóa thành công trả `204` và không còn bản ghi.
- Danh sách chọn trả về mảng chỉ gồm `id` và `label`.

Trên trình duyệt:

- Mỗi thao tác thành công hiện một thông báo nổi ở góc dưới bên phải rồi tự đóng sau vài giây: `Đã tạo môn học.`, `Đã lưu thay đổi môn học.`, `Đã khóa môn học "<tên>".`, `Đã mở lại môn học "<tên>".`, `Đã xóa môn học "<tên>".`
- Danh sách môn học tự hiển thị bản ghi vừa tạo hoặc vừa sửa khi màn hình quay lại, không cần tải lại trang.

## Lỗi và trường hợp ngoại lệ

- Tên môn học trùng trả `422` với lỗi gắn vào trường `name`: `Tên môn học này đã tồn tại trong hệ thống.`
- Tham số phân trang hoặc sắp xếp ngoài hợp đồng trả `422` gắn vào đúng tham số sai. Cụ thể: `per_page` ngoài khoảng 1–100, `page` nhỏ hơn 1, `sort` ngoài danh sách cho phép, `direction` khác `asc`/`desc`.
- Khóa môn học còn lớp đang hoạt động trả `409`: `Môn học đang được dùng bởi {N} lớp đang hoạt động, không thể khóa.`
- Xóa môn học còn lớp tham chiếu trả `409`: `Môn học đang được dùng bởi {N} lớp, không thể xóa.`
- Không tìm thấy môn học trả `404`: `Không tìm thấy môn học.`
- Không đủ quyền trả `403`; thiếu token trả `401`.

Ký tự `%` và `_` gõ trong `q` được so khớp đúng như ký tự thường, không mở rộng phạm vi tìm kiếm.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai gọi được các endpoint môn học. | Không đủ quyền thì nhận `403`. |
| Lớp học | Hạ nguồn | Lớp học tham chiếu môn và khóa việc khóa hoặc xóa môn. | Còn lớp dùng môn thì không khóa hoặc xóa được. |

## Giới hạn hiện tại

- Chưa lưu lịch sử thay đổi môn học.
- Danh sách chọn trả tối đa 50 bản ghi mỗi lần gọi.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Academic/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/AcademicSubjectTest.php`, `api/tests/Security/AcademicAuthorizationTest.php`
- Schema: `docs/database.md`
