# Design System

Last Verified: 2026-09-10

Tài liệu tham chiếu hệ thống thiết kế của frontend (`frontend/`). Mô tả những gì hiện có trong mã nguồn: token, typography, theme mapping, tầng CSS, và các nguyên hàm giao diện dùng chung. Quy tắc hành vi vẫn nằm ở `.agents/rules/`; tài liệu chức năng cho người dùng nằm ở `docs/documentation/`.

## 1. Nguồn sự thật

| Tệp | Sở hữu |
| --- | --- |
| `frontend/src/styles.css` | Điểm nạp toàn cục, khai báo thứ tự import |
| `frontend/src/styles/tokens.css` | Giá trị thô (màu, radius). Không selector, không style |
| `frontend/src/styles/theme.css` | Ánh xạ token sang utility của Tailwind (`@theme inline`) + khai báo variant |
| `frontend/src/styles/base.css` | Mặc định cấp phần tử (`@layer base`) |
| `frontend/app/layout.tsx` | Nạp font, `lang="vi"`, nền và chữ mặc định của `body` |
| `frontend/components.json` | Cấu hình shadcn/ui: style `new-york`, base color `zinc`, icon `lucide` |

Thứ tự nạp trong `styles.css` là bắt buộc: `tailwindcss` → `tw-animate-css` → tokens → theme → base.

## 2. Design token

Toàn bộ token khai báo trên `:root` trong `tokens.css`.

### 2.1 Bảng màu thương hiệu

Lấy mẫu từ artwork pixel-art của linh vật (`public/images/character-panel-login.webp`); cam `#fd7110` là màu chủ đạo neo cả hệ thống.

| Token | Giá trị | Vai trò |
| --- | --- | --- |
| `--vc-orange` | `#fd7110` | Màu thương hiệu chính |
| `--vc-orange-deep` | `#d8500a` | Trạng thái focus / nhấn sâu |
| `--vc-gold` | `#fd9e01` | Điểm nhấn ấm |
| `--vc-ink` | `#1b1614` | Mực đen nâu: chữ, viền cứng, nền mặt bàn |
| `--vc-paper` | `#fdf5e8` | Giấy vở |
| `--vc-wood` | `#78310a` | Gỗ bàn học |
| `--vc-ember` | `#d62b0c` | Cảnh báo / hủy |
| `--vc-leaf` | `#2e7d55` | Thành công |

### 2.2 Vai trò bề mặt

Đặt tên tách khỏi màu thô để đổi mục tiêu mà không phải sửa mọi nơi tiêu thụ.

`--vc-surface` (= `--vc-paper`), `--vc-surface-raised` `#fffdf7`, `--vc-line` (= `--vc-ink`), `--vc-text` (= `--vc-ink`), `--vc-text-muted` `#7a5a45`, `--vc-grid-minor`, `--vc-grid-major`, `--vc-hole`.

### 2.3 Token ngữ nghĩa (hợp đồng shadcn/ui)

`--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--border`, `--input`, `--ring`.

Các token trung tính dùng thang `oklch` của base color `zinc`. Các token mang thương hiệu trỏ thẳng vào bảng màu: `--primary` → `--vc-orange`, `--destructive` → `--vc-ember`, `--success` → `--vc-leaf`, `--ring` → `--vc-orange-deep`.

`--success` / `--success-foreground` là phần mở rộng ngoài bộ mặc định của shadcn/ui.

### 2.4 Token sidebar

