# Technologies used

Versions below are defined in `source-code/package.json`.

| Technology | Version | Purpose |
| --- | --- | --- |
| React | 18.3.x | Component-based user interface |
| React DOM | 18.3.x | Browser rendering |
| TypeScript | 5.7.x | Typed application code and compile-time checks |
| Vite | 6.4.x | Development server and production bundler |
| Tailwind CSS | 3.4.x | Utility-first styling |
| Zustand | 5.0.x | Application state management |
| Lucide React | 0.468.x | Interface icons |
| Vite PWA plugin | 1.3.0 | Progressive Web App build integration |

## Development and quality checks

- Node.js 22 or newer is required by the package manifest.
- `npm run build` runs `tsc --noEmit` and then creates the Vite production build.
- GitHub Actions checks Node.js 22 and 24, builds the app, and runs `npm audit --omit=dev`.

Exact dependency versions are maintained by `source-code/package-lock.json`.
