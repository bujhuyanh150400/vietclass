# Phân quyền theo chức năng

Last Verified: 2026-08-27

## Tổng quan

Auth quyết định người dùng nào được gọi endpoint nào. Mỗi module tự khai báo danh sách quyền của mình trong mã nguồn; Auth gom chúng lại, ánh xạ sang vai trò, và cho phép cấp hoặc thu hồi riêng cho từng người dùng. Đây cũng là module giữ luồng đăng nhập/đăng xuất — xem [Xác thực bearer token](authentication.md).

Trước chức năng này, API chỉ phân biệt được đã đăng nhập hay chưa. Mọi người dùng đăng nhập đều gọi được mọi endpoint.

## Người dùng và điều kiện

- Chỉ áp dụng cho endpoint đã gắn quyền. Endpoint xác thực (`/auth/*`) không nằm trong phạm vi này.
- Người gọi phải có bearer token hợp lệ; thiếu token vẫn trả `401` như trước.
- Chưa có giao diện hay endpoint để quản trị viên tự cấp quyền. Việc cấp riêng cho từng người dùng hiện thực hiện trực tiếp trong cơ sở dữ liệu.

## Quy tắc nghiệp vụ

- Quyền hiệu lực của một người dùng bằng: quyền mặc định của vai trò, cộng các quyền được cấp riêng, trừ các quyền bị thu hồi riêng.
- Quyền mặc định theo vai trò được khai báo trong mã nguồn, không nằm trong cơ sở dữ liệu. Đổi quyền mặc định là đổi mã nguồn.
- Bản ghi cấp riêng chỉ chứa ngoại lệ. Không có bản ghi nghĩa là áp dụng đúng mặc định của vai trò.
- Mỗi người dùng có tối đa một bản ghi ngoại lệ cho mỗi quyền.
- Người dùng có `is_active = false` không có bất kỳ quyền nào, kể cả quản trị viên và kể cả khi đã được cấp riêng. Token cấp trước lúc khóa vẫn xác thực được, nên lớp phân quyền phải tự từ chối.
- Quyền chỉ có hiệu lực khi vẫn còn module khai báo nó. Bản ghi còn sót trong danh mục của một module đã gỡ không cấp được gì.
- Danh mục quyền trong cơ sở dữ liệu là bản sao của khai báo trong mã nguồn. Lệnh đồng bộ không bao giờ xóa bản ghi thừa, vì xóa sẽ kéo theo mọi phân quyền riêng gắn với nó.

## Hướng dẫn thao tác

### Đồng bộ danh mục quyền

```bash
cd api && php artisan auth:sync-features
```

Lệnh in số quyền đã đồng bộ. Nếu cơ sở dữ liệu còn quyền không module nào khai báo, lệnh liệt kê chúng kèm cảnh báo và giữ nguyên.

### Khai báo quyền cho một module mới

1. Tạo enum string implement `App\Modules\Auth\Contracts\FeatureEnum`, mỗi case là một mã quyền dạng `<nhóm>.<hành_động>`.
2. Đăng ký enum trong `register()` của provider module: `$this->app->make(FeatureRegistry::class)->register(TênEnum::class);`
3. Gắn quyền lên route: `->middleware(Authorize::using(TênEnum::CaseCầnDùng))`.
4. Chạy `php artisan auth:sync-features`.

## Kết quả mong đợi

- Người dùng có quyền gọi endpoint thành công như bình thường.
- Người dùng không có quyền nhận `403` với thông điệp `Bạn không có quyền thực hiện thao tác này.` trong envelope lỗi chuẩn.
- Không có token nhận `401` với thông điệp `Chưa xác thực.`.
- Thêm một bản ghi cấp riêng có `granted = true` mở ngay quyền đó cho người dùng, không cần triển khai lại mã nguồn.
- Thêm một bản ghi có `granted = false` thu hồi ngay quyền đó, kể cả với quản trị viên.

## Lỗi và trường hợp ngoại lệ

- Ability không thuộc bất kỳ module nào được bỏ qua, rơi xuống phần còn lại của cơ chế Gate. Không có Gate nào khác thì mặc định từ chối.
- Thiếu bản ghi trong danh mục không làm hỏng quyền mặc định theo vai trò, vì mặc định đọc từ mã nguồn. Chỉ là không tạo được ngoại lệ cho quyền đó.
- Đăng ký một lớp không implement `FeatureEnum` làm ứng dụng dừng ngay khi khởi động, kèm thông điệp nêu tên lớp sai.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Xác thực bearer token](authentication.md) | Tiên quyết | Phân quyền chỉ chạy sau khi request đã xác định được người dùng. | Không đăng nhập thì nhận `401` chứ không phải `403`. |
| [Quản lý môn học](../academic/mon-hoc.md) | Hạ nguồn | Mọi endpoint môn học đều gắn quyền. | Không đủ quyền thì không thấy được dữ liệu môn học. |
| [Quản lý giáo viên](../identity/giao-vien.md) | Hạ nguồn | Mọi endpoint giáo viên đều gắn quyền. | Không đủ quyền thì không thấy được hồ sơ giáo viên. |

## Giới hạn hiện tại

- Đợt này chỉ vai trò Quản trị viên có quyền học vụ. Giáo viên, Học viên và Phụ huynh không có quyền nào.
- Không có endpoint hay màn hình để xem và sửa phân quyền. Cấp riêng phải thao tác trực tiếp trong cơ sở dữ liệu.
- API chưa trả danh sách quyền hiệu lực của người dùng. Frontend vì thế ẩn hiện menu Học vụ theo **vai trò** (chỉ Quản trị viên), không theo quyền thật. Ranh giới thật vẫn là `403` từ API; phần ẩn hiện chỉ là mỹ quan. Hệ quả: nếu cấp riêng một quyền Học vụ cho tài khoản không phải Quản trị viên, người đó gọi được API nhưng không thấy menu. Cần bổ sung danh sách quyền vào `GET /auth/me` trước khi dùng phân quyền riêng trên thực tế.
- Chưa có phân quyền theo từng bản ghi. Ai có quyền xem lớp thì xem được mọi lớp.
- Quyền được phân giải một lần cho mỗi request. Thay đổi phân quyền giữa chừng một request không có hiệu lực trong chính request đó.

## Tham chiếu kỹ thuật

- Module: `api/app/Modules/Auth/`
- Khai báo quyền của từng module: `api/app/Modules/Academic/Enums/AcademicFeature.php`, `api/app/Modules/Identity/Enums/IdentityFeature.php`
- Kiểm thử xác định: `api/tests/Behavioral/AuthFeatureResolutionTest.php`, `api/tests/Security/AcademicAuthorizationTest.php`
- Schema: `.docs/database.md`
