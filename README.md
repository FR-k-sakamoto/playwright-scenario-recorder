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
  // Or use: await recorder.generate();  // outputs MD/PDF based on outputFormat
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
| `outputFormat`          | `"md" \| "pdf" \| "both"` | `"md"` | Output format                                         |
| `pdfOptions`            | `PdfOptions` | `{}`             | PDF generation options (Chromium only)                 |

#### `PdfOptions`

| Option            | Type                                                        | Default    | Description                          |
| ----------------- | ----------------------------------------------------------- | ---------- | ------------------------------------ |
| `format`          | `"A4" \| "Letter" \| "Legal"`                               | `"A4"`     | Paper format                         |
| `printBackground` | `boolean`                                                   | `true`     | Whether to print background graphics |
| `margin`          | `{ top?: string; right?: string; bottom?: string; left?: string }` | `20mm` all | Page margins                         |

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

### `recorder.generatePdf(options?)`

Generates a PDF file at `{outputDir}/{scenarioName}.pdf`. Screenshots are embedded as base64 data URIs. **Chromium only** — throws an error on Firefox/WebKit.

### `recorder.generate()`

Generates output based on the `outputFormat` option. This is the recommended entry point — it calls `generateMarkdown()` and/or `generatePdf()` as needed.

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

## Fixture (Recommended)

Use `createScenarioTest()` to eliminate boilerplate. The fixture auto-creates a `recorder`, calls `generate()` after each test (outputting MD/PDF based on `outputFormat`), and optionally cleans up created resources.

```ts
import { createScenarioTest } from "playwright-scenario-recorder/fixture";

const test = createScenarioTest({
  outputDir: "./docs/manuals",
  locale: "en",
});

test("Login flow", async ({ recorder }) => {
  await recorder.step("Open login page", "Navigate to the login page.", async (p) => {
    await p.goto("http://localhost:3000/login");
  });
  // generate() and cleanup run automatically
});
```

### `createScenarioTest(config?)`

Returns a Playwright `test` object with a `recorder` fixture.

#### `ScenarioFixtureConfig`

| Option            | Type                         | Default     | Description                                     |
| ----------------- | ---------------------------- | ----------- | ----------------------------------------------- |
| `outputDir`       | `string`                     | `"./docs"`  | Root directory for generated files               |
| `locale`          | `"ja" \| "en"`               | `"ja"`      | Output language                                  |
| `recorderOptions` | `Omit<ScenarioRecorderOptions, "locale">` | `{}` | Passed to `ScenarioRecorder` constructor |
| `cleanup`         | `CleanupConfig \| false`     | `{}`        | Resource cleanup config. `false` to disable      |
| `outputFormat`    | `"md" \| "pdf" \| "both"`    | `"md"`      | Output format                                    |
| `pdfOptions`      | `PdfOptions`                 | `{}`        | PDF generation options (Chromium only)            |

#### `CleanupConfig`

| Option          | Type                                        | Default                       | Description                          |
| --------------- | ------------------------------------------- | ----------------------------- | ------------------------------------ |
| `trackMethods`  | `string[]`                                  | `["POST", "PUT"]`             | HTTP methods to monitor              |
| `extractId`     | `(body: any) => string \| undefined`        | `body?.id`                    | Extract resource ID from response    |
| `buildDeleteUrl`| `(url: string, id: string) => string`       | `` `${url}/${id}` ``          | Build the DELETE endpoint URL        |
| `urlPattern`    | `RegExp`                                    | —                             | Only track URLs matching this pattern|

### `recorder.configure(overrides)`

Override auto-detected `scenarioName`, `title`, or `outputDir` inside a test. Must be called before any `step()`.

```ts
test("Login flow", async ({ recorder }) => {
  recorder.configure({ scenarioName: "custom-login", title: "Custom Login Manual" });
  // ...
});
```

## Index Generation

Generate a table-of-contents `index.md` from all Markdown files in a directory.

```ts
import { generateIndex } from "playwright-scenario-recorder";

generateIndex({
  dir: "./docs/manuals",
  locale: "en",
});
// Output: docs/manuals/index.md
```

#### `GenerateIndexOptions`

| Option   | Type           | Default                       | Description                       |
| -------- | -------------- | ----------------------------- | --------------------------------- |
| `dir`    | `string`       | —                             | Directory to scan for `.md` files |
| `output` | `string`       | `${dir}/index.md`             | Output file path                  |
| `locale` | `"ja" \| "en"` | `"ja"`                       | Default title language            |
| `title`  | `string`       | locale-dependent              | Custom heading for the index      |