`--sidebar` = `--vc-paper`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent` = `--vc-shell-tint`, `--sidebar-accent-foreground`, `--sidebar-border` = `--vc-shell-rule`, `--sidebar-ring`.

Vỏ ứng dụng tái dùng chất liệu giấy của màn đăng nhập: sidebar là tờ giấy kẻ dòng, khung nội dung inset là trang trắng đặt trên đó. Sidebar xám trung tính sẽ lạnh khi đứng cạnh cam thương hiệu.

Sidebar và page sheet dùng chung đúng một nền giấy nên chúng đọc như một tập tài liệu; phân tách giữa hai lớp là bóng đổ của sidebar, không phải màu nền khác nhau.

### 2.5 Bo góc

Chỉ một token gốc: `--radius: 0.625rem`. `theme.css` dẫn xuất ra `--radius-sm` (−4px), `--radius-md` (−2px), `--radius-lg` (= gốc), `--radius-xl` (+4px).

App shell dùng bộ token có phạm vi riêng, không thay đổi radius toàn cục của các màn
hình tính năng: `--vc-shell-radius-control` `5px`,
`--vc-shell-radius-panel` `8px`, `--vc-shell-radius-sheet` `10px`.
Divider dùng `--vc-shell-rule`; control tương tác dùng
`--vc-shell-control-border`; nền hover dùng `--vc-shell-tint`; chữ phụ trong shell
dùng `--vc-shell-muted`.

Chất liệu và hình học còn lại của shell cũng là token có phạm vi riêng:
`--vc-shell-rule-ink` và `--vc-shell-rule-pitch` `22px` vẽ dòng kẻ trên tờ sidebar;
`--vc-shell-topbar-height` `64px`, `--vc-shell-topbar-inset` `31px` và
`--vc-shell-content-max` `1550px` định khung page sheet.

Bóng đổ chia làm hai vai trò. Solid offset dành cho control và hàng điều hướng đang
chọn (`--vc-shell-shadow-control` `0 2px 0`, `--vc-shell-shadow-raised` `0 3px 0`),
đọc như giấy bìa được ấn xuống. Blur chỉ dành cho bề mặt thực sự nổi:
`--vc-shell-shadow-sheet`, `--vc-shell-shadow-sidebar`, `--vc-shell-shadow-drawer`.

### 2.6 Chưa có token riêng

Spacing, thang typography, shadow và motion **không** có token riêng — vẫn dùng thang mặc định của Tailwind v4.

## 3. Typography

Ba font, nạp qua `next/font/google` trong `app/layout.tsx`, phơi ra dưới dạng biến CSS và đăng ký trong `theme.css`.

| Biến | Font | Utility | Phạm vi |
| --- | --- | --- | --- |
| `--font-be-vietnam-pro` | Be Vietnam Pro (400–800, subset `latin` + `vietnamese`) | `font-sans` | Toàn bộ giao diện |
| `--font-silkscreen` | Silkscreen (400, 700, subset `latin`) | `font-pixel` | Chỉ wordmark |
| `--font-geist-mono` | Geist Mono | `font-mono` | Nội dung đơn cách |

Quy tắc:

- Toàn bộ giao diện viết bằng tiếng Việt, nên font chữ chính phải mang đủ bộ dấu: Be Vietnam Pro giữ dấu thanh chồng không bị cắt hay lệch khỏi nguyên âm.
- Silkscreen **không có** dấu tiếng Việt. Vì vậy nó bị giới hạn ở tên thương hiệu thuần Latin (`VIETCLASSES`) và không bao giờ chạm vào nội dung giao diện.
- `<html>` mang `antialiased`; `display: "swap"` cho các font khai báo nó.

## 4. Theme mapping

`theme.css` là cổng duy nhất biến token thành utility. **Thêm token vào `tokens.css` chưa sinh ra utility** — nó chỉ trở thành utility sau khi đăng ký trong khối `@theme inline`.

Đã đăng ký: toàn bộ token ngữ nghĩa và sidebar dưới dạng `--color-*`, thang radius, ba họ font, cùng các màu thương hiệu `--color-vc-orange`, `--color-vc-orange-deep`, `--color-vc-gold`, `--color-vc-ink`, `--color-vc-paper`, `--color-vc-wood`, `--color-vc-ember`, `--color-vc-leaf`, `--color-vc-surface`, `--color-vc-surface-raised`, `--color-vc-line`, `--color-vc-text`, `--color-vc-text-muted`.

## 5. Chế độ sáng duy nhất

Ứng dụng chỉ có theme sáng: không có nút chuyển, và chế độ tối cố ý không được cung cấp.

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Variant `dark` bị buộc vào lớp tổ tiên `.dark` không bao giờ được gắn ở đâu, nên nó bất hoạt thay vì bám theo thiết lập của hệ điều hành. Mọi utility `dark:` còn sót trong nguyên hàm shadcn/ui là no-op, không phải theme thứ hai phải bảo trì. `:root` khai `color-scheme: light`.

## 6. Tầng CSS và CSS theo tính năng

`base.css` chỉ đặt hai mặc định: mọi phần tử nhận `border-border outline-ring/50`, `body` nhận `bg-background text-foreground`.

CSS của một tính năng **không** được import vào `styles.css`. Nó sống cạnh module và được import bởi chính view cần nó, để Next tách bundle và các route khác không tải về:

| Stylesheet | Được import bởi |
| --- | --- |
| `src/modules/identity/styles/login.css` | `src/modules/identity/components/login-view.tsx` |
| `src/modules/files/styles/filepond.css` | `src/modules/files/components/filepond-client.tsx` |
| `src/components/layouts/app-shell.css` | `src/components/layouts/protected-shell.tsx` |

Cách này vẫn đúng vì cascade layer là toàn cục theo tài liệu: `styles.css` khai báo thứ tự tầng, còn một khối `@layer components` nạp riêng vẫn được xếp vào đúng tầng đó, nằm dưới mọi utility. Vì vậy CSS tính năng luôn bọc trong `@layer components`.

## 7. Ngôn ngữ thị giác màn đăng nhập

`login.css` dựng màn đăng nhập từ hai chất liệu artwork linh vật đã cho thấy: mặt bàn gỗ tối và tờ "vở ô ly".

| Class | Vai trò |
| --- | --- |
| `.vc-desk` | Nền mực với hai gradient tỏa: đèn ấm phía trên, gỗ phía dưới |
| `.vc-paper` | Giấy ô ly: ô 22px, kẻ đậm mỗi 5 ô (110px) |
| `.vc-binding` | Gáy vở và lỗ đục dọc mép trong, chỉ từ breakpoint `64rem` |
| `.vc-field` | Khối sprite: viền cứng 2px, radius 3px, đổ bóng đặc 3px không nhòe; đọc `data-invalid="true"` |
| `.vc-key` | Nút bấm vật lý: lún vào bóng của chính nó khi hover/active, chuyển theo `steps()` |
| `.vc-pixels` | `image-rendering: pixelated` |
| `.vc-rise` / `.vc-hop` | Hiệu ứng vào màn; `.vc-hop` chạy bằng `steps(4, end)` để chuyển động đúng độ phân giải của artwork |
| `.vc-delay-1..3` | Trễ 60ms / 140ms / 220ms cho chuỗi vào của cột đăng nhập |

Toàn bộ hiệu ứng bị tắt dưới `prefers-reduced-motion: reduce`; `.vc-key` chỉ giữ lại chuyển màu nền.

## 8. Bố cục vỏ ứng dụng

| Vùng | Nguồn | Quy ước |
| --- | --- | --- |
| Vỏ đã đăng nhập | `components/layouts/protected-shell.tsx` | `SidebarProvider` + `AppSidebar` + `SidebarInset`; sidebar mở rộng `14.75rem`, icon rail `4.875rem`, drawer mobile tối đa `min(19.5rem, 88vw)` |
| IA điều hướng | `components/layouts/navigation.ts` | `Trang chủ`; nhóm `Học vụ` gồm Môn học, Phòng học, Lớp học; nhóm `Người dùng` gồm Giáo viên, Học sinh, Phụ huynh · Sắp có; nhóm `Hệ thống` gồm Quản lý thư viện |
| Nội dung | `components/layouts/protected-shell.tsx` + `app-shell.css` | `<main class="vc-app-content">` là vùng cuộn duy nhất; shell cao `100svh` và ẩn overflow bên ngoài |
| Page sheet | `app-shell.css` | Desktop inset `14px 14px 14px 12px` và radius `10px`, nền `--vc-surface-raised`; vùng cuộn giới hạn `1550px` và canh giữa để dòng không dài quá tầm quét; từ mobile bỏ inset/radius ngoài để ưu tiên chiều rộng |
| Topbar | `components/layouts/app-header.tsx` | `64px` (mobile `60px`), thụt trái `31px` để đường kẻ bắt đầu ở mép vùng viết; chỉ chứa `SidebarTrigger` (`44px`, viền control, solid offset shadow) và tiêu đề trang `15px/600` suy ra từ pathname |
| Chất liệu sidebar | `app-shell.css` | Tờ giấy kẻ dòng ngang mỗi `22px` (không phải giấy ô ly) kèm gáy lò xo trang trí ở mép phải; hàng thương hiệu có caption `Không gian quản lý lớp học` và một đường kẻ phía dưới |
| Hàng điều hướng | `app-shell.css` | Cao tối thiểu `44px`, icon `18px`; hàng đang chọn là nền cam đặc `--vc-orange` + viền `--vc-wood` + solid offset `0 3px 0` và một chevron ở cuối hàng; hover chỉ đổi màu, không đổi kích thước |
| Geometry app shell | `tokens.css` + `app-shell.css` | Control `5px`, panel `8px`, page sheet `10px`; viền control đậm hơn divider; control có solid offset focus/press shadow, blur chỉ dành cho page sheet/drawer |
| Vỏ chưa đăng nhập | `app/(auth)/layout.tsx` | `flex min-h-svh grow flex-col` |

Chiều rộng sidebar hẹp dần theo breakpoint: `14.75rem` mặc định, `13.5rem` ở
`1024–1199px`, `13rem` ở `768–1023px`. Primitive đặt chiều rộng bằng inline style nên
mỗi giá trị đọc qua một biến (`--vc-shell-sidebar-width`) để CSS còn ghi đè được theo
media query.

Trạng thái mở/thu của sidebar lưu ở cookie `sidebar_state` và được đọc phía server để tránh nhảy layout. Rail giữ nguyên quy tắc cookie ở mọi breakpoint desktop và tablet; không có breakpoint nào ép rail thu gọn.

Thương hiệu, điều hướng và menu tài khoản đều nằm trong sidebar; topbar cố ý để trống để không lặp lại. Desktop có icon rail với tooltip; mobile dùng Radix Sheet với overlay, focus trap, Escape và nút `Đóng điều hướng`. Các màn nghiệp vụ giữ nguyên route, dữ liệu và state loading/empty/no-result/error.

## 9. Thang khoảng cách trong màn hình

Không có token riêng, nhưng các màn hình dùng nhất quán:

| Ngữ cảnh | Lớp |
| --- | --- |
| Vùng cấp trang của một màn danh sách | `grid gap-6` |
| Form (`components/shared/form-shell.tsx`) | `grid gap-6`, thân Card `grid gap-5 sm:grid-cols-2` |
| Một trường (`components/shared/field.tsx`) | `grid gap-1.5`, hint và lỗi `text-xs` |
| Hàng nút của form | `flex items-center gap-3` |
| Toolbar danh sách | `flex flex-wrap items-center justify-end gap-2`, ô tìm kiếm `h-8 text-xs`, `w-full sm:w-64` |
| Empty state trong danh sách | `grid justify-items-center gap-3 px-6 py-10 text-center` |

## 10. Thư viện thành phần

### 10.1 Nguyên hàm (`src/components/ui/`)

shadcn/ui style `new-york` trên `radix-ui`, icon `lucide-react`, biến thể bằng `class-variance-authority`, gộp lớp bằng `cn()` (`clsx` + `tailwind-merge`).

`alert`, `alert-dialog`, `avatar`, `badge`, `button`, `calendar`, `card`, `checkbox`, `command`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `pagination`, `popover`, `progress`, `radio-group`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `switch`, `table`, `tabs`, `textarea`, `toast`, `tooltip`.

`Button` mở rộng bộ size mặc định của shadcn: ngoài `default`, `sm`, `lg`, `icon` còn có `xs`, `icon-xs`, `icon-sm`, `icon-lg`. Biến thể: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.

### 10.2 Thành phần dùng chung (`src/components/shared/`)

Nhóm dữ liệu (`shared/data-table/`): `DataTable`, `DataTableToolbar`, `DataTablePagination`, `ListToolbar`, `FilterPopover` + `FilterSection`, `SortPopover`, `ViewPopover`, `ConditionTag` + `ConditionsBar`, `EmptyState`.

Nhóm form: `Field` + `fieldAria`, `FormShell`, `SelectField`, `AsyncSelectField`, `DateField`, `TimeField`.

Nhóm trạng thái màn hình: `LoadingState`, `RouteLoadingState`, `NotFoundState`, `RouteErrorState`, `AppShellSkeleton`, `AuthServiceUnavailable`, `ResourceLoader`.

Khác: `BrandMark` / `BrandIcon`, `BackLink`, `ConfirmActionDialog`, `ToastProvider`, `AppProviders`.

Ranh giới: `EmptyState` dành cho ô bảng hoặc lưới, không phải toàn trang — bản toàn trang là `NotFoundState` và `RouteErrorState`.

## 11. Thương hiệu và hình ảnh

- `BrandIcon` dùng `public/images/brand-mark.png`, bản đã cắt viền của bộ icon trong `public/app-icons/`. Bộ icon launcher mang ~20% đệm trong suốt để vừa mask nền tảng; ở 24px phần đệm đó chiếm một phần năm khung nên phải dùng bản cắt.
- Mark **không** được lấy mẫu pixel: `image-rendering: pixelated` chỉ giúp khi phóng to pixel art; ở đây ảnh bị thu nhỏ mạnh, nearest-neighbour sẽ làm rơi pixel và vỡ hình.
- `BrandMark` nhận `tone`: `"desk"` cho cột nền tối (`text-vc-paper`), `"paper"` cho nền sáng (`text-vc-text`). Wordmark đặt ở `font-pixel text-[0.8rem] leading-none tracking-[0.06em]`.
- `BrandMark` nhận thêm `caption` tùy chọn, đặt ngay dưới wordmark. Chỉ sidebar dùng nó; màn đăng nhập đã tự giới thiệu sản phẩm bằng headline riêng. Caption phải quay về `--font-sans` vì font pixel không có dấu tiếng Việt.
- Kích thước do bên gọi quyết định, vì rail sidebar thu hẹp hơn header màn đăng nhập.
- Ảnh minh họa trạng thái rỗng: `public/images/empty_1.png` (chưa có dữ liệu nào) và `empty_2.png` (bộ lọc không khớp).
- Hoạt hình chờ: `public/animations/vietclass-owl-reading-thinking-loop.lottie` qua `@lottiefiles/dotlottie-react`.

Ảnh đại diện người dùng có tài liệu riêng: [`docs/documentation/identity/avatar.md`](documentation/identity/avatar.md).

## 12. Chuyển động

- Thư viện: `motion` (dùng trong `LoadingState`), `tw-animate-css` cho animation tiện ích.
- Mọi chuyển động phải có nhánh `prefers-reduced-motion`. `LoadingState` bỏ qua Motion hoàn toàn dưới thiết lập này: ngoài việc tôn trọng lựa chọn của người dùng, exit của `AnimatePresence` không bao giờ resolve khi Motion tắt animation cho thiết lập đó, và overlay sẽ kẹt lại trên màn hình.
- Hằng thời lượng của `LoadingState`: hiện tối thiểu 1200ms, giữ ở 100% thêm 350ms, nhịp tiến 200ms, fade 0.25s. Thanh tiến trình tiệm cận 90% và không chạm tới, để tác vụ chậm không trông như đang treo ở một con số tròn đáng ngờ.

## 13. Khả năng tiếp cận

- Hợp đồng trường nhập do `Field` và `fieldAria` thiết lập: thông báo lỗi mang id ổn định `${name}-error`, hint mang `${name}-hint`, control trỏ tới bằng `aria-describedby` và mang `aria-invalid`.
- Thông báo lỗi cấp form trong `FormShell` dùng `aria-live="polite"` để trình đọc màn hình nhận được mà không cắt ngang.
- Icon trang trí luôn mang `aria-hidden="true"`; nút chỉ có icon phải có `aria-label`.
- Focus dùng token `--ring`; `base.css` đặt `outline-ring/50` cho mọi phần tử.
- Ảnh trang trí (mascot, empty state, brand mark) không mang alt text riêng — chữ bên cạnh đã nói điều cần nói.

## 14. Giới hạn hiện tại

- Không có token spacing, thang typography, shadow hay motion. Bổ sung khi có nhu cầu thực sự lệch khỏi thang mặc định của Tailwind.
- Không có chế độ tối, và variant `dark` bất hoạt theo thiết kế.
- Khối chú thích đầu `frontend/src/modules/identity/styles/login.css` nói rằng nó vào bundle qua `@import` trong `src/styles.css`. Điều đó không còn đúng: `styles.css` không import nó, và nó được `login-view.tsx` import. Chú thích cần sửa; mục 6 mô tả hành vi hiện tại đã xác minh.

## 15. Tham chiếu

- Nguyên hàm: `frontend/src/components/ui/`
- Thành phần dùng chung: `frontend/src/components/shared/`
- Vỏ ứng dụng: `frontend/src/components/layouts/`
- Cấu hình shadcn/ui: `frontend/components.json`
- Tài liệu chức năng: `docs/documentation/README.md`
