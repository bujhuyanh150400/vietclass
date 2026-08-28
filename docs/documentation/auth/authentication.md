# Xác thực bearer token

Last Verified: 2026-08-28

## Tổng quan

Auth cung cấp đăng nhập bằng username và mật khẩu, sau đó cấp bearer token để gọi các API cần xác thực. Chức năng này có hai mặt sử dụng:

- **API client** gọi trực tiếp các endpoint Laravel dưới tiền tố `/api/v1` và tự quản lý bearer token.
- **Trình duyệt** dùng màn hình `/login` của frontend. Bearer token không bao giờ đi tới trình duyệt; frontend giữ token trong cookie `HttpOnly` và chỉ trả về thông tin người dùng.

Chức năng này là nền tảng xác thực hiện có; chưa bao gồm quản lý vai trò hay chức năng trường học.

## Người dùng và điều kiện

- Bất kỳ người dùng có bản ghi `users` đang hoạt động đều có thể đăng nhập.
- API client phải gửi JSON đến endpoint dưới tiền tố `/api/v1`.
- Các endpoint xem thông tin và đăng xuất của Laravel cần header `Authorization: Bearer <token>` hợp lệ.
- Người dùng trình duyệt chỉ cần truy cập `/login`; frontend tự gắn cookie phiên vào các request cùng nguồn.

## Quy tắc nghiệp vụ

- Chỉ `username` duy nhất và mật khẩu đúng của người dùng đang hoạt động mới tạo được token.
- Token thông thường hết hạn sau 30 ngày; payload `remember: true` tạo token hết hạn sau 120 ngày.
- Đăng xuất chỉ thu hồi token có trong request, không thu hồi token khác của cùng người dùng.
- Mỗi username và địa chỉ IP có tối đa 5 lần thử đăng nhập mỗi phút.
- Token được lưu dưới dạng hash; API chỉ trả token dạng rõ đúng một lần khi đăng nhập.

Bổ sung cho luồng trình duyệt:

- Token của phiên trình duyệt chỉ nằm trong cookie `vietclass_session` với `HttpOnly`, `SameSite=Lax`, `Path=/`, không có `Domain`, và `Secure` khi chạy production. Thời điểm hết hạn của cookie đúng bằng `expires_at` mà Laravel trả về, nên tùy chọn ghi nhớ quyết định luôn tuổi thọ của cookie.
- Token không xuất hiện trong phản hồi JSON của frontend, trong cache truy vấn, trong `localStorage`, `sessionStorage`, hay trong log.
- `/dashboard`, `/academic`, và các đường dẫn con được bảo vệ hai lớp: lớp ngoài chỉ kiểm tra sự hiện diện của cookie và chuyển hướng về `/login`, lớp trong xác minh token với Laravel trước khi hiển thị nội dung.
- Sau khi đăng nhập, người dùng chỉ được đưa về đường dẫn nằm trong `/dashboard` hoặc `/academic`. Mọi giá trị `returnTo` khác — URL tuyệt đối, URL bắt đầu bằng `//`, đường dẫn chứa dấu gạch chéo ngược, hoặc đường dẫn ngoài hai khu vực này — đều quay về `/dashboard`.
- Đang có phiên hợp lệ mà mở `/login` thì được chuyển thẳng tới đích hợp lệ; không hiển thị lại biểu mẫu.
- URL không tồn tại hiển thị trang `404` tiếng Việt cùng nút trở về trang chủ hoặc, trong khu vực đã đăng nhập, trang tổng quan. Lỗi render không mong đợi hiển thị nút `Thử lại` thay vì chi tiết lỗi kỹ thuật.

## Hướng dẫn thao tác

### Dùng API trực tiếp

1. Gửi `POST /api/v1/auth/login` với `username`, `password`, và tùy chọn `remember`.
2. Lấy `data.token` từ phản hồi thành công và dùng giá trị đó làm bearer token cho các request tiếp theo.
3. Gửi `GET /api/v1/auth/me` để xem định danh của token hiện tại.
4. Khi không dùng token nữa, gửi `DELETE /api/v1/auth/logout` với cùng header bearer.

### Dùng trên trình duyệt

1. Mở `/login` và nhập tên đăng nhập cùng mật khẩu. Có thể bật `Ghi nhớ đăng nhập` để phiên sống lâu hơn.
2. Nhấn `Đăng nhập`. Thành công sẽ chuyển tới `/dashboard`, hoặc trở lại đúng trang trong khu vực `/dashboard` hay `/academic` mà trước đó đã yêu cầu.
3. Tên đăng nhập và nhãn vai trò hiển thị trong menu tài khoản ở thanh trên. Nhãn vai trò: `0` Quản trị viên, `1` Giáo viên, `2` Nhân viên, `3` Học viên.
4. Chọn `Đăng xuất` trong menu tài khoản để kết thúc phiên.

Các endpoint cùng nguồn mà trình duyệt gọi là `POST /api/auth/login`, `GET /api/auth/session`, và `POST /api/auth/logout`. Đây là endpoint của frontend, **không phải** endpoint Laravel; chúng khác với `/api/v1/auth/*` cả về đường dẫn lẫn phương thức, và chỉ tồn tại để giữ bearer token ở phía server.

## Kết quả mong đợi

