# Quản lý học sinh

Last Verified: 2026-09-11

## Tổng quan

Hồ sơ học sinh và tài khoản đăng nhập của học sinh được quản lý cùng nhau: tạo hồ sơ là tạo luôn tài khoản. Hồ sơ học sinh phải tồn tại trước khi ghi danh vào lớp.

Chức năng dùng được cả qua API lẫn màn hình quản trị tại `/academic/students` (mục **Học sinh** trong nhóm Người dùng ở thanh bên).

## Người dùng và điều kiện

- Chỉ vai trò Quản trị viên. Các vai trò khác nhận `403`.
- Cần bearer token hợp lệ.

## Quy tắc nghiệp vụ

- Tạo hồ sơ học sinh tạo đồng thời một bản ghi tài khoản với vai trò Học viên, trong cùng một transaction. Thất bại ở bất kỳ bước nào không để lại tài khoản mồ côi hay hồ sơ mồ côi.
- Tên đăng nhập là duy nhất trong toàn hệ thống và **không đổi được** sau khi tạo.
- Mật khẩu tối thiểu 8 ký tự, được lưu dưới dạng hash và không bao giờ xuất hiện trong phản hồi.
- Họ tên, giới tính và khối lớp của học sinh là bắt buộc. Số điện thoại, ngày sinh, địa chỉ và ghi chú của học sinh đều không bắt buộc.
- Học sinh **không có** trường email. Hồ sơ nhân thân có cột email nhưng đường tạo và sửa học sinh không nhận và không trả về nó.
- Ngày sinh, nếu có, phải trước ngày hôm nay.
- Một học sinh liên kết được **nhiều phụ huynh hoặc người giám hộ**, và một người cũng theo dõi được nhiều học sinh. Cả tạo và sửa đều nhận danh sách đó qua khóa `guardians`, tối đa 10 người.
- Mỗi phần tử của `guardians` là **một trong hai dạng**, hệ thống phân biệt bằng những khóa có trong phần tử chứ không bằng một cờ chế độ riêng:
  - **Người có sẵn** — gửi `guardian_profile_id`. Hồ sơ được chỉ định được dùng đúng như vậy, không suy lại từ tên. Dạng này **cấm** gửi kèm `name`: gửi cả hai làm cho ý định "ghi đè hồ sơ có sẵn hay không" trở nên nhập nhằng.
  - **Người mới** — gửi `name` kèm `gender`; `phone` tùy chọn.
