# Quản lý giáo viên

Last Verified: 2026-09-01

## Tổng quan

Hồ sơ giáo viên và tài khoản đăng nhập của giáo viên được quản lý cùng nhau: tạo hồ sơ là tạo luôn tài khoản. Lớp học phải có giáo viên phụ trách, nên hồ sơ giáo viên phải tồn tại trước khi tạo được lớp.

Chức năng dùng được cả qua API lẫn màn hình quản trị tại `/academic/teachers` (mục **Giáo viên** trong nhóm Học vụ ở thanh bên).

## Người dùng và điều kiện

- Chỉ vai trò Quản trị viên. Các vai trò khác nhận `403`.
- Cần bearer token hợp lệ.

## Quy tắc nghiệp vụ

- Tạo hồ sơ giáo viên tạo đồng thời một bản ghi tài khoản với vai trò Giáo viên, trong cùng một transaction. Thất bại ở bất kỳ bước nào không để lại tài khoản mồ côi hay hồ sơ mồ côi.
- Tên đăng nhập là duy nhất trong toàn hệ thống và **không đổi được** sau khi tạo. Gửi kèm `username` khi sửa hồ sơ thì giá trị đó bị bỏ qua.
- Họ tên, số điện thoại, email và giới tính là bắt buộc khi tạo hồ sơ. Số điện thoại phải bắt đầu bằng `0` và có 10 hoặc 11 chữ số.
- Số điện thoại và email **không cần duy nhất**, kể cả giữa các giáo viên với nhau. Hồ sơ giáo viên, học sinh và phụ huynh dùng chung một bảng nhân thân, nên một giáo viên có thể dùng chính số của mình làm số liên hệ phụ huynh cho con mà không bị chặn vì trùng.
- Mật khẩu tối thiểu 8 ký tự, được lưu dưới dạng hash và không bao giờ xuất hiện trong phản hồi.
- Trạng thái làm việc gồm `0` Đang làm việc và `1` Đã nghỉ. Chỉ giáo viên đang làm việc và có tài khoản chưa khóa mới xuất hiện trong danh sách chọn khi xếp lớp.
- Màu đại diện, nếu có, phải là mã hex sáu ký tự dạng `#FD7110`.
- Không có thao tác xóa giáo viên. Ngừng cộng tác bằng cách đổi trạng thái làm việc hoặc khóa tài khoản; bản ghi hồ sơ luôn được giữ để các lớp và lịch sử trỏ tới nó không bị hỏng.
- Khóa tài khoản chỉ chặn đăng nhập, không đụng tới hồ sơ.
- Đổi mật khẩu không thu hồi các token đang có. Giáo viên không bị đăng xuất khỏi các thiết bị khác.

## Hướng dẫn thao tác

Mọi endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách | `GET /teachers` |
| Lấy danh sách chọn | `GET /teachers/options` |
| Tạo | `POST /teachers` với `username`, `password`, `full_name`, `phone`, `email`, `gender`, `status`, `joined_at` |
| Xem chi tiết | `GET /teachers/{id}` |
| Sửa hồ sơ | `PUT /teachers/{id}` với `full_name`, `phone`, `email`, `gender`, `status`, `joined_at` |
| Khóa hoặc mở tài khoản | `PATCH /teachers/{id}/account` với `is_active` |
| Đổi mật khẩu | `PATCH /teachers/{id}/password` với `password` |

Trường tùy chọn khi tạo và sửa: `address`, `color_identification`.

Giới tính: `0` Nam, `1` Nữ, `2` Khác.

Danh sách nhận thêm `q` để tìm theo họ tên, số điện thoại, email hoặc tên đăng nhập; `status[]` để lọc theo trạng thái làm việc; `is_active` để lọc theo trạng thái tài khoản; cùng `page`, `per_page`, `sort`, `direction`. Cột sắp xếp cho phép: `id`, `full_name`, `joined_at`, `created_at`.

