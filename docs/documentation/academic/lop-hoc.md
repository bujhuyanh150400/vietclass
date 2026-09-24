# Quản lý lớp học

Last Verified: 2026-09-24
Related Task: `.tasks/phase-4-academic-lifecycle.md`

## Tổng quan

Lớp học gắn một hoặc nhiều môn với một giáo viên phụ trách và không hoặc nhiều trợ giảng; học sinh được ghi danh vào toàn lớp. Lớp phụ thuộc các môn và hồ sơ giáo viên, nên những dữ liệu này phải có trước.

Chức năng dùng được cả qua API lẫn màn hình quản trị tại `/academic/classes` (mục **Lớp học** trong nhóm Học vụ ở thanh bên).

## Người dùng và điều kiện

- Chỉ vai trò Quản trị viên. Các vai trò khác nhận `403`.
- Cần bearer token hợp lệ.
- Khi tạo, phải có ít nhất một môn học đang hoạt động, một giáo viên phụ trách đang làm việc, và mọi trợ giảng được chọn cũng đang làm việc.

## Quy tắc nghiệp vụ

- Mã lớp là duy nhất trong toàn hệ thống.
- **Mã lớp và ngày khai giảng không đổi được sau khi tạo.** Gửi kèm hai trường này khi sửa thì chúng bị bỏ qua, không phải bị từ chối.
- Lớp mới luôn ở trạng thái đang hoạt động.
- Lớp có một giáo viên phụ trách và 0..n trợ giảng; cùng một giáo viên không được vừa phụ trách vừa trợ giảng, và ID môn/trợ giảng không được lặp trong danh sách gửi lên.
- `subject_id` tiếp tục là môn đại diện và `teacher_id` là giáo viên phụ trách cho client cũ. Tập môn đầy đủ lưu trong `class_subjects` và luôn gồm môn đại diện.
- Khi tạo, mọi môn của lớp phải đang hoạt động và áp dụng cho khối. Khi đổi tập môn hoặc khối, tất cả môn trong tập mới phải áp dụng cho khối; môn mới được thêm và môn mới chọn làm đại diện phải đang hoạt động.
- Khi sửa, client cũ có thể chỉ gửi `subject_id`/`teacher_id`: đổi `subject_id` thay môn đại diện nhưng giữ các môn bổ sung, không gửi danh sách trợ giảng thì giữ nguyên đội ngũ. Client gửi `subject_ids` sẽ thay toàn bộ tập môn; gửi `assistant_teacher_ids: []` tường minh mới xóa hết trợ giảng. Thay đổi dữ liệu lớp và quan hệ được lưu cùng một transaction.
- Trợ giảng được gửi trong danh sách phải đang làm việc. Giữ nguyên môn đại diện/khối/tập môn và giáo viên phụ trách hiện tại vẫn được, kể cả khi subject đã khóa hoặc giáo viên đã nghỉ — để không chặn sửa các trường khác.
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
| Xem danh sách | `GET /api/v1/academic/classes` |
| Lấy danh sách chọn | `GET /api/v1/academic/classes/options` |
| Tạo | `POST /api/v1/academic/classes` với `code`, `name`, `subject_id`, `teacher_id`, `grade_level`, `max_students`, `start_at`; tùy chọn `subject_ids[]`, `assistant_teacher_ids[]` |
| Xem chi tiết | `GET /api/v1/academic/classes/{id}` |
| Sửa | `PUT /api/v1/academic/classes/{id}` với `name`, `subject_id`, `teacher_id`, `grade_level`, `max_students`; tùy chọn `subject_ids[]`, `assistant_teacher_ids[]` |
| Đổi trạng thái | `PATCH /api/v1/academic/classes/{id}/status` với `status` |

Trạng thái: `0` Đang hoạt động, `1` Kết thúc. Khối lớp: `0` Tiền tiểu học, `1`–`12` theo số lớp.

Danh sách nhận thêm `q` để tìm theo mã hoặc tên lớp; `status[]`, `subject_id[]`, `teacher_id[]`, `grade_level[]` để lọc; cùng `page`, `per_page`, `sort`, `direction`. Lọc `subject_id[]` khớp mọi môn trong tập đầy đủ, không chỉ môn đại diện. Cột sắp xếp cho phép: `id`, `code`, `name`, `start_at`, `created_at`.

Từ khóa tìm kiếm **bỏ dấu tiếng Việt và không phân biệt hoa thường**: gõ `Hung` tìm ra `Hùng`, gõ `Do Thi Uoc` tìm ra `Đỗ Thị Ước`. Gõ đầy đủ dấu vẫn tìm được như thường. Ký tự `%` và `_` gõ vào được hiểu là ký tự thật, không phải ký tự đại diện.

## Kết quả mong đợi

