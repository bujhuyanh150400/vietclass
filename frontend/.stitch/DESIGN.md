---
name: VietClasses
colors:
  background: '#ffffff'
  on-background: '#09090b'
  surface: '#ffffff'
  surface-dim: '#f8f1e6'
  surface-bright: '#fffdf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fffdf7'
  surface-container: '#fdf5e8'
  surface-container-high: '#f8f1e6'
  surface-container-highest: '#f0e4d2'
  surface-variant: '#f4f4f5'
  on-surface: '#09090b'
  on-surface-variant: '#71717b'
  inverse-surface: '#1b1614'
  inverse-on-surface: '#fdf5e8'
  outline: '#e4e4e7'
  outline-variant: '#e7d9c5'
  surface-tint: '#fd7110'
  primary: '#fd7110'
  on-primary: '#1b1614'
  primary-container: '#fd9e01'
  on-primary-container: '#1b1614'
  inverse-primary: '#fd9e01'
  secondary: '#f4f4f5'
  on-secondary: '#18181b'
  secondary-container: '#f4f4f5'
  on-secondary-container: '#18181b'
  tertiary: '#78310a'
  on-tertiary: '#fdf5e8'
  tertiary-container: '#f8f1e6'
  on-tertiary-container: '#78310a'
  error: '#d62b0c'
  on-error: '#fffdf7'
  error-container: '#fdf5e8'
  on-error-container: '#d62b0c'
  success: '#2e7d55'
  on-success: '#fffdf7'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
  body-base:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: '0'
  label-xs:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: '0'
  wordmark:
    fontFamily: Silkscreen
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 13px
    letterSpacing: 0.06em
  mono-sm:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
rounded:
  sm: 0.375rem
  DEFAULT: 0.625rem
  md: 0.5rem
  lg: 0.625rem
  xl: 0.875rem
  sprite: 3px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
---

# Design System: VietClasses

VietClasses is a Vietnamese classroom-management web app (Next.js App Router,
Tailwind CSS v4, shadcn/ui `new-york` on Radix). This document is the design
contract handed to Stitch. The authoritative, code-level reference lives at
`docs/design.md` in the repository; when the two disagree, the code and
`docs/design.md` win and this file must be regenerated.

## 1. Visual Theme & Atmosphere

The product borrows its materials from a Vietnamese classroom desk. The brand
palette was sampled from a pixel-art owl mascot: a warm plumage orange
(`#fd7110`) anchors everything, sitting on brown-black ink (`#1b1614`) and the
cream of *vở ô ly*, the squared exercise book Vietnamese pupils write in
(`#fdf5e8`). Nothing in the palette is cool or corporate; even the greys lean
warm the moment they touch a branded surface.

Two registers coexist. The signed-out screens are **tactile and playful**: a
dark wooden desk lit from above, an open notebook page ruled in 22px squares,
hard 2px outlines and solid unblurred offset shadows that make controls read as
physical sprites. The signed-in application is **quiet and dense**: a warm paper
sidebar, a white inset content pane, standard shadcn/ui surfaces, and orange
reserved almost entirely for the primary action on the screen. Density is
moderate — data tables and forms are the dominant content, spacing is generous
enough to scan but never decorative. Light mode only; there is no dark theme and
none should be designed.

## 2. Color Palette & Roles

### Primary Foundation

- **Paper Cream `#fdf5e8`** — the notebook sheet. Sign-in page, sidebar family.
- **Raised Paper `#fffdf7`** — inputs and lifted blocks on the cream ground.
- **Sidebar Paper `#f8f1e6`**, **Sidebar Accent `#f0e4d2`**, **Sidebar Border
  `#e7d9c5`** — the warm sheet the app shell rests on.
- **White `#ffffff`** — the inset content pane and every card in the app.
- **Ink `#1b1614`** — brown-black. Text, the dark desk ground, and every hard
  outline in the sprite language.

### Accent & Interactive

- **Brand Orange `#fd7110`** — the one brand color. Primary buttons, active
  navigation, focus glow, the sprite shadow on a focused field.
- **Orange Deep `#d8500a`** — focus rings and pressed accents.
- **Gold `#fd9e01`** — warm secondary accent, used sparingly.
- **Wood `#78310a`** — desk grain, muted warm text on cream, notebook rules.

### Typography & Text Hierarchy

- **Ink `#1b1614` / Zinc-950 `#09090b`** — primary text.
- **Warm Muted `#7a5a45`** — supporting copy on cream surfaces.
- **Zinc-500 `#71717b`** — supporting copy on white surfaces.

### Functional States

- **Ember `#d62b0c`** — destructive actions, validation errors.
- **Leaf `#2e7d55`** — success. This is an extension beyond stock shadcn/ui.
- Never signal state with color alone; pair it with an icon or text.

## 3. Typography Rules

### Hierarchy & Weights

**Be Vietnam Pro** (400–800) sets the entire interface. This is not a stylistic
preference: every string in the product is Vietnamese, and Be Vietnam Pro
carries the full diacritic set with stacked tone marks that neither clip nor
drift off their vowels. Any substitute face must be verified against
`ế ậ ữ ỗ ọ` before it is proposed.

**Silkscreen** is a bitmap face with **no Vietnamese diacritics at all**. It is
therefore confined to the Latin-only wordmark `VIETCLASSES` and must never touch
interface copy. **Geist Mono** is available for monospaced values.

Scale in use: page and card headings at 600–700; the sign-in headline at 800
with `-0.02em` tracking; body copy at 400; form labels and buttons at 500; hints
and field errors at 12px. The signed-in topbar title is deliberately small
(14px/600) — the sidebar carries the brand, the topbar does not repeat it.

