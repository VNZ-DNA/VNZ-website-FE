import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const memberSource = readFileSync(
  join(process.cwd(), "src/components/member.tsx"),
  "utf8",
);

test("member detail loading keeps the selected profile visible for at least 1.5 seconds", () => {
  assert.match(memberSource, /MIN_MEMBER_LOADING_MS\s*=\s*1500/);
  assert.match(memberSource, /Math\.max\(\s*0,\s*MIN_MEMBER_LOADING_MS/);
  assert.match(memberSource, /window\.setTimeout\(resolve, remaining\)/);
});