- Danh sách trả về envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi lớp giữ `subject_id`, `subject_name`, `teacher_id`, `teacher_name` và `active_students_count`; đồng thời trả `subjects[]` (`id`, `name`, `is_active`), `teacher_status` và `assistant_teachers[]` (`id`, `name`, `status`). `active_students_count` là sĩ số đang học, tức con số mà sĩ số tối đa được so với.
- Tạo thành công trả `201` với trạng thái đang hoạt động và sĩ số bằng `0`.
- Sửa và đổi trạng thái trả `200` cùng bản ghi sau khi cập nhật.
- Kết thúc lớp trả về `active_students_count` bằng `0` vì mọi bản ghi ghi danh đã bị đóng.
- Danh sách chọn chỉ trả các lớp đang hoạt động, nhãn dạng `Tên lớp (MÃ)`.

Trên trình duyệt:

- Mỗi thao tác thành công hiện một thông báo nổi ở góc dưới bên phải rồi tự đóng sau vài giây: `Đã tạo lớp học.`, `Đã lưu thay đổi lớp học.`, `Đã kết thúc lớp "<tên>".`, `Đã mở lại lớp "<tên>".`
- Danh sách lớp học tự hiển thị bản ghi vừa tạo hoặc vừa sửa khi màn hình quay lại, không cần tải lại trang.

## Lỗi và trường hợp ngoại lệ

- Trùng mã lớp trả `422` gắn vào `code`: `Mã lớp này đã tồn tại. Vui lòng đặt mã khác.`
- Ngày kết thúc trước ngày khai giảng trả `422` gắn vào `end_at`: `Ngày kết thúc không thể trước ngày khai giảng.`
- Môn học đã khóa trả `422`: `Môn học này đã bị khóa, không thể mở lớp mới.` hoặc `... không thể gán cho lớp.`
- Môn học không áp dụng cho khối của lớp trả `422`; nếu `subject_ids[]` được gửi thì phải chứa `subject_id` và không được có môn trùng.
- ID trợ giảng không được trùng nhau hoặc trùng với `teacher_id`; khi client cũ đổi `teacher_id` thành một trợ giảng hiện có nhưng bỏ qua danh sách trợ giảng, yêu cầu cũng bị từ chối. Lỗi trả `422` gắn vào `assistant_teacher_ids` hoặc `teacher_id`; gửi danh sách đã bỏ người được chuyển sang vai trò phụ trách để xác nhận thay đổi.
- Giáo viên phụ trách đã nghỉ trả `422`: `Giáo viên này không còn làm việc, không thể phụ trách lớp.` Trợ giảng đã nghỉ cũng không thể được chọn khi tạo hoặc gửi trong danh sách sửa.
- Hạ sĩ số dưới số học sinh hiện tại trả `422`: `Sĩ số tối đa (N) không thể nhỏ hơn số học sinh đang học trong lớp (M).`
- Không tìm thấy lớp trả `404`: `Không tìm thấy lớp học.`
- Không đủ quyền trả `403`; thiếu token trả `401`.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Quản lý môn học](mon-hoc.md) | Tiên quyết | Lớp tham chiếu toàn bộ tập môn; mỗi môn đều có khối áp dụng. | Môn đã khóa không được chọn làm môn mới, và mọi môn còn được dạy bởi lớp đang hoạt động chặn khóa hoặc xóa. |
| [Quản lý giáo viên](../academic/giao-vien.md) | Tiên quyết | Lớp phải có giáo viên đang làm việc phụ trách. | Giáo viên đã nghỉ không chọn được khi mở lớp. |
| [Ghi danh vào lớp](ghi-danh.md) | Hạ nguồn | Kết thúc lớp đóng toàn bộ ghi danh còn mở. | Sau khi kết thúc, sĩ số về `0` và không thao tác ghi danh được nữa. |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai gọi được các endpoint lớp học. | Không đủ quyền thì nhận `403`. |

## Giới hạn hiện tại

- Không có chức năng xóa lớp.
- Mở lại lớp đã kết thúc không khôi phục danh sách học sinh.
- Form tạo/sửa cho chọn nhiều môn, một giáo viên phụ trách và các trợ giảng. Khi đổi tập môn của lớp đang có học sinh, màn sửa yêu cầu xác nhận tác động trước khi lưu. Chi tiết lớp có bốn tab: Tổng quan, Học sinh, Lịch cố định và Lịch sử buổi học; hai tab lịch chỉ là placeholder.
- Chưa có lịch học, phòng học, điểm danh hay học phí. Không có cột tiền nào trên bảng `classes`; module tài chính sau này sẽ tự thêm cột riêng khi cần.
- Danh sách chọn trả tối đa 50 bản ghi mỗi lần gọi.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Academic/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/AcademicClassTest.php`, `api/tests/Security/AcademicAuthorizationTest.php`
- Schema: `docs/database.md`