## AI Prompt Template for Generating Scenario Files

Copy the prompt below and paste it into your AI assistant (e.g., Claude, ChatGPT) to quickly scaffold scenario recorder test files for your project.

<details>
<summary>Prompt template (click to expand)</summary>

````markdown
## Goal

Using the `playwright-scenario-recorder` library, generate Playwright test files that walk
through the main scenarios of each feature and auto-generate Markdown manuals with
annotated screenshots.

## Directory layout

Place files according to the structure below:

```
e2e/
  manuals/             # Scenario test files (separate from regular E2E tests)
    login.spec.ts
    dashboard.spec.ts
    ...
docs/
  manuals/             # Generated Markdown + screenshots (auto-created at runtime)
    screenshots/
```

## package.json scripts

Add the following script so that scenario generation runs independently from normal
unit / E2E tests. This also makes it easy to trigger only after deployment:

```jsonc
{
  "scripts": {
    "scenario:generate": "npx playwright test --project=scenario-recorder -c e2e/manuals/playwright.config.ts"
  }
}
```

> Provide a minimal `e2e/manuals/playwright.config.ts` that only includes scenario
> files (e.g., `testDir: '.'`).

## Writing scenarios

For every feature, write a scenario that follows the **main (happy-path) flow**.
Each scenario file should:

1. Use `createScenarioTest()` to create a test with the `recorder` fixture:

```ts
import { createScenarioTest } from "playwright-scenario-recorder/fixture";

const test = createScenarioTest({
  outputDir: "./docs/manuals",
  locale: "en",       // "ja" or "en"
});

test("Feature X scenario", async ({ recorder }) => {
  // ... steps ...
  // generate() runs automatically after the test (MD/PDF based on outputFormat)
});
```

2. Add `recorder.step(...)` calls for each user action.

> **Tip:** If you need to override the auto-detected scenario name or title,
> call `recorder.configure(...)` before any steps.

## Screenshot rules

Follow these rules when adding steps:

### 1. Page navigation / first display

Take a screenshot every time a new page or view is displayed.
No highlight is needed — just capture the initial state.

```ts
await recorder.step(
  "Open the dashboard",
  "Navigate to the dashboard page.",
  async (p) => {
    await p.goto("http://localhost:3000/dashboard");
  }
);
```

### 2. Button click / interactive action

When a step involves clicking a button or interacting with a control,
use `highlightTarget` to outline the element with a red border so readers
can see what was clicked.

```ts
await recorder.step(
  "Submit the form",
  "Click the **Submit** button.",
  async (p) => {
    await p.click('button[type="submit"]');
  },
  {
    highlightTarget: page.locator('button[type="submit"]'),
    waitAfter: 500,
  }
);
```

### 3. Form input

When filling in forms, take the screenshot **after** the values are entered
so that the filled state is visible in the manual.

```ts
await recorder.step(
  "Enter user info",
  "Fill in the name and email fields.",
  async (p) => {
    await p.fill('input[name="name"]', "Alice");
    await p.fill('input[name="email"]', "alice@example.com");
  }
);
```

## Cleaning up test data

Since scenarios create real data (user registrations, form submissions, etc.),
repeated runs can pollute the development database.

When using the **fixture**, cleanup is built in. The fixture automatically
tracks POST/PUT responses, collects resource IDs, and deletes them in reverse
order after the test. To customize or disable this behavior:

```ts
const test = createScenarioTest({
  outputDir: "./docs/manuals",
  locale: "en",
  // Customize cleanup
  cleanup: {
    trackMethods: ["POST"],
    extractId: (body) => body?.data?.id,
    buildDeleteUrl: (url, id) => `${url}/${id}`,
    urlPattern: /\/api\//,
  },
  // Or disable cleanup entirely:
  // cleanup: false,
});
```

> **Notes:**
> - Resources are deleted in reverse order to respect dependency constraints
>   (e.g., child records before parent records).
> - Adjust `buildDeleteUrl` to match your API's delete endpoint convention.
> - If your API returns IDs in a different shape (e.g., `body.data.id`),
>   customize `extractId` accordingly.

## Additional instructions

- Use `waitAfter` (in milliseconds) when the page needs extra time to settle
  (e.g., after animations or API calls).
- Keep step descriptions concise — they become the body text in the generated
  Markdown manual.
- One scenario file per feature. Name files descriptively (e.g., `login.spec.ts`,
  `user-settings.spec.ts`).
````

</details>

## License

MIT
