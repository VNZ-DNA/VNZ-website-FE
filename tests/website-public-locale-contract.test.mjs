import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const sourceRoot = join(process.cwd(), "src");

function source(relativePath) {
  return readFileSync(join(sourceRoot, relativePath), "utf8");
}

test("public API adapters require and forward the active lang", () => {
  for (const file of [
    "server/api/news.ts",
    "server/api/careers.ts",
    "server/api/products.ts",
  ]) {
    const contents = source(file);
    assert.match(contents, /Locale/);
    assert.match(contents, /lang/);
    assert.doesNotMatch(contents, /URLSearchParams\(\{\s*locale/);
    assert.match(contents, /URLSearchParams/);
  }
});

test("localized pages do not switch to hardcoded English feeds", () => {
  for (const file of [
    "app/[locale]/tin-tuc/page.tsx",
    "app/[locale]/tin-tuc/[id]/page.tsx",
    "app/[locale]/tuyen-dung/page.tsx",
    "app/[locale]/tuyen-dung/[id]/page.tsx",
  ]) {
    const contents = source(file);
    assert.doesNotMatch(contents, /if\s*\(\s*locale\s*===\s*["']vi["']/);
  }

  assert.match(source("app/[locale]/page.tsx"), /getPublicProducts\(locale\)/);
  assert.doesNotMatch(source("components/products-act.tsx"), /staticProducts|\bPRODUCTS\b/);
});

test("public News and JobPost routes use backend slugs", () => {
  const newsApi = source("server/api/news.ts");
  const careersApi = source("server/api/careers.ts");

  assert.match(newsApi, /slug:\s*string/);
  assert.match(newsApi, /getPublicNewsDetail\(slug:\s*string/);
  assert.match(newsApi, /public\/news\/\$\{encodeURIComponent\(slug\)\}/);
  assert.match(careersApi, /slug:\s*string/);
  assert.match(careersApi, /getPublicJobPostDetail\(slug:\s*string/);
  assert.match(careersApi, /public\/job-posts\/\$\{encodeURIComponent\(slug\)\}/);

  assert.match(source("app/[locale]/tin-tuc/page.tsx"), /tin-tuc\/\$\{post\.slug\}/);
  assert.match(source("app/[locale]/tin-tuc/[id]/page.tsx"), /tin-tuc\/\$\{post\.slug\}/);
  assert.match(source("components/careers.tsx"), /tuyen-dung\/\$\{job\.slug\}/);
  assert.match(source("components/careers.tsx"), /jobSlug=\$\{encodeURIComponent\(job\.slug\)\}/);
  assert.match(source("app/[locale]/tuyen-dung/[id]/page.tsx"), /jobSlug=\$\{encodeURIComponent\(job\.slug\)\}/);
  assert.match(source("app/[locale]/ung-tuyen/page.tsx"), /params\.jobSlug/);
  assert.match(source("app/[locale]/ung-tuyen/page.tsx"), /jobPostId=\{job\.id\}/);
  assert.doesNotMatch(source("app/[locale]/tuyen-dung/[id]/page.tsx"), /const GUID/);
  assert.doesNotMatch(source("app/[locale]/ung-tuyen/page.tsx"), /const GUID/);
});
