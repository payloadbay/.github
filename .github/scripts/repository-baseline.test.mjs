import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  hasCentralRenovatePreset,
  hashContent,
  mergeManagedFile,
  normalizeRuleset,
  planAutolinkChanges,
  planLabelChanges,
  planRulesetChanges,
  portableRepositorySettings,
  resolveModuleContract,
  resolveRepositoryModules,
  repositorySettingsDiffer,
  selectRepositories,
  validateModulePackage,
} from "./repository-baseline.mjs";

test("selectRepositories excludes archived, forked, and configured repositories", () => {
  const repositories = [
    { name: ".github", archived: false, fork: false },
    { name: "dashboard", archived: false, fork: false },
    { name: "fork", archived: false, fork: true },
    { name: "old", archived: true, fork: false },
    { name: "excluded", archived: false, fork: false },
  ];
  const config = { excludedRepositories: ["excluded"] };

  assert.deepEqual(
    selectRepositories(repositories, config).map(({ name }) => name),
    [".github", "dashboard"],
  );
});

test("resolveRepositoryModules uses an explicit repository declaration", () => {
  const config = {
    modules: {
      "runtime:bun": {
        requires: [],
        files: [],
        packagePatch: { fields: {}, scripts: {}, devDependencies: {} },
        rulesets: [],
      },
      "language:typescript": {
        requires: ["runtime:bun"],
        files: [
          {
            source: ".github/modules/language-typescript/tsconfig.json",
            target: "tsconfig.json",
          },
        ],
        packagePatch: { fields: {}, scripts: {}, devDependencies: {} },
        rulesets: [],
      },
    },
  };

  assert.deepEqual(
    resolveRepositoryModules(config, {
      version: 1,
      modules: ["language:typescript"],
    }).map(({ name }) => name),
    ["runtime:bun", "language:typescript"],
  );
  assert.deepEqual(resolveRepositoryModules(config, null), []);
});

test("repository modules reject unknown and circular dependencies", () => {
  const unknown = {
    modules: {
      "runtime:bun": {
        requires: ["missing"],
        files: [],
        packagePatch: { fields: {}, scripts: {}, devDependencies: {} },
        rulesets: [],
      },
    },
  };
  assert.throws(
    () =>
      resolveRepositoryModules(unknown, {
        version: 1,
        modules: ["runtime:bun"],
      }),
    /Unknown repository module: missing/,
  );

  const circular = {
    modules: {
      one: {
        requires: ["two"],
        files: [],
        packagePatch: { fields: {}, scripts: {}, devDependencies: {} },
        rulesets: [],
      },
      two: {
        requires: ["one"],
        files: [],
        packagePatch: { fields: {}, scripts: {}, devDependencies: {} },
        rulesets: [],
      },
    },
  };
  assert.throws(
    () =>
      resolveRepositoryModules(circular, {
        version: 1,
        modules: ["one"],
      }),
    /Circular repository module dependency: one/,
  );
});

test("module contracts reject incompatible managed files", () => {
  assert.throws(
    () =>
      resolveModuleContract([
        {
          name: "one",
          files: [{ source: "one/tooling.json", target: "tooling.json" }],
          packagePatch: { fields: {}, scripts: {}, devDependencies: {} },
          rulesets: [],
        },
        {
          name: "two",
          files: [{ source: "two/tooling.json", target: "tooling.json" }],
          packagePatch: { fields: {}, scripts: {}, devDependencies: {} },
          rulesets: [],
        },
      ]),
    /Conflicting managed target tooling.json from repository module two/,
  );
});

test("module contracts require the declared toolchain values", () => {
  const contract = resolveModuleContract([
    {
      name: "typescript",
      files: [
        {
          source: ".github/modules/language-typescript/tsconfig.json",
          target: "tsconfig.json",
        },
      ],
      packagePatch: {
        fields: { packageManager: "bun@1.3.14", type: "module" },
        scripts: { lint: "biome lint ." },
        devDependencies: { fallow: "3.12.0" },
      },
      rulesets: [],
    },
  ]);

  assert.deepEqual(
    validateModulePackage(
      JSON.stringify({
        packageManager: "bun@1.3.14",
        type: "module",
        scripts: { lint: "biome lint ." },
        devDependencies: { fallow: "3.12.0" },
      }),
      contract,
    ),
    [],
  );
  assert.deepEqual(
    validateModulePackage(JSON.stringify({}), contract),
    [
      "package field packageManager does not match baseline",
      "package field type does not match baseline",
      "package script lint does not match baseline",
      "devDependency fallow does not match baseline",
    ],
  );
});

test("static-only modules do not require package.json", () => {
  assert.deepEqual(
    validateModulePackage(null, {
      files: [
        {
          source: ".github/modules/docs/example.md",
          target: "example.md",
        },
      ],
      packagePatch: { fields: {}, scripts: {}, devDependencies: {} },
      rulesets: [],
    }),
    [],
  );
});

