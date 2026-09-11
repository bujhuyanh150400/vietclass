# Môi trường phát triển cục bộ

Tài liệu này ghi lại các dữ kiện hiện tại để chạy được toàn bộ stack trên máy cá
nhân: dịch vụ và cổng, điều kiện tiên quyết trên host, và những lỗi đã thực sự gặp
kèm triệu chứng của chúng. Quy ước hành vi vẫn nằm ở `.agents/rules/`; tài liệu này
chỉ mô tả môi trường.

## 1. Dịch vụ và cổng

| Dịch vụ | Cổng | Nguồn | Ghi chú |
| --- | --- | --- | --- |
| Postgres | `127.0.0.1:5432` | `compose.dev.yml`, `POSTGRES_PORT` | DB `vietclass`, có volume bền |
| Postgres (test) | `127.0.0.1:5434` | `compose.dev.yml` | Chỉ chạy với profile `test`; dữ liệu trên tmpfs |
| Redis | `127.0.0.1:6379` | `compose.dev.yml`, `REDIS_PORT` | |
| Laravel API | `0.0.0.0:8000` | `DEV_API_PORT`, `DEV_BIND_HOST` | `php artisan serve`, chạy trên host chứ không trong container |
| Next.js | `0.0.0.0:3000` | `make dev` | |

Chỉ Postgres và Redis chạy trong Docker. API và frontend chạy trực tiếp trên host,
nên phiên bản PHP và extension của host là một phần điều kiện tiên quyết.

## 2. Điều kiện tiên quyết trên host

### 2.1 Entry `/etc/hosts`

```
127.0.0.1 app.vietclass.test api.vietclass.test
```

App và API cố ý nằm trên hai hostname khác nhau để cookie phiên được thử đúng kiểu
cross-origin như production. Hai hostname phải chung một parent domain, nếu không
cookie hết same-site và `SameSite=Lax` không còn áp dụng. TLD `.test` được RFC 6761
dành riêng cho mục đích này nên không bao giờ đụng DNS thật.

Ba nơi phụ thuộc vào cặp hostname này và phải đổi cùng nhau nếu đổi tên:
`frontend/.env.local` (`APP_ORIGIN`, `NEXT_PUBLIC_API_ORIGIN`, `ALLOWED_ORIGIN`),
`api/.env` (`SESSION_DOMAIN`, `CORS_ALLOWED_ORIGINS`).

Trên Windows + WSL2, entry đặt ở `C:\Windows\System32\drivers\etc\hosts`.

### 2.2 Extension `pdo_pgsql` cho PHP CLI

PHP CLI của host phải có `pdo_pgsql`. Bản PHP mặc định của Ubuntu chỉ có `PDO` mà
không kèm driver Postgres.

```
sudo apt install -y php8.5-pgsql   # thay 8.5 bằng phiên bản PHP CLI đang dùng
php -m | grep pgsql                # phải thấy cả pgsql và pdo_pgsql
```

Extension chỉ nạp lúc process khởi động, nên phải khởi động lại `make dev` sau khi
cài.

## 3. Chạy

```
make dev
```

Rồi mở **`http://app.vietclass.test:3000`** — không phải `localhost:3000`. Cookie
phiên gắn với domain, nên đăng nhập ở `localhost` không mang sang được.

### 3.1 Dữ liệu minh họa cho màn học sinh

`IdentitySeeder` chỉ tạo tài khoản quản trị, nên DB mới sẽ không có học sinh nào và
màn danh sách học sinh đứng ở state "chưa có dữ liệu". Không có dữ liệu thì không
kiểm chứng được bảng, chip `+N`, hay phân trang.

```
cd api && php artisan db:seed --class=StudentDemoSeeder --force
```

Seeder này idempotent — chạy lại không nhân bản. Nó gọi `AcademicSeeder` trước để có
môn học, rồi tạo một giáo viên `gvdemo01`, tám lớp, tám hồ sơ phụ huynh dùng chung,
và 25 học sinh `hsdemo01`–`hsdemo25` với mật khẩu `matkhau123`.

Phân bố được chọn có chủ ý để lộ hết mọi trạng thái của giao diện: số phụ huynh và số
lớp đang học đều trải từ 0 đến 4 (nên có cả chip nét đứt, hai tag, và `+N`),
`hsdemo16` bị khóa tài khoản, và `hsdemo01` có một bản ghi ghi danh đã `left_at` để
chứng minh lớp đã nghỉ **không** lọt vào cột Lớp đang học.

Seeder **không** được đăng ký trong `DatabaseSeeder`, nên `db:seed` mặc định không
sinh dữ liệu minh họa. Phải gọi tường minh bằng `--class`.

## 4. Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| Màn hình báo `Không kết nối được dịch vụ xác thực`; `api/storage/logs/laravel.log` có `could not find driver (Connection: pgsql, …)`; API trả 500 | PHP CLI thiếu `pdo_pgsql` | Mục 2.2, rồi khởi động lại `make dev` |
| Trình duyệt chặn request với lỗi CORS; API luôn trả `Access-Control-Allow-Origin: http://app.vietclass.test:3000` | Đang mở app bằng `localhost:3000` nên origin không khớp allowlist | Thêm entry ở mục 2.1 và mở bằng `app.vietclass.test:3000` |
| `make dev` dừng với `Failed to listen on 0.0.0.0:8000 (reason: Address already in use)` | Một tiến trình hoặc container khác đang giữ cổng 8000 | `ss -ltnp \| grep :8000` để tìm chủ sở hữu rồi dừng nó, hoặc đổi `DEV_API_PORT` cùng với cổng trong `frontend/.env.local` |
| `FATAL: An unexpected Turbopack error occurred`, hoặc HMR lặp `Cell … no longer exists in task …` | Cache tăng dần trong `frontend/.next` đã hỏng | Dừng dev, `rm -rf frontend/.next`, chạy lại. Không có gì trong repo sai; `.next` chỉ là cache và sẽ được dựng lại |
| Một màn danh sách đứng mãi ở khung xương chờ dù Network cho thấy request đã trả lỗi | Module graph của HMR đã lệch sau nhiều vòng sửa file — xem mục 4.1 | Khởi động lại `make dev`. Đừng kết luận là lỗi của màn hình đang sửa trước khi thử trên dev server sạch |