### Spacing Principles

Tailwind's default type scale is used as-is; there are no custom typography
tokens. Body copy uses relaxed leading; headings use tight leading.

## 4. Component Stylings

### Buttons

Application buttons are shadcn/ui `new-york`: `0.5rem` radius, 14px/500 label,
36px default height, with `xs`/`sm`/`lg` and matching icon-only sizes. Variants:
solid orange primary (ink label), destructive ember, outline, secondary
(zinc-100), ghost, link. Focus shows a 3px orange ring.

The sign-in submit is a different object — a **physical key**: 2px ink border,
3px radius, a solid `5px 5px 0` ink shadow, no blur. On hover it travels 2px
into its own shadow; on press it travels the full 5px and the shadow collapses
to zero. Transitions run in `steps()`, not eases, so the motion reads at sprite
resolution.

### Cards & Containers

Cards are white, 1px zinc-200 border, `0.625rem` radius, and rely on the border
rather than shadow for separation. On the sign-in page the equivalent container
is the ruled paper itself: 22px squares with a heavier rule every fifth square,
and a punched binding with spine shadow along the inner edge from the 1024px
breakpoint up.

### Navigation

A fixed sidebar rail on desktop, a drawer below the mobile breakpoint, on the
warm paper ground. It holds the brand lockup, the navigation groups, and the
account menu. The topbar is a 64px bordered strip containing only the sidebar
trigger and the current page title.

### Inputs & Forms

Application fields are shadcn/ui inputs: 1px zinc-200 border, `0.5rem` radius,
label above, hint and error text at 12px directly below. The error message is
the only red element; the field border also turns ember.

Sign-in fields are sprite blocks: 2px ink border, 3px radius, raised-paper fill,
a solid `3px 3px 0` shadow at 26% ink. On focus the shadow becomes solid orange
and a 3px ink outline appears at 2px offset. Invalid fields swap ink for ember.

Form layout: a card body on a `24px` grid, two columns from the `sm` breakpoint,
`6px` between a label and its control, `12px` between buttons in an action row.

### Data Tables & List Screens

List screens are a vertical `24px` stack: a toolbar row (right-aligned, wrapping,
`8px` gaps, a 32px search box that is full-width on mobile and 256px from `sm`),
an optional row of active-filter tags, the table, then pagination. The empty
state sits inside the table area — centered illustration, message, and at most
one action, on a `40px` vertical pad.

### Brand Lockup

The owl app mark beside the `VIETCLASSES` wordmark, `10px` apart. The mark is
scaled down and must be rendered smoothly; only the large mascot artwork is
pixel-sampled. The mascot appears on the sign-in page only.

## 5. Layout Principles

### Grid & Structure

Signed-in: sidebar plus inset content pane, content padded `16px/24px` at mobile
and `24px/32px` from `sm`. Signed-out: a two-column split at `1024px` and above —
a `1.15fr` dark desk column carrying brand and mascot, and a `1fr` paper column
carrying the form, with the form body capped at `26rem`.

### Whitespace Strategy

A 4px base rhythm. `24px` between page-level regions, `20px` between fields in a
form grid, `8px` inside toolbars. Space is functional; the app is dense with
records and should not be padded into needing extra scrolling.

### Alignment & Visual Balance

Content is left-aligned and top-aligned; only empty states and the sign-in
column are centered. Toolbars align right, page titles align left.

### Responsive Behavior & Touch

Breakpoints are Tailwind defaults (`sm` 640px, `lg` 1024px). Below `lg` the
sign-in split collapses to one column with a compact desk band holding the
brand and a shortened mascot. Below the mobile breakpoint the sidebar becomes a
drawer. Tables scroll horizontally rather than reflowing into cards. All motion
must have a `prefers-reduced-motion` branch.

## 6. Design System Notes for Stitch Generation

### Language to Use

All UI copy must be **Vietnamese**, matching the existing product voice: formal
but warm, `bạn` for the user, sentence case for labels and buttons. Do not
generate English placeholder copy.

Describe the atmosphere as "warm paper and ink, Vietnamese exercise-book
material, light mode only, one orange accent". Ask for "hard 2px outlines and
solid unblurred offset shadows" only for sign-in and other unauthenticated
screens; ask for "clean bordered cards, no shadow" for everything inside the app
shell.

### Color References

Brand Orange `#fd7110`, Orange Deep `#d8500a`, Gold `#fd9e01`, Ink `#1b1614`,
Paper Cream `#fdf5e8`, Raised Paper `#fffdf7`, Wood `#78310a`, Ember `#d62b0c`,
Leaf `#2e7d55`, Sidebar Paper `#f8f1e6`, White `#ffffff`.

### Component Prompts

- "Trang danh sách học sinh: sidebar giấy ấm bên trái, topbar mỏng, thanh công
  cụ căn phải với ô tìm kiếm và nút lọc, bảng dữ liệu viền mảnh, phân trang bên
  dưới. Nền trắng, viền xám nhạt, chỉ nút chính màu cam #fd7110."
- "Form tạo lớp học trong một card trắng: lưới hai cột, nhãn phía trên ô nhập,
  dòng gợi ý 12px bên dưới, hàng nút Lưu / Hủy căn trái ở cuối card."
- "Trạng thái rỗng trong bảng: minh họa nhỏ ở giữa, một dòng thông báo tiếng
  Việt, một nút hành động duy nhất."

### Incremental Iteration

Design one screen or one small flow per pass. Do not let Stitch introduce
business features, entities, or navigation items that the screen's scope does
not already contain. Do not ask Stitch for a dark variant.
