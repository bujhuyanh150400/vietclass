# Quản lý phòng học

Last Verified: 2026-09-14
Related Task: `.tasks/schedule-phase-1-rooms.md`

## Tổng quan

Phòng học là danh mục thuộc Học vụ. Mỗi phòng ghi nhận tên, sức chứa, vị trí, danh sách tiện ích, ghi chú và trạng thái sẵn sàng để được sử dụng trong lịch học ở giai đoạn sau.

Chức năng có màn quản trị tại `/academic/rooms` (mục **Phòng học** trong nhóm Học vụ ở thanh bên) và API quản trị dưới tiền tố `/api/v1`.

## Người dùng và điều kiện

- Chỉ vai trò Quản trị viên được xem, tạo, sửa, đổi trạng thái hoặc xóa phòng học. Vai trò khác nhận `403`.
- Cần bearer token hợp lệ.

## Quy tắc nghiệp vụ

- Tên phòng học là duy nhất trong toàn hệ thống và dài tối đa 50 ký tự.
- Sức chứa là số nguyên từ `0` đến `32767`.
- Vị trí là văn bản tự do, tối đa 500 ký tự, và được phép để trống.
- Tiện ích là danh sách chọn nhiều trong mười giá trị cố định. Phòng mới không có tiện ích nào cho tới khi được chọn.
- Mười tiện ích là `0` — Máy chiếu, `1` — Điều hòa, `2` — Máy tính, `3` — Tivi thông minh, `4` — Loa, `5` — Micro, `6` — Bảng trắng, `7` — Bảng thông minh, `8` — Thiết bị thí nghiệm, `9` — Wifi.
- Phòng mới mặc định ở trạng thái `0` — **Hoạt động**.
- Ba trạng thái phòng là `0` — **Hoạt động**, `1` — **Tạm khóa**, và `2` — **Bảo trì**.
- Tên, sức chứa, vị trí, tiện ích, ghi chú **và trạng thái** đều sửa được qua endpoint sửa phòng. Endpoint đổi trạng thái riêng vẫn giữ, dùng cho thao tác đổi nhanh có xác nhận trên danh sách.
- Danh sách chọn chỉ trả các phòng **Hoạt động**.
- Không xóa được phòng khi còn lịch học tham chiếu. Bộ đếm tham chiếu hiện đếm số [lịch cố định](../schedule/lich-co-dinh.md) trỏ vào phòng; khi có buổi học chi tiết, các buổi đó sẽ được cộng vào cùng số đếm này.

## Hướng dẫn thao tác

Trên màn hình **Phòng học**:

1. Dùng ô tìm kiếm theo tên hoặc vị trí, cùng bộ lọc trạng thái, khoảng sức chứa và tiện ích để tìm phòng cần quản lý.
2. Chọn **Thêm phòng học** để nhập tên, trạng thái, sức chứa, tiện ích, vị trí và ghi chú.
3. Chọn **Sửa phòng học** trong menu của một dòng để cập nhật bất kỳ trường nào, kể cả trạng thái.
4. Chọn **Xem thông tin** trong menu dòng để đọc toàn bộ thông tin phòng mà không rời danh sách.
5. Dùng menu dòng để chuyển nhanh sang một trạng thái khác. Hệ thống yêu cầu xác nhận trước khi đổi.
6. Chọn **Xóa**, xác nhận thao tác, rồi đọc lý do ngay trong hộp thoại nếu hệ thống từ chối xóa.

Bảng chỉ hiện ba tiện ích đầu của mỗi phòng; chip `+N` mở hộp thoại liệt kê **toàn bộ**
tiện ích của phòng đó. Dưới `1024px` bảng chuyển thành thẻ mang đúng những thông tin đó.
Mọi điều kiện lọc, sắp xếp, chế độ xem và số dòng mỗi trang đều nằm trên URL, nên một
danh sách đã lọc có thể tải lại hoặc gửi cho người khác bằng đường dẫn.

Mọi endpoint cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách | `GET /api/v1/rooms` |
| Lấy danh sách chọn | `GET /api/v1/rooms/options` |
| Tạo | `POST /api/v1/rooms` với `name`, `capacity`, tùy chọn `location`, `facilities`, `note` |
| Xem chi tiết | `GET /api/v1/rooms/{id}` |
| Sửa | `PUT /api/v1/rooms/{id}` với `name`, `capacity`, tùy chọn `location`, `facilities`, `note`, `status` |
| Đổi trạng thái | `PATCH /api/v1/rooms/{id}/status` với `status` (thao tác nhanh trên danh sách) |
| Xóa | `DELETE /api/v1/rooms/{id}` |

