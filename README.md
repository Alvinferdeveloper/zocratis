<div align="center">

<!-- IMAGE: Zocratis logo (mark + wordmark), ~120px tall -->

# Zocratis

**A study companion built around your own documents.**

Read, ask, take notes and test yourself without ever leaving the PDF.

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<img width="1918" height="1032" alt="image" src="https://github.com/user-attachments/assets/b7345629-8802-4664-ae45-2b91a85c55cc" />

</div>

---

## Why Zocratis

Students already have the material: lecture notes, papers, textbooks. What they lack is a way to turn those pages into understanding they can prove. Zocratis reads _with_ you (a chat grounded in your PDF, notes, translation, vocabulary) and _examines_ you (exams, flashcards and spaced repetition generated from the pages you choose).

The name points to Socrates: learning by questioning. The interface follows the same idea. It feels like a quiet library, ink on ivory paper, so your attention stays on the text and not on the app.

Zocratis is for:

- **University students** who study long PDFs and prepare for exams.
- **Language learners** who read in another language and build vocabulary from what they read.
- **Self-directed learners and researchers** studying for certifications or working through papers on their own.

---

## Features

### Workspace

Organize everything you study in collections and nested folders, with favorites, grid and list views, and a curated color palette.

- **Continue reading:** the last half-read document waits for you at the top, and every document shows how far you have read ("Page 34 of 120 · 28 %").
- **Plan usage at a glance:** document and storage quotas live in the sidebar, and uploads are blocked before you hit a limit, not after.

<img width="1918" height="588" alt="image" src="https://github.com/user-attachments/assets/a28ea8af-254f-4568-a594-aba652e05243" />

### The reader

A PDF reader designed for long study sessions.

- **Picks up where you left off**, with a one-click "back to the start".
- **Search inside the PDF** (`Ctrl/Cmd + F`):
  - **Exact** across every page, ignoring accents, case and ligatures.
  - **By meaning**, returning the passages closest to what you ask even when the words differ.
- **Navigable outline**, read from the PDF's own table of contents, with the current section marked.
- **Page thumbnails** in a collapsible sidebar.
- **Notes and vocabulary panel**, grouped by page and searchable; clicking an item jumps straight to its highlight.
- **Export** your notes as Markdown, PDF, JSON, CSV or an Anki deck (`.apkg`).

<img width="1917" height="1030" alt="image" src="https://github.com/user-attachments/assets/4dd8d223-d166-4deb-a98a-6c3095765946" />


### AI chat with citations

Ask anything about the document. Answers are grounded in the most relevant passages of your PDF, and every claim is cited inline.

- **Inline citations:** hover a citation to preview the passage and its page; click it to open the PDF at that exact passage, highlighted.
- **Ask about a selection:** select text in the PDF and send it to the chat as a quote.
- **Saved conversations**, grouped by date, plus suggested follow-up questions after each answer.
- **Images and formulas:** draw a box around a figure or an equation and ask about it.

<img width="1321" height="692" alt="image" src="https://github.com/user-attachments/assets/ac0785a0-ad2a-49a7-9ad0-7ddee25644b5" />


### AI notes

Highlight a passage and turn it into a note: an explanation, a summary or your own words. Notes are streamed as they are written, can be refined with a follow-up instruction, and show changes as an editor-style diff before you save them. Each note keeps its highlight color on the page.

<!-- IMAGE: note dialog — a highlighted passage and its generated note -->

### Language mode

For reading in another language:

- **Quick translation** of any selection, in any mode.
- **Vocabulary card** for a saved word: meanings, examples with translation, phonetics, commonly confused words and a usage tip.
- **Personal vocabulary per document**, highlighted on the page, ready to become flashcards.

<img width="530" height="247" alt="image" src="https://github.com/user-attachments/assets/893c60bc-96d7-49cb-ac24-a95af2344831" />


### Exams: practice and simulation

Pick the pages you want to be tested on, then choose the question type (multiple choice, true/false, fill in the blank, open answer or mixed), the difficulty and the size (5, 10, 15 or 20 questions). The credit cost is shown before generating.

- **Practice mode:** each answer is graded as you give it, with feedback against the ideal answer.
- **Simulation mode:** a real exam. You get a time limit and can move freely between questions. Answers can be changed until you hand in, and the exam submits automatically when time runs out.
- **History of every exam and attempt:** resume, review, retake or rename. Reloading the page never loses an attempt.

<img width="1918" height="1023" alt="image" src="https://github.com/user-attachments/assets/18fa91e3-7680-4efa-8f81-304245855abc" />

<img width="1382" height="1023" alt="image" src="https://github.com/user-attachments/assets/38257fc8-515f-4aa9-a879-25a4cc64791d" />


### Flashcards and spaced repetition

Turn what you study into cards and remember it for good.

- **Create cards in several ways:**
  - write them by hand;
  - select text in the PDF;
  - add your saved words in one click;
  - let the AI propose 1–3 cards from a note, then accept, edit or discard each one.
