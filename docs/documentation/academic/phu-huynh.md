# Quản lý phụ huynh

Last Verified: 2026-09-22
Related Issue: `#14`

## Tổng quan

Phụ huynh là hồ sơ liên hệ học vụ độc lập, không có tài khoản đăng nhập, mật khẩu hoặc cổng phụ huynh. Màn hình nằm tại `/academic/guardians`.

## Người dùng và điều kiện

- Quản trị viên được xem, tạo, sửa và xóa hồ sơ.
- Giáo viên được xem toàn bộ hồ sơ và học sinh liên kết ở chế độ chỉ đọc.
- Giáo viên không được truy cập form, options directory hoặc endpoint mutation.
- Cần bearer token hợp lệ.

## Quy tắc nghiệp vụ

- Hồ sơ phụ huynh phải role-pure: không có tài khoản, không là giáo viên hoặc học sinh, và luôn có ít nhất một liên kết học sinh.
- Roster gửi khi tạo/sửa là danh sách đầy đủ; mỗi dòng có học sinh, quan hệ và cờ liên hệ chính rõ ràng.
- Trùng chính xác họ tên và số điện thoại với phụ huynh khác trả `409`; chỉ trùng tên vẫn được phép.
- Không tự động chọn người liên hệ chính thay thế. Khi gỡ liên hệ chính mà học sinh còn phụ huynh khác, phải chọn replacement hợp lệ.
- Xóa phụ huynh xóa hồ sơ và các liên kết của hồ sơ, nhưng giữ nguyên học sinh.

## Hướng dẫn thao tác

1. Mở **Phụ huynh** trong nhóm Người dùng.
2. Quản trị viên chọn **Thêm người giám hộ**, nhập thông tin liên hệ và roster học sinh.
3. Khi sửa hoặc xóa, chọn replacement nếu hệ thống yêu cầu rồi xác nhận.
4. Giáo viên mở danh sách hoặc chi tiết để tra cứu, không có nút mutation.

API chính: `GET/POST /api/v1/academic/guardians`, `GET/PUT/DELETE /api/v1/academic/guardians/{id}`. Options cho biểu mẫu học sinh là `GET /api/v1/academic/guardians/options` và chỉ yêu cầu quyền sửa học sinh.

## Kết quả mong đợi

Danh sách và chi tiết trả hồ sơ liên hệ cùng toàn bộ học sinh liên kết, primary trước rồi theo họ tên và id. Tạo trả `201`, sửa trả `200`, xóa trả `204`.

## Lỗi và trường hợp ngoại lệ

- Hồ sơ không đủ điều kiện hoặc không tồn tại trả `404`.
- Không đủ quyền trả `403`.
- Duplicate trả `409` kèm metadata an toàn của hồ sơ đã có.
- Thiếu replacement hợp lệ trả `422` và rollback toàn bộ thay đổi.

## Quan hệ với chức năng khác

- [Quản lý học sinh](hoc-sinh.md): biểu mẫu học sinh chỉ liên kết guardian đã tồn tại; không tự tạo hoặc tự gán primary.
- [Quản lý giáo viên](giao-vien.md): Admin đổi mật khẩu giáo viên thu hồi token của đúng tài khoản.
- Không có tài khoản phụ huynh trong phase này.

## Giới hạn hiện tại

Không có portal, đăng nhập, password reset hoặc tự quản lý hồ sơ phụ huynh. Không thêm migration hay bảng guardian riêng.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Academic/Routes/api.php`
- Tests: `api/tests/Behavioral/Api/Guardians/` và `api/tests/Behavioral/IdentityGuardianTest.php`
- Schema: `docs/database.md`
