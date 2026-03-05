import { test as base, type Page, type APIRequestContext } from "@playwright/test";
import * as path from "path";
import { ScenarioRecorder, type ScenarioRecorderOptions } from "./index.js";

export interface CleanupConfig {
  trackMethods?: string[];
  extractId?: (body: any) => string | undefined;
  buildDeleteUrl?: (url: string, id: string) => string;
  urlPattern?: RegExp;
}

export interface ScenarioFixtureConfig {
  outputDir?: string;
  locale?: "ja" | "en";
  recorderOptions?: Omit<ScenarioRecorderOptions, "locale">;
  cleanup?: CleanupConfig | false;
}

interface ScenarioFixtures {
  recorder: ScenarioRecorder;
}

export function createScenarioTest(config: ScenarioFixtureConfig = {}) {
  const {
    outputDir = "./docs",
    locale = "ja",
    recorderOptions = {},
    cleanup: cleanupConfig,
  } = config;

  return base.extend<ScenarioFixtures>({
    recorder: async ({ page, request }, use, testInfo) => {
      const filePath = testInfo.titlePath[0] ?? "unknown";
      const scenarioName = path.basename(filePath).replace(/\.spec\.\w+$|\.test\.\w+$|\.\w+$/, "");
      const title = testInfo.title;

      const recorder = new ScenarioRecorder(page, scenarioName, title, outputDir, {
        locale,
        ...recorderOptions,
      });

      const created: { url: string; id: string }[] = [];

      if (cleanupConfig !== false) {
        const {
          trackMethods = ["POST", "PUT"],
          extractId = (body: any) => body?.id,
          buildDeleteUrl = (url: string, id: string) => `${url}/${id}`,
          urlPattern,
        } = cleanupConfig ?? {};

        page.on("response", async (res) => {
          if (!trackMethods.includes(res.request().method()) || !res.ok()) return;
          if (urlPattern && !urlPattern.test(res.url())) return;
          try {
            const body = await res.json();
            const id = extractId(body);
            if (id) {
              created.push({ url: res.url(), id });
            }
          } catch {
            // Non-JSON responses — skip
          }
        });
      }

      await use(recorder);

      recorder.generateMarkdown();

      if (cleanupConfig !== false) {
        for (const res of [...created].reverse()) {
          const deleteUrl = cleanupConfig?.buildDeleteUrl
            ? cleanupConfig.buildDeleteUrl(res.url, res.id)
            : `${res.url}/${res.id}`;
          try {
            await request.delete(deleteUrl);
          } catch {
            // cleanup is best-effort
          }
        }
      }
    },
  });
}
