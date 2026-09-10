# VietClasses app shell redesign

Status: Đã triển khai và xác minh
Last Updated: 2026-09-10

## Mục tiêu

Thay app shell đã đăng nhập của VietClasses bằng workspace “teacher's desk / academic
workspace”: ấm, có chất liệu giấy vở và bàn học, nhưng gọn, rõ ràng và hiệu quả cho
công việc quản lý học vụ hằng ngày. Route, dữ liệu, authorization và hành vi nghiệp
vụ hiện hữu không thay đổi.

## Visual contract

- Project OpenDesign: `vietclass-polished-redesign`.
- Artifact đã duyệt: `vietclass-prototype-v2.html`.
- Prototype chỉ là reference cho hierarchy, tỷ lệ, chất liệu và responsive states;
  mã Next.js là source of truth cho behavior và accessibility.
- Chỉ có light mode; Be Vietnam Pro cho UI, Silkscreen chỉ cho wordmark
  `VIETCLASSES`, Geist Mono cho dữ liệu đơn cách; dùng asset brand hiện hữu và Lucide.
- App shell dùng radius `5px` cho control, `8px` cho panel, `10px` cho page sheet;
  divider là notebook-rule nhạt, control edge đậm, solid offset cho control và blur
  chỉ cho sheet/drawer.

## IA và responsive

- `Trang chủ` → `/dashboard`.
- `Học vụ` → `Môn học`, `Phòng học`, `Lớp học`.
- `Người dùng` → `Giáo viên`, `Học sinh`, `Phụ huynh · Sắp có`.
- `Hệ thống` → `Quản lý thư viện` → `/files`.
- Desktop có sidebar mở rộng và icon rail; mobile dùng drawer có overlay, focus trap,
  Escape và nút đóng rõ ràng.
- Header chỉ có trigger sidebar và tiêu đề route hiện tại. Chỉ `.vc-app-content`
  cuộn; không có horizontal scroll ở viewport nhỏ.

## Xác minh

- Frontend lint, TypeScript check và production build bằng Webpack đều đạt.
- API suite đạt `409 tests passed (1270 assertions)`.
- Visual QA dashboard đã kiểm tra ở `1440×900`, `1024×900` và `390×844`, gồm icon
  rail, mobile drawer, trạng thái disabled của `Phụ huynh · Sắp có` và scroll ngang.

## Phạm vi không đổi

Không tạo route/API/màn hình cho `Phụ huynh`, không đưa dữ liệu mẫu của OpenDesign vào
ứng dụng, và không thay đổi query, mutation, authorization, loading, empty, no-result
hay error logic của các màn nghiệp vụ.