- `relationship` là **bắt buộc ở cả hai dạng**: một liên kết không nói người đó là ai với học sinh thì không ghi lại được điều gì có ích.
- `is_primary` đánh dấu người liên hệ chính. Nhiều nhất **một** phần tử được mang cờ này; không phần tử nào mang thì hệ thống lấy phần tử đầu tiên. Một học sinh đã có người liên kết thì luôn có người liên hệ chính — ràng buộc này do một partial unique index trên bảng bảo đảm, không phải do mã ứng dụng.
- Cùng một `guardian_profile_id` không được xuất hiện hai lần trong một danh sách.
- Hồ sơ được chỉ định bằng `guardian_profile_id` phải là hồ sơ **không mang vai trò học sinh**, và không được là chính học sinh đang sửa. Một học sinh không bao giờ được làm phụ huynh của học sinh khác.
- Với dạng **người mới**: nếu số điện thoại **và** họ tên trùng với một hồ sơ đã có trong hệ thống, hồ sơ đó được dùng lại thay vì tạo mới; không có số điện thoại thì luôn tạo một hồ sơ mới. Nhờ vậy, hai anh chị em ruột được nhập từ hai lần tạo học sinh riêng biệt tự động dùng chung một hồ sơ phụ huynh. Cấp tài khoản đăng nhập cho phụ huynh sau này chỉ là một lần cập nhật hồ sơ đó, không cần chuyển đổi dữ liệu.
- Sửa hồ sơ đọc `guardians` là **danh sách đầy đủ**: ai không có trong danh sách sẽ bị gỡ liên kết. Thêm người, gỡ người và đổi người liên hệ chính vì thế đều là cùng một thao tác gửi danh sách mong muốn, không cần endpoint riêng cho từng việc.
- **Không gửi khóa `guardians`** thì mọi liên kết hiện tại được giữ nguyên — đây là điều kiện để một màn hình chỉ sửa thông tin hồ sơ mà không hiển thị phụ huynh vẫn lưu được. Gửi **mảng rỗng** là chuyện khác: nó nói "không còn ai" và gỡ hết.
- Gỡ liên kết **không xóa hồ sơ người đó**: họ có thể vẫn là phụ huynh của một học sinh khác.
- Sửa hồ sơ **không bao giờ sửa hồ sơ nhân thân của phụ huynh**. Sửa tên hay số điện thoại của một người là thay đổi về người đó, không phải về liên kết của học sinh này với họ; nhờ vậy chỉnh danh sách của một anh/chị/em không còn khả năng làm hỏng dữ liệu của người kia.
- Tìm phụ huynh có sẵn dùng endpoint riêng `GET /guardians/options`, chỉ trả về những hồ sơ **đang là phụ huynh của ai đó**: liệt kê mọi hồ sơ không mang vai trò học sinh sẽ đưa cả danh bạ giáo viên vào một ô chọn phụ huynh. Hồ sơ mang vai trò học sinh bị loại. Kết quả sắp theo họ tên và mang theo số điện thoại, vì hai phụ huynh trùng tên là chuyện thường và số điện thoại là thứ phân biệt được họ.
- Tìm phụ huynh **bỏ qua dấu tiếng Việt và không phân biệt hoa thường**: gõ `Hung` ra `Nguyễn Văn Hùng`, gõ `Do Thi Uoc` ra `Đỗ Thị Ước`. Gõ có dấu vẫn tìm được như thường. Điều này **khác** quy tắc dùng lại hồ sơ phụ huynh theo SĐT và họ tên khi nhập tay — quy tắc đó vẫn so khớp **chính xác**, vì nó tự quyết định hai bản ghi có phải cùng một người hay không, còn ô tìm chỉ đưa ra ứng viên để người dùng chọn.
- Số điện thoại học sinh và phụ huynh, nếu có, phải bắt đầu bằng `0` và có 10 hoặc 11 chữ số. Không số nào trong hai số này cần duy nhất — hồ sơ giáo viên, học sinh và phụ huynh dùng chung một bảng nhân thân, và anh chị em ruột thường dùng chung số của phụ huynh.
- Trạng thái học tập gồm `0` Đang học, `1` Tạm nghỉ, `2` Dừng hẳn. Mặc định khi tạo là Đang học. Trường này sửa được trong biểu mẫu hồ sơ, nhưng **màn danh sách không hiển thị và không lọc theo nó** — xem mục "Màn danh sách học sinh".
- Trạng thái học tập và trạng thái tài khoản là hai thứ khác nhau: khóa tài khoản chỉ chặn đăng nhập, không đổi việc học sinh đang học hay đã nghỉ.
- Một học sinh có thể có nhiều phụ huynh, và danh sách trả về tất cả, người liên hệ chính đứng đầu. Biểu mẫu tạo và sửa hồ sơ đều ghi được cả danh sách đó.
- Danh sách cũng trả về các lớp học sinh **đang** theo học. Lớp đã nghỉ không xuất hiện: quy tắc "còn đang học" dùng đúng định nghĩa chung của ghi danh, xem [Ghi danh vào lớp](../academic/ghi-danh.md).
- Không có thao tác xóa học sinh. Ngừng theo học bằng cách đổi trạng thái học tập hoặc khóa tài khoản; hồ sơ luôn được giữ để lịch sử ghi danh trỏ tới nó không bị hỏng.
- Đổi mật khẩu không thu hồi các token đang có.
- Hồ sơ học sinh có ảnh đại diện riêng. Tạo học sinh gửi ảnh kèm trong cùng một yêu cầu; sửa hồ sơ ghi ảnh bằng endpoint riêng của nó nhưng vẫn nằm trong cùng nút **Lưu thay đổi** của tờ hồ sơ, xem [Ảnh đại diện hồ sơ](avatar.md). Ảnh được ghi **sau** khi các trường hồ sơ được chấp nhận, nên một trường bị từ chối không làm đổi ảnh.

