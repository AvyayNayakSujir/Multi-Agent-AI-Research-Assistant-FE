# Multi-Agent Research Assistant (FRONTEND)

A high-fidelity, real-time chat interface designed for orchestrating and rendering deep web research workflows. The application connects to an external multi-agent backend via Next.js server-side streaming proxies, tracking task stages sequentially (searching, scraping, synthesizing) and rendering final report with host-level inline citations.

---

## Key Features

- **Live Server-Sent Events (SSE) Stream**: Feeds real-time progress steps and final research outputs directly into a unified React state hook.
- **Collapsible Status Accordion**: Monitors the sequential process of the agent research loop (`Searching sources...`, `Scraping & filtering...`) with clean visual status indicators and exact step timestamps.
- **Rich Markdown Reports**: Renders comprehensive research drafts with headings, formatted bullet points, structured comparison tables, and code snippets.
- **Interactive Source Citations**: Extracts references from the API payload and showcases them as responsive visual link cards containing the domain name and title.
- **Bulletproof Error Sanitizer**: Translates dense and complex LLM model rate limit strings (e.g. Groq TPD/RPM/TPM limit alerts) and HTTP error statuses into polite, user-friendly instructions.
- **Collapsible Sidebar**: Slide-out history drawer (`w-64` to `w-0` transition) allowing users to maximize horizontal workspace space.
- **Lazy Session Initialization**: Keeps history logs pristine by only creating and persisting chat sessions in local storage when the user sends their first query.
- **Clean Vector PDF Exports & Prints**: Includes custom media query layouts designed to isolate and format the research drafts for high-quality printer paper and PDF layouts.

---

## Technology Stack

- **Framework**: Next.js 16 (React 19, Turbopack)
- **Styling**: Tailwind CSS v4 (Class-based dark mode configuration)
- **Icons**: Lucide React
- **Text Rendering**: React Markdown & Remark GFM (Github Flavored Markdown)

---

## Clean Project Structure

The project maintains a modular, decoupled layout:

```text
├── app/
│   ├── api/v1/research/stream/   # Server-side Route Handler proxying events to Railway
│   ├── layout.tsx                # Initial SSR theme config
│   └── page.tsx                  # Main workspace layout containing sidebar and chat hook bindings
├── components/
│   ├── ChatArea.tsx              # Workspace manager for landing views and active textareas
│   ├── MessageItem.tsx           # Message card containing markdown parsers and download buttons
│   ├── Sidebar.tsx               # Collapsible sidebar containing mode toggles and session lists
│   └── StatusProgress.tsx        # Accordion listing active research stages
├── hooks/
│   └── useSSE.ts                 # React hook parsing stream buffers and driving loading states
├── utils/
│   ├── api.ts                    # Dedicated API client forwarding searches to local routes
│   ├── download.ts               # Exporters for printing, PDF layout frames, and clipboard copy
│   └── sse.ts                    # SSE buffer parsing functions and error sanitizers
└── types/
    └── index.ts                  # Type definitions for messages, sessions, and steps
```

---

## Getting Started

### 1. Configure Environment Variables
Create a `.env` file in the root directory using the `.env.example` file

### 2. Run the Development Server
Install dependencies and run the client:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start searching.

### 3. Build for Production
To build and optimize the project for deployment:

```bash
pnpm build
pnpm start
```
