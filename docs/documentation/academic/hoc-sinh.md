# Quản lý học sinh

Last Verified: 2026-09-23
Related Task: `.tasks/phase-4-academic-lifecycle.md` — Task 2.2

## Tổng quan

Hồ sơ học sinh và tài khoản đăng nhập của học sinh được quản lý cùng nhau: tạo hồ sơ là tạo luôn tài khoản. Hồ sơ học sinh phải tồn tại trước khi ghi danh vào lớp.

Chức năng dùng được cả qua API lẫn màn hình quản trị tại `/academic/students` (mục **Học sinh** trong nhóm Người dùng ở thanh bên). Trên trình duyệt, `/academic/students/{id}` là trang **Chi tiết học sinh** và `/academic/students/{id}/edit` là trang **Sửa hồ sơ học sinh**.

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
- Một học sinh liên kết được **nhiều phụ huynh hoặc người giám hộ**, và một người cũng theo dõi được nhiều học sinh. Cả tạo và sửa đều nhận danh sách đó qua khóa `guardians`, tối đa 10 người. Student form chỉ chọn guardian role-pure đã tồn tại.
- Mỗi phần tử của `guardians` gửi `guardian_profile_id`, `relationship` và `is_primary`; student form không tạo guardian mới từ dữ liệu tên/điện thoại.
- `relationship` là bắt buộc: một liên kết không nói người đó là ai với học sinh thì không ghi lại được điều gì có ích.
- `is_primary` đánh dấu người liên hệ chính. Roster không rỗng phải chọn chính xác một primary; hệ thống không tự chọn row đầu tiên.
- Cùng một `guardian_profile_id` không được xuất hiện hai lần trong một danh sách.
- Hồ sơ được chỉ định bằng `guardian_profile_id` phải là hồ sơ **không mang vai trò học sinh**, và không được là chính học sinh đang sửa. Một học sinh không bao giờ được làm phụ huynh của học sinh khác.
- Sửa hồ sơ đọc `guardians` là **danh sách đầy đủ**: ai không có trong danh sách sẽ bị gỡ liên kết. Thêm người, gỡ người và đổi người liên hệ chính vì thế đều là cùng một thao tác gửi danh sách mong muốn, không cần endpoint riêng cho từng việc.
- **Không gửi khóa `guardians`** thì mọi liên kết hiện tại được giữ nguyên. Gửi **mảng rỗng** là chuyện khác: nó nói "không còn ai" và gỡ hết.
- Gỡ liên kết **không xóa hồ sơ người đó**: họ có thể vẫn là phụ huynh của một học sinh khác.
- Sửa hồ sơ **không bao giờ sửa hồ sơ nhân thân của phụ huynh**. Sửa tên hay số điện thoại của một người là thay đổi về người đó, không phải về liên kết của học sinh này với họ; nhờ vậy chỉnh danh sách của một anh/chị/em không còn khả năng làm hỏng dữ liệu của người kia.
- Tìm phụ huynh có sẵn dùng endpoint riêng `GET /api/v1/academic/guardians/options`, chỉ trả về những hồ sơ **đang là phụ huynh của ai đó** và đồng thời không có tài khoản, vai trò giáo viên hoặc vai trò học sinh. Kết quả sắp theo họ tên và mang theo số điện thoại, vì hai phụ huynh trùng tên là chuyện thường và số điện thoại là thứ phân biệt được họ.
- Tìm phụ huynh **bỏ qua dấu tiếng Việt và không phân biệt hoa thường**: gõ `Hung` ra `Nguyễn Văn Hùng`, gõ `Do Thi Uoc` ra `Đỗ Thị Ước`. Gõ có dấu vẫn tìm được như thường. Kết quả chỉ là các hồ sơ để người dùng chọn liên kết.
- Số điện thoại học sinh và phụ huynh, nếu có, phải bắt đầu bằng `0` và có 10 hoặc 11 chữ số. Không số nào trong hai số này cần duy nhất — hồ sơ giáo viên, học sinh và phụ huynh dùng chung một bảng nhân thân, và anh chị em ruột thường dùng chung số của phụ huynh.
- Trạng thái học tập gồm `0` Đang học, `1` Tạm nghỉ, `2` Dừng hẳn. Mặc định khi tạo là Đang học. Trường này sửa được trong biểu mẫu hồ sơ, nhưng **màn danh sách không hiển thị và không lọc theo nó** — xem mục "Màn danh sách học sinh".
- Trạng thái học tập và trạng thái tài khoản là hai thứ khác nhau: khóa tài khoản chỉ chặn đăng nhập, không đổi việc học sinh đang học hay đã nghỉ.
- Một học sinh có thể có nhiều phụ huynh, và danh sách trả về tất cả, người liên hệ chính đứng đầu. Biểu mẫu tạo và sửa hồ sơ đều ghi được cả danh sách đó.
- Danh sách cũng trả về các lớp học sinh **đang** theo học. Lớp đã nghỉ không xuất hiện: quy tắc "còn đang học" dùng đúng định nghĩa chung của ghi danh, xem [Ghi danh vào lớp](../academic/ghi-danh.md).
- Không có thao tác xóa học sinh. Ngừng theo học bằng cách đổi trạng thái học tập hoặc khóa tài khoản; hồ sơ luôn được giữ để lịch sử ghi danh trỏ tới nó không bị hỏng.
- Đổi mật khẩu thu hồi toàn bộ token đang có của đúng tài khoản học sinh. Học sinh cần đăng nhập lại trên các thiết bị.
- Hồ sơ học sinh có ảnh đại diện riêng. Tạo học sinh gửi ảnh kèm trong cùng một yêu cầu; sửa hồ sơ ghi ảnh bằng endpoint riêng của nó nhưng vẫn nằm trong cùng nút **Lưu thay đổi** của tờ hồ sơ, xem [Ảnh đại diện hồ sơ](avatar.md). Ảnh được ghi **sau** khi các trường hồ sơ được chấp nhận, nên một trường bị từ chối không làm đổi ảnh.

