# Quản lý tệp

Last Verified: 2026-09-04

## Tổng quan

Mỗi tài khoản có một thư viện tệp riêng tư: tệp được tải lên, xem, đổi tên, chuyển vào thùng rác, khôi phục và xóa vĩnh viễn trong phạm vi tài khoản đó. Tệp không bao giờ công khai; nội dung chỉ mở được qua một liên kết tạm thời do hệ thống cấp sau khi đã kiểm tra quyền.

Chức năng dùng được cả qua API lẫn màn hình quản trị tại `/files` (mục **Tệp** trong nhóm Thư viện ở thanh bên).

## Người dùng và điều kiện

- Mọi vai trò (Quản trị viên, Giáo viên, Học sinh, Phụ huynh) đều có các quyền `file.list`, `file.upload`, `file.update`, `file.delete` theo mặc định; quyền vẫn có thể bị thu hồi riêng cho từng người dùng.
- Cần bearer token hợp lệ.
- Chỉ Quản trị viên đọc và sửa được hạn mức lưu trữ, quyền `file_quota.manage`.
- Chỉ Quản trị viên thao tác được trên tệp của người khác; các vai trò còn lại luôn bị giới hạn trong tệp của chính mình.

## Quy tắc nghiệp vụ

- Mỗi tệp có một người sở hữu duy nhất và **không đổi được** sau khi tải lên. Người sở hữu là người tải lên, trừ khi Quản trị viên chỉ định `owner_user_id` khác.
- Người không phải Quản trị viên chỉ thấy và chỉ thao tác được tệp mình sở hữu. Gửi `owner_user_id` khi không phải Quản trị viên bị trả `422`.
- Tệp tối đa 25 MiB.
- Chỉ nhận JPEG, PNG, WebP (`jpg`, `jpeg`, `png`, `webp`), PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, CSV và TXT. Phần mở rộng và MIME do máy chủ tự phát hiện phải khớp nhau và khớp danh sách cho phép; tệp `docx`, `xlsx`, `pptx` còn phải chứa đúng thành phần tài liệu của nó và không được bật macro.
- Mỗi tệp được xếp vào một loại: `image`, `pdf`, `document`, `spreadsheet`, `presentation`, `text`.
- Hạn mức lưu trữ tính theo vai trò của người sở hữu, trên tổng dung lượng tệp còn tồn tại của người đó. Mặc định trước khi Quản trị viên lưu cấu hình riêng: Quản trị viên 10 GiB, Giáo viên 2 GiB, Học sinh 500 MiB, Phụ huynh 500 MiB.
- Một lần tải lên bị từ chối nếu dung lượng đang dùng cộng tệp mới vượt hạn mức của vai trò người sở hữu.
- Đổi tên chỉ đổi tên hiển thị. Gửi kèm `owner_user_id`, `disk` hoặc `path` bị từ chối; tên gốc, vị trí lưu trữ và người sở hữu không đổi được qua API.
- Tệp đang được dùng bởi một bản ghi khác (hiện tại chỉ có ảnh đại diện hồ sơ) **không** chuyển vào thùng rác và **không** xóa vĩnh viễn được. Phải bỏ liên kết đó trước.
- Chuyển vào thùng rác giữ nguyên đối tượng đã lưu; khôi phục không đổi người sở hữu hay vị trí lưu trữ.
- Tệp nằm trong thùng rác quá 30 ngày bị xóa vĩnh viễn bởi tác vụ định kỳ chạy mỗi ngày. Tệp còn liên kết được giữ lại thay vì xóa; tệp mà bước xóa đối tượng thất bại cũng được giữ lại để lần chạy sau thử lại.
- Nội dung tệp chỉ truy cập được qua endpoint nội dung: hệ thống kiểm tra quyền rồi chuyển hướng sang liên kết tạm thời có hiệu lực 5 phút.
- Ảnh và PDF mở trực tiếp trên trình duyệt; mọi loại còn lại luôn tải xuống. Thêm `download=1` buộc tải xuống cả với ảnh và PDF.

## Hướng dẫn thao tác

Mọi endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách | `GET /files` |
| Xem dung lượng đã dùng | `GET /files/usage` |
| Xem danh sách chủ sở hữu chọn được | `GET /files/owner-options`, tùy chọn `q` và `limit` (tối đa 50) — chỉ Quản trị viên, vai trò khác nhận `403` |
| Tải lên | `POST /files` dạng multipart với `file`, tùy chọn `display_name` và `owner_user_id` |
| Xem chi tiết | `GET /files/{id}` |
| Đổi tên hiển thị | `PUT /files/{id}` với `display_name` |
| Mở nội dung | `GET /files/{id}/content`, tùy chọn `download=1` |
| Chuyển vào thùng rác | `DELETE /files/{id}` |
| Khôi phục | `POST /files/{id}/restore` |
| Xóa vĩnh viễn | `DELETE /files/{id}/permanent` |
| Xem hạn mức | `GET /system/file-quotas` |
| Sửa hạn mức | `PUT /system/file-quotas` với `quotas.admin`, `quotas.teacher`, `quotas.student`, `quotas.guardian` tính theo byte |

Danh sách nhận `search` (tìm theo tên tệp), `category`, `uploaded_from`, `uploaded_to`, `trash` (`active` mặc định hoặc `trashed`), `link_type`, `owner_user_id` (chỉ Quản trị viên), cùng `page`, `per_page` (tối đa 200), `sort` và `direction`. Cột sắp xếp cho phép: `id`, `original_name`, `display_name`, `size_bytes`, `created_at`.

Trên trình duyệt tại `/files`:

1. Kéo tệp vào khung tải lên hoặc bấm chọn tệp; thanh tiến trình hiện cho từng tệp và có thể hủy giữa lúc đang tải.
2. Dùng ô **Tìm theo tên tệp**, bộ chọn **Loại tệp** và **Trạng thái tệp** (`Đang dùng` hoặc thùng rác) để thu hẹp danh sách. Quản trị viên có thêm bộ chọn **Chủ sở hữu**.
3. Bấm một tệp để xem trước; ảnh và PDF hiện ngay trong hộp xem trước.
4. Dùng thao tác trên từng dòng để đổi **Tên hiển thị**, **Chuyển vào thùng rác**, **Khôi phục** hoặc **Xóa vĩnh viễn**; mỗi thao tác có bước xác nhận riêng.
5. Khối **Dung lượng** hiện phần đã dùng trên hạn mức của tài khoản. Quản trị viên mở được hộp thoại sửa hạn mức cho từng vai trò, nhập dạng `25 MB` hoặc `1 GB`.

## Kết quả mong đợi

- Danh sách trả về envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi tệp báo tên hiển thị, tên gốc, loại, dung lượng, người sở hữu, thời điểm tải lên, trạng thái thùng rác và các liên kết đang dùng nó; không bao giờ báo tọa độ lưu trữ.
- Tải lên thành công trả `201` cùng bản ghi tệp.
- Dung lượng đã dùng trả `owner_id`, `used_bytes`, `quota_bytes`, `remaining_bytes` và `exceeded`.
- Đổi tên và khôi phục trả `200` cùng bản ghi sau khi cập nhật.
- Chuyển vào thùng rác và xóa vĩnh viễn trả `204`.
- Mở nội dung trả `302` sang liên kết tạm thời, kèm `Cache-Control: no-store`. Liên kết hết hiệu lực sau 5 phút.
- Trên trình duyệt, thao tác thành công hiện thông báo nổi `Đã cập nhật tệp.` hoặc `Đã cập nhật hạn mức.`, và danh sách tự làm mới không cần tải lại trang.

## Lỗi và trường hợp ngoại lệ

- Tệp quá 25 MiB hoặc không hợp lệ trả `422` gắn vào `file`.
- Tệp ngoài danh sách cho phép, hoặc phần mở rộng không khớp nội dung thật, trả `422` gắn vào `file`.
- Vượt hạn mức trả `409` (`FILE-002`): `Dung lượng lưu trữ không đủ.`
- Tệp đang được sử dụng trả `409` (`FILE-004`): `Tệp đang được sử dụng.`
- Thao tác sai trạng thái — chuyển vào thùng rác một tệp đã ở thùng rác, khôi phục một tệp đang dùng, xóa vĩnh viễn một tệp chưa vào thùng rác — trả `409` (`FILE-005`): `Tệp không ở trạng thái phù hợp.`
- Không tìm thấy tệp, hoặc tệp không thuộc phạm vi của người gọi, trả `404` (`FILE-001`): `Không tìm thấy tệp.` Người gọi không phân biệt được hai trường hợp này.
- Quản trị viên chỉ định `owner_user_id` không tồn tại trả lỗi `Không tìm thấy người sở hữu.`
- Kho lưu trữ không ghi, không xóa hoặc không cấp được liên kết tạm thời trả `503` (`FILE-003`): `Không thể lưu tệp.`, `Không thể xóa tệp.` hoặc `Không thể mở nội dung tệp.` Một lần tải lên thất bại không để lại bản ghi mồ côi lẫn đối tượng mồ côi.
- Không đủ quyền trả `403`; thiếu token trả `401`.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai xem, tải lên, sửa và xóa được tệp, và ai sửa được hạn mức. | Thiếu quyền thì nhận `403`. |
| [Xác thực bearer token](../auth/authentication.md) | Tiên quyết | Vai trò của tài khoản quyết định hạn mức và phạm vi tệp thấy được. | Học sinh chỉ thấy tệp của mình và hết dung lượng sớm hơn Giáo viên. |
| [Ảnh đại diện hồ sơ](../identity/avatar.md) | Hạ nguồn | Ảnh được chọn làm ảnh đại diện tạo một liên kết chặn chuyển vào thùng rác và xóa vĩnh viễn. | Ảnh đang dùng làm ảnh đại diện không xóa được cho tới khi đổi ảnh đại diện. |

## Giới hạn hiện tại

- Không có thư mục hay cây thư mục; thư viện là một danh sách phẳng, lọc bằng loại tệp, từ khóa và khoảng ngày.
- Không đổi được người sở hữu của một tệp đã tải lên.
- Không có endpoint dùng chung để tạo hay xóa liên kết sử dụng; liên kết duy nhất hiện có là ảnh đại diện hồ sơ và do chính chức năng đó quản lý.
- Không có tải lên nhiều tệp trong một request; mỗi request một tệp.
- Không có bản sao lưu hay phục hồi sau khi đã xóa vĩnh viễn.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/FileManagement/Routes/api.php`, `api/app/Modules/System/Routes/api.php`
- Tác vụ định kỳ: `api/app/Modules/FileManagement/Routes/console.php` (`files:purge-trash`, chạy hằng ngày)
- Cấu hình kho lưu trữ: `api/config/file-management.php`, `api/config/filesystems.php`
- Kiểm thử xác định: `api/tests/Behavioral/FileUploadTest.php`, `api/tests/Behavioral/FileLibraryTest.php`, `api/tests/Behavioral/FileLifecycleTest.php`, `api/tests/Behavioral/SystemFileQuotaTest.php`, `api/tests/Security/FileManagementAuthorizationTest.php`
- Schema: `docs/database.md`
