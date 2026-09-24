# Ghi danh vào lớp

Last Verified: 2026-09-24
Related Task: `.tasks/phase-4-academic-lifecycle.md`

## Tổng quan

Ghi danh nối một học sinh với một lớp trong một khoảng thời gian. Một học sinh có thể có **nhiều** bản ghi ghi danh trong cùng một lớp: rời lớp rồi quay lại tạo bản ghi mới và giữ nguyên giai đoạn đã học trước đó.

Chức năng dùng được cả qua API lẫn màn hình quản trị: mở một lớp tại `/academic/classes/{id}` để thấy danh sách học sinh và mọi thao tác ghi danh.

## Người dùng và điều kiện

- Chỉ vai trò Quản trị viên. Các vai trò khác nhận `403`.
- Lớp phải đang hoạt động. Lớp đã kết thúc khóa mọi thao tác ghi danh.
- Học sinh phải có tài khoản chưa bị khóa và đang ở cùng khối với lớp.

## Quy tắc nghiệp vụ

### Quy tắc "đang học"

Một bản ghi ghi danh được coi là **đang học** khi `left_at` rỗng, hoặc `left_at` sau ngày hôm nay. Rời lớp đúng ngày hôm nay tức là đã nghỉ.

Mỗi cặp (lớp, học sinh) chỉ được có tối đa **một** bản ghi đang học tại một thời điểm. Quy tắc này phụ thuộc ngày hiện tại nên không diễn đạt được bằng ràng buộc cơ sở dữ liệu; hệ thống kiểm tra khi thao tác.

### Thêm học sinh vào lớp

- Thêm được nhiều học sinh cùng lúc, dùng chung một ngày vào lớp.
- Khối của từng học sinh phải trùng với khối lớp; nếu một học sinh không khớp, cả lô bị từ chối và không ghi nhận học sinh nào.
- Ngày vào lớp không được trước ngày khai giảng của lớp.
- Sĩ số được kiểm tra **một lần cho cả lô**: nếu cả lô làm vượt sĩ số tối đa thì toàn bộ yêu cầu bị từ chối, không thêm một phần.
- Học sinh đang học trong lớp thì không thêm lại được. Học sinh **đã rời lớp** thì thêm lại được.
- Cùng một học sinh gửi trùng trong một yêu cầu chỉ được ghi danh một lần.

### Sửa thông tin ghi danh

- Sửa được ngày vào lớp, ngày rời lớp và ghi chú.
- Khác với chuyển lớp và cho nghỉ, thao tác này áp dụng được cả cho bản ghi **đã đóng**, vì mục đích của nó là sửa dữ liệu nhập sai.
- Ngày vào lớp không được trước ngày khai giảng; ngày rời lớp không được trước ngày vào lớp.
- Mở lại một bản ghi đã đóng bị từ chối nếu học sinh đang có một bản ghi khác còn mở trong cùng lớp, hoặc nếu mở lại sẽ vượt sĩ số tối đa của lớp.

### Chuyển lớp

- Chỉ áp dụng cho bản ghi đang học.
- Lớp đích phải đang hoạt động, cùng khối với học sinh và có **đúng toàn bộ tập môn học** của lớp đang rời; có thêm, thiếu hoặc khác môn đều bị từ chối.
- Lớp đích phải còn chỗ và học sinh chưa đang học ở đó.
- Ngày chuyển không được trước ngày vào lớp cũ, cũng không được trước ngày khai giảng của lớp đích.
- Bản ghi cũ được đóng vào ngày chuyển và ghi chú thêm `[Chuyển sang lớp: MÃ]`; bản ghi mới mở ra **cùng ngày đó**, nên lịch sử không có khoảng trống.
- Chuyển lớp thất bại thì không thay đổi gì cả.
- Bộ chọn lớp đích tìm kiếm và phân trang trên server, hiển thị cả lớp không đủ điều kiện ở trạng thái không thể chọn kèm lý do; lớp nguồn không xuất hiện. Backend kiểm tra lại khi chuyển.

### Lịch sử ghi danh

- Mỗi lần thêm, sửa, cho nghỉ, chuyển lớp hoặc kết thúc lớp ghi thêm event bất biến cùng transaction với thay đổi period. Chuyển lớp ghi cặp `transferred_out` / `transferred_in` và liên kết hai period.
- Period đã tồn tại trước event log không được tạo lịch sử giả. Khi không có event, API trả một mục `legacy_enrollment` với ngày/ghi chú đang lưu và `actor: null`; nội dung ghi chú cũ không được phân tích để suy diễn event.
- Lịch sử được phân trang theo student và class, mặc định ngày hiệu lực mới nhất trước. Endpoint yêu cầu đồng thời vai trò Quản trị viên và quyền `student.view`; thiếu hoặc sai `class_id` trả `422`, còn lớp không tồn tại hoặc học sinh chưa từng có period trong lớp trả `404`.

