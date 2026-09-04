# Ảnh đại diện hồ sơ

Last Verified: 2026-09-04

## Tổng quan

Mỗi hồ sơ (tài khoản đang đăng nhập, học sinh, giáo viên) có một ảnh đại diện dùng chung ở mọi nơi hiển thị người: menu tài khoản, danh sách học sinh, danh sách giáo viên và các biểu mẫu hồ sơ.

Ảnh đại diện có ba dạng: **không dùng ảnh**, **ảnh tải lên** lấy từ thư viện tệp riêng của chính tài khoản đó, hoặc **ảnh DiceBear** dựng ngay trên thiết bị từ ba bộ hình cài sẵn. Hệ thống không gọi dịch vụ ảnh bên ngoài.

Chức năng dùng được cả qua API lẫn trên trình duyệt: `/account/avatar` (mục **Đổi ảnh đại diện** trong menu tài khoản), và ngay trong biểu mẫu tạo hoặc sửa học sinh, giáo viên.

## Người dùng và điều kiện

- Mọi vai trò đều có quyền `profile.avatar_update` theo mặc định; quyền vẫn có thể bị thu hồi riêng cho từng người dùng.
- Cần bearer token hợp lệ.
- Người dùng chỉ đổi được ảnh đại diện của hồ sơ gắn với tài khoản mình. Quản trị viên đổi được ảnh đại diện của mọi hồ sơ.
- Chọn dạng **ảnh tải lên** đòi hồ sơ đã có tài khoản đăng nhập, vì tệp phải thuộc sở hữu của chính tài khoản đó. Hồ sơ chưa có tài khoản chỉ chọn được **không dùng ảnh** hoặc **DiceBear**.

## Quy tắc nghiệp vụ

- Ảnh đại diện là một trong ba dạng, gửi lên dưới dạng một đối tượng JSON duy nhất:
  - `{"type":"none"}` — xóa ảnh đại diện.
  - `{"type":"file","file_id":<id>}` — dùng một tệp ảnh đã có trong thư viện.
  - `{"type":"dicebear","style":<kiểu>,"seed":<seed>,"options":{...}}` — ảnh dựng tại thiết bị.
- Không có dạng nào khác, và không nhận thêm khóa lạ trong đối tượng; toàn bộ JSON không vượt 16 KiB.
- Kiểu DiceBear chỉ nhận `lorelei`, `notionists` hoặc `thumbs` — đúng ba bộ hình được cài trong ứng dụng. `seed` tối đa 128 ký tự.
- `options` chỉ nhận giá trị đơn (chuỗi, số, boolean) thuộc danh sách tùy chọn khai báo riêng cho từng kiểu: xác suất và biến thể của từng bộ phận, các màu của kiểu đó, cùng `backgroundColor`, `flip`, `scale`, `rotate`, `translateX`, `translateY`, `borderRadius` trong khoảng giá trị đã khai. Mọi tùy chọn ngoài danh sách bị từ chối.
- Tệp chọn làm ảnh đại diện phải đang hoạt động (không ở thùng rác), thuộc sở hữu của tài khoản gắn với hồ sơ, và có phần mở rộng `jpg`, `jpeg`, `png` hoặc `webp`.
- Một hồ sơ có nhiều nhất một liên kết ảnh đại diện. Lưu ảnh mới thay thế liên kết cũ trong cùng một transaction; không có lúc nào hồ sơ giữ hai ảnh.
- Tệp đang được dùng làm ảnh đại diện không chuyển vào thùng rác và không xóa vĩnh viễn được, cho tới khi hồ sơ đổi sang ảnh khác hoặc bỏ ảnh.
- Đổi ảnh đại diện là thao tác độc lập với sửa hồ sơ: nó có endpoint riêng và nút lưu riêng, không phụ thuộc việc lưu các trường hồ sơ khác.
- Riêng lúc **tạo** học sinh hoặc giáo viên, ảnh đại diện được gửi cùng request tạo tài khoản, vì tài khoản sở hữu tệp chưa tồn tại trước đó. Ảnh tải từ máy đi kèm dưới dạng multipart và chỉ được lưu khi cả hồ sơ và tài khoản tạo thành công.

## Hướng dẫn thao tác

Endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Đổi ảnh đại diện của một hồ sơ | `PUT /profiles/{profile}/avatar` với thân request là chính đối tượng union ở trên |
| Tạo học sinh kèm ảnh không dùng ảnh hoặc DiceBear | `POST /students` dạng JSON, thêm khóa `avatar` |
| Tạo học sinh kèm ảnh tải từ máy | `POST /students` dạng multipart với `payload` là JSON của toàn bộ payload (trong đó `avatar` là `{"type":"file"}`) và `avatar_file` là tệp ảnh |
| Tạo giáo viên kèm ảnh | `POST /teachers`, cùng hai dạng như học sinh |

Trên trình duyệt:

1. Mở menu tài khoản ở góc dưới thanh bên rồi bấm **Đổi ảnh đại diện**, hoặc mở màn hình sửa một học sinh hay giáo viên.
2. Chọn một trong các nút **Không dùng ảnh**, **Ảnh đã tải** hoặc **DiceBear**.
3. Với **Ảnh đã tải**: chọn một ảnh có sẵn trong thư viện, hoặc kéo ảnh mới vào khung **Tải ảnh mới** — ảnh được tải lên thư viện trước và vẫn ở đó dù bước lưu sau có lỗi.
4. Với **DiceBear**: chọn kiểu, sửa seed (hoặc bấm nút tạo seed mới), rồi chỉnh các tùy chọn màu, tỷ lệ, xoay và dịch chuyển. Ảnh xem trước đổi ngay tại chỗ.
5. Bấm **Lưu ảnh đại diện**.