Lỗi cổng 8000 dễ gây hiểu nhầm: nếu thứ đang giữ cổng lại là một container API cũ
thì ứng dụng vẫn chạy được, che mất việc host chưa cấu hình đúng. Khi container đó
biến mất, cả hai lỗi ở hai dòng trên xuất hiện cùng lúc.

**Không chạy `npm run build` khi `next dev` đang chạy.** Cả hai dùng chung thư mục
`.next`. Bản build sẽ dừng ngay với `Another next build process is already running`
vì dev đang giữ `.next/dev/lock`, nhưng trước đó nó đã kịp ghi vào `.next` — đủ để
làm hỏng cache tăng dần của dev server. Triệu chứng không xuất hiện lập tức: dev vẫn
phục vụ request bình thường thêm một lúc rồi HMR mới bắt đầu panic. Muốn build thì
dừng dev trước.

### 4.1 Dev server chạy lâu qua nhiều vòng sửa file thì kết luận không còn tin được

Một dev server đã chạy nhiều giờ trong khi hàng chục file bị viết lại có thể phục vụ
một module graph lệch: giao diện hành xử theo code cũ dù file trên disk đã đúng.

Triệu chứng đã thực sự gặp: một màn danh sách đứng mãi ở khung xương chờ, `aria-busy`
vẫn là `"true"`, không có `[role="alert"]` và không có nút `Thử lại`, **trong khi** tab
Network cho thấy request đã trả `422` và React Query đã ở `status: "error"`. Hai nguồn
sự thật nói ngược nhau chính là dấu hiệu. Sau khi khởi động lại `make dev`, cùng URL
đó hiện state lỗi đúng ngay lần đầu.

Vì vậy: **trước khi ghi một hành vi lạ thành lỗi của sản phẩm, hãy tái hiện nó trên
dev server vừa khởi động lại.** Cái giá của việc bỏ qua bước này là một mục tài liệu
khẳng định sai, và thời gian của người sau bỏ ra đi tìm nguyên nhân không tồn tại.

Cách ép một state lỗi thật để kiểm chứng:

```
http://app.vietclass.test:3000/academic/students?q=<151 ký tự bất kỳ>
```

`q` có luật `max:100` trong `api/app/Core/Http/Requests/Concerns/PaginatesQuery.php`,
nên API trả `422` ngay ở request đầu tiên của lần tải trang. Trên dev server sạch,
màn hình phải hiện panel lỗi kèm nút `Thử lại`.

## 5. Kiểm chứng thay đổi giao diện

- **Trạng thái responsive.** Yêu cầu resize cửa sổ từ công cụ tự động hoá có thể bị
  window manager bỏ qua, khiến ảnh chụp trông đúng kích thước nhưng viewport thì
  không. Cách chắc chắn là nhúng chính ứng dụng vào một iframe same-origin đặt đúng
  bề rộng cần kiểm tra: media query phản ứng theo viewport của iframe, và vì
  same-origin nên cookie phiên vẫn còn, không phải đăng nhập lại.
- **Đối chiếu prototype OpenDesign.** Artifact tham chiếu asset bằng đường dẫn tương
  đối và không mở được qua `file://` từ công cụ duyệt web. Phục vụ thư mục project
  qua HTTP rồi mở bằng `http://` để asset và font tải đúng.
- **Ép state lỗi và state rỗng.** Transport của frontend là **axios**, tức
  `XMLHttpRequest`, **không** phải `fetch` (`src/lib/api/browser-request.ts`). Ghi đè
  `window.fetch` từ console hay từ công cụ tự động hoá **không có tác dụng gì** —
  request vẫn đi bình thường và bạn sẽ tưởng mình chưa chặn được. Đây là cái bẫy đã
  làm mất thời gian nhiều lần. Cách ép lỗi rẻ nhất là gửi tham số không hợp lệ qua
  URL: `?q=` dài hơn 100 ký tự trả `422` (mục 4.1). Muốn chặn ở tầng mạng thì phải
  patch `XMLHttpRequest.prototype.open`, không phải `fetch`.
- **Không tắt API để thử state lỗi.** `make dev` chờ bằng `wait -n` trên cả hai tiến
  trình, nên API thoát sẽ kéo cả frontend xuống theo. Ngoài ra axios không đặt
  `timeout`, nên một API bị treo (`SIGSTOP`) cho ra loading vô hạn chứ không ra lỗi.
- **Hai thẻ `<main>` trong DOM là bình thường.** Bản dựng production có hai
  `.vc-app-content`, nhưng một trong hai nằm trong container streaming Suspense của
  React (`#S:0`, `hidden` + `display:none`) nên không lộ ra accessibility tree. Chỉ
  cần đúng một `<main>` **nhìn thấy được**; kiểm tra bằng `offsetParent` thay vì đếm
  `querySelectorAll('main')`.
