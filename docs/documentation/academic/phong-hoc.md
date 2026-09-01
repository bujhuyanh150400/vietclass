# Quản lý phòng học

Last Verified: 2026-09-01
Related Task: `.tasks/schedule-phase-1-rooms.md`

## Tổng quan

Phòng học là danh mục thuộc Học vụ. Mỗi phòng ghi nhận tên, sức chứa, ghi chú và trạng thái sẵn sàng để được sử dụng trong lịch học ở giai đoạn sau.

Chức năng có màn quản trị tại `/academic/rooms` (mục **Phòng học** trong nhóm Học vụ ở thanh bên) và API quản trị dưới tiền tố `/api/v1`.

## Người dùng và điều kiện

- Chỉ vai trò Quản trị viên được xem, tạo, sửa, đổi trạng thái hoặc xóa phòng học. Vai trò khác nhận `403`.
- Cần bearer token hợp lệ.

## Quy tắc nghiệp vụ

- Tên phòng học là duy nhất trong toàn hệ thống và dài tối đa 50 ký tự.
- Sức chứa là số nguyên từ `0` đến `32767`.
- Phòng mới mặc định ở trạng thái `0` — **Hoạt động**.
- Ba trạng thái phòng là `0` — **Hoạt động**, `1` — **Tạm khóa**, và `2` — **Bảo trì**.
- Tên, sức chứa và ghi chú được sửa qua endpoint sửa phòng; trạng thái có endpoint riêng.
- Danh sách chọn chỉ trả các phòng **Hoạt động**.
- Không xóa được phòng khi còn lịch học tham chiếu. Bộ đếm tham chiếu hiện đếm số [lịch cố định](../schedule/lich-co-dinh.md) trỏ vào phòng; khi có buổi học chi tiết, các buổi đó sẽ được cộng vào cùng số đếm này.

## Hướng dẫn thao tác

Trên màn hình **Phòng học**:

1. Dùng ô tìm kiếm theo tên và bộ lọc trạng thái để tìm phòng cần quản lý.
2. Chọn **Thêm phòng học** để nhập tên, sức chứa và ghi chú. Phòng mới ở trạng thái Hoạt động.
3. Chọn **Sửa phòng học** trong menu của một dòng để cập nhật tên, sức chứa hoặc ghi chú.
4. Dùng menu dòng để chuyển sang một trạng thái khác. Hệ thống yêu cầu xác nhận trước khi đổi.
5. Chọn **Xóa**, xác nhận thao tác, rồi đọc lý do ngay trong hộp thoại nếu hệ thống từ chối xóa.

Mọi endpoint cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách | `GET /api/v1/rooms` |
| Lấy danh sách chọn | `GET /api/v1/rooms/options` |
| Tạo | `POST /api/v1/rooms` với `name`, `capacity`, tùy chọn `note` |
| Xem chi tiết | `GET /api/v1/rooms/{id}` |
| Sửa | `PUT /api/v1/rooms/{id}` với `name`, `capacity`, tùy chọn `note` |
| Đổi trạng thái | `PATCH /api/v1/rooms/{id}/status` với `status` |
| Xóa | `DELETE /api/v1/rooms/{id}` |

Danh sách nhận `q` để tìm theo tên, `status` để lọc theo một trạng thái, và `page`, `per_page`, `sort`, `direction` để phân trang và sắp xếp. Cột sắp xếp cho phép: `id`, `name`, `capacity`, `created_at`.

## Kết quả mong đợi

- Danh sách trả envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi phòng trả `id`, `name`, `capacity`, `note`, `status`, `created_at`, `updated_at`.
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
- Sức chứa âm hoặc vượt `32767`, và trạng thái ngoài ba giá trị đã khai báo trả `422` gắn vào trường không hợp lệ.
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
- Schema: `.docs/database.md`