## Hướng dẫn thao tác

Mọi endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách | `GET /students` |
| Tạo, không có phụ huynh | `POST /students` với `username`, `password`, `full_name`, `gender`, `grade_level` |
| Tạo, kèm phụ huynh | thêm `guardians` — mỗi phần tử là `guardian_profile_id` (người có sẵn) hoặc `name` + `gender` (người mới), kèm `relationship` |
| Tìm phụ huynh có sẵn | `GET /guardians/options` với `q` và `limit` |
| Xem chi tiết | `GET /students/{id}` |
| Sửa hồ sơ | `PUT /students/{id}` với `full_name`, `gender`, `grade_level`, `status`; `guardians` tùy chọn và được đọc là danh sách đầy đủ |
| Khóa hoặc mở tài khoản | `PATCH /students/{id}/account` với `is_active` |
| Đổi mật khẩu | `PATCH /students/{id}/password` với `password` |

`GET /guardians/options` cần quyền riêng `guardian.list` (mặc định chỉ Quản trị viên) và trả về mảng phẳng, mỗi mục gồm `id` (là `profile_id`), `label` (họ tên) và `phone`. `q` tối đa 100 ký tự, `limit` từ 1 đến 50 và mặc định 20.

Trường tùy chọn: `phone`, `dob`, `guardians`, `address`, `note`, và `status` khi tạo. Mỗi phần tử của `guardians` gồm `guardian_profile_id` **hoặc** `name` + `gender` (+ `phone` tùy chọn), kèm `relationship` bắt buộc và `is_primary` tùy chọn. Khi tạo còn nhận `avatar` — xem [Ảnh đại diện hồ sơ](avatar.md) cho cả hai dạng JSON và multipart.

Giới tính (học sinh và phụ huynh): `0` Nam, `1` Nữ, `2` Khác. Khối lớp: `0` Tiền tiểu học, `1`–`12` theo số lớp. Quan hệ phụ huynh: `0` Bố, `1` Mẹ, `2` Người giám hộ — chỉ ba lựa chọn, không có ô "Khác" riêng vì nó sẽ nằm cạnh `2` mà không nói thêm được gì.

Danh sách nhận thêm `q` để tìm theo mã học sinh, họ tên học sinh, số điện thoại học sinh, tên phụ huynh, số điện thoại phụ huynh hoặc tên đăng nhập. Từ khóa **bỏ dấu tiếng Việt và không phân biệt hoa thường**. Mã học sinh là `profile_id`, nên `q` toàn chữ số được đối chiếu thêm với id bên cạnh các điều kiện văn bản — không thay thế chúng, vì số điện thoại cũng là chữ số. Hệ quả: gõ vài chữ số có thể ra cả học sinh mang id đó và những học sinh có số điện thoại chứa dãy số đó. Chuỗi số dài quá tầm số nguyên không được coi là id. Ngoài ra có `status[]`, `grade_level[]`, `is_active` để lọc; cùng `page`, `per_page`, `sort`, `direction`. Cột sắp xếp cho phép: `id`, `full_name`, `grade_level`, `created_at`. `q` tối đa 100 ký tự và `per_page` tối đa 200; vượt quá thì trả `422`.

API vẫn nhận `status[]`, nhưng màn danh sách trên trình duyệt **không còn gửi tham số này** — xem mục dưới.

### Màn tạo và sửa hồ sơ học sinh

