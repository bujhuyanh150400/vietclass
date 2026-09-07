# Quy trình redesign UI với Google Stitch

Last Verified: 2026-09-07

Quy trình chuẩn để đưa **một màn hình đã có** trong `frontend/` sang
[Google Stitch](https://stitch.withgoogle.com/) để redesign, rồi implement lại
bằng kiến trúc hiện có. Tài liệu này mô tả *cách làm*; hệ thống thiết kế ở mức
mã nguồn nằm ở [`docs/design.md`](design.md).

> **Phạm vi.** Chỉ dùng cho màn hình **đã tồn tại**. Toàn bộ luồng dựa trên ảnh
> chụp UI hiện tại: bước 2 chụp nó, bước 3 upload chính nó, bước 4 sửa trên nó.
> Màn hình chưa có thì không có gì để chụp và quy trình đứt ngay từ bước 2 —
> dùng [`docs/stitch-new-screen-workflow.md`](stitch-new-screen-workflow.md).

Mục 3 (cài đặt MCP và skills), mục 5 (quy tắc implementation) và mục 6 (checklist
review) của tài liệu này dùng chung cho cả hai luồng; luồng màn hình mới trỏ về
đây thay vì lặp lại.

## 1. Nguyên tắc

```text
Repo                  = nguồn sự thật của code
docs/design.md        = nguồn sự thật của design system
frontend/.stitch/DESIGN.md = bản hợp đồng thiết kế gửi cho Stitch
Stitch                = design sandbox
Màn hình Stitch đã chốt = đặc tả thị giác
Coding agent          = implementation
PR                    = cổng review
```

Hệ quả bắt buộc:

- HTML/CSS Stitch export **không** phải production code. Không copy nguyên vào repo.
- Tái sử dụng component trong `src/components/ui/` và `src/components/shared/`
  trước khi tạo component mới.
- Stitch không được thêm chức năng, thực thể hay mục điều hướng ngoài phạm vi
  màn hình đang thiết kế. Nếu mock có, bỏ khi implement và ghi vào `approved.md`.
- Không đổi business logic để khớp mock.
- Mỗi lượt một màn hình hoặc một flow nhỏ.
- `stitch-skills` là tooling của agent, **không** vào `frontend/package.json`.

## 2. Cấu trúc thư mục

```text
frontend/.stitch/
├── DESIGN.md          # hợp đồng thiết kế gửi Stitch (đã có, giữ đồng bộ với docs/design.md)
└── references/        # vật chứng thị giác từng màn hình — xem references/README.md
```

`.stitch/` là thư mục tooling, không được import vào ứng dụng và không nằm trong
bundle. `.gitignore` loại `frontend/.stitch/**/*.html` vì ảnh chụp tĩnh nặng và
sinh lại được.

## 3. Cài đặt một lần

Toàn bộ cấu hình Stitch nằm trong repo này, không đụng vào cấu hình toàn cục của
máy: `.mcp.json` và `.claude/settings.json` cho Claude Code, `.codex/config.toml`
cho Codex. Cả ba đều nằm trong `.gitignore` theo chính sách sẵn có của repo
("Private/local AI agent configuration"), nên mỗi developer tự tạo — mục này là
bản copy-paste để làm việc đó.

### 3.1 Stitch MCP

Cả sáu skill `stitch-design` đều gọi MCP server của Stitch; không có nó thì
không skill nào chạy được.

Server là remote streamable HTTP, endpoint `https://stitch.googleapis.com/mcp`,
xác thực bằng API key ở header `X-Goog-Api-Key`.

**1. Lấy API key.** Đăng nhập <https://stitch.withgoogle.com/> → ảnh đại diện
góc trên phải → **Stitch settings** → mục API key → **Create key**. Key chỉ hiện
một lần.

**2. Đặt key vào biến môi trường**, không viết vào file cấu hình nào:

```bash
echo 'export STITCH_API_KEY="<key>"' >> ~/.zshrc && source ~/.zshrc
```

**3. Claude Code** — `.mcp.json` ở gốc repo:

```json
{
  "mcpServers": {
    "stitch": {
      "type": "http",
      "url": "https://stitch.googleapis.com/mcp",
      "headers": { "X-Goog-Api-Key": "${STITCH_API_KEY}" }
    }
  }
}
```

Hoặc sinh ra bằng lệnh, chạy từ gốc repo:

```bash
claude mcp add stitch --scope project --transport http \
  https://stitch.googleapis.com/mcp \
  --header 'X-Goog-Api-Key: ${STITCH_API_KEY}'
```

Lần chạy `claude` kế tiếp sẽ hỏi duyệt server của project — chọn approve.

**4. Codex** — `.codex/config.toml` ở gốc repo. Codex đọc file này chồng lên
`~/.codex/config.toml` khi worktree là thư mục hiện tại, nên cấu hình không rò
ra ngoài repo:

```toml
[mcp_servers.stitch]
url = "https://stitch.googleapis.com/mcp"
env_http_headers = { "X-Goog-Api-Key" = "STITCH_API_KEY" }
```

Đừng dùng `codex mcp add` cho việc này: nó ghi vào `~/.codex/config.toml` (toàn
cục), tự khởi động OAuth rồi báo `Dynamic client registration not supported`, và
CLI không có cờ nào truyền header tùy ý. Viết tay bốn dòng trên nhanh hơn.

**5. Kiểm tra.** Từ trong repo:

```bash
claude mcp get stitch     # Scope: Project config (shared via .mcp.json)
codex mcp get stitch      # env_http_headers: X-Goog-Api-Key=STITCH_API_KEY
```

Cả hai lệnh chạy ngoài repo phải báo không tìm thấy — đó là bằng chứng cấu hình
đúng phạm vi.

Lưu ý một cái bẫy: `initialize` và `tools/list` của server này chạy được **không
cần** key, nên `Status: Connected` chưa chứng minh key đúng. Chỉ một lời gọi tool
thật (`list_projects`) mới chứng minh; key sai hoặc thiếu trả về `Request is
missing required authentication credential`.

Server phơi 15 tool: `create_project`, `get_project`, `delete_project`,
`list_projects`, `list_screens`, `get_screen`, `generate_screen_from_text`,
`edit_screens`, `generate_variants`, `upload_design_md`, `create_design_system`,
`create_design_system_from_design_md`, `update_design_system`,
`list_design_systems`, `apply_design_system`.

Một số skill gọi thẳng REST API (`https://stitch.googleapis.com`) qua script
Python và cần `--api-key` — cùng key đó, truyền bằng `"$STITCH_API_KEY"`.

### 3.2 Skills

Nguồn: [`google-labs-code/stitch-skills`](https://github.com/google-labs-code/stitch-skills).
Chỉ cần plugin **`stitch-design`**:

| Skill | Vai trò trong quy trình |
| --- | --- |
| `stitch::extract-design-md` | Sinh lại `frontend/.stitch/DESIGN.md` từ mã nguồn |
| `stitch::manage-design-system` | Upload `DESIGN.md` lên Stitch, apply cho các screen |
| `stitch::extract-static-html` | Chụp HTML tĩnh self-contained của một route đang chạy |
| `stitch::upload-to-stitch` | Đẩy HTML/ảnh lên một Stitch project |
| `stitch::code-to-design` | Gộp ba bước trên thành một lệnh |
| `stitch::generate-design` | Sửa màn hình đã upload (`edit_screens`) |

`stitch-build` (sinh React component) **chưa** dùng: implementation vẫn do
coding agent làm trên codebase hiện tại. `stitch-utilities` là tùy chọn.

**Claude Code** — chạy từ gốc repo:

```bash
npx plugins add google-labs-code/stitch-skills --scope project --target claude-code
claude plugin disable stitch-build@google-labs-code-stitch-skills
```

`claude plugin marketplace add google-labs-code/stitch-skills` **không** chạy
được: repo đó đặt manifest ở `.agents/plugins/marketplace.json` theo chuẩn Agent
Skills, còn Claude Code tìm `.claude-plugin/marketplace.json`. `npx plugins` là
lớp trung gian dựng shim đó.

`npx plugins add` cài cả ba plugin, không chọn được từng cái — lệnh `disable`
phía trên là để tắt `stitch-build`. Trạng thái bật/tắt ghi ở
`.claude/settings.json` của repo:

```json
{
  "enabledPlugins": {
    "stitch-build@google-labs-code-stitch-skills": false,
    "stitch-design@google-labs-code-stitch-skills": true,
    "stitch-utilities@google-labs-code-stitch-skills": true
  }
}
```

**Codex** — khai marketplace và plugin trong `.codex/config.toml` của repo, cùng
file với khối `[mcp_servers.stitch]` ở mục 3.1:

```toml
[marketplaces.stitch-skills]
source_type = "git"
source = "https://github.com/google-labs-code/stitch-skills.git"
ref = "main"
sparse_paths = [".agents/plugins", "plugins/stitch-design"]

[plugins."stitch-design@stitch-skills"]
enabled = true
```

Lần đầu cần tải marketplace về cache một lần:

```bash
codex plugin marketplace add google-labs-code/stitch-skills --ref main \
  --sparse .agents/plugins --sparse plugins/stitch-design
codex plugin add stitch-design@stitch-skills
```

Hai lệnh này ghi thêm vào `~/.codex/config.toml`; xóa khối `[marketplaces.stitch-skills]`
và `[plugins."stitch-design@stitch-skills"]` khỏi đó rồi giữ bản trong
`.codex/config.toml` của repo. Codex bắt buộc dạng `<plugin>@<marketplace>`;
`codex plugin add stitch-design` trơ trọi sẽ lỗi. Tên marketplace là
`stitch-skills`, không phải tên repo.

Kiểm tra: `claude plugin list` và `codex plugin list` chạy từ trong repo.

## 4. Vòng lặp sáu bước

### Bước 1 — Chọn màn hình

Một route, ví dụ `/login`, `/dashboard`, `/academic/students`. Viết ra trước khi
mở Stitch: mục tiêu, người dùng, chức năng hiện có, phần được phép đổi, phần
**không** được đụng.

### Bước 2 — Chụp UI hiện tại

**Bắt buộc, và phải làm trước khi đụng vào Stitch.** Bước 4 sửa đè lên screen
chứ không nhân bản, nên ảnh chụp này là bản "before" duy nhất còn lại.

Chạy dev server rồi chụp:

```bash
cd frontend && npm run dev
```

```bash
npx tsx <SKILL_DIR>/extract-static-html/scripts/snapshot.ts \
  --url http://localhost:3000/login \
  --output frontend/.stitch/references/login/current.html \
  --wait 2000
```

Route trong `(protected)` cần đăng nhập trước; khi đó dùng Strategy B (browser
subagent) của `extract-static-html` thay vì Puppeteer.

Context gửi Stitch gồm: `frontend/.stitch/DESIGN.md`, `current.html`, ảnh
logo/mascot nếu màn hình có dùng, mô tả chức năng, và prompt redesign.

### Bước 3 — Đưa lên Stitch

```text
"Upload frontend code at frontend/ vào Stitch project <PROJECT_ID>,
 dùng frontend/.stitch/DESIGN.md làm design system, screen title '/login'."
```

`stitch::code-to-design` sẽ chụp HTML, upload `DESIGN.md`, gọi
`create_design_system_from_design_md`, rồi upload screen. Sau bước này Stitch giữ
token ở cấp project — **không** lặp lại màu/font trong prompt sinh màn hình nữa.

Nếu `DESIGN.md` đã ở trên Stitch, chỉ cần `stitch::upload-to-stitch` cho HTML.

### Bước 4 — Sửa trong Stitch

Dùng `stitch::generate-design` (`edit_screens`) sửa thẳng trên screen vừa upload.
Được phép đổi: layout, hierarchy, spacing, responsive, cách ghép component.
Prompt viết bằng tiếng Việt để copy trong mock đúng ngôn ngữ sản phẩm.

`edit_screens` **ghi đè**, không giữ bản trước. Vì vậy: mỗi lượt một thay đổi
nhỏ, xem kết quả rồi mới sửa tiếp — và đừng bỏ qua bước 2, vì `current.html`
trong repo là thứ duy nhất cho phép quay lại.

Ràng buộc nhắc lại trong mỗi prompt khi cần: chỉ light mode, một màu nhấn cam
`#fd7110`, không thêm chức năng ngoài phạm vi.

### Bước 5 — Chốt thiết kế

Chưa chốt thì chưa code. Khi chốt:

1. Tải ảnh screen về `frontend/.stitch/references/<route>/approved.png`.
2. Viết `approved.md` theo quy ước ở
   [`frontend/.stitch/references/README.md`](../frontend/.stitch/references/README.md).
3. Nếu thiết kế làm đổi token (màu, font, radius), cập nhật
   `frontend/src/styles/tokens.css` + `theme.css`, `docs/design.md`, rồi sinh lại
   `frontend/.stitch/DESIGN.md`. Ba nơi này phải khớp.

### Bước 6 — Implement, review, PR

Xem mục 5 và 6.

## 5. Quy tắc implementation cho coding agent

Đầu vào: `approved.png` + `approved.md`, `frontend/.stitch/DESIGN.md`,
[`docs/design.md`](design.md), và mã nguồn hiện tại của màn hình.

Thứ tự bắt buộc khi cần một khối giao diện:

1. Đã có trong `src/components/shared/` chưa? (`FormShell`, `Field`, `DataTable`,
   `ListToolbar`, `EmptyState`, `SelectField`, `DateField`…) → dùng lại.
2. Có nguyên hàm trong `src/components/ui/` không? → dùng lại.
3. Utility Tailwind ghép từ token đã đăng ký trong `theme.css` giải quyết được
   không? → viết inline, không tạo file CSS.
4. Chỉ khi ba bước trên không đủ mới tạo component mới, đặt trong module tương
   ứng dưới `src/modules/<module>/components/`.

Cấm:

- Copy HTML/CSS từ Stitch vào `.tsx`.
- Thêm màu, font, radius dạng giá trị thô. Màu mới phải vào `tokens.css` và được
  đăng ký trong `theme.css` mới thành utility.
- Thêm dependency chỉ để dựng lại một hiệu ứng của mock.
- Thêm chế độ tối. Variant `dark` bất hoạt theo thiết kế.
- Đổi API client, form schema, hoặc business rule để khớp mock.

CSS riêng của một tính năng đặt cạnh module và được view import (như
`src/modules/identity/styles/login.css`), bọc trong `@layer components`, không
import vào `src/styles.css`.

## 6. Checklist review và PR

- [ ] Đối chiếu với `approved.png`: bố cục, hierarchy, spacing.
- [ ] Phần mock có mà cố ý không implement đã ghi trong `approved.md` và mô tả PR.
- [ ] Responsive: kiểm tra dưới `sm` (640px), giữa `sm`–`lg`, và trên `lg` (1024px).
- [ ] Accessibility: label gắn với control, `aria-describedby` cho hint/lỗi,
      `aria-invalid` khi sai, nút chỉ có icon có `aria-label`, icon trang trí
      `aria-hidden`, focus ring nhìn thấy được.
- [ ] Mọi chuyển động có nhánh `prefers-reduced-motion`.
- [ ] Copy tiếng Việt, không còn placeholder tiếng Anh của Stitch.
- [ ] Không đổi business logic ngoài phạm vi.
- [ ] `npm run lint` và `npm run build` trong `frontend/` pass.
- [ ] `docs/design.md` được cập nhật nếu có token hoặc component dùng chung mới.

Không auto-merge code do Stitch hoặc agent sinh ra. PR vào `main` là cổng duy nhất.

## 7. Ví dụ end-to-end: `/login`

Route: `frontend/app/(auth)/login/page.tsx` → `LoginContainer` →
`LoginView` (`src/modules/identity/components/login-view.tsx`) +
`src/modules/identity/styles/login.css`.

```bash
# 1. Chụp UI hiện tại
cd frontend && npm run dev            # cổng 3000
npx tsx <SKILL_DIR>/extract-static-html/scripts/snapshot.ts \
  --url http://localhost:3000/login \
  --output frontend/.stitch/references/login/current.html --wait 2000
```

```text
# 2. Đưa lên Stitch (prompt cho agent)
Dùng stitch::code-to-design đưa frontend/ vào Stitch project <PROJECT_ID>.
Design system lấy từ frontend/.stitch/DESIGN.md. Screen title: '/login'.

# 3. Redesign (prompt cho agent)
Dùng stitch::generate-design sửa screen '/login' trong project <PROJECT_ID>:
giữ nguyên hai cột bàn gỗ / giấy ô ly và linh vật, giữ ngôn ngữ sprite
(viền cứng 2px, bóng đặc không nhòe), chỉ sắp xếp lại phần biểu mẫu.
Tiếng Việt. Chỉ light mode. Không thêm trường hay chức năng mới.
```

```text
# 4. Chốt
frontend/.stitch/references/login/approved.png
frontend/.stitch/references/login/approved.md
```

```text
# 5. Implement (prompt cho agent)
Implement approved.png vào LoginView. Đọc trước
frontend/.stitch/references/login/approved.md, frontend/.stitch/DESIGN.md,
docs/design.md và mục 5 của docs/stitch-redesign-workflow.md.
Giữ nguyên LoginContainer, form schema và luồng đăng nhập.
```

Phạm vi được phép đổi ở `/login`: bố cục cột, thứ tự và khoảng cách trong biểu
mẫu, kiểu dáng trường và nút, vị trí linh vật, hành vi responsive.
Không được đổi: các trường của biểu mẫu, validate, `LoginContainer`, xử lý
session, `SESSION_COOKIE_NAME`.

## 8. Trạng thái hiện tại

Đã có trong repo (tracked): `frontend/.stitch/DESIGN.md`, quy ước
`frontend/.stitch/references/`, và tài liệu này.

Cấu hình agent, tất cả ở phạm vi repo, không đụng cấu hình toàn cục — cả ba đều
untracked theo `.gitignore` sẵn có:

| File | Nội dung |
| --- | --- |
| `.mcp.json` | MCP server `stitch` cho Claude Code |
| `.claude/settings.json` | Bật `stitch-design` + `stitch-utilities`, tắt `stitch-build` |
| `.codex/config.toml` | MCP server, marketplace và plugin `stitch-design` cho Codex |

Đã verify: `claude mcp get stitch` và `codex mcp get stitch` thấy server khi chạy
trong repo, và **không** thấy khi chạy ngoài repo.

### Lượt chạy thật đầu tiên (2026-09-07)

Stitch project: `11889732664035915530` ("Vietclass project").

| Bước | Kết quả |
| --- | --- |
| 2 — chụp UI | `frontend/.stitch/references/login/current.html`, 2.6 MB, 8 ảnh + 8 CSS url inline, 30 script gỡ. Mở lại trong trình duyệt: khớp bản chạy thật |
| 3 — upload `DESIGN.md` | Screen `DESIGN.md`, `screenType: DOCUMENT` |
| 3 — tạo design system | `create_design_system_from_design_md` → asset `6e6d739c9af145d0839845fc063365d6`, Stitch đặt tên **"Vở Ô Ly Modern"** |
| 3 — upload màn hình | Screen `/login`, `screenType: DESIGN`, `status: COMPLETE` |

Chưa chạy: bước 4 (sửa trong Stitch) và bước 5 (chốt) — đó là quyết định thiết
kế của người, nên `approved.png` / `approved.md` còn trống.

### Hai điều phát hiện khi chạy thật

**Stitch dựng lại bảng màu M3, không giữ nguyên hex của bạn.** Nó lấy
`primary` trong frontmatter làm hạt giống (`customColor`) rồi tự sinh cả thang
tonal: `primary` quay lại thành `#9e4200`, `surface` thành `#fff8f6`. Thứ **giữ
nguyên** là `customColor`, `font`/`headlineFont`/`bodyFont`/`labelFont`,
`colorMode: LIGHT`, `roundness`, và mọi màu đặt **tên riêng** —
`brand-orange`, `paper-cream`, `paper-raised`, `sidebar-warm`, `sidebar-accent`,
`sidebar-border`, `ember`, `leaf`, `orange-deep` đều về đúng hex. Hệ quả: màu nào
phải chính xác thì đặt tên riêng trong frontmatter, đừng trông vào các role M3.

**`upload_to_stitch.py` in log người đọc, không phải JSON thuần.** Nó ghi
`File:`, `MIME type:`, `Base64:`… rồi mới tới response. Đừng pipe thẳng vào
`json.load` — parser vỡ trong khi upload đã thành công, và nếu chạy lại sẽ tạo
màn hình trùng. Ghi ra file rồi đọc, hoặc cắt từ dấu `{` đầu tiên.

Không có tool `delete_screen`; chỉ có `delete_project`. Xóa nhầm một màn hình
phải làm trong giao diện Stitch.

## 9. Tham chiếu

- Hệ thống thiết kế: [`docs/design.md`](design.md)
- Hợp đồng thiết kế cho Stitch: `frontend/.stitch/DESIGN.md`
- Quy ước reference: [`frontend/.stitch/references/README.md`](../frontend/.stitch/references/README.md)
- Google Stitch: <https://stitch.withgoogle.com/>
- Stitch MCP setup: <https://stitch.withgoogle.com/docs/mcp/setup/>
- Stitch Skills: <https://github.com/google-labs-code/stitch-skills>
- Hướng dẫn viết prompt cho Stitch: <https://stitch.withgoogle.com/docs/learn/prompting/>
