# Buổi học theo ngày

Last Verified: 2026-09-01
Related Task: `.tasks/schedule-phase-3-projection.md`

## Tổng quan

Buổi học là một buổi cụ thể của một lớp vào một ngày cụ thể. Nó không được khai báo tay: hệ thống **suy ra** buổi học từ [lịch cố định theo lớp](lich-co-dinh.md), rồi chỉ ghi lại thành dòng dữ liệu những buổi đã có người chạm vào.

Vì thế xem lịch học không phải là đọc một bảng đã sinh sẵn. Hệ thống nhận khoảng ngày, đi qua từng ngày trong khoảng, và trả về:

- những **buổi đã ghi** — buổi mà ai đó đã vật thể hoá, có `id` riêng;
- cộng những **buổi ảo** — buổi mà lịch cố định chiếu ra ngày đó nhưng chưa ai chạm vào, **không có `id`**.

Người đọc nhìn thấy một danh sách duy nhất, không phải hai loại. Một buổi có `id` hay không chỉ nói lên "đã có người chạm vào chưa", không nói lên buổi đó có thật hay không.

Phase hiện tại chỉ có **đọc lịch** và **vật thể hoá**. Chưa có sửa buổi, huỷ buổi, ghi buổi đã diễn ra, học bù hay buổi tăng cường.

Chức năng hiện chỉ có API quản trị dưới tiền tố `/api/v1`, chưa có màn hình quản trị.

## Người dùng và điều kiện

- Quản trị viên xem lịch của mọi lớp, xem chi tiết mọi buổi, và vật thể hoá buổi ảo.
- Giáo viên xem được lịch theo khoảng ngày và chi tiết buổi học, nhưng **chỉ thấy những buổi có tên mình**, bất kể là giáo viên chính hay trợ giảng, và điều này áp dụng **cả cho buổi ảo**. Vật thể hoá trả `403` với giáo viên.
- Tài khoản giáo viên chưa có hồ sơ thì lịch trả về rỗng, không trả toàn bộ hệ thống.
- Cần bearer token hợp lệ; thiếu token trả `401`.

## Quy tắc nghiệp vụ

### Buổi ảo được chiếu từ đâu

Một lịch cố định chiếu ra buổi ảo vào mọi ngày trong khoảng đọc **khớp `day_of_week`** của nó và **nằm trong cả bốn mốc ngày** sau:

| Mốc | Nguồn | Ý nghĩa |
| --- | --- | --- |
| Ngày bắt đầu áp dụng | `start_date` của lịch cố định | Trước ngày này lịch chưa có hiệu lực. |
| Ngày khai giảng lớp | `start_at` của lớp | Trước ngày này lớp chưa tồn tại. |
| Ngày đóng lịch | `end_date` của lịch cố định | Để trống nghĩa là không có giới hạn ở phía này. |
| Ngày kết thúc lớp | `end_at` của lớp | Để trống nghĩa là không có giới hạn ở phía này. |

Ngày đầu tiên chiếu được là **ngày muộn hơn** giữa hai mốc mở; ngày cuối cùng là **ngày sớm hơn** giữa hai mốc đóng. Hệ quả thực tế: một lịch cố định không đặt `end_date` vẫn dừng khi lớp kết thúc, chứ không chạy vô hạn.

Buổi ảo mang đúng giá trị của lịch cố định: thứ, giờ, phòng, và **danh sách giáo viên** kèm vai trò. Môn học lấy theo môn của lớp.

### Dòng thật luôn thắng buổi ảo

Danh tính của một buổi ảo là cặp `(lịch cố định, ngày)`. Nếu cặp đó đã có buổi đã ghi, buổi ảo bị **loại khỏi kết quả**, không phải trộn vào. Vì vậy một ngày không bao giờ trả về hai buổi cho cùng một lịch cố định, và buổi đã ghi là buổi duy nhất được nhìn thấy.

Luật này không có ngoại lệ, kể cả khi buổi đã ghi ở trạng thái **Đã huỷ**: một buổi bị huỷ vẫn chặn buổi ảo của chính nó, nên huỷ là bỏ buổi chứ không phải trả ngày đó lại cho phép chiếu.

Sau khi vật thể hoá, buổi học **tự nó là nguồn sự thật** về ngày, giờ, phòng và người dạy. Danh sách giáo viên của nó được lấy từ chính nó, không đọc lại từ lịch cố định, và chỉ nó mới ghi được việc **dạy thay**.

### Vật thể hoá một buổi ảo

Buổi ảo không có `id` nên không thao tác ghi nào chỉ định được nó. Muốn ghi thì phải vật thể hoá trước: gửi cặp `(template_id, date)` và nhận về buổi học có `id`.

