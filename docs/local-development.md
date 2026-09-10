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

## 4. Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| Màn hình báo `Không kết nối được dịch vụ xác thực`; `api/storage/logs/laravel.log` có `could not find driver (Connection: pgsql, …)`; API trả 500 | PHP CLI thiếu `pdo_pgsql` | Mục 2.2, rồi khởi động lại `make dev` |
| Trình duyệt chặn request với lỗi CORS; API luôn trả `Access-Control-Allow-Origin: http://app.vietclass.test:3000` | Đang mở app bằng `localhost:3000` nên origin không khớp allowlist | Thêm entry ở mục 2.1 và mở bằng `app.vietclass.test:3000` |
| `make dev` dừng với `Failed to listen on 0.0.0.0:8000 (reason: Address already in use)` | Một tiến trình hoặc container khác đang giữ cổng 8000 | `ss -ltnp \| grep :8000` để tìm chủ sở hữu rồi dừng nó, hoặc đổi `DEV_API_PORT` cùng với cổng trong `frontend/.env.local` |
| `FATAL: An unexpected Turbopack error occurred`, hoặc HMR lặp `Cell … no longer exists in task …` | Cache tăng dần trong `frontend/.next` đã hỏng | Dừng dev, `rm -rf frontend/.next`, chạy lại. Không có gì trong repo sai; `.next` chỉ là cache và sẽ được dựng lại |

Lỗi cổng 8000 dễ gây hiểu nhầm: nếu thứ đang giữ cổng lại là một container API cũ
thì ứng dụng vẫn chạy được, che mất việc host chưa cấu hình đúng. Khi container đó
biến mất, cả hai lỗi ở hai dòng trên xuất hiện cùng lúc.

**Không chạy `npm run build` khi `next dev` đang chạy.** Cả hai dùng chung thư mục
`.next`. Bản build sẽ dừng ngay với `Another next build process is already running`
vì dev đang giữ `.next/dev/lock`, nhưng trước đó nó đã kịp ghi vào `.next` — đủ để
làm hỏng cache tăng dần của dev server. Triệu chứng không xuất hiện lập tức: dev vẫn
phục vụ request bình thường thêm một lúc rồi HMR mới bắt đầu panic. Muốn build thì
dừng dev trước.

## 5. Kiểm chứng thay đổi giao diện

- **Trạng thái responsive.** Yêu cầu resize cửa sổ từ công cụ tự động hoá có thể bị
  window manager bỏ qua, khiến ảnh chụp trông đúng kích thước nhưng viewport thì
  không. Cách chắc chắn là nhúng chính ứng dụng vào một iframe same-origin đặt đúng
  bề rộng cần kiểm tra: media query phản ứng theo viewport của iframe, và vì
  same-origin nên cookie phiên vẫn còn, không phải đăng nhập lại.
- **Đối chiếu prototype OpenDesign.** Artifact tham chiếu asset bằng đường dẫn tương
  đối và không mở được qua `file://` từ công cụ duyệt web. Phục vụ thư mục project
  qua HTTP rồi mở bằng `http://` để asset và font tải đúng.
- **Hai thẻ `<main>` trong DOM là bình thường.** Bản dựng production có hai
  `.vc-app-content`, nhưng một trong hai nằm trong container streaming Suspense của
  React (`#S:0`, `hidden` + `display:none`) nên không lộ ra accessibility tree. Chỉ
  cần đúng một `<main>` **nhìn thấy được**; kiểm tra bằng `offsetParent` thay vì đếm
  `querySelectorAll('main')`.
