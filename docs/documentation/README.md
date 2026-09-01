# Chức năng đã được xác minh

| Module | Chức năng | Mô tả |
| --- | --- | --- |
| Auth | [Xác thực bearer token](auth/authentication.md) | Đăng nhập, xem người dùng hiện tại và đăng xuất API, cùng luồng đăng nhập, phục hồi phiên và đăng xuất trên trình duyệt. |
| Auth | [Phân quyền theo chức năng](auth/phan-quyen.md) | Quyền mặc định theo vai trò khai trong mã nguồn, cộng phân quyền cấp riêng hoặc thu hồi riêng cho từng người dùng. |
| Identity | [Quản lý giáo viên](identity/giao-vien.md) | Hồ sơ giáo viên kèm tài khoản đăng nhập, trạng thái làm việc và khóa mở tài khoản. |
| Identity | [Quản lý học sinh](identity/hoc-sinh.md) | Hồ sơ học sinh kèm tài khoản đăng nhập, thông tin phụ huynh và trạng thái học tập. |
| Academic | [Quản lý môn học](academic/mon-hoc.md) | Danh mục môn học, khóa và mở môn theo các lớp đang dùng. |
| Academic | [Quản lý phòng học](academic/phong-hoc.md) | Danh mục phòng, sức chứa, trạng thái sẵn sàng và điều kiện xóa. |
| Academic | [Quản lý lớp học](academic/lop-hoc.md) | Lớp học gắn môn và giáo viên, sĩ số tối đa, và việc kết thúc lớp. |
| Academic | [Ghi danh vào lớp](academic/ghi-danh.md) | Thêm học sinh vào lớp, sửa thông tin ghi danh, chuyển lớp và cho nghỉ. |
| Schedule | [Lịch cố định theo lớp](schedule/lich-co-dinh.md) | Lịch học hằng tuần của một lớp kèm giáo viên chính và trợ giảng, chống trùng phòng và trùng giáo viên, đóng và ra bản mới. |
| Schedule | [Buổi học theo ngày](schedule/buoi-hoc.md) | Xem lịch học theo khoảng ngày từ buổi ảo chiếu ra lịch cố định, vật thể hoá một buổi ảo thành buổi học có `id`, cùng màn lịch chỉ đọc theo tuần và theo tháng trên trình duyệt. |