- Đăng nhập thành công qua API trả token bearer, thời điểm hết hạn, và thông tin người dùng gồm `id`, `username`, `role`, `is_active` trong envelope `data`.
- `GET /api/v1/auth/me` trả thông tin người dùng hiện tại trong envelope `data`.
- `DELETE /api/v1/auth/logout` trả `204 No Content`; token đã dùng không thể tiếp tục xác thực.
- Đăng nhập thành công trên trình duyệt trả về chỉ `{ "data": { id, username, role, is_active } }` kèm cookie phiên; không có token trong phần thân phản hồi.
- Tải lại `/dashboard` hoặc một trang `/academic/...` vẫn giữ phiên. `document.cookie` không đọc được `vietclass_session`.
- Đăng xuất trên trình duyệt thu hồi đúng một token ở Laravel, xóa cookie, đưa về `/login`, và `/dashboard` lại được bảo vệ.

## Lỗi và trường hợp ngoại lệ

- Username không tồn tại, mật khẩu sai, hoặc người dùng không hoạt động cùng trả `401` với thông điệp `Thông tin đăng nhập không chính xác.`.
- Thiếu hoặc token bearer không hợp lệ khiến endpoint cần xác thực trả `401`.
- Vượt quá 5 lần thử trong một phút trả `429 Too Many Requests` với thông điệp `Quá nhiều yêu cầu. Vui lòng thử lại sau.`.
- Payload đăng nhập không hợp lệ trả lỗi JSON chuẩn của Laravel với `message` và `errors` khi có lỗi từng trường.
- Lỗi hệ thống không dự kiến trả `500` với thông điệp tổng quát và không trả chi tiết exception nội bộ.
- Các lỗi HTTP/framework như `404`, `405` và `403` dùng cùng envelope lỗi JSON của API.

Trên trình duyệt:

- Ô trống hoặc quá dài được báo ngay tại từng trường trước khi có request: `Vui lòng nhập tên đăng nhập.`, `Tên đăng nhập không được vượt quá 50 ký tự.`, `Vui lòng nhập mật khẩu.`, `Mật khẩu không được vượt quá 255 ký tự.`.
- Sai thông tin đăng nhập, `429`, và các lỗi khác hiện trong một vùng thông báo `aria-live`; tên đăng nhập đã nhập được giữ lại.
- Token hết hạn hoặc đã bị thu hồi đưa người dùng về `/login` với thông điệp `Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.`, đồng thời cookie cũ bị xóa nên không tạo vòng lặp chuyển hướng.
- Không gọi được Laravel, hoặc Laravel trả lỗi `5xx`, cho thông điệp `Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại.` kèm hành động thử lại. Sự cố dịch vụ không bao giờ bị trình bày như sai mật khẩu.
- Nếu thu hồi token ở Laravel thất bại khi đăng xuất, phiên cục bộ vẫn được kết thúc và cookie vẫn bị xóa.

Lỗi nghiệp vụ của thao tác đăng nhập được throw dưới dạng `ActionError`, được bắt tại boundary của Action và chuyển thành `ActionResult` thất bại; Controller chỉ chuyển result đó thành response HTTP. Các exception framework hoặc lỗi hệ thống không được Action chuyển thành lỗi nghiệp vụ; chúng được renderer chung của API xử lý.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| API cần `auth:sanctum` | Tiên quyết | Token xác định người dùng của request. | Không có bearer token hợp lệ thì không truy cập được endpoint cần xác thực. |
| [Phân quyền theo chức năng](phan-quyen.md) | Hạ nguồn | Phân quyền chỉ chạy sau khi request đã xác định được người dùng. | Đăng nhập được không có nghĩa là gọi được mọi endpoint; xem tài liệu phân quyền để biết ai được làm gì. |
| Khu vực `/dashboard` và `/academic` | Phụ thuộc | Chỉ phiên đã xác minh mới vào được khu vực đã đăng nhập. | Chưa đăng nhập thì bị đưa về `/login`; đăng nhập xong thì trở lại đúng trang đã yêu cầu. |

## Giới hạn hiện tại

- Chưa có endpoint hay màn hình đăng ký, đổi mật khẩu, đặt lại mật khẩu, làm mới token, hoặc quản trị token. Màn hình `/login` vì vậy không có liên kết đăng ký hay quên mật khẩu.
- Giá trị role được trả về và được hiển thị dưới dạng nhãn. Phân quyền theo role cho từng endpoint được mô tả riêng tại [Phân quyền theo chức năng](phan-quyen.md); tài liệu này chỉ nói về việc xác định danh tính, không nói về việc danh tính đó được làm gì.
- Phiên trình duyệt kết thúc khi cookie hết hạn hoặc khi đăng xuất; không có gia hạn tự động.
- CORS chỉ cho phép origin cấu hình qua `CORS_ALLOWED_ORIGINS` và không hỗ trợ credentialed browser session. Frontend không bị ảnh hưởng vì chỉ gọi Laravel từ phía server.

## Tham chiếu kỹ thuật

- Route module Laravel: `api/app/Modules/Auth/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/AuthenticationTest.php`, `api/tests/Security/AuthenticationSecurityTest.php`
- Schema: `.docs/database.md`
- Module Identity của frontend: `frontend/src/modules/identity/` (`index.ts` cho client, `server.ts` chỉ cho server)
- Endpoint cùng nguồn của frontend: `frontend/app/api/auth/`
- Bảo vệ đường dẫn: `frontend/proxy.ts` và `frontend/app/(protected)/layout.tsx`
