# Ảnh đại diện hồ sơ

Last Verified: 2026-09-18

## Tổng quan

Mỗi hồ sơ (tài khoản đang đăng nhập, học sinh, giáo viên) có một ảnh đại diện dùng chung ở mọi nơi hiển thị người: menu tài khoản, danh sách học sinh, danh sách giáo viên và các biểu mẫu hồ sơ.

Ảnh đại diện có ba dạng: **không dùng ảnh**, **ảnh tải lên** lấy từ thư viện tệp riêng của chính tài khoản đó, hoặc **avatar mẫu** dựng ngay trên thiết bị bằng DiceBear. Hệ thống không gọi dịch vụ ảnh bên ngoài.

Chức năng dùng được cả qua API lẫn trên trình duyệt: `/academic/avatar` (mục **Đổi ảnh đại diện** trong menu tài khoản), và ngay trong biểu mẫu tạo hoặc sửa học sinh, giáo viên.

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
- Kiểu DiceBear chỉ nhận `adventurer` — đúng một bộ hình được cài trong ứng dụng. `seed` tối đa 128 ký tự. Ba kiểu `lorelei`, `notionists`, `thumbs` từng được khai báo khi giao diện còn cho chỉnh kiểu và seed bằng tay; bỏ bộ điều khiển đó đi thì chúng nhận những giá trị không còn nơi nào tạo ra được, nên đã gỡ khỏi hợp đồng.
- Avatar mẫu được chọn bằng **giới tính** rồi **random**, không có bảng tùy chọn. Adventurer không có tùy chọn giới tính, nên độ dài tóc mang sự phân biệt đó: `hairVariant` thuộc `long01`–`long26` đọc là Nữ, `short01`–`short19` đọc là Nam. Mọi thứ còn lại của khuôn mặt — da, mắt, miệng, phụ kiện — do `seed` quyết định. Vì vậy một avatar mẫu đã lưu chỉ gồm `seed` và đúng một tùy chọn `hairVariant`, và mở lại picker thì giới tính được đọc ngược ra từ chính tiền tố đó.
- `options` chỉ nhận giá trị đơn (chuỗi, số, boolean) thuộc danh sách tùy chọn khai báo riêng cho từng kiểu: xác suất và biến thể của từng bộ phận, các màu của kiểu đó, cùng `backgroundColor`, `flip`, `scale`, `rotate`, `translateX`, `translateY`, `borderRadius` trong khoảng giá trị đã khai. Mọi tùy chọn ngoài danh sách bị từ chối.
- Tệp chọn làm ảnh đại diện phải đang hoạt động (không ở thùng rác), thuộc sở hữu của tài khoản gắn với hồ sơ, và có phần mở rộng `jpg`, `jpeg`, `png` hoặc `webp`.
- Một hồ sơ có nhiều nhất một liên kết ảnh đại diện. Lưu ảnh mới thay thế liên kết cũ trong cùng một transaction; không có lúc nào hồ sơ giữ hai ảnh.
- Tệp đang được dùng làm ảnh đại diện không chuyển vào thùng rác và không xóa vĩnh viễn được, cho tới khi hồ sơ đổi sang ảnh khác hoặc bỏ ảnh.
- Đổi ảnh đại diện luôn là một endpoint riêng, độc lập với endpoint sửa hồ sơ. Nút bấm tùy màn: màn `/academic/avatar` có nút **Lưu ảnh đại diện** riêng; màn sửa học sinh và giáo viên gộp việc ghi ảnh vào nút **Lưu thay đổi** của tờ hồ sơ, sau khi các trường hồ sơ được chấp nhận.
- Riêng lúc **tạo** học sinh hoặc giáo viên, ảnh đại diện được gửi cùng request tạo tài khoản, vì tài khoản sở hữu tệp chưa tồn tại trước đó. Ảnh tải từ máy đi kèm dưới dạng multipart và chỉ được lưu khi cả hồ sơ và tài khoản tạo thành công.

## Hướng dẫn thao tác

Endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Đổi ảnh đại diện của một hồ sơ | `PUT /api/v1/academic/profiles/{profile}/avatar` với thân request là chính đối tượng union ở trên |
| Tạo học sinh kèm ảnh không dùng ảnh hoặc DiceBear | `POST /api/v1/academic/students` dạng JSON, thêm khóa `avatar` |
| Tạo học sinh kèm ảnh tải từ máy | `POST /api/v1/academic/students` dạng multipart với `payload` là JSON của toàn bộ payload (trong đó `avatar` là `{"type":"file"}`) và `avatar_file` là tệp ảnh |
| Tạo giáo viên kèm ảnh | `POST /api/v1/academic/teachers`, cùng hai dạng như học sinh |

