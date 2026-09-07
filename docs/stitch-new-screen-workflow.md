# Quy trình thiết kế màn hình mới với Google Stitch

Last Verified: 2026-09-07

Quy trình chuẩn để thiết kế **một màn hình chưa tồn tại** trong `frontend/` bằng
[Google Stitch](https://stitch.withgoogle.com/), rồi implement bằng kiến trúc
hiện có.

> **Phạm vi.** Chỉ dùng cho màn hình **chưa có**. Màn hình đã có thì dùng
> [`docs/stitch-redesign-workflow.md`](stitch-redesign-workflow.md).

Ba mục dùng chung với luồng redesign, **không lặp lại ở đây**:

| Cần gì | Đọc ở đâu |
| --- | --- |
| Cài Stitch MCP và `stitch-skills` | [`stitch-redesign-workflow.md`](stitch-redesign-workflow.md) §3 |
| Quy tắc implementation cho coding agent | [`stitch-redesign-workflow.md`](stitch-redesign-workflow.md) §5 |
| Checklist review và PR | [`stitch-redesign-workflow.md`](stitch-redesign-workflow.md) §6 |

## 1. Màn hình mới không phải trang trắng

Đây là tiền đề của cả tài liệu. Một màn hình mới trong VietClasses nằm trong app
shell có sẵn, và gần như luôn rơi vào một trong ba hình dạng đã có trong repo:

| Hình dạng | Mỏ neo có sẵn | Component dựng nên nó |
| --- | --- | --- |
| Danh sách | `/academic/students` | `DataTable`, `DataTableToolbar`, `ListToolbar`, `FilterPopover`, `SortPopover`, `ConditionsBar`, `DataTablePagination`, `EmptyState` |
| Form | `/academic/students/new` | `FormShell`, `Field`, `SelectField`, `AsyncSelectField`, `DateField`, lưới hai cột từ breakpoint `sm` |
| Chi tiết | `/academic/students/[studentId]` | vỏ `protected-shell` + `Card` + `BackLink` |

Vì vậy bước "chuẩn bị context" **không** phải là upload một màn hình khác rồi
sửa đè lên nó. Mẫu gần nhất chỉ giúp agent xác định shell, spacing, convention
của toolbar và component sẽ tái dùng; `spec.md` mới là input chính gửi cho Stitch.

Luồng mặc định dùng `generate_screen_from_text` để Stitch tạo một screen mới.
Cách này giữ rõ ranh giới giữa screen tham chiếu và screen đang thiết kế, đồng
thời để design system ở cấp project xử lý token thay vì nhồi chúng vào prompt.

## 2. Rủi ro thật: Stitch phát minh phạm vi

Redesign thì chức năng đã cố định — Stitch chỉ được sắp xếp lại thứ đã có. Màn
hình mới thì nó sẽ vui vẻ thêm trường, thêm filter, thêm tab, thêm thẻ thống kê
và thêm nút hành động mà API không hề có. Nếu không chặn, bước 6 mới phát hiện
một nửa mock không có dữ liệu để hiển thị, và người implement phải tự quyết định
bỏ cái gì — đúng loại quyết định không nên nằm ở bước cuối.

Nên luồng này có một bước **trước khi mở Stitch** mà luồng redesign không cần:
chốt hợp đồng màn hình.

## 3. Vòng lặp sáu bước

### Bước 1 — Chốt hợp đồng màn hình

Viết `frontend/.stitch/references/<route>/spec.md` trước khi mở Stitch. Tối thiểu:

- **Route** và vị trí trong điều hướng.
- **Hình dạng**: danh sách / form / chi tiết (mục 1).
- **Các trường thực có**, lấy từ API — không phải từ tưởng tượng.
- **Hành động được phép** và ai được làm (phân quyền).
- **Trạng thái rỗng, đang tải, lỗi** — ba thứ Stitch hầu như không bao giờ tự vẽ.
- **Ngoài phạm vi**: những gì cố ý không có ở lần này.

Nguồn để suy ra hợp đồng, theo thứ tự ưu tiên:

| Nguồn | Cho biết |
| --- | --- |
| `frontend/src/modules/<module>/api/` + `types/` + `schemas/` | Contract đã có phía frontend, nếu module đã tồn tại |
| `docs/database.md` | Bảng, cột, ràng buộc, quan hệ |
| `docs/documentation/` | Quy tắc nghiệp vụ, người dùng, điều kiện, lỗi |
| Module API tương ứng trong `api/` | Endpoint và payload thật |

`spec.md` là thứ chặn Stitch phát minh ở bước 4, và là thứ bước 6 đối chiếu. Nếu
một mục trong hợp đồng chưa có câu trả lời, dừng lại và hỏi — đừng để Stitch trả
lời hộ.

### Bước 2 — Chọn mẫu cấu trúc

Chọn màn hình cùng hình dạng gần nhất để đọc route, shell và component đang dùng:

| Hình dạng | Mẫu đọc trước |
| --- | --- |
| Danh sách | `/academic/students` |
| Form | `/academic/students/new` |
| Chi tiết | `/academic/students/[studentId]` |

Không cần snapshot hoặc upload mẫu này lên Stitch. Nếu cần ảnh để đối chiếu
spacing trong lúc viết prompt, có thể tạo `anchor.html` cục bộ, nhưng nó không
phải đầu vào bắt buộc và không được dùng làm screen nền để sửa đè.

### Bước 3 — Đưa design system lên Stitch

Chỉ đưa design system lên project; **không upload HTML của màn hình tham chiếu**:

1. `upload_design_md` ← `frontend/.stitch/DESIGN.md`, rồi
   `create_design_system_from_design_md`. Một lần cho cả project; nếu project đã
   có design system thì bỏ qua.

### Bước 4 — Sinh màn hình mới trực tiếp

Dùng `stitch::generate-design` với `generate_screen_from_text`. Prompt phải
mang theo nội dung `spec.md` và mô tả rõ:

- mục đích và người dùng của route;
- cấu trúc trang, shell, vùng nội dung và component cần tái dùng theo mẫu ở bước 2;
- đúng các trường, hành động, trạng thái và phần ngoài phạm vi trong `spec.md`.

Prompt generation chỉ tập trung vào layout, content và structure. Không lặp lại
hex, font, radius hoặc theme trong prompt; các token đó đã nằm trong design system
của project. Không thêm trường, filter, tab, thẻ thống kê hay hành động ngoài
`spec.md`.

Stitch tạo một screen mới, sau đó dùng `edit_screens` trên **screen mới đó** để
tinh chỉnh từng thay đổi nhỏ. Không dùng `edit_screens` trên route mẫu.

### Bước 5 — Chốt thiết kế

Chưa chốt thì chưa code. Khi chốt:

1. Tải ảnh về `frontend/.stitch/references/<route>/approved.png`.
2. Viết `approved.md` theo quy ước ở
   [`frontend/.stitch/references/README.md`](../frontend/.stitch/references/README.md),
   ghi screen ID và các quyết định thiết kế chính.
3. Đối chiếu `approved.png` với `spec.md`. Mọi thứ trong ảnh mà hợp đồng không
   có: hoặc bổ sung vào hợp đồng một cách có ý thức, hoặc ghi vào phần **ngoài
   phạm vi** của `approved.md`. Không để trôi sang bước 6 mà chưa quyết.

### Bước 6 — Implement, review, PR

Theo [`stitch-redesign-workflow.md`](stitch-redesign-workflow.md) §5 và §6, cộng
thêm hai điều riêng của màn hình mới:

- Agent đọc `spec.md` **trước** `approved.png`. Hợp đồng thắng khi ảnh và hợp
  đồng lệch nhau.
- Route mới cần đủ bộ: `page.tsx`, `loading.tsx` nếu màn hình chờ dữ liệu, xử lý
  lỗi qua `RouteErrorState`, trạng thái rỗng qua `EmptyState`, và một mục điều
  hướng trong `AppSidebar`. Mock hiếm khi vẽ ba trạng thái sau — nhưng chúng vẫn
  phải có trong code.

## 4. Ví dụ: `/academic/enrollments`

Ghi danh đã có tài liệu chức năng (`docs/documentation/academic/ghi-danh.md`) và
đã có trong schema, nhưng **chưa có route** trong `frontend/app/(protected)/academic/`.
Đúng dạng màn hình mới.

```text
# Bước 1 — hợp đồng
frontend/.stitch/references/academic-enrollments/spec.md
Nguồn: docs/documentation/academic/ghi-danh.md (quy tắc "đang học", thêm học
sinh vào lớp, sửa ghi danh, chuyển lớp, cho nghỉ lớp, lỗi và ngoại lệ),
docs/database.md, và module academic phía api/ + frontend.
Hình dạng: danh sách.
```

```text
# Bước 2 — mẫu cấu trúc
Đọc /academic/students để giữ shell, toolbar, bảng và phân trang theo convention
hiện có. Không upload route này làm screen nền.

# Bước 3 — đưa design system lên Stitch
upload_design_md + create_design_system_from_design_md   (bỏ qua nếu đã có)

# Bước 4 — sinh màn hình mới (prompt cho agent)
Dùng stitch::generate-design tạo screen mới trong project <PROJECT_ID> cho
màn danh sách ghi danh. Giữ sidebar, topbar, thanh công cụ căn phải, bảng và
phân trang theo convention của /academic/students. Cột, hành động và trạng thái
lấy đúng theo frontend/.stitch/references/academic-enrollments/spec.md. Dùng
tiếng Việt. KHÔNG thêm cột, filter, tab, thẻ thống kê hay nút hành động nào
không có trong spec.md. Không lặp lại token màu/font/theme trong prompt.
```

```text
# Bước 5 — chốt
approved.png + approved.md (ghi screen ID và quyết định thiết kế chính)

# Bước 6 — implement (prompt cho agent)
Implement approved.png thành route /academic/enrollments. Đọc trước spec.md,
approved.md, frontend/.stitch/DESIGN.md, docs/design.md, và mục 5 của
docs/stitch-redesign-workflow.md. Tái dùng DataTable / ListToolbar /
EmptyState của module academic. Thêm mục điều hướng vào AppSidebar.
Spec thắng nếu ảnh và spec lệch nhau.
```

## 5. Trạng thái hiện tại

Chưa chạy thật lần nào. Luồng này dựa trên `generate_screen_from_text` của
Stitch, design system đã upload ở luồng redesign và ba hình dạng màn hình đã
verify trong `frontend/app/(protected)/academic/`. Lượt chạy đầu tiên nên chọn
đúng ví dụ ở mục 4, vì hợp đồng của nó đã có sẵn tài liệu
chức năng.

## 6. Tham chiếu

- Luồng redesign, cài đặt, quy tắc implementation, checklist review:
  [`docs/stitch-redesign-workflow.md`](stitch-redesign-workflow.md)
- Hệ thống thiết kế: [`docs/design.md`](design.md)
- Hợp đồng thiết kế cho Stitch: `frontend/.stitch/DESIGN.md`
- Quy ước reference: [`frontend/.stitch/references/README.md`](../frontend/.stitch/references/README.md)
- Schema: [`docs/database.md`](database.md)
- Tài liệu chức năng: [`docs/documentation/README.md`](documentation/README.md)
