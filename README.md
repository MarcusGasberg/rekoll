# Rekoll

A browser extension that captures browsing interactions into a local database for natural language querying. Built with [WXT](https://wxt.dev/) and [Svelte 5](https://svelte.dev/).

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (included with Node.js)

## Installation

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd kek
npm install
```

### 2a. Development (with hot reload)

```bash
# Chrome
npm run dev

# Firefox
npm run dev:firefox
```

### 2b. Production build

```bash
# Chrome
npm run build

# Firefox
npm run build:firefox
```

### 3. Load the extension in your browser

#### Chrome / Chromium

1. Open `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the build output directory:
   - Development: `.output/chrome-mv3-dev`
   - Production: `.output/chrome-mv3`

#### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select any file inside the build output directory:
   - Development: `.output/firefox-mv2-dev`
   - Production: `.output/firefox-mv2`

## Packaging for distribution

```bash
# Chrome
npm run zip

# Firefox
npm run zip:firefox
```

This creates a `.zip` file ready for submission to the Chrome Web Store or Firefox Add-ons.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
