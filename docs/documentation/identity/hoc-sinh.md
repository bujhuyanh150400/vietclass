# Quản lý học sinh

Last Verified: 2026-09-10

## Tổng quan

Hồ sơ học sinh và tài khoản đăng nhập của học sinh được quản lý cùng nhau: tạo hồ sơ là tạo luôn tài khoản. Hồ sơ học sinh phải tồn tại trước khi ghi danh vào lớp.

Chức năng dùng được cả qua API lẫn màn hình quản trị tại `/academic/students` (mục **Học sinh** trong nhóm Người dùng ở thanh bên).

## Người dùng và điều kiện

- Chỉ vai trò Quản trị viên. Các vai trò khác nhận `403`.
- Cần bearer token hợp lệ.

## Quy tắc nghiệp vụ

- Tạo hồ sơ học sinh tạo đồng thời một bản ghi tài khoản với vai trò Học viên, trong cùng một transaction. Thất bại ở bất kỳ bước nào không để lại tài khoản mồ côi hay hồ sơ mồ côi.
- Tên đăng nhập là duy nhất trong toàn hệ thống và **không đổi được** sau khi tạo.
- Mật khẩu tối thiểu 8 ký tự, được lưu dưới dạng hash và không bao giờ xuất hiện trong phản hồi.
- Họ tên, giới tính và khối lớp của học sinh là bắt buộc. Số điện thoại, ngày sinh, địa chỉ và ghi chú của học sinh đều không bắt buộc.
- Ngày sinh, nếu có, phải trước ngày hôm nay.
- Tạo học sinh nhận thêm nhóm bốn trường phụ huynh: **tên** (bắt buộc), **giới tính** (bắt buộc), **quan hệ với học sinh** (bắt buộc — `0` Bố, `1` Mẹ, `2` Người giám hộ khác), và **số điện thoại** (tùy chọn). Nhóm trường này tạo ra một hồ sơ phụ huynh thật, không phải hai cột rời `parent_name`/`parent_phone` như trước đây.
- Nếu số điện thoại phụ huynh trùng với một hồ sơ đã có trong hệ thống, hồ sơ đó được dùng lại thay vì tạo mới; không có số điện thoại thì luôn tạo một hồ sơ phụ huynh mới. Nhờ vậy, hai anh chị em ruột được nhập từ hai lần tạo học sinh riêng biệt tự động dùng chung một hồ sơ phụ huynh. Cấp tài khoản đăng nhập cho phụ huynh sau này chỉ là một lần cập nhật hồ sơ đó, không cần chuyển đổi dữ liệu.
- Sửa hồ sơ với nhóm trường phụ huynh ghi đè lên hồ sơ phụ huynh hiện tại của học sinh — trừ khi hồ sơ đó đang dùng chung với một anh/chị/em khác, trường hợp này hệ thống tạo một hồ sơ phụ huynh mới riêng cho học sinh đang sửa thay vì sửa hồ sơ dùng chung, để không làm sai dữ liệu của người kia.
- Số điện thoại học sinh và phụ huynh, nếu có, phải bắt đầu bằng `0` và có 10 hoặc 11 chữ số. Không số nào trong hai số này cần duy nhất — hồ sơ giáo viên, học sinh và phụ huynh dùng chung một bảng nhân thân, và anh chị em ruột thường dùng chung số của phụ huynh.
- Trạng thái học tập gồm `0` Đang học, `1` Tạm nghỉ, `2` Dừng hẳn. Mặc định khi tạo là Đang học. Trường này sửa được trong biểu mẫu hồ sơ, nhưng **màn danh sách không hiển thị và không lọc theo nó** — xem mục "Màn danh sách học sinh".
- Trạng thái học tập và trạng thái tài khoản là hai thứ khác nhau: khóa tài khoản chỉ chặn đăng nhập, không đổi việc học sinh đang học hay đã nghỉ.
- Một học sinh có thể có nhiều phụ huynh, và danh sách trả về tất cả, người liên hệ chính đứng đầu. Biểu mẫu tạo và sửa hồ sơ vẫn chỉ ghi được **đúng một** phụ huynh (người liên hệ chính), nên nhiều phụ huynh chỉ xuất hiện với dữ liệu được nhập bằng đường khác, ví dụ seeder hoặc import.
- Danh sách cũng trả về các lớp học sinh **đang** theo học. Lớp đã nghỉ không xuất hiện: quy tắc "còn đang học" dùng đúng định nghĩa chung của ghi danh, xem [Ghi danh vào lớp](../academic/ghi-danh.md).
- Không có thao tác xóa học sinh. Ngừng theo học bằng cách đổi trạng thái học tập hoặc khóa tài khoản; hồ sơ luôn được giữ để lịch sử ghi danh trỏ tới nó không bị hỏng.
- Đổi mật khẩu không thu hồi các token đang có.
- Hồ sơ học sinh có ảnh đại diện riêng. Tạo học sinh gửi được ảnh kèm theo; sau khi tạo, ảnh đại diện đổi bằng endpoint và nút lưu riêng của nó, xem [Ảnh đại diện hồ sơ](avatar.md).