### Cho nghỉ lớp

- Chỉ áp dụng cho bản ghi đang học.
- **Bắt buộc nhập lý do.** Lý do được ghi nối vào ghi chú dưới dạng `[Nghỉ học]: ...`.
- Ngày nghỉ không được trước ngày vào lớp.
- Bản ghi được giữ lại chứ không xóa, để giai đoạn học sinh đã theo học vẫn còn trên hồ sơ.

## Hướng dẫn thao tác

Mọi endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách lớp | `GET /api/v1/academic/classes/{id}/enrollments` |
| Xem học sinh có thể thêm | `GET /api/v1/academic/classes/{id}/available-students` |
| Tìm học sinh kèm lý do không thể thêm | `GET /api/v1/academic/classes/{id}/enrollment-student-options` |
| Xem lớp đang học và lịch sử của học sinh | `GET /api/v1/academic/students/{student}/classes` |
| Xem lịch sử trong một lớp | `GET /api/v1/academic/students/{student}/enrollment-events?class_id={class}` |
| Tìm lớp đích kèm lý do không thể chuyển | `GET /api/v1/academic/enrollments/{enrollment}/transfer-options` với `q`, `page`, `per_page` |
| Thêm học sinh | `POST /api/v1/academic/classes/{id}/enrollments` với `student_ids`, `enrolled_at` |
| Sửa thông tin ghi danh | `PUT /api/v1/academic/enrollments/{id}` với `enrolled_at`, tùy chọn `left_at`, `note` |
| Chuyển lớp | `POST /api/v1/academic/enrollments/{id}/transfer` với `class_id`, `left_at` |
| Cho nghỉ lớp | `POST /api/v1/academic/enrollments/{id}/leave` với `left_at`, `reason` |

Danh sách lớp nhận thêm `active_only=1` để chỉ lấy bản ghi đang học, `q` để tìm theo tên học sinh, cùng `page`, `per_page`, `sort`, `direction`. Cột sắp xếp cho phép: `id`, `enrolled_at`, `left_at`.

Hai endpoint lịch sử học sinh đều phân trang và yêu cầu vai trò Quản trị viên cùng quyền `student.view`. `classes` trả mỗi lớp một lần, kể cả lớp đã học trước đây, kèm `is_current` và số period. `enrollment-events` bắt buộc `class_id`; `sort` nhận `effective_on`, `created_at`, `id`, mặc định `effective_on desc`; khi trùng khóa sắp xếp, event thật đứng trước mục legacy rồi sắp theo id để phân trang ổn định. Event gồm loại, ngày hiệu lực, ghi chú, metadata, actor và các period đối ứng; mục lịch sử cũ không có event có `kind: legacy_enrollment` và không có `event_type`/`metadata`.

`transfer-options` nhận tìm kiếm và phân trang, trả các lớp đích kèm `is_eligible` và `disabled_reason` (`class_ended`, `grade_mismatch`, `subject_mismatch`, `already_enrolled`, `class_full`); lớp nguồn bị loại khỏi danh sách. Chỉ Quản trị viên có quyền `class.transfer_student` được xem projection này; action chuyển lớp vẫn kiểm tra lại toàn bộ điều kiện khi ghi.

`enrollment-student-options` là projection phân trang riêng, yêu cầu vai trò Quản trị viên và quyền `class.add_student`. Mỗi dòng có tình trạng tài khoản, khối, các lớp đang học, `is_eligible` và `disabled_reason` (`account_missing`, `account_inactive`, `grade_mismatch`, `already_enrolled`, `class_full`, `class_ended`). Endpoint `available-students` giữ nguyên hợp đồng cũ và chỉ trả học sinh hiện có thể ghi danh.

Từ khóa tìm kiếm **bỏ dấu tiếng Việt và không phân biệt hoa thường**: gõ `Hung` tìm ra `Hùng`, gõ `Do Thi Uoc` tìm ra `Đỗ Thị Ước`. Gõ đầy đủ dấu vẫn tìm được như thường. Ký tự `%` và `_` gõ vào được hiểu là ký tự thật, không phải ký tự đại diện.

## Kết quả mong đợi

- Danh sách lớp trả về **mọi** giai đoạn, kể cả đã rời, kèm `is_active` cho từng bản ghi.
- Lịch sử lớp của học sinh trả về cả event thật và một mục legacy cho period chưa có event, phân trang ổn định; không giả lập log từ ghi chú.
- Event bị chặn cập nhật/xóa ở PostgreSQL và giữ period/actor được tham chiếu; nếu event không ghi được, thay đổi period cùng transaction bị rollback.
- Danh sách học sinh có thể thêm chỉ gồm người cùng khối, có tài khoản chưa bị khóa và chưa đang học trong lớp; người đã từng rời lớp vẫn có thể xuất hiện.
- Thêm học sinh trả `201` cùng mảng các bản ghi vừa tạo.
- Chuyển lớp trả `201` cùng bản ghi mới ở lớp đích.
- Sửa và cho nghỉ trả `200` cùng bản ghi sau khi cập nhật.