Danh sách nhận `q` để tìm theo tên và vị trí, `status` để lọc theo một trạng thái,
`facilities[]` để lọc theo tiện ích, `capacity_min` và `capacity_max` để lọc theo khoảng
sức chứa, cùng `page`, `per_page`, `sort`, `direction` để phân trang và sắp xếp. Cột sắp
xếp cho phép: `id`, `name`, `capacity`, `created_at`.

Bộ lọc tiện ích mang nghĩa **VÀ**: `?facilities[]=0&facilities[]=9` chỉ trả những phòng
có **đủ cả** Máy chiếu lẫn Wifi, không phải phòng có một trong hai. Giá trị ngoài `0`–`9`
trả `422`.

Từ khóa tìm kiếm **bỏ dấu tiếng Việt và không phân biệt hoa thường**: gõ `Hung` tìm ra `Hùng`, gõ `Do Thi Uoc` tìm ra `Đỗ Thị Ước`. Gõ đầy đủ dấu vẫn tìm được như thường. Ký tự `%` và `_` gõ vào được hiểu là ký tự thật, không phải ký tự đại diện.

## Kết quả mong đợi

- Danh sách trả envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi phòng trả `id`, `name`, `capacity`, `location`, `facilities`, `note`, `status`, `created_at`, `updated_at`. `facilities` là mảng số nguyên, có thể rỗng; `location` có thể `null`.
- Tạo thành công trả `201` cùng phòng mới.
- Sửa và đổi trạng thái trả `200` cùng phòng sau cập nhật.
- Xóa thành công trả `204` và phòng không còn tồn tại.
- Danh sách chọn trả mảng gồm `id` và `label`.
- Màn hình giữ danh sách đang xem sau khi tạo, sửa, đổi trạng thái hoặc xóa và làm mới dữ liệu phòng học.

Trên trình duyệt:

- Mỗi thao tác thành công hiện một thông báo nổi ở góc dưới bên phải rồi tự đóng sau vài giây: `Đã tạo phòng học.`, `Đã lưu thay đổi phòng học.`, `Đã chuyển phòng học "<tên>" sang trạng thái <trạng thái>.`, `Đã xóa phòng học "<tên>".`
- Danh sách phòng học tự hiển thị bản ghi vừa tạo hoặc vừa sửa khi màn hình quay lại, không cần tải lại trang.

## Lỗi và trường hợp ngoại lệ

- Tên phòng trùng trả `422` với lỗi gắn vào `name`: `Tên phòng học này đã tồn tại trong hệ thống.`
- Sức chứa âm hoặc vượt `32767`, trạng thái ngoài ba giá trị đã khai báo, vị trí quá 500 ký tự, và tiện ích ngoài mười giá trị đã khai báo đều trả `422` gắn vào trường không hợp lệ.
- Không tìm thấy phòng trả `404`: `Không tìm thấy phòng học.`
- Xóa phòng còn lịch tham chiếu trả `409`: `Phòng học đang được dùng bởi {N} lịch, không thể xóa.`
- Không đủ quyền trả `403`; thiếu token trả `401`.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai sử dụng được từng endpoint phòng học. | Không đủ quyền thì nhận `403`. |
| [Lịch cố định theo lớp](../schedule/lich-co-dinh.md) | Hạ nguồn | Lịch cố định phải chọn một phòng đang Hoạt động, và phòng còn lịch trỏ vào thì không xóa được. | Xóa phòng đang có lịch trả `409` kèm số lịch đang dùng; phòng chưa có lịch nào thì xóa được. |

## Giới hạn hiện tại

- Chưa có buổi học chi tiết, nên tham chiếu phòng hiện chỉ đến từ lịch cố định.
- Chưa lưu lịch sử thay đổi phòng hoặc trạng thái.
- Danh sách chọn trả tối đa 50 phòng mỗi lần gọi.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Academic/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/AcademicRoomTest.php`, `api/tests/Behavioral/AcademicPersistenceTest.php`
- Màn hình: `frontend/app/(protected)/academic/rooms/`
- Dữ liệu minh họa: `api/database/seeders/RoomDemoSeeder.php`
- Schema: `docs/database.md`