## Hướng dẫn thao tác

Mọi endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách | `GET /students` |
| Tạo | `POST /students` với `username`, `password`, `full_name`, `gender`, `grade_level`, `guardian_name`, `guardian_gender`, `guardian_relationship` |
| Xem chi tiết | `GET /students/{id}` |
| Sửa hồ sơ | `PUT /students/{id}` với `full_name`, `gender`, `grade_level`, `guardian_name`, `guardian_gender`, `guardian_relationship`, `status` |
| Khóa hoặc mở tài khoản | `PATCH /students/{id}/account` với `is_active` |
| Đổi mật khẩu | `PATCH /students/{id}/password` với `password` |

Trường tùy chọn: `phone`, `dob`, `guardian_phone`, `address`, `note`, và `status` khi tạo. Khi tạo còn nhận `avatar` — xem [Ảnh đại diện hồ sơ](avatar.md) cho cả hai dạng JSON và multipart.

Giới tính (học sinh và phụ huynh): `0` Nam, `1` Nữ, `2` Khác. Khối lớp: `0` Tiền tiểu học, `1`–`12` theo số lớp. Quan hệ phụ huynh: `0` Bố, `1` Mẹ, `2` Người giám hộ khác.

Danh sách nhận thêm `q` để tìm theo mã học sinh, họ tên học sinh, số điện thoại học sinh, tên phụ huynh, số điện thoại phụ huynh hoặc tên đăng nhập. Mã học sinh là `profile_id`, nên `q` toàn chữ số được đối chiếu thêm với id bên cạnh các điều kiện văn bản — không thay thế chúng, vì số điện thoại cũng là chữ số. Hệ quả: gõ vài chữ số có thể ra cả học sinh mang id đó và những học sinh có số điện thoại chứa dãy số đó. Chuỗi số dài quá tầm số nguyên không được coi là id. Ngoài ra có `status[]`, `grade_level[]`, `is_active` để lọc; cùng `page`, `per_page`, `sort`, `direction`. Cột sắp xếp cho phép: `id`, `full_name`, `grade_level`, `created_at`. `q` tối đa 100 ký tự và `per_page` tối đa 200; vượt quá thì trả `422`.

API vẫn nhận `status[]`, nhưng màn danh sách trên trình duyệt **không còn gửi tham số này** — xem mục dưới.

### Màn danh sách học sinh