test("planLabelChanges creates, updates, and preserves unmanaged labels", () => {
  const current = [
    { name: "bug", color: "ffffff", description: "old" },
    { name: "local", color: "000000", description: "local" },
  ];
  const desired = [
    { name: "bug", color: "d73a4a", description: "Confirmed defect" },
    { name: "feature", color: "1d76db", description: "New capability" },
  ];

  assert.deepEqual(planLabelChanges(current, desired), {
    create: [desired[1]],
    update: [desired[0]],
    unmanaged: ["local"],
  });
});

test("planAutolinkChanges creates, replaces, removes, and preserves autolinks", () => {
  const current = [
    {
      id: 1,
      key_prefix: "PAB-",
      url_template: "https://old.example/PAB-<num>",
      is_alphanumeric: false,
    },
    {
      id: 2,
      key_prefix: "OLD-",
      url_template: "https://old.example/<num>",
      is_alphanumeric: false,
    },
    {
      id: 3,
      key_prefix: "LOCAL-",
      url_template: "https://local.example/<num>",
      is_alphanumeric: false,
    },
  ];
  const desired = [
    {
      keyPrefix: "PAB-",
      urlTemplate: "https://linear.app/example/issue/PAB-<num>",
      isAlphanumeric: false,
    },
    {
      keyPrefix: "NEW-",
      urlTemplate: "https://new.example/<num>",
      isAlphanumeric: true,
    },
  ];

  assert.deepEqual(
    planAutolinkChanges(current, desired, ["PAB-", "OLD-", "NEW-"]),
    {
      create: [
        {
          key_prefix: "NEW-",
          url_template: "https://new.example/<num>",
          is_alphanumeric: true,
        },
      ],
      replace: [
        {
          current: current[0],
          desired: {
            key_prefix: "PAB-",
            url_template: "https://linear.app/example/issue/PAB-<num>",
            is_alphanumeric: false,
          },
        },
      ],
      remove: [current[1]],
      unmanaged: [current[2]],
    },
  );
});

test("planAutolinkChanges rejects prefixes outside its namespace", () => {
  assert.throws(
    () =>
      planAutolinkChanges(
        [],
        [{ keyPrefix: "PAB-", urlTemplate: "https://example/<num>" }],
        ["OTHER-"],
      ),
    /not in the managed namespace/,
  );
});

test("portableRepositorySettings includes only the merge baseline", () => {
  const source = {
    default_branch: "master",
    allow_squash_merge: true,
    allow_merge_commit: false,
    allow_rebase_merge: false,
    allow_auto_merge: false,
    delete_branch_on_merge: true,
    allow_update_branch: true,
    squash_merge_commit_title: "PR_TITLE",
    squash_merge_commit_message: "PR_BODY",
    description: "must not be copied",
  };

  const settings = portableRepositorySettings(source);
  assert.equal(settings.default_branch, "master");
  assert.equal(settings.description, undefined);
  assert.equal(repositorySettingsDiffer(source, settings), false);
  assert.equal(
    repositorySettingsDiffer({ ...source, allow_merge_commit: true }, settings),
    true,
  );
});

test("normalizeRuleset injects one synchronization app bypass", () => {
  const source = {
    name: "baseline:default-branch",
    target: "branch",
    enforcement: "active",
    bypass_actors: [
      {
        actor_id: null,
        actor_type: "OrganizationAdmin",
        bypass_mode: "always",
      },
    ],
    conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
    rules: [{ type: "deletion" }],
  };

  const normalized = normalizeRuleset(source, {
    appId: 123,
    injectAppBypass: true,
  });
  assert.deepEqual(normalized.bypass_actors, [
    {
      actor_id: null,
      actor_type: "OrganizationAdmin",
      bypass_mode: "always",
    },
    {
      actor_id: 123,
      actor_type: "Integration",
      bypass_mode: "always",
    },
  ]);
});

test("planRulesetChanges preserves repository-specific rulesets", () => {
  const source = [{ id: 1, name: "baseline:default-branch" }];
  const target = [
    { id: 2, name: "baseline:old" },
    { id: 3, name: "repository:release" },
  ];
  const plan = planRulesetChanges(source, target, "baseline:");

  assert.deepEqual(plan.upsert, source);
  assert.deepEqual(plan.remove, [target[0]]);
});

test("mergeManagedFile handles unchanged and independently changed content", async () => {
  assert.deepEqual(
    await mergeManagedFile({
      base: "one\n",
      current: "one\n",
      incoming: "two\n",
    }),
    { content: "two\n", conflict: false },
  );

  const merged = await mergeManagedFile({
    base: "one\ntwo\n",
    current: "local\none\ntwo\n",
    incoming: "one\ntwo\ncentral\n",
  });
  assert.equal(merged.conflict, false);
  assert.equal(merged.content, "local\none\ntwo\ncentral\n");
});