Cả hai chế độ là một tờ hồ sơ duy nhất, các khối được đánh số và phân tách bằng đường kẻ.

| Khối | Chế độ tạo | Chế độ sửa |
| --- | --- | --- |
| Ảnh đại diện | `01`, cột trái. Khung tròn với hai thẻ **Tải ảnh lên** và **Avatar mẫu**. Hồ sơ mới **mặc định đã có một avatar mẫu ngẫu nhiên** thay vì để trống, nên học sinh nào cũng có một khuôn mặt trong danh sách | `01`, cột trái. Cùng khung và cùng hai thẻ đó. Khung mở ra trên ảnh đang lưu và giữ nguyên ảnh ấy cho tới khi có ảnh mới; ảnh chỉ được ghi khi bấm **Lưu thay đổi**. Màn này không có cách gỡ ảnh, nên mở thẻ tải ảnh mà không chọn tệp thì ảnh cũ vẫn nguyên. Hồ sơ chưa có tài khoản thì không có thẻ tải ảnh, vì tệp lưu theo người sở hữu |
| Tài khoản đăng nhập | `02`, cột trái. Ô tên đăng nhập có nút **tự tạo từ họ và tên** gắn liền; ô mật khẩu có nút hiện/ẩn | `02`, cột trái. Tên đăng nhập chỉ đọc, kèm huy hiệu trạng thái tài khoản và hai nút **Khóa tài khoản** / **Mở lại tài khoản** và **Đặt lại mật khẩu**. Hai thao tác này có endpoint riêng và **áp dụng ngay khi xác nhận**, không chờ nút Lưu thay đổi — khối nói rõ điều đó ngay dưới hai nút |
| Thông tin học sinh | `03`, cột phải | `03`, cột phải |
| Thông tin phụ huynh | `04`, cột phải | `04`, cột phải |

Nút tự tạo tên đăng nhập bỏ dấu tiếng Việt, bỏ khoảng trắng và ký tự đặc biệt rồi thêm tiền tố `hs_` — ví dụ `Đỗ Thị Lan` thành `hs_dothilan`. Chưa nhập họ tên thì nút báo lỗi ngay tại trường họ tên thay vì tạo ra `hs_`.

Khối `04` là một **danh sách** chứ không phải một phụ huynh: thanh trên cùng đếm số người đang được liên kết và mang nút **Thêm phụ huynh**; bên dưới là từng hàng, mỗi hàng gồm chữ cái đầu tên, họ tên, số điện thoại, ô **quan hệ với học sinh**, nút chọn **Liên hệ chính**, và nút thùng rác để gỡ. Chưa có ai thì chỗ đó là một ô trống có hình minh họa và nút thêm.

Mỗi hàng mang nhãn nói rõ nó là gì, vì hàng sắp tạo hồ sơ, hàng vừa liên kết và hàng đã lưu trông giống hệt nhau nếu không nói ra:

| Nhãn | Nghĩa | Xuất hiện ở |
| --- | --- | --- |
| **Sẽ tạo mới** | Người nhập tay, lưu xong mới có hồ sơ | Cả hai màn |
| **Mới thêm** | Người có sẵn, vừa được liên kết trong phiên sửa này, chưa lưu | Chỉ màn sửa |
| *(không nhãn)* | Liên kết đã lưu trên hồ sơ | Chỉ màn sửa |

Màn tạo không dùng nhãn **Mới thêm**: ở đó hàng nào cũng chưa lưu, nên nhãn đó chỉ là nhiễu.

**Liên hệ chính** là một nhóm radio trải suốt danh sách, nên không bao giờ đánh dấu được hai người. Người đầu tiên được thêm tự động nhận cờ này; gỡ người đang giữ cờ thì cờ chuyển cho người còn lại đầu danh sách, để một danh sách còn người luôn có số điện thoại để gọi trước.

Nút **Thêm phụ huynh** mở một hộp thoại có hai thẻ:

