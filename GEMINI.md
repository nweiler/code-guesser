# CodeGuesser AI Manifest

CodeGuesser is a web-based game where users are presented with a code snippet from a popular GitHub repository and must guess which repository it belongs to.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** Vanilla CSS (globals.css)
- **API:** GitHub REST API
- **Testing:** [Vitest](https://vitest.dev/)
- **Code Highlighting:** [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)

## Project Structure

- `src/app/`: Next.js pages and actions.
- `src/components/`: Reusable React components (e.g., `HistoryDrawer`).
- `src/lib/`: Core logic, types, and utility functions.
- `src/data/`: Static data (e.g., list of repositories).

## Key Workflows

- **Game Logic:** Handled in `src/app/page.tsx` and `src/app/actions.ts`.
- **History Tracking:** Persisted in local storage via `src/lib/history.ts`.
- **Fetching Snippets:** Randomly selects a repository and file via `src/lib/github.ts`.

## Development Guidelines

- Use `npm run dev` for local development.
- Ensure all new logic is tested with Vitest.
- Adhere to the established Vanilla CSS styling pattern in `src/app/globals.css`.
- Maintain type safety across the application.