- **Free practice:** flip through a document's deck at your own pace.
- **Spaced repetition (FSRS):** review what is due, rated _Again / Hard / Good / Easy_, with the next interval shown under each option and keyboard shortcuts (`Space`, `1–4`). Review everything at once or one document at a time.

<img width="1087" height="957" alt="image" src="https://github.com/user-attachments/assets/9699afd0-20d6-4d41-8c9e-748e79276466" />


### Plans and credits

AI actions spend credits from your plan's allowance, which renews daily on the free plan and monthly on paid plans. The reader shows your balance at all times, and limits always come with their renewal time and a way to upgrade. Payments are handled with PayPal.


### Built for long sessions

- Light and dark themes, both designed (dark is not just inverted).
- Spanish and English interface. The AI answers in the language of your content, independently of the interface language.
- Keyboard-friendly and accessible by design (WCAG 2.2 AA as the target).

---

## Architecture

Zocratis is made of three services:

| Service | Role | Stack |
| --- | --- | --- |
| **Frontend** (this repository) | Landing, workspace, reader, exams, flashcards, plans | Next.js 15 (App Router), React 19 |
| **[API](https://github.com/Alvinferdeveloper/zocratis-api)** | Auth, documents, AI features, RAG, exams, FSRS, credits, payments | NestJS 11, TypeORM, MySQL |
| **Parser** | Converts uploaded PDFs to structured Markdown and locates their images | Python, FastAPI, PyMuPDF |

Files and document embeddings are stored in Supabase (Storage + pgvector). AI runs on Google Gemini through the Vercel AI SDK, translation uses DeepL, and every AI call is metered by tokens and cost.

---

## Tech stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Turbopack) with [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) with an in-house design system on top of [Radix UI](https://www.radix-ui.com/) primitives
- **Data:** [TanStack Query](https://tanstack.com/query), [Zod](https://zod.dev/)
- **AI streaming:** [Vercel AI SDK](https://ai-sdk.dev/)
- **PDF:** [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`, legacy build) with our own viewer, selection and highlight layer
- **i18n:** [next-intl](https://next-intl.dev/) (Spanish and English)
- **Auth:** [Better Auth](https://www.better-auth.com/) (email, Google and GitHub)
- **Payments:** [PayPal](https://developer.paypal.com/)
- **Package manager:** [pnpm](https://pnpm.io/)

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- The [API](https://github.com/Alvinferdeveloper/zocratis-api) running locally (it listens on `http://localhost:3001` by default)

### Setup

```bash
git clone https://github.com/Alvinferdeveloper/zocratis.git
cd zocratis
pnpm install
pnpm dev
```

The app runs on [http://localhost:3100](http://localhost:3100).

### Environment variables

Every variable is validated at startup (`src/config/env.ts`). In development each one falls back to a local default, so a `.env.local` is only needed to point somewhere else. In production a missing variable stops the build.

| Variable | Purpose | Development default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_AUTH_URL` | Better Auth server | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_URL` | Public site URL (metadata, sitemap, Open Graph) | `http://localhost:3100` |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal client ID | `sb` (PayPal sandbox) |

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Development server with Turbopack on port 3100 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build on port 3100 |
| `pnpm lint` | ESLint |

---

## Project structure

```text
src/
├── app/
│   ├── [locale]/            # Every page, under the locale (Spanish without prefix, English under /en)
│   │   ├── (main)/          # Marketing landing
│   │   ├── (auth)/          # Sign in and sign up
│   │   ├── workspace/       # Collections, folders and documents
│   │   ├── document/[id]/   # Reader, chat, notes, language mode, exams and flashcards
│   │   ├── review/          # Spaced repetition sessions
│   │   └── subscription/    # Plans, usage and checkout
│   ├── robots.ts, sitemap.ts, manifest.ts
│   └── types.ts
├── components/              # Design system (ui/), brand mark, locale switcher, SEO
├── config/                  # Site identity, routes, SEO and validated env
├── hooks/                   # Shared hooks (stored preferences)
├── i18n/                    # Locale routing and locale-aware navigation
├── lib/                     # API client, API error mapping, formatting
└── messages/{es,en}/        # UI copy, one namespace per feature
```

---

## Design

The interface follows **"The Serene Library"**: warm ivory paper, one ink accent used sparingly, Geist for the interface and Instrument Serif only for moments of ceremony. It deliberately avoids the generic "AI SaaS" look (purple gradients, glows, sparkles). Colors come only from theme tokens, and ESLint rejects raw palette colors.

- [`PRODUCT.md`](./PRODUCT.md): users, purpose, brand personality and design principles.
- [`DESIGN.md`](./DESIGN.md): colors, typography, elevation, components and their rules.

---

## Where we are heading

Zocratis starts with studying, but the goal is bigger: to become the platform that powers the next generation of scientific work. The path from student to researcher continues with work across many documents with cross-references, and with shared knowledge: documents with their notes, exams and flashcards that others can reuse and build on, like code on GitHub. See the **Vision** section in [`PRODUCT.md`](./PRODUCT.md).

---

<div align="center">

© 2026 Zocratis. All rights reserved.

</div>