- **Phụ huynh có sẵn** — ô tìm theo tên hoặc số điện thoại, áp dụng sau khoảng dừng nhập. Kết quả hiện kèm chữ cái đầu tên, họ tên và số điện thoại; người đã có trong danh sách bị làm mờ và mang nhãn **Đã liên kết**. Chọn một người thì hiện thẻ **Sẽ liên kết**. Ô **Quan hệ với học sinh** nằm dưới cùng và bắt buộc.
- **Tạo phụ huynh mới** — bốn trường họ tên, số điện thoại, giới tính và quan hệ.

Ô tìm phụ huynh bỏ dấu: gõ `Hung` ra `Hùng`, gõ `Do Thi Uoc` ra `Đỗ Thị Ước`. Mọi ô tìm khác trong ứng dụng đều như vậy.

Thẻ **Tạo phụ huynh mới** kiểm tra trùng trước khi thêm, để hai hồ sơ của cùng một người không cùng tồn tại. Ba tình huống, mỗi tình huống một lối ra riêng vì chúng khác nhau thật chứ không phải ba mức của cùng một cảnh báo:

| Tình huống | Ý nghĩa | Lựa chọn |
| --- | --- | --- |
| Trùng người **đã có trong danh sách** của học sinh này | Không còn gì để thêm | **Đóng và xem danh sách** |
| Trùng **số điện thoại** với một người khác trong hệ thống | Số điện thoại nhận ra một người chắc chắn hơn tên tiếng Việt, nên nhiều khả năng cùng một người hoặc gõ nhầm số | **Liên kết người này** hoặc **Sửa số điện thoại** |
| Chỉ trùng **họ tên** | Tên tiếng Việt trùng nhau là chuyện thường, nên đây là nhắc chứ không phải chặn | **Liên kết người này** hoặc **Vẫn tạo người mới** |

So khớp **bỏ dấu và không phân biệt hoa thường**, nên gõ `bui minh son` vẫn nhận ra `Bùi Minh Sơn`. Số điện thoại được rút về chữ số và quy `+84`/`84` về `0` trước khi so, và chỉ so khi đủ 9 chữ số trở lên. Kiểm tra chạy lúc bấm **Thêm vào hồ sơ** chứ không chạy trong lúc gõ, vì một truy vấn còn dở dang khi người dùng bấm nút sẽ để lọt bản trùng.

Đây là **lớp trợ giúp ở giao diện**, không phải ràng buộc của API: số điện thoại cố ý không duy nhất (anh chị em ruột dùng chung số của phụ huynh), nên bấm **Vẫn tạo người mới** vẫn tạo được người thứ hai trùng tên. Nếu không gọi được danh bạ, thao tác thêm vẫn chạy bình thường thay vì bị chặn.

Hộp thoại **không gọi API**. Nó trả một hàng về cho biểu mẫu và danh sách chỉ được ghi khi bấm **Tạo học sinh** / **Lưu thay đổi** — nhờ vậy người dùng thêm ba người, đổi ý về một người, rồi rời đi mà chưa ghi gì cả.

Chế độ sửa dùng đúng khối đó, mở sẵn với những người học sinh đang liên kết. Khác biệt nằm ở lời văn, vì lời hứa khác nhau: màn sửa nói thêm **"Thay đổi chỉ được lưu khi bạn nhấn Lưu thay đổi"** dưới danh sách, ô trống ghi **"Hồ sơ chưa liên kết phụ huynh"**, và thông báo nổi khi thêm hoặc gỡ đều nhắc phải nhấn **Lưu thay đổi** để xác nhận — trên màn tạo thì nhắc nhấn **Tạo học sinh**.

Gỡ một hàng chỉ gỡ **liên kết**, không xóa hồ sơ người đó: họ có thể vẫn là phụ huynh của học sinh khác, và thao tác này cũng chỉ có hiệu lực sau khi lưu.

