# ListSheet contract cho các màn danh sách VietClasses

Last Reviewed: 2026-09-18

## Mục tiêu

Mọi màn danh sách trong VietClasses dùng cùng một khung làm việc có thể tái sử dụng trong OpenDesign và frontend: một sheet giấy duy nhất, toolbar, conditions bar, vùng dữ liệu và pager. Nội dung miền dữ liệu được thay đổi theo từng module; hình học, thứ tự vùng, trạng thái và hành vi responsive không tự phát minh lại.

## Phạm vi áp dụng

- Học sinh
- Giáo viên
- Lớp học
- Phòng học
- Môn học

Không áp dụng contract này cho form, màn chi tiết, sổ lớp hoặc dashboard.

## Cấu trúc bắt buộc

```text
Page heading
└── ListSheet
    ├── Toolbar
    │   ├── Search
    │   ├── Bộ lọc (popup)
    │   ├── Sắp xếp (popup)
    │   └── Chế độ xem (popup: Bảng / Thẻ)
    ├── Conditions bar (chỉ hiện khi có điều kiện)
    ├── Data region
    │   ├── table trên desktop
    │   ├── card fallback dưới 1024px
    │   └── loading / empty / no-result / error
    └── Pager (tuỳ data region)
```

### Khung giấy

- Chỉ một sheet bao toàn bộ toolbar, conditions, data và pager.
- Các vùng phân tách bằng `1px` rule; không tạo các card rời cho từng vùng.
- Sheet không clip overflow để popup từ toolbar thoát ra được.
- Bảng rộng tự có scroll container; không làm cả trang tràn ngang.
- Dùng geometry VietClasses: radius `5px` cho control, `8px` cho panel/card, border `1px`.

### Toolbar

- Search đứng bên trái trên desktop.
- Khung control dùng chung `assets/list-sheet-controls.css` và `assets/list-sheet-controls.js`: `listSheetToolbar`, `listSheetControl`, `listSheetPopover`, `listSheetSortPopover`, `listSheetViewPopover`. Không sao chép markup/CSS toolbar theo module.
- Bộ lọc, sắp xếp và chế độ xem là button mở popup; không dùng segmented toggle inline. Chỉ field của bộ lọc và tập lựa chọn sắp xếp được thay đổi theo nghiệp vụ.
- Button chế độ xem hiển thị icon của chế độ hiện tại và popup có hai lựa chọn `Bảng` / `Thẻ`, mô tả ngắn và dấu chọn.
- Dưới `1200px`, control có thể rút nhãn thành icon; dưới mobile, toolbar xếp thành các cột vừa khung.
- Khi data region loading hoặc error, search và control liên quan bị disable.

### Data region

- Bảng là mặc định trên desktop.
- Dưới `1024px`, ẩn bảng và hiển thị card dùng cùng dữ liệu; không dùng JavaScript đo viewport.
- Card không được tạo overflow ngang; tên dài được wrap hoặc ellipsis có chủ ý.
- Dữ liệu minh họa phải ghi rõ là minh họa, không bịa tính năng chưa có.

### States

Mỗi màn list phải có đủ bốn state cho data region:

- `loading`: skeleton mô phỏng đúng cấu trúc dữ liệu.
- `empty`: owl waving và hành động tạo bản ghi đầu tiên.
- `no-result`: owl tìm kiếm và hành động xoá điều kiện.
- `error`: owl lỗi, `role="alert"`, thông báo tiếng Việt và nút thử lại.

Toolbar vẫn giữ lại ở empty/no-result/error để người dùng có đường thoát khỏi điều kiện lọc.

### Nội dung và accessibility

- UI và copy tiếng Việt.
- Mỗi control popup có accessible name, `aria-haspopup`, `aria-expanded` và focus-visible rõ ràng.
- Mỗi bảng có caption/aria-label, header scope và cột thao tác có nhãn sr-only.
- Dùng Lucide inline SVG và Be Vietnam Pro; Geist Mono cho ID, mã, ngày và số cố định.

## Nguồn tham chiếu

- OpenDesign canonical design system: `brand-vietclasses-design-system-f6edfd/DESIGN.md`
- Artifact mẫu có thể mở/xem: `list-sheet.html`
- Quy tắc frontend: `docs/design.md`, thành phần runtime `frontend/src/components/shared/data-table/list-sheet.tsx`

OpenDesign chỉ tự nạp `DESIGN.md` của design system vào run. Vì vậy contract cốt lõi phải nằm trong DESIGN.md; artifact `list-sheet.html` là mẫu trực quan để agent và người review đối chiếu, không phải nguồn duy nhất.
