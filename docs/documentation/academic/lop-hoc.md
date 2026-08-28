# Quản lý lớp học

Last Verified: 2026-08-28

## Tổng quan

Lớp học gắn một môn học với một giáo viên phụ trách, và là nơi học sinh được ghi danh vào. Lớp phụ thuộc cả môn học lẫn hồ sơ giáo viên, nên hai thứ đó phải có trước.

Chức năng dùng được cả qua API lẫn màn hình quản trị tại `/academic/classes` (mục **Lớp học** trong nhóm Học vụ ở thanh bên).

## Người dùng và điều kiện

- Chỉ vai trò Quản trị viên. Các vai trò khác nhận `403`.
- Cần bearer token hợp lệ.
- Phải có ít nhất một môn học đang hoạt động và một giáo viên đang làm việc.

## Quy tắc nghiệp vụ

- Mã lớp là duy nhất trong toàn hệ thống.
- **Mã lớp và ngày khai giảng không đổi được sau khi tạo.** Gửi kèm hai trường này khi sửa thì chúng bị bỏ qua, không phải bị từ chối.
- Lớp mới luôn ở trạng thái đang hoạt động.
- Chỉ mở được lớp với môn học đang hoạt động và giáo viên đang làm việc.
- Đổi sang môn khác hoặc giáo viên khác cũng phải chọn môn đang hoạt động và giáo viên đang làm việc. Giữ nguyên môn và giáo viên hiện tại thì luôn được, kể cả khi môn đã bị khóa hoặc giáo viên đã nghỉ — nếu không thì một lớp đang chạy sẽ không sửa nổi bất cứ thứ gì khác.
- Sĩ số tối đa không được đặt thấp hơn số học sinh đang học trong lớp. Bằng đúng số hiện tại thì được.
- Ngày kết thúc không được trước ngày khai giảng.
- **Kết thúc lớp gần như là một chiều.** Khi chuyển sang trạng thái kết thúc, hệ thống đóng mọi bản ghi ghi danh còn mở theo ngày kết thúc và ghi lại ngày đó. Mở lại lớp chỉ khôi phục trạng thái, **không** khôi phục các bản ghi đã bị đóng. Fork cũng hành xử như vậy.
- Nếu lớp đã có sẵn ngày kết thúc thì ngày đó được giữ; nếu chưa thì lấy ngày hiện tại.
- Lớp đã kết thúc khóa mọi thao tác ghi danh.
- Không có chức năng xóa lớp.

## Hướng dẫn thao tác

Mọi endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách | `GET /classes` |
| Lấy danh sách chọn | `GET /classes/options` |
| Tạo | `POST /classes` với `code`, `name`, `subject_id`, `teacher_id`, `grade_level`, `max_students`, `start_at` |
| Xem chi tiết | `GET /classes/{id}` |
| Sửa | `PUT /classes/{id}` với `name`, `subject_id`, `teacher_id`, `grade_level`, `max_students` |
| Đổi trạng thái | `PATCH /classes/{id}/status` với `status` |

Trạng thái: `0` Đang hoạt động, `1` Kết thúc. Khối lớp: `0` Tiền tiểu học, `1`–`12` theo số lớp.

Danh sách nhận thêm `q` để tìm theo mã hoặc tên lớp; `status[]`, `subject_id[]`, `teacher_id[]`, `grade_level[]` để lọc; cùng `page`, `per_page`, `sort`, `direction`. Cột sắp xếp cho phép: `id`, `code`, `name`, `start_at`, `created_at`.

## Kết quả mong đợi

- Danh sách trả về envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi lớp kèm `subject_name`, `teacher_name` và `active_students_count` — sĩ số đang học, tức con số mà sĩ số tối đa được so với.
- Tạo thành công trả `201` với trạng thái đang hoạt động và sĩ số bằng `0`.
- Sửa và đổi trạng thái trả `200` cùng bản ghi sau khi cập nhật.
- Kết thúc lớp trả về `active_students_count` bằng `0` vì mọi bản ghi ghi danh đã bị đóng.
- Danh sách chọn chỉ trả các lớp đang hoạt động, nhãn dạng `Tên lớp (MÃ)`.

## Lỗi và trường hợp ngoại lệ

- Trùng mã lớp trả `422` gắn vào `code`: `Mã lớp này đã tồn tại. Vui lòng đặt mã khác.`
- Ngày kết thúc trước ngày khai giảng trả `422` gắn vào `end_at`: `Ngày kết thúc không thể trước ngày khai giảng.`
- Môn học đã khóa trả `422`: `Môn học này đã bị khóa, không thể mở lớp mới.` hoặc `... không thể gán cho lớp.`
- Giáo viên đã nghỉ trả `422`: `Giáo viên này không còn làm việc, không thể phụ trách lớp.`
- Hạ sĩ số dưới số học sinh hiện tại trả `422`: `Sĩ số tối đa (N) không thể nhỏ hơn số học sinh đang học trong lớp (M).`
- Không tìm thấy lớp trả `404`: `Không tìm thấy lớp học.`
- Không đủ quyền trả `403`; thiếu token trả `401`.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Quản lý môn học](mon-hoc.md) | Tiên quyết | Lớp phải thuộc một môn đang hoạt động. | Môn đã khóa không chọn được khi mở lớp. |
| [Quản lý giáo viên](../identity/giao-vien.md) | Tiên quyết | Lớp phải có giáo viên đang làm việc phụ trách. | Giáo viên đã nghỉ không chọn được khi mở lớp. |
| [Ghi danh vào lớp](ghi-danh.md) | Hạ nguồn | Kết thúc lớp đóng toàn bộ ghi danh còn mở. | Sau khi kết thúc, sĩ số về `0` và không thao tác ghi danh được nữa. |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai gọi được các endpoint lớp học. | Không đủ quyền thì nhận `403`. |

## Giới hạn hiện tại

- Không có chức năng xóa lớp.
- Mở lại lớp đã kết thúc không khôi phục danh sách học sinh.
- Chưa có lịch học, phòng học, điểm danh hay học phí. Không có cột tiền nào trên bảng `classes`; module tài chính sau này sẽ tự thêm cột riêng khi cần.
- Danh sách chọn trả tối đa 50 bản ghi mỗi lần gọi.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Academic/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/AcademicClassTest.php`, `api/tests/Security/AcademicAuthorizationTest.php`
- Schema: `.docs/database.md`