## Hướng dẫn thao tác

Mọi endpoint nằm dưới tiền tố `/api/v1` và cần header `Authorization: Bearer <token>`.

| Thao tác | Yêu cầu |
| --- | --- |
| Xem danh sách | `GET /api/v1/academic/students` |
| Tạo, không có phụ huynh | `POST /api/v1/academic/students` với `username`, `password`, `full_name`, `gender`, `grade_level` |
| Tạo, kèm phụ huynh | thêm `guardians` — mỗi phần tử là `guardian_profile_id`, `relationship` và `is_primary` |
| Tìm phụ huynh có sẵn | `GET /api/v1/academic/guardians/options` với `q` và `limit` |
| Xem chi tiết | `GET /api/v1/academic/students/{id}` |
| Xem các lớp đang học và đã học | `GET /api/v1/academic/students/{id}/classes` |
| Xem event lịch sử của một lớp | `GET /api/v1/academic/students/{id}/enrollment-events?class_id={class}` |
| Sửa hồ sơ | `PUT /api/v1/academic/students/{id}` với `full_name`, `gender`, `grade_level`, `status`; `guardians` tùy chọn và được đọc là danh sách đầy đủ |
| Khóa hoặc mở tài khoản | `PATCH /api/v1/academic/students/{id}/account` với `is_active` |
| Đổi mật khẩu | `PATCH /api/v1/academic/students/{id}/password` với `password` |

`GET /api/v1/academic/guardians/options` cần quyền `student.update` (mặc định chỉ Quản trị viên) và trả về mảng phẳng, mỗi mục gồm `id` (là `profile_id`), `label` (họ tên) và `phone`. `q` tối đa 100 ký tự, `limit` từ 1 đến 50 và mặc định 20.

`GET /api/v1/academic/students/{id}/classes` phân trang các lớp distinct mà học sinh đang hoặc từng theo học; response mang `is_current` và số period. `GET .../enrollment-events` bắt buộc `class_id` và cần đồng thời vai trò Quản trị viên cùng quyền `student.view`. Mục có `kind: event` là lịch sử thật; period cũ chưa có event trả `kind: legacy_enrollment`, không phân tích ghi chú và không tạo sự kiện tổng hợp. Xem định dạng, paging và trường hợp `404` tại [Ghi danh vào lớp](../academic/ghi-danh.md).

Trường tùy chọn: `phone`, `dob`, `guardians`, `address`, `note`, và `status` khi tạo. Mỗi phần tử của `guardians` gồm `guardian_profile_id`, `relationship` bắt buộc và `is_primary` bắt buộc khi roster không rỗng. Khi tạo còn nhận `avatar` — xem [Ảnh đại diện hồ sơ](avatar.md) cho cả hai dạng JSON và multipart.

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

Mỗi hàng chọn một guardian đã có, quan hệ và radio **Liên hệ chính**. Roster không rỗng phải chọn chính xác một primary; hệ thống không tự gán row đầu tiên hoặc tạo hồ sơ từ tên/điện thoại. Muốn tạo guardian mới, Admin mở [Quản lý phụ huynh](phu-huynh.md).

