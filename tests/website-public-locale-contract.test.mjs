import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const sourceRoot = join(process.cwd(), "src");

function source(relativePath) {
  return readFileSync(join(sourceRoot, relativePath), "utf8");
}

test("public API adapters require and forward the active locale", () => {
  for (const file of [
    "server/api/news.ts",
    "server/api/careers.ts",
    "server/api/products.ts",
  ]) {
    const contents = source(file);
    assert.match(contents, /Locale/);
    assert.match(contents, /locale/);
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