| Vùng | Hành vi |
| --- | --- |
| Cột | Học sinh (ảnh đại diện, họ tên, số điện thoại, mã học sinh) · Khối · Phụ huynh · Lớp đang học · Tài khoản · menu thao tác |
| Phụ huynh và Lớp đang học | Hiện tối đa **2** mục, phần còn lại gộp vào chip `+N`. Bấm `+N` ở cột Phụ huynh mở hộp thoại liệt kê **toàn bộ** phụ huynh kèm quan hệ, số điện thoại và nhãn `Liên hệ chính`; bấm `+N` ở cột Lớp đang học mở hộp thoại cùng dạng, liệt kê **toàn bộ** lớp kèm môn và nhãn `Đang học` |
| Không có dữ liệu liên quan | Hiện `Chưa có phụ huynh` hoặc `Chưa có lớp` |
| Tài khoản | `Đang mở` hoặc `Đã khóa` |
| Tìm kiếm | Ô tìm kiếm áp dụng sau khoảng dừng nhập, không tìm theo từng ký tự. Tìm được theo mã học sinh, tên và số điện thoại học sinh, tên và số điện thoại phụ huynh, và tên đăng nhập |
| Bộ lọc | Chỉ **Khối** và **Tài khoản**. Không có bộ lọc trạng thái học tập |
| Sắp xếp | Mới tạo gần đây (mặc định), Tên A–Z, Tên Z–A, Khối tăng dần |
| Điều kiện đang áp dụng | Hiện thành dải chip bỏ được từng cái, kèm `Xóa tất cả`. Từ khóa quá dài bị cắt bớt kèm dấu `…`; trỏ chuột vào chip để xem đủ |
| Chế độ xem | Bảng hoặc Thẻ. Bảng cho chọn 20/50/100/200 mục mỗi trang; dạng Thẻ cố định 20 mục |
| Màn hình hẹp | Dưới 1024px bảng chuyển thành thẻ, mỗi thẻ mang đúng những thông tin cột bảng có |
| Trạng thái, tìm kiếm, phân trang | Lưu trong URL nên chia sẻ và tải lại được |

Menu thao tác của mỗi học sinh có `Sửa hồ sơ`, `Đổi mật khẩu`, và `Khóa tài khoản` / `Mở tài khoản`.

## Kết quả mong đợi

- Danh sách trả về envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi hồ sơ kèm `username` và `is_account_active` của tài khoản, không kèm bất kỳ thông tin xác thực nào.
- Mỗi hồ sơ kèm `profile_id` và `avatar`; `avatar` là `null` khi học sinh chưa chọn ảnh.
- Mỗi hồ sơ kèm `guardians`: mọi phụ huynh của học sinh, người liên hệ chính đứng đầu, mỗi mục gồm `profile_id`, `full_name`, `phone`, `relationship`, `is_primary`. Bốn trường `guardian_name`, `guardian_phone`, `guardian_gender`, `guardian_relationship` của người liên hệ chính vẫn được giữ nguyên bên cạnh.
- Mỗi hồ sơ kèm `active_enrollments`: các lớp học sinh đang theo học, mỗi mục gồm `class_id`, `code`, `subject_name`.
- Cả `guardians` và `active_enrollments` luôn là mảng, rỗng khi không có, không bao giờ `null`.
- Tạo thành công trả `201` với trạng thái Đang học; học sinh đăng nhập được ngay.
- Sửa hồ sơ, khóa và mở tài khoản trả `200` cùng bản ghi sau khi cập nhật.
- Đổi mật khẩu trả `204`.

Trên trình duyệt:

- Mỗi thao tác thành công hiện một thông báo nổi ở góc dưới bên phải rồi tự đóng sau vài giây: `Đã tạo học sinh và tài khoản đăng nhập.`, `Đã lưu thay đổi hồ sơ học sinh.`, `Đã khóa tài khoản của <tên>.`, `Đã mở lại tài khoản của <tên>.`, `Đã đổi mật khẩu cho <tên>.`
- Danh sách học sinh tự hiển thị bản ghi vừa tạo hoặc vừa sửa khi màn hình quay lại, không cần tải lại trang.

## Lỗi và trường hợp ngoại lệ