test("mergeManagedFile reports conflicting edits", async () => {
  const merged = await mergeManagedFile({
    base: "value: old\n",
    current: "value: local\n",
    incoming: "value: central\n",
  });
  assert.equal(merged.conflict, true);
  assert.equal(merged.content, "value: central\n");
});

test("hasCentralRenovatePreset supports renovate and package configs", () => {
  const preset = "local>payloadbay/.github:renovate-config";
  assert.equal(
    hasCentralRenovatePreset(
      "renovate.json",
      JSON.stringify({ extends: [preset] }),
      preset,
    ),
    true,
  );
  assert.equal(
    hasCentralRenovatePreset(
      "package.json",
      JSON.stringify({ renovate: { extends: [preset] } }),
      preset,
    ),
    true,
  );
  assert.equal(hasCentralRenovatePreset("renovate.json", "{}", preset), false);
});

test("hashContent is stable", () => {
  assert.equal(hashContent("payload bay"), hashContent("payload bay"));
  assert.notEqual(hashContent("payload bay"), hashContent("Payload Bay"));
});

function parseLabelMatchers(configuration) {
  const matchers = [];
  let current = null;

  for (const line of configuration.split("\n")) {
    const label = line.match(/^  - label: (.+)$/);
    if (label) {
      current = { label: label[1] };
      matchers.push(current);
      continue;
    }

    const property = line.match(/^    (type|title|body): (.+)$/);
    if (!current || !property) continue;
    const value = property[2];
    current[property[1]] =
      value.startsWith("'") && value.endsWith("'") ? value.slice(1, -1) : value;
  }

  return matchers;
}

function compileLabelPattern(pattern) {
  return pattern.startsWith("(?m)")
    ? new RegExp(pattern.slice(4), "m")
    : new RegExp(pattern);
}

function labelsFor(matchers, record) {
  return new Set(
    matchers
      .filter(
        (matcher) =>
          (!matcher.type || matcher.type === record.type) &&
          (!matcher.title || compileLabelPattern(matcher.title).test(record.title)) &&
          (!matcher.body || compileLabelPattern(matcher.body).test(record.body)),
      )
      .map(({ label }) => label),
  );
}

const metadataMatchers = parseLabelMatchers(
  readFileSync(new URL("../labeler.yml", import.meta.url), "utf8"),
);

test("metadata label rules declare their record type", () => {
  assert.ok(metadataMatchers.length > 0);
  assert.ok(metadataMatchers.every(({ type }) => type === "issue" || type === "pull_request"));
});

test("pull request prose cannot trigger planned-work area labels", () => {
  const labels = labelsFor(metadataMatchers, {
    type: "pull_request",
    title: "feat(brand): generate application icon variants",
    body: `## 🧩 Type of Change

- [x] ✨ New feature

## 🗺️ Areas

- [ ] API
- [x] Brand
- [x] Infrastructure

## 🔐 Security, Compatibility, and Operations

No authentication, API, persisted data, configuration, or environment variables change.
`,
  });

  assert.equal(labels.has("feature"), true);
  assert.equal(labels.has("area:brand"), true);
  assert.equal(labels.has("area:infrastructure"), true);
  assert.equal(labels.has("area:api"), false);
});

test("planned-work labels only match values under their form headings", () => {
  const labels = labelsFor(metadataMatchers, {
    type: "issue",
    title: "[Planned]: Correct metadata label matching boundaries",
    body: `### Type of work

🐛 Bug fix, 🤖 CI/CD or automation, 🧪 Tests, 🧹 Maintenance

### Affected areas

Governance, Infrastructure

### Expected outcome

No authentication, API, persisted data, configuration, or environment variables change.
`,
  });

  assert.equal(labels.has("bug"), true);
  assert.equal(labels.has("tests"), true);
  assert.equal(labels.has("maintenance"), true);
  assert.equal(labels.has("area:governance"), true);
  assert.equal(labels.has("area:infrastructure"), true);
  assert.equal(labels.has("area:api"), false);
});

test("feature and bug issue mappings remain valid", () => {
  const featureLabels = labelsFor(metadataMatchers, {
    type: "issue",
    title: "[Feature]: Add provider support",
    body: `### Request type

New product capability
`,
  });
  assert.equal(featureLabels.has("feature"), true);

  const bugLabels = labelsFor(metadataMatchers, {
    type: "issue",
    title: "[Bug]: SDK request fails",
    body: `### Affected area

API or SDK
`,
  });
  assert.equal(bugLabels.has("area:api"), true);
  assert.equal(bugLabels.has("area:sdk"), true);
});
