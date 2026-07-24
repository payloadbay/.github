import assert from "node:assert/strict";
import test from "node:test";

import {
  hasCentralRenovatePreset,
  hashContent,
  mergeManagedFile,
  normalizeRuleset,
  planLabelChanges,
  planRulesetChanges,
  portableRepositorySettings,
  repositorySettingsDiffer,
  selectRepositories,
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
    bypass_actors: [],
    conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
    rules: [{ type: "deletion" }],
  };

  const normalized = normalizeRuleset(source, {
    appId: 123,
    injectAppBypass: true,
  });
  assert.deepEqual(normalized.bypass_actors, [
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
