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
  // または: await recorder.generate();  // outputFormat に応じて MD/PDF を出力
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
| `outputFormat`          | `"md" \| "pdf" \| "both"` | `"md"` | 出力形式                                            |
| `pdfOptions`            | `PdfOptions` | `{}`           | PDF生成オプション（Chromium限定）                     |

#### `PdfOptions`

| オプション         | 型                                                          | デフォルト    | 説明                          |
| ----------------- | ----------------------------------------------------------- | ------------ | ----------------------------- |
| `format`          | `"A4" \| "Letter" \| "Legal"`                               | `"A4"`       | 用紙サイズ                     |
| `printBackground` | `boolean`                                                   | `true`       | 背景グラフィックを印刷するか     |
| `margin`          | `{ top?: string; right?: string; bottom?: string; left?: string }` | 全て `20mm` | ページ余白                     |

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

### `recorder.generatePdf(options?)`

`{outputDir}/{scenarioName}.pdf` にPDFファイルを生成します。スクリーンショットはbase64データURIとして埋め込まれます。**Chromium限定** — Firefox/WebKitではエラーになります。

### `recorder.generate()`

`outputFormat` オプションに基づいて出力を生成します。推奨のエントリポイントです。`generateMarkdown()` および/または `generatePdf()` を必要に応じて呼び出します。

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

## Fixture（推奨）

`createScenarioTest()` を使うと、ボイラープレートを省略できます。fixture が `recorder` を自動生成し、テスト後に `generate()` を呼び出し（`outputFormat` に応じてMD/PDFを出力）、オプションでリソースのクリーンアップも行います。

```ts
import { createScenarioTest } from "playwright-scenario-recorder/fixture";

const test = createScenarioTest({
  outputDir: "./docs/manuals",
  locale: "ja",
});

test("ログインフロー", async ({ recorder }) => {
  await recorder.step("ログインページを開く", "ログインページに遷移します。", async (p) => {
    await p.goto("http://localhost:3000/login");
  });
  // generate() とクリーンアップは自動実行
});
```

### `createScenarioTest(config?)`

`recorder` fixture 付きの Playwright `test` オブジェクトを返します。

#### `ScenarioFixtureConfig`

| オプション         | 型                          | デフォルト   | 説明                                     |
| ----------------- | --------------------------- | ----------- | ---------------------------------------- |
| `outputDir`       | `string`                    | `"./docs"`  | 生成ファイルの出力先ディレクトリ             |
| `locale`          | `"ja" \| "en"`              | `"ja"`      | 出力言語                                  |
| `recorderOptions` | `Omit<ScenarioRecorderOptions, "locale">` | `{}` | `ScenarioRecorder` コンストラクタに渡すオプション |
| `cleanup`         | `CleanupConfig \| false`    | `{}`        | リソースクリーンアップ設定。`false` で無効化  |
| `outputFormat`    | `"md" \| "pdf" \| "both"`   | `"md"`      | 出力形式                                  |
| `pdfOptions`      | `PdfOptions`                | `{}`        | PDF生成オプション（Chromium限定）            |

#### `CleanupConfig`

| オプション       | 型                                         | デフォルト                  | 説明                          |
| --------------- | ------------------------------------------ | -------------------------- | ----------------------------- |
| `trackMethods`  | `string[]`                                 | `["POST", "PUT"]`          | 監視するHTTPメソッド            |
| `extractId`     | `(body: any) => string \| undefined`       | `body?.id`                 | レスポンスからリソースIDを抽出    |
| `buildDeleteUrl`| `(url: string, id: string) => string`      | `` `${url}/${id}` ``       | DELETE エンドポイントURLを生成   |
| `urlPattern`    | `RegExp`                                   | —                          | このパターンに一致するURLのみ追跡 |

### `recorder.configure(overrides)`

テスト内で自動検出された `scenarioName`、`title`、`outputDir` を上書きします。`step()` 呼び出し前のみ有効です。

```ts
test("ログインフロー", async ({ recorder }) => {
  recorder.configure({ scenarioName: "custom-login", title: "カスタムログイン手順書" });
  // ...
});
```

## 目次（Index）自動生成

ディレクトリ内の全Markdownファイルから目次 `index.md` を生成します。

```ts
import { generateIndex } from "playwright-scenario-recorder";

generateIndex({
  dir: "./docs/manuals",
  locale: "ja",
});
// 出力: docs/manuals/index.md
```

#### `GenerateIndexOptions`

| オプション | 型              | デフォルト            | 説明                              |
| --------- | --------------- | -------------------- | --------------------------------- |
| `dir`     | `string`        | —                    | `.md` ファイルをスキャンするディレクトリ |
| `output`  | `string`        | `${dir}/index.md`    | 出力ファイルパス                     |
| `locale`  | `"ja" \| "en"`  | `"ja"`               | デフォルトタイトルの言語              |
| `title`   | `string`        | ロケールに依存        | カスタム見出し                       |

## 手順書作成を手軽に始められるプロンプトひな型

以下のプロンプトをコピーしてAIアシスタント（Claude、ChatGPTなど）に貼り付けると、シナリオファイルを素早く生成できます。