Hàng **Hủy** / **Tạo học sinh** nằm ở mép dưới của tờ hồ sơ. Trên màn hình hẹp hàng này dính đáy khung nhìn, nên biểu mẫu dài không che mất nút gửi của chính nó. Dưới 1024px tờ hồ sơ về một cột; dưới 640px mỗi khối về một cột.

### Màn danh sách học sinh

| Vùng | Hành vi |
| --- | --- |
| Cột | Học sinh (ảnh đại diện, họ tên, số điện thoại, mã học sinh) · Khối · Phụ huynh · Lớp đang học · Tài khoản · menu thao tác |
| Phụ huynh và Lớp đang học | Hiện tối đa **2** mục, phần còn lại gộp vào chip `+N`. Bấm `+N` ở cột Phụ huynh mở hộp thoại liệt kê **toàn bộ** phụ huynh kèm quan hệ, số điện thoại và nhãn `Liên hệ chính`; bấm `+N` ở cột Lớp đang học mở hộp thoại cùng dạng, liệt kê **toàn bộ** lớp kèm môn và nhãn `Đang học` |
| Không có dữ liệu liên quan | Hiện `Chưa có phụ huynh` hoặc `Chưa có lớp` |
| Tài khoản | `Đang mở` hoặc `Đã khóa` |
| Tìm kiếm | Ô tìm kiếm áp dụng sau khoảng dừng nhập, không tìm theo từng ký tự. Tìm được theo mã học sinh, tên và số điện thoại học sinh, tên và số điện thoại phụ huynh, và tên đăng nhập |
| Bộ lọc | Chỉ **Khối** và **Tài khoản**. Không có bộ lọc trạng thái học tập |
| Sắp xếp | Mới tạo gần đây (mặc định), Tên A–Z, Tên Z–A, Khối tăng dần |
| Điều kiện đang áp dụng | Hiện thành dải chip bỏ được từng cái, kèm `Xóa tất cả`. Từ khóa quá dài bị cắt bớt kèm dấu `…`; trỏ chuột vào chip để xem đủ |
| Chế độ xem | Bảng hoặc Thẻ. Bảng cho chọn 20/50/100/200 mục mỗi trang; dạng Thẻ cố định 20 mục |
| Màn hình hẹp | Dưới 1024px bảng chuyển thành thẻ, mỗi thẻ mang đúng những thông tin cột bảng có |
| Trạng thái, tìm kiếm, phân trang | Lưu trong URL nên chia sẻ và tải lại được |

Menu thao tác của mỗi học sinh có `Sửa hồ sơ`, `Đổi mật khẩu`, và `Khóa tài khoản` / `Mở tài khoản`.

## Kết quả mong đợi

- Danh sách trả về envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi hồ sơ kèm `username` và `is_account_active` của tài khoản, không kèm bất kỳ thông tin xác thực nào.
- Mỗi hồ sơ kèm `profile_id` và `avatar`; `avatar` là `null` khi học sinh chưa chọn ảnh.
- Mỗi hồ sơ kèm `guardians`: mọi phụ huynh của học sinh, người liên hệ chính đứng đầu, mỗi mục gồm `profile_id`, `full_name`, `phone`, `relationship`, `is_primary`. Bốn trường `guardian_name`, `guardian_phone`, `guardian_gender`, `guardian_relationship` của người liên hệ chính vẫn được giữ nguyên bên cạnh.
- Mỗi hồ sơ kèm `active_enrollments`: các lớp học sinh đang theo học, mỗi mục gồm `class_id`, `code`, `subject_name`.
- Cả `guardians` và `active_enrollments` luôn là mảng, rỗng khi không có, không bao giờ `null`.
- Tạo thành công trả `201` với trạng thái Đang học; học sinh đăng nhập được ngay.
- Sửa hồ sơ, khóa và mở tài khoản trả `200` cùng bản ghi sau khi cập nhật.
- Đổi mật khẩu trả `204`.

Trên trình duyệt:

- Mỗi thao tác thành công hiện một thông báo nổi ở góc dưới bên phải rồi tự đóng sau vài giây: `Đã tạo học sinh và tài khoản đăng nhập.`, `Đã lưu thay đổi hồ sơ học sinh.`, `Đã khóa tài khoản của <tên>.`, `Đã mở lại tài khoản của <tên>.`, `Đã đổi mật khẩu cho <tên>.`
- Danh sách học sinh tự hiển thị bản ghi vừa tạo hoặc vừa sửa khi màn hình quay lại, không cần tải lại trang.

## Lỗi và trường hợp ngoại lệ

- Trùng tên đăng nhập trả `422` gắn vào `username`: `Có tài khoản đã dùng tên đăng nhập này, vui lòng chọn tên khác.`
- Lỗi của danh sách phụ huynh gắn vào đúng phần tử, ví dụ `guardians.0.name`. Một phần tử không nêu ai cả trả `Vui lòng chọn một phụ huynh có sẵn hoặc nhập tên phụ huynh mới.`; nhập tay mà thiếu giới tính trả `Vui lòng chọn giới tính phụ huynh.`; thiếu `relationship` trả `Vui lòng chọn quan hệ của phụ huynh với học sinh.`
- Gửi cùng lúc `guardian_profile_id` và `name` trong một phần tử trả `422` gắn vào `guardians.{i}.guardian_profile_id`: `Chọn phụ huynh có sẵn hoặc nhập phụ huynh mới, không gửi cả hai.`
- Cùng một `guardian_profile_id` xuất hiện hai lần trả `422` ở phần tử thứ hai: `Phụ huynh này đã có trong danh sách của học sinh.`
- Nhiều hơn một phần tử mang `is_primary` trả `422` gắn vào `guardians`: `Chỉ một phụ huynh được đánh dấu là liên hệ chính.`
- Quá 10 phần tử trả `422` gắn vào `guardians`.
- `guardian_profile_id` không tồn tại, trỏ vào một hồ sơ mang vai trò học sinh, hoặc trỏ vào chính học sinh đang sửa, trả `404` (`IDENTITY-007`): `Không tìm thấy phụ huynh.` Yêu cầu bị từ chối không để lại tài khoản hay hồ sơ nào.
- Ngày sinh không ở quá khứ trả `422` gắn vào `dob`: `Ngày sinh phải trước ngày hôm nay.`
- Số điện thoại sai định dạng trả `422` gắn vào `phone` (`Số điện thoại không hợp lệ.`) hoặc `guardians.{i}.phone` (`Số điện thoại phụ huynh không hợp lệ.`).
- Mật khẩu dưới 8 ký tự trả `422` gắn vào `password`.
- Không tìm thấy học sinh trả `404`: `Không tìm thấy học sinh.`
- Không đủ quyền trả `403`; thiếu token trả `401`.
- Tạo hồ sơ thất bại vì dữ liệu không hợp lệ thì không tạo tài khoản nào.
- Danh sách với `q` dài hơn 100 ký tự, hoặc `per_page` lớn hơn 200, trả `422`.
- Danh sách không khớp điều kiện nào hiện `Không tìm thấy kết quả` kèm nút `Xóa điều kiện`. Chưa có học sinh nào trong hệ thống thì hiện `Chưa có học sinh` kèm nút `Thêm học sinh`; thanh công cụ vẫn ở lại trong cả hai trường hợp.
- Tải danh sách thất bại thì màn hình hiện `Chưa tải được danh sách` kèm thông báo của máy chủ và nút `Thử lại`; thanh công cụ và các điều kiện đang áp dụng vẫn ở lại. Hành vi này giống nhau cho lần tải đầu và cho lần tải lại sau khi đã có dữ liệu.

## Quan hệ với chức năng khác