Nút **Thêm phụ huynh** chỉ tìm trong options directory đã được lọc role-pure. Ô tìm bỏ dấu tiếng Việt và kết quả hiển thị số điện thoại để phân biệt hồ sơ trùng tên.

Hộp thoại trả dòng đã chọn về form; liên kết chỉ được ghi khi bấm **Tạo học sinh** / **Lưu thay đổi**.

Chế độ sửa dùng đúng khối đó, mở sẵn với những người học sinh đang liên kết. Khác biệt nằm ở lời văn, vì lời hứa khác nhau: màn sửa nói thêm **"Thay đổi chỉ được lưu khi bạn nhấn Lưu thay đổi"** dưới danh sách, ô trống ghi **"Hồ sơ chưa có liên kết"**, và thông báo nổi khi thêm hoặc gỡ đều nhắc phải nhấn **Lưu thay đổi** để xác nhận — trên màn tạo thì nhắc nhấn **Tạo học sinh**.

Gỡ một hàng chỉ gỡ **liên kết**, không xóa hồ sơ người đó: họ có thể vẫn là phụ huynh của học sinh khác, và thao tác này cũng chỉ có hiệu lực sau khi lưu.

Hàng **Hủy** / **Tạo học sinh** nằm ở mép dưới của tờ hồ sơ. Trên màn hình hẹp hàng này dính đáy khung nhìn, nên biểu mẫu dài không che mất nút gửi của chính nó. Dưới 1024px tờ hồ sơ về một cột; dưới 640px mỗi khối về một cột.

### Màn chi tiết học sinh

- Từ tên hoặc ảnh học sinh, mục **Xem hồ sơ**, và đường dẫn `/academic/students/{id}`, người dùng mở trang chi tiết. Mục **Sửa hồ sơ** ở danh sách và nút **Sửa hồ sơ** trên trang chi tiết mở `/academic/students/{id}/edit`. Lưu thành công quay về `/academic/students/{id}`; tạo mới vẫn quay về `/academic/students`.
- Trang chi tiết là màn đọc theo capability. Có `student.view` thì đọc được hồ sơ; API vẫn là rào chắn quyền cuối cùng. Có `student.update` thì hiện **Sửa hồ sơ**; **Đổi mật khẩu** chỉ hiện khi đồng thời có tài khoản đăng nhập. Có `student.toggle_active` thì hiện **Khóa tài khoản** hoặc **Mở tài khoản**, cũng chỉ khi học sinh có tài khoản. Thiếu capability tương ứng thì action đó không xuất hiện; không có tài khoản thì không có action tài khoản.
- Khối **Thông tin cá nhân** che một phần số điện thoại học sinh và gắn nhãn **Đã che**. Khối **Người giám hộ** hiển thị toàn bộ roster, đếm số người, đặt **Liên hệ chính** ở đầu nếu có, và che số điện thoại từng người. Thêm, sửa hoặc gỡ liên kết thực hiện trong **Sửa hồ sơ**.
- Tab **Lớp đang học** chỉ đọc `active_enrollments`, tức các ghi danh còn hiệu lực. Mỗi dòng có tên lớp, mã lớp, môn học và link **Xem lớp** tới `/academic/classes/{classId}`. Trang này không ghi danh, chuyển lớp hoặc cho nghỉ; các thao tác đó thuộc [Ghi danh vào lớp](../academic/ghi-danh.md). Khi không có lớp còn hiệu lực, trang hiện trạng thái trống và link **Mở danh sách lớp** tới `/academic/classes`.
- Hai tab **Điểm thưởng** và **Báo cáo học tập** luôn hiển thị nhưng mang badge **Sắp có** và panel tĩnh. Chúng không hiển thị số liệu, không có thao tác và không gọi dữ liệu module chưa được triển khai.

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

Menu thao tác của mỗi học sinh có **Xem hồ sơ**; **Sửa hồ sơ** chỉ hiện khi có `student.update`, còn **Đổi mật khẩu** cần capability đó và tài khoản đăng nhập. **Khóa tài khoản** / **Mở tài khoản** cần `student.toggle_active` và tài khoản đăng nhập; các mục bị ẩn khi thiếu điều kiện tương ứng.

## Kết quả mong đợi