<details>
<summary>プロンプトテンプレート（クリックで展開）</summary>

````markdown
## ゴール

`playwright-scenario-recorder` ライブラリを使用し、各機能のメインシナリオを通る
Playwright テストファイルを生成してください。実行するとスクリーンショット付きの
Markdown 手順書が自動生成されます。

## ディレクトリ構成

以下の構成でファイルを配置してください:

```
e2e/
  manuals/             # シナリオテストファイル（通常のE2Eテストとは分離）
    login.spec.ts
    dashboard.spec.ts
    ...
docs/
  manuals/             # 生成されるMarkdown + スクリーンショット（実行時に自動作成）
    screenshots/
```

## package.json スクリプト

通常の Unit/E2E テストとは別に、シナリオ生成だけを独立して実行できるスクリプトを
追加してください。デプロイ後に発火させることで無駄なファイルが増えません:

```jsonc
{
  "scripts": {
    "scenario:generate": "npx playwright test --project=scenario-recorder -c e2e/manuals/playwright.config.ts"
  }
}
```

> `e2e/manuals/playwright.config.ts` にシナリオファイルのみを対象とした最小限の
> 設定を用意してください（例: `testDir: '.'`）。

## シナリオの書き方

各機能について、**メインシナリオ（正常系フロー）** を通るシナリオを作成してください。
各シナリオファイルは以下のように構成します:

1. `createScenarioTest()` を使って `recorder` fixture 付きの test を作成:

```ts
import { createScenarioTest } from "playwright-scenario-recorder/fixture";

const test = createScenarioTest({
  outputDir: "./docs/manuals",
  // locale はデフォルトで "ja"
});

test("機能X シナリオ", async ({ recorder }) => {
  // ... ステップ ...
  // generate() はテスト後に自動実行（outputFormat に応じて MD/PDF を出力）
});
```

2. 各ユーザー操作ごとに `recorder.step(...)` を追加します。

> **Tip:** 自動検出されたシナリオ名やタイトルを上書きしたい場合は、
> ステップの前に `recorder.configure(...)` を呼び出してください。

## スナップショット生成ルール

以下のルールに従ってステップを追加してください:

### 1. 画面遷移・初回表示

新しいページやビューが表示されるたびにスクリーンショットを撮影します。
ハイライトは不要で、初期状態をそのままキャプチャします。

```ts
await recorder.step(
  "ダッシュボードを開く",
  "ダッシュボードページに遷移します。",
  async (p) => {
    await p.goto("http://localhost:3000/dashboard");
  }
);
```

### 2. ボタンクリック・操作時

ボタンのクリックやコントロールの操作を伴うステップでは、
`highlightTarget` を指定して操作対象を赤枠でハイライトします。
読者がどこをクリックしたか一目でわかるようになります。

```ts
await recorder.step(
  "フォームを送信",
  "**送信**ボタンをクリックします。",
  async (p) => {
    await p.click('button[type="submit"]');
  },
  {
    highlightTarget: page.locator('button[type="submit"]'),
    waitAfter: 500,
  }
);
```

### 3. フォーム入力

フォームに値を入力する場合は、入力**後**にスクリーンショットを撮影し、
入力済みの状態が手順書に反映されるようにします。

```ts
await recorder.step(
  "ユーザー情報を入力",
  "名前とメールアドレスを入力します。",
  async (p) => {
    await p.fill('input[name="name"]', "Alice");
    await p.fill('input[name="email"]', "alice@example.com");
  }
);
```

## テストデータのクリーンアップ

シナリオではユーザー登録やフォーム送信など実データが作成されるため、
繰り返し実行すると開発環境のDBが汚れます。

**fixture** を使用する場合、クリーンアップは組み込み済みです。fixture が
POST/PUT レスポンスを自動追跡し、リソースIDを収集して、テスト後に逆順で
削除します。カスタマイズや無効化も可能です:

```ts
const test = createScenarioTest({
  outputDir: "./docs/manuals",
  // クリーンアップのカスタマイズ
  cleanup: {
    trackMethods: ["POST"],
    extractId: (body) => body?.data?.id,
    buildDeleteUrl: (url, id) => `${url}/${id}`,
    urlPattern: /\/api\//,
  },
  // クリーンアップを完全に無効化する場合:
  // cleanup: false,
});
```

> **補足:**
> - 依存関係を考慮し、逆順で削除します（子レコード → 親レコードの順）。
> - `buildDeleteUrl` で API の削除エンドポイントの規約に合わせて調整してください。
> - API が `body.data.id` のような形式で ID を返す場合は、
>   `extractId` をカスタマイズしてください。

## その他の指示

- アニメーションや API 呼び出し後など、ページの安定に時間が必要な場合は
  `waitAfter`（ミリ秒）を指定してください。
- ステップの説明文は簡潔に書いてください。生成される Markdown 手順書の
  本文テキストになります。
- 機能ごとに 1 ファイルとし、わかりやすいファイル名にしてください
  （例: `login.spec.ts`, `user-settings.spec.ts`）。
````

</details>

## ライセンス

MIT
