---
name: Zocratis
description: A study companion built around your own documents. Ink on ivory paper.
colors:
  ink: "oklch(0.36 0.05 254)"
  vivid-ink: "oklch(0.6 0.18 254)"
  ink-text: "oklch(0.22 0.01 255)"
  ink-muted: "oklch(0.52 0.012 255)"
  ivory-paper: "oklch(0.982 0.006 85)"
  ivory-sheet: "oklch(0.995 0.004 85)"
  paper-shade: "oklch(0.955 0.007 85)"
  paper-edge: "oklch(0.9 0.008 85)"
  reading-tray: "oklch(0.89 0.006 85)"
  night-ink: "oklch(0.145 0.006 255)"
  night-sheet: "oklch(0.185 0.008 255)"
  ivory-light: "oklch(0.925 0.008 85)"
  ochre: "oklch(0.74 0.15 85)"
  success: "oklch(0.68 0.16 155)"
  warning: "oklch(0.82 0.16 82)"
  danger: "oklch(0.67 0.21 27)"
  info: "oklch(0.68 0.16 230)"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
  numeric:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    fontFeature: "tnum"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ivory-sheet}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "36px"
  button-ghost:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  segmented-track:
    backgroundColor: "{colors.paper-shade}"
    rounded: "{rounded.lg}"
    padding: "4px"
  segmented-thumb:
    backgroundColor: "{colors.ivory-sheet}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.md}"
    height: "32px"
  input:
    backgroundColor: "{colors.ivory-sheet}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.ivory-sheet}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Zocratis

## 1. Overview

**Creative North Star: "The Serene Library"**

Zocratis is a quiet reading room. Ink on ivory paper, soft daylight, nothing on the desk that isn't about the text. Students spend long sessions here, often at night, so the system optimizes for sustained focus: low visual noise, warm surfaces that are easy on the eyes, and one confident color (ink) that marks what matters. At night the room inverts: deep blue-black ink becomes the surface and ivory becomes the voice.

Personality lives in a few considered details rather than in decoration: the chisel-carving logo, a serif accent at the moments that deserve ceremony (a finished exam, an empty shelf, a page title), and precise micro-interactions that feel crafted, not animated for show. The system explicitly rejects generic AI SaaS (purple gradients, glows, "magic"), default shadcn templates, childish school apps and the gray bureaucracy of legacy academic platforms.

This is a product surface: familiar patterns where they help students move fast, Zocratis craft in the details.

**Key Characteristics:**
- Warm ivory paper surfaces, cool ink text and accents.
- One accent color (ink, ivory at night) used sparingly for actions, selection and focus.
- Geist for the interface, Instrument Serif italic only for moments of ceremony.
- Flat, tonal layering; shadows only where something genuinely lifts.
- Motion that confirms state in 150 to 250 ms with an ease-out curve, and nothing else.

## 2. Colors

A restrained palette: warm paper neutrals, one ink accent, and semantic colors reserved for meaning.

### Primary
- **Zocratis Ink** (oklch(0.36 0.05 254)): the logo's own blue-black ink. Primary actions, current selection, focus rings, links. In dark mode it inverts to **Ivory Light** (oklch(0.925 0.008 85)) so the brand keeps its contrast.

### Selection
- **Vivid Ink** (oklch(0.6 0.18 254)): the logo's ink hue, brightened. Marks what the user has selected over content, such as exam pages on the PDF and their thumbnails (3px border, 12% veil, check badge). The same in both themes, because PDF pages stay white. Never for buttons or links.

### Secondary
- **Ochre** (oklch(0.74 0.15 85); oklch(0.78 0.15 85) at night, `--ochre`): the warm highlighter. Favorites, marketing accents and rare moments of emphasis (a highlighted passage, a streak, a "commonly confused" note). Never for buttons or errors.

