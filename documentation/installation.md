# Installation instructions

## Requirements

- Node.js 22 or newer
- npm (included with Node.js)
- An internet connection to install npm dependencies and load the public NASA/NOAA data endpoints

## Install and run

From the repository root, enter the application folder and install the locked dependencies:

```sh
cd source-code
npm ci
```

Start the local development server:

```sh
npm run dev
```

Open the local URL printed by Vite in your browser.

## Production build

Build the application:

```sh
npm run build
```

The build runs the TypeScript check before generating optimized production files in `source-code/dist/`.

To serve the production build locally:

```sh
npm run preview
```

## Dependency maintenance

The committed `source-code/package-lock.json` records the dependency tree. Use `npm ci` for a reproducible installation. When intentionally changing dependencies, update the package manifest and lock file together.

The GitHub Actions workflow runs the production build and audits production dependencies from `source-code/`.
