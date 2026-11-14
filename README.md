# ASTRA-ONE-FINAL

**Astra One** is a bilingual educational space-outpost simulation designed to help children aged 7–12 explore the challenges of managing a lunar or Martian mission.

Explorer mode introduces the essential resources — oxygen, power, food, and water — before progressively making additional systems available. Through interactive scenarios and decision-based gameplay, players learn how resource management, radiation awareness, and communication delays influence mission operations.

Astra One is an educational simulation built around simplified game models. It is not a NASA product, nor is it intended for engineering, medical, or real-world mission-planning purposes.

## Source Code

The application source code, static assets, npm manifests, and build configuration are located in [`source-code/`](./source-code/).

The main application logic and user interface are located in [`source-code/src/`](./source-code/src/).

## Installation and Setup

### Requirements

- Node.js 22 or newer
- npm

### Install Dependencies

From the project root, run:

```sh
cd source-code
npm ci
```

### Start the Development Server

```sh
npm run dev
```

Vite will provide a local URL once the development server is ready.

### Build for Production

```sh
npm run build
```

### Preview the Production Build

Run this after building:

```sh
npm run preview
```

For additional setup details, see the [Installation Guide](./documentation/installation.md).

## Data Sources

Astra One incorporates data from the following space-weather sources:

- **NASA CCMC DONKI:** Provides Coronal Mass Ejection (CME) event information through its space-weather database.
- **NOAA GOES:** Provides proton-flux observations used in the space-weather monitoring experience.

The application also provides links to relevant planetary and radiation-science references.

For source details and attribution, see [Scientific Sources](./documentation/scientific-sources.md).

### Important Data Limitations

Real space-weather observations do not automatically represent environmental conditions or radiation exposure at a lunar or Martian outpost.

NOAA GOES observations are used as educational decision-making prompts. They do not directly calculate local lunar or Martian radiation doses, and they do not automatically modify the simulation's modeled crew health or radiation dose.

## Technologies Used

The application is built using:

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Lucide React
- Vite PWA Plugin

For more information, see [Technologies Used](./documentation/technologies-used.md).

## Scientific Methodology

The in-app data reference classifies information into three categories:

- **REAL DATA:** Values obtained from actual scientific observations or published datasets.
- **DERIVED:** Values calculated or transformed from referenced scientific data.
- **GAME MODEL:** Simplified parameters and values created for educational gameplay.

Resource consumption rates, greenhouse production, power requirements, radiation inputs, and gameplay effects are simplified training parameters. They should not be interpreted as NASA mission requirements or validated engineering predictions.

For further details about data classification, assumptions, and limitations, see [Data Methodology](./documentation/data-methodology.md).

The Arabic parameter catalog is available in [Game Data Sources](./documentation/game-data-sources-ar.html).

## Project Structure

```text
ASTRA-ONE-FINAL/
│
├── source-code/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   └── build configuration files
│
├── documentation/
│   ├── installation.md
│   ├── scientific-sources.md
│   ├── data-methodology.md
│   ├── technologies-used.md
│   └── game-data-sources-ar.html
│
├── demo/
│   └── screenshots/
│
├── presentation/
│
├── .github/
├── .gitignore
└── README.md
```

## Demo and Presentation

The `demo/` and `presentation/` directories are reserved for project demonstration materials.

Demo videos, screenshots, a project overview PDF, and presentation slides were not included in the supplied project files at the time of this documentation. No placeholder files are presented as completed materials.

## Project Scope

Astra One is designed as an educational experience that introduces younger learners to the complexity of space exploration through simplified simulations and interactive decisions.

Its models are intended to support learning and experimentation, not to reproduce the full complexity of actual lunar or Martian mission systems.