Trên trình duyệt:

- Mỗi thao tác thành công hiện một thông báo nổi ở góc dưới bên phải rồi tự đóng sau vài giây: `Đã thêm <n> học sinh vào lớp.`, `Đã lưu thông tin ghi danh.`, `Đã chuyển <tên> sang lớp mới.`, `Đã cho <tên> nghỉ lớp.`
- Danh sách lớp và sĩ số của lớp cập nhật ngay sau thao tác, không cần tải lại trang.

## Lỗi và trường hợp ngoại lệ

- Ngày vào lớp trước ngày khai giảng trả `422`: `Ngày vào lớp không thể trước ngày khai giảng (dd/mm/yyyy).`
- Vượt sĩ số trả `409`: `Lớp đã đạt sĩ số tối đa (N/M học sinh), không thể thêm.`
- Học sinh đang học trong lớp trả `409`: `Học sinh {tên} đang học trong lớp này rồi.`
- Tài khoản học sinh bị khóa trả `422`: `Tài khoản học sinh đã bị khóa, không thể ghi danh.`
- Lớp đã kết thúc trả `409`: `Lớp đã kết thúc, không thể thay đổi danh sách học sinh.`
- Thao tác trên bản ghi đã đóng trả `409`: `Học sinh không còn học trong lớp này.`
- Mở lại bản ghi khi đã có bản ghi khác đang mở trả `409`: `Học sinh đã có một bản ghi đang học khác trong lớp này.`
- Mở lại bản ghi đã đóng khi lớp hết chỗ trả `409` với cùng thông báo sĩ số tối đa như lúc thêm học sinh.
- Ngày rời trước ngày vào trả `422`: `Ngày rời lớp không thể trước ngày vào lớp (dd/mm/yyyy).`
- Học sinh khác khối với lớp nhận trả `422`: `Học sinh {tên} không cùng khối với lớp.`; khi chuyển lớp, lỗi là `Học sinh không cùng khối với lớp mới.`
- Lớp đích khác tập môn hoặc số lượng môn trả `422`: `Chỉ được chuyển học sinh sang lớp cùng môn học.`
- Lớp đích đã kết thúc trả `422`: `Lớp học mới không ở trạng thái đang hoạt động.`
- Thiếu lý do khi cho nghỉ trả `422` gắn vào `reason`: `Vui lòng nhập lý do nghỉ học.`
- `class_id` thiếu hoặc sai định dạng trong history query trả `422`; class không tồn tại hoặc chưa từng có period của học sinh đó trả `404`.
- Không tìm thấy bản ghi trả `404`: `Không tìm thấy bản ghi ghi danh.` Không tìm thấy lớp trả `Không tìm thấy lớp học.`
- Không đủ quyền trả `403`; thiếu token trả `401`.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Quản lý lớp học](lop-hoc.md) | Tiên quyết | Lớp phải đang hoạt động và còn chỗ. | Lớp kết thúc thì mọi thao tác ghi danh bị chặn. |
| [Quản lý học sinh](../academic/hoc-sinh.md) | Tiên quyết | Học sinh phải có hồ sơ và tài khoản chưa khóa. | Bộ chọn mới hiển thị học sinh bị khóa nhưng không cho chọn và nêu lý do; endpoint `available-students` cũ vẫn chỉ trả người đủ điều kiện. |
| [Quản lý học sinh](../academic/hoc-sinh.md) | Hạ nguồn | Hồ sơ học sinh báo về các lớp học sinh còn đang theo học, dùng đúng định nghĩa "còn đang học" ở mục Quy tắc nghiệp vụ. | Lớp đã cho nghỉ biến mất khỏi cột Lớp đang học ở danh sách học sinh, thay vì hiện kèm nhãn. Ghi danh, chuyển lớp và cho nghỉ đều làm mới cột đó ngay. |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Mỗi thao tác ghi danh có một quyền riêng. | Không đủ quyền thì nhận `403`. |

## Giới hạn hiện tại

- **Chưa kiểm tra trùng lịch.** Một học sinh có thể được ghi danh vào hai lớp học cùng khung giờ mà hệ thống không phát hiện, cho tới khi có module Lịch học.
- Chưa có học phí riêng theo học sinh. Không có cột tiền nào trên bảng `class_enrollments`; module tài chính sau này sẽ tự thêm cột riêng khi cần.
- Chuyển lớp luôn thực hiện ngay, chưa có luồng chờ duyệt như fork.
- Không có chức năng xóa bản ghi ghi danh.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Academic/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/AcademicEnrollmentTest.php`, `api/tests/Security/AcademicAuthorizationTest.php`
- Schema: `docs/database.md`
