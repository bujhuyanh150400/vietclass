# Stitch references

Nơi lưu vật chứng thị giác của từng màn hình đã đi qua Stitch. Đây **không** phải
mã nguồn: không có gì trong thư mục này được import vào ứng dụng.

Quy trình đầy đủ: [`docs/stitch-redesign-workflow.md`](../../../docs/stitch-redesign-workflow.md)
cho màn hình đã có, [`docs/stitch-new-screen-workflow.md`](../../../docs/stitch-new-screen-workflow.md)
cho màn hình mới.

## Cấu trúc

Một thư mục cho mỗi route, đặt tên theo route và thay `/` bằng `-`:

```text
frontend/.stitch/references/
├── login/                      # màn hình đã có → luồng redesign
│   ├── current.html            # ảnh chụp HTML tĩnh của UI hiện tại (sinh ra, không commit)
│   ├── approved.png            # ảnh màn hình Stitch đã chốt
│   └── approved.md             # ghi chú chốt thiết kế
└── academic-enrollments/       # màn hình mới → luồng new screen
    ├── spec.md                 # hợp đồng màn hình, viết TRƯỚC khi mở Stitch
    ├── approved.png
    └── approved.md
```

`academic-students/` cho `/academic/students`, `academic-classes-new/` cho
`/academic/classes/new`, v.v.

Ba tệp phân biệt hai luồng:

| Tệp | Là gì | Luồng nào |
| --- | --- | --- |
| `current.html` | UI hiện tại của **chính** route đó, bản "before" | redesign |
| `spec.md` | Hợp đồng màn hình: trường thực có, hành động, phân quyền, trạng thái rỗng/lỗi | màn hình mới |

## Quy ước

- `current.html` do `stitch::extract-static-html` sinh ra, thường vài MB vì ảnh
  đã inline base64. `.gitignore` loại mọi `*.html` trong `.stitch/` — chụp lại
  khi cần thay vì commit. Luồng new screen không cần `anchor.html`.
- `spec.md` thì **commit**: nó là quyết định về phạm vi, không phải output sinh
  ra, và bước implement đối chiếu với nó.
- Chỉ commit `approved.png` và `approved.md`, và chỉ sau khi thiết kế được chốt.
  Bản nháp giữa chừng sống trong Stitch, không nằm trong repo.
- `approved.md` tối thiểu phải có: Stitch project ID và screen ID, ngày chốt,
  người chốt, các quyết định thiết kế chính và phần **ngoài phạm vi** — những gì
  Stitch vẽ ra nhưng cố ý không implement. Với redesign, thêm danh sách thay đổi
  so với UI hiện tại.
- Một reference chỉ mô tả *hình*. Hành vi, business rule và API contract vẫn nằm
  ở `docs/documentation/` và mã nguồn.
- Reference cũ không xóa khi màn hình được redesign lần nữa: đổi tên thành
  `approved-<YYYY-MM-DD>.png` để còn dấu vết lịch sử.
