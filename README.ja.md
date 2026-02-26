# playwright-scenario-recorder

Playwright E2Eシナリオを実行し、スクリーンショット付きのMarkdownマニュアルを自動生成するライブラリです。

## インストール

```bash
npm install -D playwright-scenario-recorder
```

> **Note:** `@playwright/test` はピア依存です。未インストールの場合は別途インストールしてください。

## クイックスタート

```ts
import { test } from "@playwright/test";
import { ScenarioRecorder } from "playwright-scenario-recorder";

test("Login flow", async ({ page }) => {
  const recorder = new ScenarioRecorder(
    page,
    "login-flow",          // シナリオ名（ファイル名に使用）
    "ログインフロー手順書", // ドキュメントタイトル
    "./docs"               // 出力ディレクトリ
  );

  await recorder.step(
    "ログインページを開く",
    "ログインページに遷移します。",
    async (p) => {
      await p.goto("http://localhost:3000/login");
    }
  );

  await recorder.step(
    "認証情報を入力",
    "メールアドレスとパスワードを入力し、**ログイン**ボタンをクリックします。",
    async (p) => {
      await p.fill('input[name="email"]', "user@example.com");
      await p.fill('input[name="password"]', "password");
      await p.click('button[type="submit"]');
    },
    { waitAfter: 1000 }
  );

  recorder.generateMarkdown();
  // 出力: docs/login-flow.md + docs/screenshots/login-flow/step-01.png, ...
});
```

## API リファレンス

### `new ScenarioRecorder(page, scenarioName, title, outputDir, options?)`

| パラメータ      | 型                        | 説明                                     |
| -------------- | ------------------------- | ---------------------------------------- |
| `page`         | `Page`                    | Playwright の `Page` インスタンス          |
| `scenarioName` | `string`                  | ファイル名・ディレクトリ名に使用される識別子  |
| `title`        | `string`                  | Markdownドキュメントのタイトル（`# title`） |
| `outputDir`    | `string`                  | 生成ファイルの出力先ディレクトリ             |
| `options`      | `ScenarioRecorderOptions` | オプション設定（後述）                      |

#### `ScenarioRecorderOptions`

| オプション               | 型          | デフォルト            | 説明                                              |
| ----------------------- | ---------- | -------------------- | ------------------------------------------------- |
| `locale`                | `"ja" \| "en"` | `"ja"`           | 見出しやメタデータの出力言語                          |
| `hideOverlaySelectors`  | `string[]` | Next.js オーバーレイ非表示ルール | スクリーンショットで開発オーバーレイを非表示にするCSSルール |

### `recorder.step(title, description, action, options?)`

アクションを実行し、ページの安定を待ってからスクリーンショットを撮影し、手順を記録します。

| パラメータ     | 型                             | 説明                            |
| ------------- | ----------------------------- | ------------------------------- |
| `title`       | `string`                      | 手順の見出し                      |
| `description` | `string`                      | 手順の説明文（Markdown対応）       |
| `action`      | `(page: Page) => Promise<void>` | 実行する操作                    |
| `options`     | `StepOptions`                 | オプション（後述）                 |

#### `StepOptions`

| オプション         | 型        | 説明                                              |
| ----------------- | --------- | ------------------------------------------------- |
| `waitAfter`       | `number`  | アクション完了後の追加待機時間（ミリ秒）                |
| `highlightTarget` | `Locator` | スクリーンショットで赤枠ハイライトする要素              |

### `recorder.generateMarkdown()`

記録した手順を `{outputDir}/{scenarioName}.md` にMarkdownファイルとして出力します。

## ロケール

コンストラクタの `options` で `locale` を設定します:

```ts
const recorder = new ScenarioRecorder(page, "flow", "Title", "./docs", {
  locale: "en",
});
```

- `"ja"`（デフォルト） — 見出し例: `手順 01`、日付行: `自動生成日: 2026-01-01`
- `"en"` — 見出し例: `Step 01`、日付行: `Auto-generated on 2026-01-01`

## オーバーレイ非表示のカスタマイズ

デフォルトでは、Next.js の開発オーバーレイがスクリーンショット撮影時に非表示になります。他のフレームワークを使用する場合は、独自のCSSルールを指定してください:

```ts
// Nuxt の例
const recorder = new ScenarioRecorder(page, "flow", "Title", "./docs", {
  hideOverlaySelectors: [
    "#__nuxt-devtools { display: none !important; }",
  ],
});

// オーバーレイ非表示を無効にする
const recorder = new ScenarioRecorder(page, "flow", "Title", "./docs", {
  hideOverlaySelectors: [],
});
```

## ライセンス

MIT