- Hệ thống **kiểm cặp đó thật sự nằm trong tập chiếu** trước khi ghi. Ngày không khớp thứ, ngày trước khi lịch có hiệu lực, ngày sau khi lớp kết thúc — tất cả bị từ chối. Đây là thứ chặn việc bịa ra một buổi ở ngày mà lớp không hề học.
- Dòng ghi ra **sao chép nguyên vẹn** lịch cố định: lớp, môn của lớp, ngày, giờ, phòng, loại **Lịch chính**, trạng thái **Chưa diễn ra**, `is_customized = true`, và người gọi được ghi vào `created_by`.
- **Danh sách giáo viên được sao chép trọn vẹn**, cả giáo viên chính và trợ giảng, giữ nguyên vai trò. Buổi học và danh sách giáo viên của nó được ghi trong **cùng một giao dịch**: một buổi học không có giáo viên chính là trạng thái không được phép tồn tại dù chỉ trong một khoảnh khắc.
- Nếu lịch cố định không có giáo viên chính thì việc vật thể hoá bị từ chối, không sinh ra buổi không người dạy.
- Thao tác **idempotent**: gọi hai lần trả về **cùng một buổi**, không tạo buổi thứ hai. Hai người gọi cùng lúc cũng vậy.
- Vật thể hoá **không** kiểm trùng phòng hay trùng giáo viên: giá trị ghi ra là giá trị mà một lịch cố định đã được kiểm sẵn chiếu vào ngày nó đã chiếm, nên hỏi lại "chỗ này có trống không" là hỏi lịch có tự trùng với chính nó không.

### Độ rộng khoảng ngày

`from` và `to` đều **bắt buộc**, và khoảng đọc **tính cả hai đầu**.

- `to` không được trước `from` — lỗi định dạng, gắn vào trường `to`.
- Khoảng rộng nhất là **92 ngày**. Rộng hơn trả lỗi nghiệp vụ `SCHEDULE-013`. Giới hạn tồn tại vì phép chiếu đi qua từng ngày trong khoảng, nên một khoảng không giới hạn là một lượng việc không giới hạn được yêu cầu bằng một dòng query string.
- Không có khoảng mặc định. Hệ thống không tự đoán "tuần này" thay người gọi, vì cùng một yêu cầu sẽ mang nghĩa khác nhau ở các ngày khác nhau.

## Hướng dẫn thao tác

Mọi endpoint cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem lịch theo khoảng ngày | `GET /api/v1/schedule-sessions?from=&to=&class_id=&teacher_id=&room_id=` |
| Vật thể hoá một buổi ảo | `POST /api/v1/schedule-sessions/resolve` với `template_id` và `date` |
| Xem chi tiết một buổi đã ghi | `GET /api/v1/schedule-sessions/{instance}` |

- `from`, `to` và `date` nhận định dạng `YYYY-MM-DD`.
- `class_id`, `teacher_id` và `room_id` là bộ lọc tùy chọn của danh sách. `teacher_id` nhận `teacher_profile_id`, và lọc theo người đó ở **cả hai vai trò**.
- `{instance}` chỉ nhận số. **Chỉ buổi đã ghi có địa chỉ này**; buổi ảo được đọc qua danh sách rồi vật thể hoá.

## Kết quả mong đợi

- Danh sách trả envelope `data` là một mảng, **không có `meta` phân trang**: người đọc hỏi một khoảng ngày thì muốn cả khoảng đó, và chia trang sẽ cắt một quyển lịch thành những mảnh vô nghĩa. Độ rộng khoảng là thứ giữ câu trả lời hữu hạn, không phải phân trang.
- Thứ tự cố định theo `date` rồi `start_time`.
- Mỗi buổi trả `id`, `template_id`, `class_id`, `subject_id`, `date`, `start_time`, `end_time`, `room_id`, `schedule_type`, `schedule_type_label`, `status`, `status_label`, `is_customized`, `note`, `teachers`.
- **Buổi ảo trả `id: null`.** Hệ thống không bịa `id` giả. Cặp `template_id` và `date` trả kèm chính là thứ để gọi vật thể hoá, nên người đọc luôn thao tác được với buổi đang xem.
- **Buổi đã ghi trả `id` là số.** Ngoài `id`, hình dạng của hai loại giống nhau hoàn toàn.
- `start_time` và `end_time` trả về dạng `HH:MM`.
- `teachers` là mảng, mỗi phần tử gồm `teacher_profile_id`, `role`, `role_label`, `replaces_profile_id`. `replaces_profile_id` luôn `null` với buổi ảo, vì lịch cố định không biểu diễn được việc dạy thay.
- Vật thể hoá trả `200` cùng buổi học, **cả lần đầu và những lần sau**. Không trả `201`: thao tác idempotent và hệ thống không phân biệt "vừa tạo" với "đã có", nên một mã nói rằng dòng vừa được tạo sẽ sai một nửa số lần.
- Chi tiết buổi học trả `200` với cùng hình dạng của một phần tử trong danh sách, nên một buổi đọc theo `id` giống hệt buổi đó đọc từ lịch.