- Trùng tên đăng nhập trả `422` gắn vào `username`: `Có tài khoản đã dùng tên đăng nhập này, vui lòng chọn tên khác.`
- Thiếu tên, giới tính hoặc quan hệ của phụ huynh trả `422` gắn vào `guardian_name`, `guardian_gender`, hoặc `guardian_relationship` tương ứng.
- Ngày sinh không ở quá khứ trả `422` gắn vào `dob`: `Ngày sinh phải trước ngày hôm nay.`
- Số điện thoại sai định dạng trả `422` gắn vào `phone` (`Số điện thoại không hợp lệ.`) hoặc `guardian_phone` (`Số điện thoại phụ huynh không hợp lệ.`).
- Mật khẩu dưới 8 ký tự trả `422` gắn vào `password`.
- Không tìm thấy học sinh trả `404`: `Không tìm thấy học sinh.`
- Không đủ quyền trả `403`; thiếu token trả `401`.
- Tạo hồ sơ thất bại vì dữ liệu không hợp lệ thì không tạo tài khoản nào.
- Danh sách với `q` dài hơn 100 ký tự, hoặc `per_page` lớn hơn 200, trả `422`.
- Danh sách không khớp điều kiện nào hiện `Không tìm thấy kết quả` kèm nút `Xóa điều kiện`. Chưa có học sinh nào trong hệ thống thì hiện `Chưa có học sinh` kèm nút `Thêm học sinh`; thanh công cụ vẫn ở lại trong cả hai trường hợp.
- Tải danh sách thất bại thì màn hình hiện `Chưa tải được danh sách` kèm thông báo của máy chủ và nút `Thử lại`; thanh công cụ và các điều kiện đang áp dụng vẫn ở lại. Hành vi này giống nhau cho lần tải đầu và cho lần tải lại sau khi đã có dữ liệu.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai gọi được các endpoint học sinh. | Không đủ quyền thì nhận `403`. |
| [Xác thực bearer token](../auth/authentication.md) | Trạng thái dùng chung | Hồ sơ học sinh sở hữu một bản ghi tài khoản đăng nhập. | Khóa tài khoản khiến học sinh không đăng nhập được. |
| [Ảnh đại diện hồ sơ](avatar.md) | Trạng thái dùng chung | Hồ sơ học sinh mang ảnh đại diện của chính nó, lưu độc lập với các trường hồ sơ. | Ảnh hiện trong danh sách, thẻ và biểu mẫu học sinh; đổi ảnh không cần lưu lại hồ sơ. |
| [Ghi danh vào lớp](../academic/ghi-danh.md) | Hạ nguồn | Chỉ học sinh có tài khoản chưa khóa mới được thêm vào lớp. | Học sinh bị khóa tài khoản không xuất hiện trong danh sách chọn khi thêm vào lớp. |
| [Ghi danh vào lớp](../academic/ghi-danh.md) | Trạng thái dùng chung | Hồ sơ học sinh báo về các lớp đang theo học, dùng đúng định nghĩa "còn đang học" của ghi danh. | Lớp đã cho nghỉ biến mất khỏi cột Lớp đang học thay vì hiện kèm nhãn. Ghi danh, chuyển lớp và cho nghỉ làm mới cột này ngay. |
| [Quản lý lớp học](../academic/lop-hoc.md) | Phụ thuộc | Mã lớp và tên môn hiện trong cột Lớp đang học lấy từ hồ sơ lớp và môn của lớp đó. | Sửa lớp, đổi tên môn, hay kết thúc lớp đều làm cột Lớp đang học của mọi học sinh trong lớp đổi theo ngay. Kết thúc lớp khép lại mọi ghi danh còn mở của lớp đó, nên lớp rời khỏi cột. |

## Giới hạn hiện tại

- Không có chức năng xóa học sinh.
- Không đổi được tên đăng nhập sau khi tạo.
- Đổi mật khẩu không thu hồi token đang hoạt động.
- Chưa có điểm thưởng, liên kết Zalo, điểm danh hay học phí.
- Biểu mẫu chỉ ghi được một phụ huynh cho mỗi học sinh, dù dữ liệu và API đã đỡ được nhiều phụ huynh. Chưa có màn thêm, sửa hay bỏ từng phụ huynh.
- Màn danh sách không xem và không lọc được theo trạng thái học tập. Muốn biết trạng thái của một học sinh thì mở hồ sơ. API vẫn nhận `status[]` nên vẫn lọc được qua API.
- Liên kết cũ tới danh sách có tham số `?status=…` không còn tác dụng: tham số bị bỏ qua và danh sách hiện như không lọc, không có cảnh báo nào.
- Ghi danh vào lớp không sửa được từ màn học sinh; cột Lớp đang học chỉ để xem. Việc ghi danh làm trong hồ sơ lớp học.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Identity/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/IdentityStudentTest.php`, `api/tests/Behavioral/IdentityAvatarResourceTest.php`, `api/tests/Security/AcademicAuthorizationTest.php`
- Schema: `docs/database.md`