### Neutral
- **Ivory Paper** (oklch(0.982 0.006 85)): the page background in light mode.
- **Ivory Sheet** (oklch(0.995 0.004 85)): raised surfaces (cards, popovers, dialogs, the segmented thumb). The lightest value in the system; pure white is never used.
- **Paper Shade** (oklch(0.955 0.007 85)): tracks, secondary surfaces and subtle fills.
- **Paper Edge** (oklch(0.9 0.008 85)): borders, dividers and input strokes.
- **Reading Tray** (oklch(0.89 0.006 85)): the tray behind PDF pages, dark enough for pages to stand out.
- **Ink Text** (oklch(0.22 0.01 255)) and **Ink Muted** (oklch(0.52 0.012 255)): primary and secondary text.
- **Night Ink** (oklch(0.145 0.006 255)) and **Night Sheet** (oklch(0.185 0.008 255)): dark-mode page and raised surfaces.

### Semantic
- **Success** (oklch(0.68 0.16 155)), **Warning** (oklch(0.82 0.16 82)), **Danger** (oklch(0.67 0.21 27)), **Info** (oklch(0.68 0.16 230)): state only, always paired with an icon or text.

### Named Rules
**The Selection Rule.** Selection over content is Vivid Ink, distinct from the ink that marks the current position: a page can be both current (ink) and selected (vivid ink) without the two reading as one.

**The Ink Scarcity Rule.** Ink (ivory at night) covers at most 10% of any screen. It marks the next action and the current selection; if everything is ink, nothing is.