Khi tạo học sinh hoặc giáo viên, khung ảnh đại diện nằm trong biểu mẫu tạo: chọn ảnh từ máy hoặc dựng ảnh DiceBear, ảnh được lưu cùng lúc bấm **Tạo học sinh** hoặc **Tạo giáo viên**.

## Kết quả mong đợi

- Đổi ảnh đại diện trả `200` cùng ảnh đại diện sau khi cập nhật.
- Hồ sơ dùng ảnh tải lên trả `{"type":"file","file_id":<id>,"content_url":"/api/v1/files/<id>/content"}`; hồ sơ dùng DiceBear trả lại đúng `style`, `seed`, `options` đã lưu; hồ sơ không dùng ảnh trả `null`.
- Học sinh, giáo viên và người dùng hiện tại đều báo ảnh đại diện trong trường `avatar` của mình; người dùng hiện tại báo thêm `profile_id`.
- Trên trình duyệt, thông báo nổi `Đã tải ảnh lên. Hãy lưu để áp dụng.` xuất hiện sau khi tải ảnh, và `Đã cập nhật ảnh đại diện.` sau khi lưu. Menu tài khoản, danh sách học sinh và danh sách giáo viên hiển thị ảnh mới không cần tải lại trang.
- Nơi nào chưa có ảnh đại diện thì hiển thị chữ cái đầu của tên, kèm tên đầy đủ ngay bên cạnh.

## Lỗi và trường hợp ngoại lệ

- Sai dạng union, sai kiểu DiceBear, seed quá dài, tùy chọn ngoài danh sách hoặc JSON quá 16 KiB đều trả `422` gắn vào `avatar`.
- Chọn tệp không tồn tại, đã ở thùng rác, không thuộc tài khoản của hồ sơ, hoặc không phải ảnh, trả `404` (`FILE-001`): `Không tìm thấy tệp.`
- Đổi ảnh đại diện của hồ sơ người khác khi không phải Quản trị viên trả `403` (`IDENTITY-006`): `Bạn không có quyền cập nhật hồ sơ này.`
- Không tìm thấy hồ sơ trả `404` (`IDENTITY-005`): `Không tìm thấy hồ sơ.`
- Tạo học sinh hoặc giáo viên với `avatar` dạng `file` mà thiếu `avatar_file`, hoặc gửi `avatar_file` khi không chọn dạng `file`, trả `422` gắn vào `avatar_file`. `payload` không phải một đối tượng JSON trả `422` gắn vào `payload`.
- Ảnh đại diện lưu thất bại lúc tạo tài khoản thì không để lại tài khoản, hồ sơ hay bản ghi tệp nào.
- Tải ảnh lên thành công nhưng bước lưu ảnh đại diện thất bại thì ảnh vẫn nằm trong thư viện tệp và người dùng thấy lỗi của bước lưu; dữ liệu hồ sơ không đổi.
- Không đủ quyền trả `403`; thiếu token trả `401`.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Quản lý tệp](../files/quan-ly-tep.md) | Tiên quyết | Ảnh tải lên phải là một tệp ảnh đang hoạt động trong thư viện của chính tài khoản; việc chọn nó tạo liên kết chặn xóa tệp. | Ảnh đang dùng làm ảnh đại diện không chuyển vào thùng rác được. |
| [Quản lý học sinh](hoc-sinh.md) | Trạng thái dùng chung | Hồ sơ học sinh mang ảnh đại diện của chính nó; tạo học sinh có thể gửi ảnh kèm theo. | Ảnh hiện trong danh sách, thẻ và biểu mẫu học sinh. |
| [Quản lý giáo viên](giao-vien.md) | Trạng thái dùng chung | Hồ sơ giáo viên mang ảnh đại diện của chính nó; tạo giáo viên có thể gửi ảnh kèm theo. | Ảnh hiện trong danh sách và biểu mẫu giáo viên. |
| [Xác thực bearer token](../auth/authentication.md) | Trạng thái dùng chung | Người dùng hiện tại báo `profile_id` và `avatar` để menu tài khoản vẽ được ảnh. | Ảnh đại diện hiện trong menu tài khoản ngay sau khi đăng nhập. |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai đổi được ảnh đại diện. | Bị thu hồi quyền thì nhận `403`. |

## Giới hạn hiện tại

- Chỉ ba bộ hình DiceBear được cài sẵn; không thêm kiểu khác bằng cấu hình.
- Không cắt, xoay hay chỉnh ảnh tải lên trong ứng dụng; ảnh được dùng nguyên trạng.
- Sửa hồ sơ không đổi ảnh đại diện kèm theo; ảnh luôn lưu bằng nút riêng của nó.
- Hồ sơ chưa có tài khoản đăng nhập không dùng được ảnh tải lên.
- Không có ảnh đại diện mặc định theo vai trò; hồ sơ không chọn ảnh thì hiển thị chữ cái đầu của tên.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Identity/Routes/api.php`
- Danh sách tùy chọn DiceBear được phép: `api/config/avatar.php`
- Kiểm thử xác định: `api/tests/Behavioral/ProfileAvatarTest.php`, `api/tests/Behavioral/IdentityAvatarResourceTest.php`, `api/tests/Security/ProfileAvatarAuthorizationTest.php`
- Tài liệu liên quan: [Quản lý tệp](../files/quan-ly-tep.md)
- Schema: `.docs/database.md`
