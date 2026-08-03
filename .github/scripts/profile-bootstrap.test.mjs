import assert from "node:assert/strict";
import test from "node:test";

import { mergeProfilePackage } from "./profile-bootstrap.mjs";

const profile = {
  name: "typescript",
  packagePatch: {
    fields: { packageManager: "bun@1.3.14", type: "module" },
    scripts: { lint: "biome lint ." },
    devDependencies: { fallow: "3.12.0" },
  },
};

test("mergeProfilePackage adds missing profile values without replacing local values", () => {
  const result = JSON.parse(
    mergeProfilePackage(
      JSON.stringify({ name: "example", scripts: { build: "bun build" } }),
      profile,
    ),
  );

  assert.deepEqual(result, {
    name: "example",
    packageManager: "bun@1.3.14",
    type: "module",
    scripts: { build: "bun build", lint: "biome lint ." },
    devDependencies: { fallow: "3.12.0" },
  });
});

test("mergeProfilePackage rejects conflicts instead of overwriting local package decisions", () => {
  assert.throws(
    () =>
      mergeProfilePackage(
        JSON.stringify({ scripts: { lint: "eslint ." } }),
        profile,
      ),
    /conflicts with repository-owned script lint/,
  );
});
