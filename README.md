# playwright-scenario-recorder

[日本語版 README](./README.ja.md)

Playwright E2E scenario runner that auto-generates Markdown manuals with annotated screenshots.

## Install

```bash
npm install -D playwright-scenario-recorder
```

> **Note:** `@playwright/test` is a peer dependency — install it separately if you haven't already.

## Quick Start

```ts
import { test } from "@playwright/test";
import { ScenarioRecorder } from "playwright-scenario-recorder";

test("Login flow", async ({ page }) => {
  const recorder = new ScenarioRecorder(
    page,
    "login-flow",          // scenario name (used for filenames)
    "Login Flow Manual",   // document title
    "./docs"               // output directory
  );

  await recorder.step(
    "Open login page",
    "Navigate to the login page.",
    async (p) => {
      await p.goto("http://localhost:3000/login");
    }
  );

  await recorder.step(
    "Enter credentials",
    "Fill in email and password, then click **Login**.",
    async (p) => {
      await p.fill('input[name="email"]', "user@example.com");
      await p.fill('input[name="password"]', "password");
      await p.click('button[type="submit"]');
    },
    { waitAfter: 1000 }
  );

  recorder.generateMarkdown();
  // Output: docs/login-flow.md + docs/screenshots/login-flow/step-01.png, ...
});
```

## API Reference

### `new ScenarioRecorder(page, scenarioName, title, outputDir, options?)`

| Parameter      | Type                      | Description                                      |
| -------------- | ------------------------- | ------------------------------------------------ |
| `page`         | `Page`                    | Playwright `Page` instance                       |
| `scenarioName` | `string`                  | Identifier used for file/directory names          |
| `title`        | `string`                  | Markdown document title (`# title`)              |
| `outputDir`    | `string`                  | Root directory for generated files                |
| `options`      | `ScenarioRecorderOptions` | Optional configuration (see below)               |

#### `ScenarioRecorderOptions`

| Option                  | Type       | Default                | Description                                           |
| ----------------------- | ---------- | ---------------------- | ----------------------------------------------------- |
| `locale`                | `"ja" \| "en"` | `"ja"`            | Output language for headings and metadata              |
| `hideOverlaySelectors`  | `string[]` | Next.js overlay rules  | CSS rules injected to hide dev overlays in screenshots |

### `recorder.step(title, description, action, options?)`

Executes an action, waits for the page to settle, takes a screenshot, and records the step.

| Parameter     | Type                          | Description                               |
| ------------- | ----------------------------- | ----------------------------------------- |
| `title`       | `string`                      | Step heading                              |
| `description` | `string`                      | Step body text (supports Markdown)        |
| `action`      | `(page: Page) => Promise<void>` | The interaction to perform             |
| `options`     | `StepOptions`                 | Optional (see below)                      |

#### `StepOptions`

| Option            | Type      | Description                                       |
| ----------------- | --------- | ------------------------------------------------- |
| `waitAfter`       | `number`  | Extra wait time in ms after the action completes   |
| `highlightTarget` | `Locator` | Element to highlight with a red outline in the screenshot |

### `recorder.generateMarkdown()`

Writes the accumulated steps to a Markdown file at `{outputDir}/{scenarioName}.md`.

## Locale

Set `locale` in the constructor options:

```ts
const recorder = new ScenarioRecorder(page, "flow", "Title", "./docs", {
  locale: "en",
});
```

- `"ja"` (default) — headings like `手順 01`, date line `自動生成日: 2026-01-01`
- `"en"` — headings like `Step 01`, date line `Auto-generated on 2026-01-01`

## Customizing Overlay Hiding

By default, Next.js dev overlays are hidden during screenshots. For other frameworks, pass your own CSS rules:

```ts
// Nuxt example
const recorder = new ScenarioRecorder(page, "flow", "Title", "./docs", {
  hideOverlaySelectors: [
    "#__nuxt-devtools { display: none !important; }",
  ],
});

// Disable overlay hiding entirely
const recorder = new ScenarioRecorder(page, "flow", "Title", "./docs", {
  hideOverlaySelectors: [],
});
```

## License

MIT