Trên trình duyệt:

1. Mở menu tài khoản ở góc dưới thanh bên rồi bấm **Đổi ảnh đại diện**, hoặc mở màn hình sửa một giáo viên.
2. Chọn một trong các nút **Không dùng ảnh**, **Ảnh đã tải** hoặc **Chọn avatar mẫu**.
3. Với **Ảnh đã tải**: chọn một ảnh có sẵn trong thư viện, hoặc kéo ảnh mới vào khung **Tải ảnh mới** — ảnh được tải lên thư viện trước và vẫn ở đó dù bước lưu sau có lỗi.
4. Với **Chọn avatar mẫu**: hộp thoại mở ra ở avatar đang có trên hồ sơ. Chọn **Nam** hoặc **Nữ**, bấm **Random avatar** đến khi vừa ý, rồi bấm **Dùng avatar này**. Đổi giới tính cũng random lại ngay. Random bao nhiêu lần cũng không đụng tới avatar đang lưu — chỉ **Dùng avatar này** mới áp dụng.
5. Ở màn `/academic/avatar`, bấm **Lưu ảnh đại diện**. Ở màn sửa học sinh hoặc giáo viên, bấm **Lưu thay đổi** để lưu cả hồ sơ và avatar.

Khi tạo học sinh hoặc giáo viên, khung ảnh đại diện nằm trong biểu mẫu tạo: tải ảnh từ máy hoặc chọn một avatar mẫu, ảnh được lưu cùng lúc bấm **Tạo học sinh** hoặc **Tạo giáo viên**. Cả hai màn tạo đều mở ra với một avatar mẫu ngẫu nhiên.

Màn **sửa** học sinh dùng đúng khung đó ở khối `01`, và lưu cùng nút **Lưu thay đổi**. Khung mở ra trên ảnh đang lưu — kể cả ảnh tải từ máy, thứ không dựng lại thành một lựa chọn đang soạn được — và chỉ ghi đè khi có ảnh mới, nên mở thẻ tải ảnh rồi bỏ đó không làm mất ảnh cũ. Màn này không có cách gỡ ảnh; muốn bỏ hẳn thì dùng màn ảnh đại diện riêng.

Khung chọn ảnh có hai chế độ, chuyển bằng một cặp nút **Tải ảnh lên** / **Avatar mẫu**; ô avatar giữ nguyên kích thước, chỉ đổi thứ nằm trong đó. Rời một chế độ thì dữ liệu của chế độ đó bị bỏ: chuyển sang avatar mẫu sẽ gỡ ảnh đã tải và giải phóng bộ nhớ của nó.

Ảnh tải lên được **xử lý ngay trên máy trước khi rời trình duyệt**, ở cả màn tạo lẫn màn sửa: sửa hướng theo EXIF, cắt vuông 1:1, thu về 512×512 theo kiểu `cover`, rồi mã hoá lại thành WebP. Máy chủ nhận đúng ảnh đã xử lý, không phải ảnh gốc — một ảnh chụp 2400×1600 nặng 3,2 MB tới nơi chỉ còn khoảng 2 KB. Vùng thả ảnh là một khung tròn hiển thị đúng phần sẽ bị cắt, nên cái nhìn thấy là cái được lưu.

## Kết quả mong đợi

- Đổi ảnh đại diện trả `200` cùng ảnh đại diện sau khi cập nhật.
- Hồ sơ dùng ảnh tải lên trả `{"type":"file","file_id":<id>,"content_url":"/api/v1/system/files/<id>/content"}`; hồ sơ dùng DiceBear trả lại đúng `style`, `seed`, `options` đã lưu; hồ sơ không dùng ảnh trả `null`.
- Học sinh, giáo viên và người dùng hiện tại đều báo ảnh đại diện trong trường `avatar` của mình; người dùng hiện tại báo thêm `profile_id`.
- Trên trình duyệt, thông báo nổi `Đã tải ảnh lên. Hãy lưu để áp dụng.` xuất hiện sau khi tải ảnh, và `Đã cập nhật ảnh đại diện.` sau khi lưu. Menu tài khoản, danh sách học sinh và danh sách giáo viên hiển thị ảnh mới không cần tải lại trang.
- Nơi nào chưa có ảnh đại diện thì hiển thị chữ cái đầu của tên, kèm tên đầy đủ ngay bên cạnh.