- Danh sách trả về envelope `data` kèm `meta` gồm `current_page`, `per_page`, `total`, `last_page`.
- Mỗi hồ sơ kèm `username` và `is_account_active` của tài khoản, không kèm bất kỳ thông tin xác thực nào.
- Mỗi hồ sơ kèm `profile_id` và `avatar`; `avatar` là `null` khi học sinh chưa chọn ảnh.
- Mỗi hồ sơ kèm `guardians`: mọi phụ huynh của học sinh, người liên hệ chính đứng đầu, mỗi mục gồm `profile_id`, `full_name`, `phone`, `relationship`, `is_primary`. Bốn trường `guardian_name`, `guardian_phone`, `guardian_gender`, `guardian_relationship` của người liên hệ chính vẫn được giữ nguyên bên cạnh.
- Mỗi hồ sơ kèm `active_enrollments`: các lớp học sinh đang theo học, mỗi mục gồm `class_id`, `name`, `code`, `subject_name`.
- Cả `guardians` và `active_enrollments` luôn là mảng, rỗng khi không có, không bao giờ `null`.
- Tạo thành công trả `201` với trạng thái Đang học; học sinh đăng nhập được ngay.
- Sửa hồ sơ, khóa và mở tài khoản trả `200` cùng bản ghi sau khi cập nhật.
- Đổi mật khẩu trả `204`.

Trên trình duyệt:

- Mỗi thao tác thành công hiện một thông báo nổi ở góc dưới bên phải rồi tự đóng sau vài giây: `Đã tạo học sinh và tài khoản đăng nhập.`, `Đã lưu thay đổi hồ sơ học sinh.`, `Đã khóa tài khoản của <tên>.`, `Đã mở lại tài khoản của <tên>.`, `Đã đổi mật khẩu cho <tên>.`
- Danh sách học sinh tự hiển thị bản ghi vừa tạo hoặc vừa sửa khi màn hình quay lại, không cần tải lại trang.

## Lỗi và trường hợp ngoại lệ

- Trùng tên đăng nhập trả `422` gắn vào `username`: `Có tài khoản đã dùng tên đăng nhập này, vui lòng chọn tên khác.`
- Lỗi của danh sách phụ huynh gắn vào đúng phần tử, ví dụ `guardians.0.guardian_profile_id`; mỗi phần tử phải chọn một hồ sơ có sẵn, quan hệ và cờ liên hệ chính.
- Cùng một `guardian_profile_id` xuất hiện hai lần trả `422` ở phần tử thứ hai: `Phụ huynh này đã có trong danh sách của học sinh.`
- Nhiều hơn một phần tử mang `is_primary` trả `422` gắn vào `guardians`: `Chỉ một phụ huynh được đánh dấu là liên hệ chính.`
- Quá 10 phần tử trả `422` gắn vào `guardians`.
- `guardian_profile_id` không tồn tại, trỏ vào một hồ sơ mang vai trò học sinh, hoặc trỏ vào chính học sinh đang sửa, trả `404` (`IDENTITY-007`): `Không tìm thấy phụ huynh.` Yêu cầu bị từ chối không để lại tài khoản hay hồ sơ nào.
- Ngày sinh không ở quá khứ trả `422` gắn vào `dob`: `Ngày sinh phải trước ngày hôm nay.`
- Số điện thoại học sinh sai định dạng trả `422` gắn vào `phone` (`Số điện thoại không hợp lệ.`).
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
- Đổi mật khẩu thu hồi token đang hoạt động của đúng tài khoản.
- Chưa có điểm thưởng, liên kết Zalo, điểm danh hay học phí.
- **Hồ sơ nhân thân của phụ huynh** (họ tên, số điện thoại, giới tính) được quản lý tại [Quản lý phụ huynh](phu-huynh.md), không đổi từ hồ sơ học sinh.
- `GET /api/v1/academic/guardians/options` chỉ liệt kê phụ huynh **đã là phụ huynh của ai đó**; student form chỉ nhận hồ sơ guardian-pure đã có.
- Màn danh sách không xem và không lọc được theo trạng thái học tập. Muốn biết trạng thái của một học sinh thì mở hồ sơ. API vẫn nhận `status[]` nên vẫn lọc được qua API.
- Liên kết cũ tới danh sách có tham số `?status=…` không còn tác dụng: tham số bị bỏ qua và danh sách hiện như không lọc, không có cảnh báo nào.
- Ghi danh vào lớp không sửa được từ màn học sinh; cột Lớp đang học chỉ để xem. Việc ghi danh làm trong hồ sơ lớp học.

## Tham chiếu kỹ thuật

- Route: `api/app/Modules/Academic/Routes/api.php`
- Kiểm thử xác định: các bài kiểm thử học sinh và phụ huynh trong `api/tests/Behavioral/` và `api/tests/Security/`
- Schema: `docs/database.md`