## Kết quả mong đợi

- Danh sách trả về envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi hồ sơ kèm `username` và `is_account_active` của tài khoản, không kèm bất kỳ thông tin xác thực nào.
- Tạo thành công trả `201`; giáo viên đăng nhập được ngay bằng tên đăng nhập và mật khẩu vừa đặt.
- Sửa hồ sơ, khóa và mở tài khoản trả `200` cùng bản ghi sau khi cập nhật.
- Đổi mật khẩu trả `204`; mật khẩu mới dùng được, mật khẩu cũ thì không.
- Danh sách chọn trả về mảng chỉ gồm `id` và `label`.

Trên trình duyệt:

- Mỗi thao tác thành công hiện một thông báo nổi ở góc dưới bên phải rồi tự đóng sau vài giây: `Đã tạo giáo viên và tài khoản đăng nhập.`, `Đã lưu thay đổi hồ sơ giáo viên.`, `Đã khóa tài khoản của <tên>.`, `Đã mở lại tài khoản của <tên>.`, `Đã đổi mật khẩu cho <tên>.` Thông báo vẫn hiển thị sau khi màn hình quay về danh sách giáo viên.
- Danh sách giáo viên tự hiển thị bản ghi vừa tạo hoặc vừa sửa khi màn hình quay lại, không cần tải lại trang.

## Lỗi và trường hợp ngoại lệ

- Trùng tên đăng nhập trả `422` gắn vào `username`: `Có tài khoản đã dùng tên đăng nhập này, vui lòng chọn tên khác.`
- Số điện thoại sai định dạng trả `422` gắn vào `phone`: `Số điện thoại không hợp lệ.` Số điện thoại và email trùng với giáo viên khác không bị chặn.
- Màu sai định dạng trả `422` gắn vào `color_identification`: `Màu phải ở dạng mã hex, ví dụ #FD7110.`
- Mật khẩu dưới 8 ký tự trả `422` gắn vào `password`.
- Không tìm thấy giáo viên trả `404`: `Không tìm thấy giáo viên.`
- Không đủ quyền trả `403`; thiếu token trả `401`.
- Tạo hồ sơ thất bại vì dữ liệu không hợp lệ thì không tạo tài khoản nào.

Trên trình duyệt:

- API từ chối lưu thì màn hình ở nguyên form với dữ liệu đã nhập, kèm một thông báo nổi `Chưa lưu được`. Phần mô tả của thông báo là thông điệp lỗi chung của API, hoặc `Vui lòng kiểm tra lại các trường được đánh dấu.` khi mọi lỗi đều đã gắn được vào từng trường.
- Lỗi `422` gắn vào một trường vẫn hiện ngay dưới trường đó; lỗi không thuộc trường nào vẫn hiện trong vùng thông báo `aria-live` ở đầu form.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai gọi được các endpoint giáo viên. | Không đủ quyền thì nhận `403`. |
| [Xác thực bearer token](../auth/authentication.md) | Trạng thái dùng chung | Hồ sơ giáo viên sở hữu một bản ghi tài khoản đăng nhập. | Khóa tài khoản giáo viên khiến người đó không đăng nhập được. |
| Lớp học | Hạ nguồn | Lớp học phải có giáo viên đang làm việc phụ trách. | Giáo viên đã nghỉ không xuất hiện khi chọn giáo viên cho lớp. |

## Giới hạn hiện tại

- Không có chức năng xóa giáo viên.
- Không đổi được tên đăng nhập sau khi tạo.
- Đổi mật khẩu không thu hồi token đang hoạt động.
- Cấu hình lương và các nghiệp vụ tài chính chưa có.
- Danh sách chọn trả tối đa 50 bản ghi mỗi lần gọi.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Identity/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/IdentityTeacherTest.php`, `api/tests/Security/AcademicAuthorizationTest.php`
- Schema: `.docs/database.md`
