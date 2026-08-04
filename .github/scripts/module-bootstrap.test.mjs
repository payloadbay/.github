import assert from "node:assert/strict";
import test from "node:test";

import { mergeModulePackage } from "./module-bootstrap.mjs";

const contract = {
  packagePatch: {
    fields: { packageManager: "bun@1.3.14", type: "module" },
    scripts: { lint: "biome lint ." },
    devDependencies: { fallow: "3.12.0" },
  },
};

test("mergeModulePackage adds missing module values without replacing local values", () => {
  const result = JSON.parse(
    mergeModulePackage(
      JSON.stringify({ name: "example", scripts: { build: "bun build" } }),
      contract,
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

test("mergeModulePackage rejects conflicts instead of overwriting local package decisions", () => {
  assert.throws(
    () =>
      mergeModulePackage(
        JSON.stringify({ scripts: { lint: "eslint ." } }),
        contract,
      ),
    /conflicts with repository-owned script lint/,
  );
});
