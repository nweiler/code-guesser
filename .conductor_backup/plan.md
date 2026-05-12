# CodeGuesser: Product & Implementation Plan

## Objective
Create a visually engaging web-based game where players are presented with a random code snippet from a popular GitHub repository and must guess the correct project from a multiple-choice list. 

## Background & Motivation
Similar to GeoGuessr, this game tests developers' knowledge of popular open-source codebases, idiomatic patterns, and project structures. It provides a fun, educational way to explore famous repositories.

## Scope & Proposed Solution

### Tech Stack
*   **Framework:** Next.js (App Router). This allows us to use React for the frontend and Next.js Server Actions for secure, server-side data fetching (hiding GitHub API keys).
*   **Styling:** Vanilla CSS (CSS Modules) to keep styling lean and maintainable without relying on Tailwind CSS.
*   **Deployment Target:** Vercel (or standard Node.js server), allowing seamless execution of Next.js Server Actions.

### Core Mechanics
1.  **Snippet Selection:** A Next.js Server Action will select a random repository from a pre-defined list of high-star repositories (covering various popular languages like Python, Go, Rust, JS/TS, Java). It will use the GitHub API to fetch a random file's contents from the chosen repository.
2.  **Display:** The code snippet will be displayed using a syntax highlighter (e.g., Prism.js or highlight.js) with a sleek, IDE-like aesthetic.
3.  **Guessing (Multiple Choice):** The user will be presented with 4 repository names. One is the correct answer; the other three are randomly selected from the pool of popular repositories.
4.  **Scoring & Progression:** The user scores points for correct answers. We can implement streaks or a simple point system. 

### Visual Design
*   **Theme:** Dark mode by default, mimicking a modern IDE (VS Code / JetBrains).
*   **Typography:** Monospace font (e.g., Fira Code or JetBrains Mono) for the code snippet, paired with a clean sans-serif for the UI.
*   **Feedback:** Satisfying visual and CSS-based animated feedback for correct (green glow) and incorrect (red shake) guesses.

## Phased Implementation Plan

### Phase 1: Setup & Data Scaffolding
*   Initialize the Next.js project with App Router.
*   Configure CSS Modules for styling.
*   Create a curated list (JSON array) of ~50-100 popular GitHub repositories (owner/repo) across various languages.

### Phase 2: Backend Integration (Server Actions)
*   Implement a server action to select a random repo from the curated list.
*   Implement GitHub API calls to:
    *   Fetch the default branch tree for the selected repo.
    *   Pick a random file (filtering out non-code files like `.md`, `.json`, image assets, etc.).
    *   Fetch the raw content of the selected file.
*   Generate 3 incorrect distractors from the curated list.

### Phase 3: Frontend & Game Loop
*   Build the main game UI: Code snippet viewer and 4 multiple-choice buttons.
*   Integrate a syntax highlighter component.
*   Implement the state machine for the game: `loading` -> `guessing` -> `result` -> `loading next`.
*   Add visual polish, transitions, and score tracking.

### Phase 4: Refinement
*   Add basic error handling (e.g., if a fetched file is too large or API rate limits are hit).
*   Enhance the visual design with a custom logo/header and footer.

## Verification
*   Verify the app runs locally without errors.
*   Ensure snippets are cleanly fetched and displayed.
*   Confirm the multiple-choice logic correctly identifies wins and losses.
*   Verify no GitHub API keys are exposed to the client.