# Quản lý học sinh

Last Verified: 2026-08-28

## Tổng quan

Hồ sơ học sinh và tài khoản đăng nhập của học sinh được quản lý cùng nhau: tạo hồ sơ là tạo luôn tài khoản. Hồ sơ học sinh phải tồn tại trước khi ghi danh vào lớp.

Chức năng dùng được cả qua API lẫn màn hình quản trị tại `/academic/students` (mục **Học sinh** trong nhóm Học vụ ở thanh bên).

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
- Trạng thái học tập gồm `0` Đang học, `1` Tạm nghỉ, `2` Dừng hẳn. Mặc định khi tạo là Đang học.
- Trạng thái học tập và trạng thái tài khoản là hai thứ khác nhau: khóa tài khoản chỉ chặn đăng nhập, không đổi việc học sinh đang học hay đã nghỉ.
- Không có thao tác xóa học sinh. Ngừng theo học bằng cách đổi trạng thái học tập hoặc khóa tài khoản; hồ sơ luôn được giữ để lịch sử ghi danh trỏ tới nó không bị hỏng.
- Đổi mật khẩu không thu hồi các token đang có.

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

Trường tùy chọn: `phone`, `dob`, `guardian_phone`, `address`, `note`, và `status` khi tạo.

Giới tính (học sinh và phụ huynh): `0` Nam, `1` Nữ, `2` Khác. Khối lớp: `0` Tiền tiểu học, `1`–`12` theo số lớp. Quan hệ phụ huynh: `0` Bố, `1` Mẹ, `2` Người giám hộ khác.

Danh sách nhận thêm `q` để tìm theo họ tên học sinh, số điện thoại học sinh, tên phụ huynh, số điện thoại phụ huynh hoặc tên đăng nhập; `status[]`, `grade_level[]`, `is_active` để lọc; cùng `page`, `per_page`, `sort`, `direction`. Cột sắp xếp cho phép: `id`, `full_name`, `grade_level`, `created_at`.

## Kết quả mong đợi

- Danh sách trả về envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi hồ sơ kèm `username` và `is_account_active` của tài khoản, không kèm bất kỳ thông tin xác thực nào.
- Tạo thành công trả `201` với trạng thái Đang học; học sinh đăng nhập được ngay.
- Sửa hồ sơ, khóa và mở tài khoản trả `200` cùng bản ghi sau khi cập nhật.
- Đổi mật khẩu trả `204`.

## Lỗi và trường hợp ngoại lệ

- Trùng tên đăng nhập trả `422` gắn vào `username`: `Có tài khoản đã dùng tên đăng nhập này, vui lòng chọn tên khác.`
- Thiếu tên, giới tính hoặc quan hệ của phụ huynh trả `422` gắn vào `guardian_name`, `guardian_gender`, hoặc `guardian_relationship` tương ứng.
- Ngày sinh không ở quá khứ trả `422` gắn vào `dob`: `Ngày sinh phải trước ngày hôm nay.`
- Số điện thoại sai định dạng trả `422` gắn vào `phone` (`Số điện thoại không hợp lệ.`) hoặc `guardian_phone` (`Số điện thoại phụ huynh không hợp lệ.`).
- Mật khẩu dưới 8 ký tự trả `422` gắn vào `password`.
- Không tìm thấy học sinh trả `404`: `Không tìm thấy học sinh.`
- Không đủ quyền trả `403`; thiếu token trả `401`.
- Tạo hồ sơ thất bại vì dữ liệu không hợp lệ thì không tạo tài khoản nào.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai gọi được các endpoint học sinh. | Không đủ quyền thì nhận `403`. |
| [Xác thực bearer token](../auth/authentication.md) | Trạng thái dùng chung | Hồ sơ học sinh sở hữu một bản ghi tài khoản đăng nhập. | Khóa tài khoản khiến học sinh không đăng nhập được. |
| [Ghi danh vào lớp](../academic/ghi-danh.md) | Hạ nguồn | Chỉ học sinh có tài khoản chưa khóa mới được thêm vào lớp. | Học sinh bị khóa tài khoản không xuất hiện trong danh sách chọn khi thêm vào lớp. |

## Giới hạn hiện tại

- Không có chức năng xóa học sinh.
- Không đổi được tên đăng nhập sau khi tạo.
- Đổi mật khẩu không thu hồi token đang hoạt động.
- Chưa có điểm thưởng, liên kết Zalo, điểm danh hay học phí.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Identity/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/IdentityStudentTest.php`, `api/tests/Security/AcademicAuthorizationTest.php`
- Schema: `.docs/database.md`