| Chức năng liên quan | Loại quan hệ | Ảnh hưởng nghiệp vụ | Người dùng quan sát được |
| --- | --- | --- | --- |
| [Phân quyền theo chức năng](../auth/phan-quyen.md) | Tiên quyết | Quyết định ai gọi được các endpoint học sinh. | Không đủ quyền thì nhận `403`. |
| [Xác thực bearer token](../auth/authentication.md) | Trạng thái dùng chung | Hồ sơ học sinh sở hữu một bản ghi tài khoản đăng nhập. | Khóa tài khoản khiến học sinh không đăng nhập được. |
| [Ảnh đại diện hồ sơ](avatar.md) | Trạng thái dùng chung | Hồ sơ học sinh mang ảnh đại diện của chính nó, lưu độc lập với các trường hồ sơ. | Ảnh hiện trong danh sách, thẻ và biểu mẫu học sinh; màn sửa hồ sơ ghi ảnh cùng lúc bấm Lưu thay đổi, qua endpoint riêng của ảnh. |
| [Ghi danh vào lớp](../academic/ghi-danh.md) | Hạ nguồn | Chỉ học sinh có tài khoản chưa khóa mới được thêm vào lớp. | Học sinh bị khóa tài khoản không xuất hiện trong danh sách chọn khi thêm vào lớp. |
| [Ghi danh vào lớp](../academic/ghi-danh.md) | Trạng thái dùng chung | Hồ sơ học sinh báo về các lớp đang theo học, dùng đúng định nghĩa "còn đang học" của ghi danh. | Lớp đã cho nghỉ biến mất khỏi cột Lớp đang học thay vì hiện kèm nhãn. Ghi danh, chuyển lớp và cho nghỉ làm mới cột này ngay. |
| [Quản lý lớp học](../academic/lop-hoc.md) | Phụ thuộc | Mã lớp và tên môn hiện trong cột Lớp đang học lấy từ hồ sơ lớp và môn của lớp đó. | Sửa lớp, đổi tên môn, hay kết thúc lớp đều làm cột Lớp đang học của mọi học sinh trong lớp đổi theo ngay. Kết thúc lớp khép lại mọi ghi danh còn mở của lớp đó, nên lớp rời khỏi cột. |

## Giới hạn hiện tại

- Không có chức năng xóa học sinh.
- Không đổi được tên đăng nhập sau khi tạo.
- Đổi mật khẩu không thu hồi token đang hoạt động.
- Chưa có điểm thưởng, liên kết Zalo, điểm danh hay học phí.
- Không sửa được **hồ sơ nhân thân của phụ huynh** (họ tên, số điện thoại, giới tính) từ màn học sinh. Nhập sai thì gỡ liên kết rồi thêm lại người đúng; chưa có màn quản lý phụ huynh riêng.
- `GET /guardians/options` chỉ liệt kê phụ huynh **đã là phụ huynh của ai đó**. Một hồ sơ chưa gắn với học sinh nào không tìm ra được ở đây, dù `guardian_profile_id` vẫn nhận nó.
- Màn danh sách không xem và không lọc được theo trạng thái học tập. Muốn biết trạng thái của một học sinh thì mở hồ sơ. API vẫn nhận `status[]` nên vẫn lọc được qua API.
- Liên kết cũ tới danh sách có tham số `?status=…` không còn tác dụng: tham số bị bỏ qua và danh sách hiện như không lọc, không có cảnh báo nào.
- Ghi danh vào lớp không sửa được từ màn học sinh; cột Lớp đang học chỉ để xem. Việc ghi danh làm trong hồ sơ lớp học.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Identity/Routes/api.php`
- Kiểm thử xác định: `api/tests/Behavioral/IdentityStudentTest.php`, `api/tests/Behavioral/IdentityGuardianTest.php`, `api/tests/Behavioral/IdentityGuardianOptionsTest.php`, `api/tests/Behavioral/IdentityAvatarResourceTest.php`, `api/tests/Security/AcademicAuthorizationTest.php`
- Schema: `docs/database.md`
