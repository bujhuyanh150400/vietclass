# Tên chức năng

Last Verified: YYYY-MM-DD
Related Issue: `.issues/<issue>.md`
Related Task: `.tasks/<task>.md`

> Xóa các dòng `Related` không có tài liệu nguồn. Thay mọi nội dung hướng dẫn bằng hành vi đã được xác minh.

## Tổng quan

Mô tả ngắn chức năng giải quyết nhu cầu gì, giá trị với người dùng và phạm vi mà tài liệu này sở hữu.

## Người dùng và điều kiện

- Người dùng hoặc vai trò có thể sử dụng chức năng.
- Điều kiện tiên quyết, quyền hạn, trạng thái hoặc dữ liệu cần có.

## Quy tắc nghiệp vụ

- Nêu quy tắc dưới dạng điều kiện hoặc kết quả có thể quan sát.
- Chỉ dùng mã quy tắc như `BR-xxx` khi repository đã định nghĩa mã đó.

## Hướng dẫn thao tác

1. Bắt đầu từ trang hoặc trạng thái đã được xác minh.
2. Thực hiện thao tác bằng đúng nhãn điều khiển hiện có.
3. Tiếp tục đến khi người dùng quan sát được kết quả cuối.

## Kết quả mong đợi

- Kết quả hiển thị cho người dùng.
- Thay đổi trạng thái, dữ liệu hoặc quyền truy cập có thể quan sát.

## Lỗi và trường hợp ngoại lệ

- Lỗi validation, quyền hạn, trạng thái không khả dụng hoặc failure đã được xác minh.
- Cách hệ thống phản hồi và điều người dùng có thể làm tiếp theo.

Nếu chưa xác định trường hợp nào, ghi rõ: `Không có lỗi hoặc trường hợp ngoại lệ đã được xác định.`

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| `<Tên hoặc liên kết>` | Tiên quyết / Phụ thuộc / Hạ nguồn / Trạng thái dùng chung | `<Dữ liệu, trạng thái, quyền hoặc khả năng bị ảnh hưởng>` | `<Kết quả quan sát được>` |

Nếu không có quan hệ đã xác minh, thay bảng bằng: `Không có quan hệ nghiệp vụ với chức năng khác đã được xác định.`

## Giới hạn hiện tại

- Nêu giới hạn đã được xác minh; không ghi kế hoạch tương lai như hành vi hiện tại.

Nếu không có giới hạn đã xác minh, ghi rõ: `Không có giới hạn hiện tại đã được xác định.`

## Tham chiếu kỹ thuật

- Public contract: `api/docs/openapi/openapi.yaml`
- Owning module or route: `<path>`
- Deterministic tests: `<path>`
- Related context or feature documentation: `<path>`

Chỉ giữ các tham chiếu ổn định và thực sự liên quan. Không sao chép schema, payload hoặc chi tiết helper riêng tư vào tài liệu chức năng.