**The Paper, Not White Rule.** Light surfaces are always tinted toward ivory (hue 85, chroma 0.004 to 0.008). Pure white (#fff) is prohibited.

**The Tokens-Only State Rule.** Correct, warning and wrong states use the success, warning and danger tokens. Raw Tailwind palette colors (emerald, amber, rose), `white`/`black` utilities and color literals in arbitrary values are prohibited; ESLint rejects them (`eslint.config.mjs`).

**Data Colors.** Colors the user picks are data, stored as hex, and the only literals allowed: note and vocabulary highlights (`document/[id]/lib/note-colors.ts`, made for white PDF pages) and topic and folder colors (`workspace/lib/collection-colors.ts`, eight book-cloth tones tuned in OKLCH for ivory and night). Third-party brand marks (Google, Facebook) keep their own colors.

**Syntax Colors.** Code blocks reuse the tokens: keywords in ink, strings in success, numbers in ochre, functions in info, deletions in danger, comments in Ink Muted; the state hues are mixed 65% with the text color to keep 4.5:1.

## 3. Typography

**Display Font:** Instrument Serif, italic (with Georgia, serif)
**Body Font:** Geist (with system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (with ui-monospace) for scores, counts and tabular figures

**Character:** Geist is a calm, precise sans that disappears into the task; Instrument Serif italic is the scholar's voice, used sparingly so each appearance feels like a small ceremony.

### Hierarchy
- **Display** (Instrument Serif italic 400, 2.25rem, 1.1): page titles and moments of ceremony (exam results, empty states, section openers). Never for UI controls.
- **Headline** (Geist 600, 1.5rem, 1.25, tight tracking): screen and panel headings.
- **Title** (Geist 600, 1rem, 1.4): card titles, list item titles, dialog titles.
- **Body** (Geist 400, 0.875rem, 1.6): interface text. Reading content caps at 65 to 75ch.
- **Label** (Geist 500, 0.75rem, 0.08em tracking, uppercase): eyebrows and section labels above lists.
- **Numeric** (Geist Mono 600, tabular): scores, counters, credits.

### Named Rules
**The Ceremony Rule.** The serif appears at most once per screen and only for a moment worth marking. Buttons, labels, inputs and data are always Geist.

## 4. Elevation

Flat by default, built from tonal layers: Ivory Paper is the page, Ivory Sheet lifts content one step, Paper Shade recedes. Shadows are reserved for elements that truly float above the page or respond to state.

### Shadow Vocabulary
Both are Tailwind utilities (`shadow-lift`, `shadow-float`); never write a shadow by hand.
- **Lift** (`box-shadow: 0 1px 2px oklch(0.22 0.01 255 / 0.06)` plus a 1px Paper Edge ring): raised controls such as the segmented thumb.
- **Float** (`box-shadow: 0 12px 32px -12px oklch(0.22 0.01 255 / 0.18)`): dialogs, popovers, menus, toasts, the upload flyout, the reader's floating controls and the vocabulary card.

### Named Rules
**The Earned Shadow Rule.** A shadow means "this sits above the page right now". Static cards and panels use tone and a Paper Edge border, never a shadow.

## 5. Components

### Buttons
Calm and tactile: pill-shaped, they press slightly when clicked. One component, `components/ui/button.tsx`; icon-only actions use `IconButton`, whose required `label` is the accessible name and tooltip.
- **Shape:** fully rounded pills (9999px) for actions; icon buttons are circles.
- **Variants:** `default` (Zocratis Ink fill, Ivory Sheet text; one per view), `secondary` (Paper Shade fill), `outline` (Paper Edge stroke, no shadow), `ghost` (Ink Muted text, Paper Shade fill and ink text on hover), `ghost-destructive` (ghost that turns Danger on hover, for delete icons), `destructive` (Danger fill, only to confirm a deletion), `link`.
- **Sizes:** `sm` 32px, `default` 36px, `lg` 44px for page-level calls to action (sign in, plans), `icon` 32px, `icon-sm` 28px for dense toolbars and inline row actions.
- **Toggles:** a `ghost` button with `aria-pressed` shows the active state as a 10% ink tint with ink text. Single choice among options is a Segmented Control instead.
- **Dialogs:** the cancel action is `ghost`, so the weight stays on the confirming action.
- **Press:** scale to 0.97 on active (160 ms ease-out, `press-feedback`, built into the base); focus shows a 2px ink ring at 30% opacity.
- **Not buttons:** selectable rows, navigation items, thumbnails, answer options and color swatches keep their own styles; they are choices or places, not actions.

### Segmented Control (signature)
The single-choice selector (exam size, difficulty, grid or list view). Icon-only options carry an `ariaLabel`; `size="sm"` fits it in a 32px toolbar. A Paper Shade track (12px radius, 4px padding) holds options; the selected one is an Ivory Sheet thumb with Lift that slides to the choice in 200 ms ease-out (instant under reduced motion). Locked options show a lock icon at 50% opacity. Radio-group semantics, one tab stop, arrow keys.

### Cards / Containers
- **Corner Style:** 16px for page-level containers, 12px for inner groups.
- **Background:** Ivory Sheet on Ivory Paper; Night Sheet on Night Ink.
- **Shadow Strategy:** none at rest (The Earned Shadow Rule).
- **Border:** 1px Paper Edge.
- **Internal Padding:** 24px for containers, 16px for list rows.

### Inputs / Fields
- **Style:** Ivory Sheet fill (Night Sheet at night), 1px Paper Edge stroke, 10px radius; the stroke darkens slightly on hover. `Input` and `Textarea` share one class list, so every text control reads as one family.
- **Sizes:** `default` 36px; `lg` 44px with 15px text and 12px radius for single-task forms (sign in, sign up).
- **Focus:** stroke shifts to ink and a 2px ink ring at 30% opacity appears.
- **Error / Disabled:** Danger stroke with a message below; disabled at 50% opacity, no hover.
- **Field:** `Field` groups label, control and the hint or error below it, and hands the control its id, `aria-describedby` and `aria-invalid`; an error replaces the hint.
- **Own patterns:** the chat composer (the border belongs to its container), exam answers (underlined input) and in-place renames keep their own styles.

### Dialogs
Dialogs are for confirmations and short, focused tasks; prefer an inline panel or a page when one would do.
- **Surface:** Ivory Sheet, 16px radius, Paper Edge border, Float; 24px padding.
- **Scrim:** an ink veil (`bg-scrim`), no blur.
- **Layout:** title (Title style) and muted description aligned left; content; footer actions on the right, ghost cancel before the primary action. No shaded footer band.
- **Close:** an `IconButton` in the top-right corner.
- **Destructive confirmation:** a small Danger alert icon next to the title and a `destructive` confirm button.

### Menus
Dropdown menus: Ivory Sheet, 12px radius, Paper Edge border, Float, 4px padding; items are 32px tall with a 10px radius and a Paper Shade highlight.
- **Single choice** (sort order, theme, language) uses radio items: the chosen one is medium weight with a check on the right, so the state never rests on color alone.

### Checkbox
`components/ui/checkbox.tsx`: 16px, 5px radius, Paper Edge stroke that turns ink on hover; checked is an ink fill with an ivory check. Row and tile checkboxes hide until hover only where hovering exists (`can-hover` variant) and stay visible while anything is selected.

### Scrollbars
Native scrolling, styled once for the whole app: a muted thumb (45% Ink Muted) on a transparent track, set in `globals.css` and inherited everywhere. Panels, lists, menus and code blocks add `scrollbar-thin`; pages and the reader keep the regular width. A surface can blend the track with its own color through `--scrollbar-track` (the reader does). No JavaScript scroll areas.

### Vocabulary Card
A sheet of paper, not a spell: Ivory Sheet (Night Sheet at night) with a Paper Edge border and Float. The word is the screen's serif moment (Instrument Serif italic); meanings are a divided list, "commonly confused" notes sit on a 10% ochre tint and the tip on Paper Shade. No gradients, glows or sparkles. In the reader header, language mode active uses the 10% ink tint like any selected item.

### Navigation
- Side navigation sits on the `--sidebar` paper, slightly deeper than the content. Every entry is a `NavItem` (`components/ui/nav-item.tsx`): 32px, muted at rest, a 10% ink tint and ink text when current, counts in tabular mono on the right (`NavItemCount`).
- Headers are quiet: muted icon buttons, the brand mark, and at most one primary action. Where there is a hierarchy the title is a breadcrumb: ancestors are muted links, the current place is the heading.
- Search is a `SearchField` (`components/ui/search-field.tsx`) on a Paper Shade fill, named after its scope ("Buscar en Física") and focused with `/`.

### Workspace
- **Documents are pages, not files.** A document is drawn as a `PaperSheet` (Ivory Sheet with ruled lines and Lift); the ochre bookmark ribbon marks one being read. Tiles hold the sheet on a tray tinted 12% with the collection color.
- **Collections and folders share the colored folder icon** (`app/icons/Folder.tsx`), tinted with the color the user picked.
- Rows show study state, not file metadata: reading progress and when it was last opened. Size lives only in the quota.
- The open collection and folder live in the URL (`?topic=&folder=`).
- Uploads start at once and report per-file progress in a corner tray (Float); dragging files over the window shows the scrim with where they will land.

### Empty States
`components/ui/empty-state.tsx`: an optional illustration, the screen's serif title, one muted sentence and the next action. Never an icon in a gray circle.

## 6. Do's and Don'ts

### Do:
- **Do** let the document lead: chrome in Ink Muted, content in Ink Text.
- **Do** tint every light surface toward ivory (hue 85); use Ivory Sheet (oklch(0.995 0.004 85)) as the lightest value.
- **Do** use the serif once per screen at most, for a moment of ceremony.
- **Do** show what something costs or why it is limited before the user hits the limit, with an "Upgrade plan" link next to it.
- **Do** pair every state color with an icon or text, and keep 4.5:1 contrast for text in both themes.
- **Do** keep transitions between 150 and 250 ms with the ease-out curve (cubic-bezier(0.23, 1, 0.32, 1)) and drop movement under reduced motion.

### Don't:
- **Don't** look like generic AI SaaS: no purple gradients, glows, sparkles or "magic" framing of AI, and no hero-metric cards with giant numbers.
- **Don't** ship default shadcn looks: no black or outline button toggles and no identical card grids. Adapt the component to these tokens first.
- **Don't** hand-style a `<button>` for an action: use a `Button` variant or `IconButton`, and add a variant when a pattern repeats.
- **Don't** drift into a childish school app: no saturated rainbow palettes, cartoon illustrations or gamification that interrupts study.
- **Don't** resemble legacy academic platforms like Moodle or Blackboard: no gray bureaucracy or dense tables without hierarchy.
- **Don't** use pure white (#fff) or pure black (#000) anywhere.
- **Don't** use raw Tailwind palette colors, `text-white`/`bg-black` or color literals in class names; use the tokens (the linter enforces it).
- **Don't** use side-stripe borders thicker than 1px as accents, gradient text, or glassmorphism as decoration.
- **Don't** open a modal when an inline panel or a page would do.