## Lỗi và trường hợp ngoại lệ

- Sai dạng union, sai kiểu DiceBear, seed quá dài, tùy chọn ngoài danh sách hoặc JSON quá 16 KiB đều trả `422` gắn vào `avatar`. Biến thể bộ phận cũng bị đối chiếu với đúng định nghĩa của kiểu đó: `hairVariant` là `long27` hay `variant01` đều bị từ chối cho `adventurer`.
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
| [Quản lý tệp](../system/quan-ly-tep.md) | Tiên quyết | Ảnh tải lên phải là một tệp ảnh đang hoạt động trong thư viện của chính tài khoản; việc chọn nó tạo liên kết chặn xóa tệp. | Ảnh đang dùng làm ảnh đại diện không chuyển vào thùng rác được. |
| [Quản lý học sinh](hoc-sinh.md) | Trạng thái dùng chung | Hồ sơ học sinh mang ảnh đại diện của chính nó; tạo học sinh gửi ảnh kèm theo, sửa học sinh ghi ảnh qua endpoint này ngay trong nút Lưu thay đổi. | Ảnh hiện trong danh sách, thẻ và biểu mẫu học sinh. |
| [Quản lý giáo viên](giao-vien.md) | Trạng thái dùng chung | Hồ sơ giáo viên mang ảnh đại diện của chính nó; tạo giáo viên gửi ảnh kèm theo, sửa giáo viên ghi ảnh qua endpoint này khi bấm **Lưu thay đổi**. | Ảnh hiện trong danh sách và biểu mẫu giáo viên. |
| [Xác thực bearer token](../auth/authentication.md) | Trạng thái dùng chung | Người dùng hiện tại báo `profile_id` và `avatar` để menu tài khoản vẽ được ảnh. | Ảnh đại diện hiện trong menu tài khoản ngay sau khi đăng nhập. |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai đổi được ảnh đại diện. | Bị thu hồi quyền thì nhận `403`. |

## Giới hạn hiện tại

- Chỉ một bộ hình DiceBear được cài sẵn; thêm kiểu khác phải sửa đồng thời ba nơi gương nhau: `api/config/academic.php`, `frontend/src/modules/academic/schemas/avatar-schema.ts` và bảng `STYLES` trong `frontend/src/modules/academic/utils/dicebear.ts`.
- Chỉ điều chỉnh được giới tính. Không còn nơi nào sửa seed, màu, tỷ lệ, xoay hay dịch chuyển bằng tay; muốn vậy phải gọi thẳng API.
- Ảnh đại diện DiceBear lưu bằng một kiểu không còn được cài sẽ hiện thành chữ cái đầu của tên thay vì báo lỗi, và lưu lại nó mà không đổi sẽ bị từ chối.
- Khung ảnh đại diện là hình tròn, nên tóc hoặc phụ kiện chạm mép khung của một số avatar bị cắt theo đường tròn.
- Vùng cắt là **giữa ảnh**, không kéo chọn được. Muốn người dùng tự chọn khung mặt thì cần một trình sửa ảnh gắn ngoài (`filepond-plugin-image-edit` chỉ là cầu nối, bản thân nó không sửa ảnh và cần Doka hoặc Pintura — đều là phần mềm thương mại).
- Ảnh tải lên luôn bị thu về 512×512 và mã hoá WebP; không giữ lại được bản gốc độ phân giải cao.
- Không cắt, xoay hay chỉnh ảnh tải lên trong ứng dụng; ảnh được dùng nguyên trạng.
- Màn ảnh đại diện riêng lưu bằng nút riêng; màn sửa học sinh và giáo viên lưu avatar đã chọn cùng nút **Lưu thay đổi**.
- Hồ sơ chưa có tài khoản đăng nhập không dùng được ảnh tải lên.
- Không có ảnh đại diện mặc định theo vai trò; hồ sơ không chọn ảnh thì hiển thị chữ cái đầu của tên.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Academic/Routes/api.php`
- Danh sách tùy chọn DiceBear được phép: `api/config/academic.php`, gương ở `frontend/src/modules/academic/schemas/avatar-schema.ts`
- Map giới tính sang biến thể tóc Adventurer: `frontend/src/modules/academic/utils/adventurer.ts`
- Kiểm thử xác định: các bài kiểm thử avatar trong `api/tests/Behavioral/` và `api/tests/Security/`
- Tài liệu liên quan: [Quản lý tệp](../system/quan-ly-tep.md)
- Schema: `docs/database.md`