## Lỗi và trường hợp ngoại lệ

Lỗi định dạng trả `422` và gắn vào đúng trường sai:

- Thiếu `from` hoặc `to` trong danh sách.
- `to` trước `from`: `Ngày kết thúc không được trước ngày bắt đầu.`
- `date` hoặc `template_id` thiếu, hoặc `date` không đúng dạng `YYYY-MM-DD`.

Lỗi nghiệp vụ trả mã và trạng thái sau:

| Mã | HTTP | Trường hợp |
| --- | --- | --- |
| `SCHEDULE-001` | `404` | Không tìm thấy lịch cố định được nêu khi vật thể hoá. |
| `SCHEDULE-004` | `422` | Lịch cố định không có giáo viên chính, nên không vật thể hoá được. |
| `SCHEDULE-013` | `422` | Khoảng ngày rộng hơn 92 ngày. |
| `SCHEDULE-014` | `404` | Không tìm thấy buổi học theo `id`. Cũng là câu trả lời khi giáo viên đọc buổi không có tên mình — nói rằng buổi đó tồn tại nhưng không phải của họ là làm lộ buổi học. |
| `SCHEDULE-015` | `422` | Lịch cố định không chiếu buổi nào vào ngày được yêu cầu. |

Không đủ quyền trả `403`; thiếu token trả `401`.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Lịch cố định theo lớp](lich-co-dinh.md) | Tiên quyết | Mọi buổi học trong phase này đều sinh từ một lịch cố định; thứ, giờ, phòng và danh sách giáo viên của buổi ảo là của lịch. | Lớp chưa có lịch cố định thì lịch học trả về rỗng. |
| [Quản lý lớp học](../academic/lop-hoc.md) | Tiên quyết | Ngày khai giảng và ngày kết thúc lớp là hai trong bốn mốc chặn phép chiếu. | Sau ngày kết thúc lớp, lịch không còn buổi nào dù lịch cố định vẫn mở. |
| [Quản lý phòng học](../academic/phong-hoc.md) | Tiên quyết và hạ nguồn | Buổi học giữ phòng của nó, và phòng còn buổi học trỏ vào thì không xóa được. | Xóa phòng đang có buổi học trả `409`. |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai đọc được lịch và ai vật thể hoá được. | Giáo viên đọc được lịch của mình, vật thể hoá trả `403`. |
| [Quản lý giáo viên](../identity/giao-vien.md) | Tiên quyết | Giáo viên của buổi học được sao chép từ lịch cố định, ở cả hai vai trò. | Giáo viên thấy đúng những buổi có tên mình. |

## Giới hạn hiện tại

- Chưa có đường **sửa, huỷ, ghi đã diễn ra** hay **xóa** buổi học; chưa có **học bù**, **buổi tăng cường** và **danh sách học sinh của buổi**.
- Chưa có đường **đổi giáo viên của một buổi**, nên `replaces_profile_id` chưa có cách nào để được ghi qua API dù dữ liệu đã biểu diễn được.
- Chi tiết buổi học chưa trả **tên** lớp, môn, phòng hay giáo viên, chỉ trả các `id`. Danh sách và chi tiết dùng chung một hình dạng, và danh sách không thể trả tên với chi phí truy vấn cố định.
- Huỷ một buổi ảo sẽ tốn hai lượt gọi khi đường huỷ có mặt: vật thể hoá rồi huỷ. Đây là đánh đổi có chủ đích để mọi đường ghi giữ hình dạng REST thông thường.
- Buổi ảo không có `id` nên không đánh dấu, không ghi chú và không tham chiếu được từ nơi khác cho tới khi được vật thể hoá.
- Khoảng đọc tối đa 92 ngày; muốn xem một năm thì phải gọi bốn lần.
- Chưa có màn hình quản trị cho lịch học.
- Luật "buổi sinh từ lịch cố định phải thuộc một lớp" (`SCHEDULE-016`) đã được cài trong Action nhưng **không có đường nào của ứng dụng đi tới được**, vì `class_id` của lịch cố định là bắt buộc. Sau khi bỏ CHECK constraint, luật này không còn tầng nào cưỡng chế với việc ghi trực tiếp bằng SQL.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Schedule/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/ScheduleProjectionTest.php`, `api/tests/Behavioral/ScheduleSessionTest.php`, `api/tests/Behavioral/ScheduleConflictTest.php`
- Schema: `.docs/database.md`, mục **Schedule**
