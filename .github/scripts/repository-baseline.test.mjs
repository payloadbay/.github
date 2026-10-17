import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  hasCentralRenovatePreset,
  hashContent,
  mergeManagedFile,
  normalizeRuleset,
  planAutolinkChanges,
  planFileSynchronization,
  planLabelChanges,
  planRulesetChanges,
  portableRepositorySettings,
  repositorySettingsDiffer,
  selectRepositories,
  selectManagedFilePaths,
} from "./repository-baseline.mjs";

test("shared SpecKit files reach only explicitly eligible repositories", () => {
  const config = {
    managedFiles: ["AGENTS.md"],
    managedFileGroups: [{
      name: "speckit",
      repositories: ["payloadbay"],
      files: [".github/speckit/setup.json"],
    }],
  };
  assert.deepEqual(selectManagedFilePaths(config, "payloadbay"), [
    "AGENTS.md", ".github/speckit/setup.json",
  ]);
  for (const repository of ["brand", ".github", "future-product", "payloadbay-fork"]) {
    assert.deepEqual(selectManagedFilePaths(config, repository), ["AGENTS.md"]);
  }
  assert.deepEqual(selectManagedFilePaths({ managedFiles: ["AGENTS.md"] }, "payloadbay"), ["AGENTS.md"]);
});

function fileApi(files) {
  const reads = [];
  return {
    reads,
    async request(endpoint) {
      const path = endpoint.split("/contents/")[1].split("?ref=")[0];
      reads.push(path);
      const content = files.get(path);
      return content === undefined ? null : {
        type: "file", content: Buffer.from(content).toString("base64"),
      };
    },
  };
}

test("preset synchronization does not inspect or overwrite project SpecKit content", async () => {
  const path = ".github/speckit/setup.json";
  const api = fileApi(new Map([
    [".specify/memory/constitution.md", "Project constitution"],
    ["specs/001-delivery/spec.md", "Project feature"],
  ]));
  const plan = await planFileSynchronization({
    api, owner: "payloadbay", repository: "payloadbay", branch: "master",
    config: { statePath: ".github/.payloadbay-baseline.json", autolinks: [] },
    baselineFiles: new Map([[path, "shared setup"]]), sourceCommit: "source-sha",
  });
  assert.deepEqual(plan.conflicts, []);
  assert.deepEqual(plan.changes.map(({ path }) => path), [path, ".github/.payloadbay-baseline.json"]);
  assert.deepEqual(api.reads, [".github/.payloadbay-baseline.json", path]);
});

test("removing eligibility uses normal deletion and conflict handling for shared assets", async () => {
  const path = ".github/speckit/setup.json";
  const statePath = ".github/.payloadbay-baseline.json";
  const state = JSON.stringify({
    schemaVersion: 2, autolinks: [],
    files: { [path]: { hash: hashContent("shared"), content: Buffer.from("shared").toString("base64") } },
  });
  for (const [current, conflicts] of [["shared", []], ["local edit", [path]]]) {
    const api = fileApi(new Map([[statePath, state], [path, current]]));
    const plan = await planFileSynchronization({
      api, owner: "payloadbay", repository: "payloadbay", branch: "master",
      config: { statePath, autolinks: [] }, baselineFiles: new Map(), sourceCommit: "source-sha",
    });
    assert.deepEqual(plan.conflicts, conflicts);
    assert.deepEqual(plan.changes[0], { path, content: null });
  }
});

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
    squash_merge_commit_message: "BLANK",
    description: "must not be copied",
  };

  const settings = portableRepositorySettings(source);
  assert.equal(settings.default_branch, "master");
  assert.equal(settings.squash_merge_commit_title, "PR_TITLE");
  assert.equal(settings.squash_merge_commit_message, "BLANK");
  assert.equal(
    repositorySettingsDiffer({ ...source, squash_merge_commit_message: "PR_BODY" }, settings),
    true,
  );
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


test("manifest owns merge policy instead of live source settings", () => {
  const config = JSON.parse(readFileSync(new URL("../repository-baseline.json", import.meta.url), "utf8"));
  const desired = portableRepositorySettings(config.repositorySettings);
  assert.equal(desired.squash_merge_commit_title, "PR_TITLE");
  assert.equal(desired.squash_merge_commit_message, "BLANK");
  assert.equal(desired.allow_merge_commit, false);
  assert.equal(desired.allow_rebase_merge, false);
  assert.equal(repositorySettingsDiffer({ ...desired, squash_merge_commit_message: "PR_BODY" }, desired), true);
});

async function environmentBaselineFixture({
  repository = 'payloadbay',
  current = null,
  userId = 66677362,
  dryRun = false,
  declarations,
} = {}) {
  const directory = await mkdtemp(
    join(tmpdir(), 'payloadbay-baseline-environment-'),
  );
  try {
    const scriptDirectory = join(directory, '.github/scripts');
    await mkdir(scriptDirectory, { recursive: true });
    const source = await readFile(
      new URL('./repository-baseline.mjs', import.meta.url),
      'utf8',
    );
    await writeFile(join(scriptDirectory, 'repository-baseline.mjs'), source);
    const manifest = JSON.parse(
      await readFile(
        new URL('../repository-baseline.json', import.meta.url),
        'utf8',
      ),
    );
    const config = {
      ...manifest,
      sourceRepository: repository,
      managedFiles: [],
      managedFileGroups: [],
      managedAutolinkPrefixes: [],
      autolinks: [],
      managedEnvironments: declarations ?? [
        {
          name: 'alpha-ci-external',
          repositories: ['payloadbay'],
          preventSelfReview: false,
          reviewers: [{ type: 'User', login: 'TheDanniCraft', id: 66677362 }],
        },
      ],
    };
    const requests = join(directory, 'requests.jsonl');
    await writeFile(
      join(directory, '.github/repository-baseline.json'),
      JSON.stringify(config),
    );
    await writeFile(join(directory, '.github/labels.json'), '[]');
    const fixture = {
      repository,
      current,
      userId,
      settings: config.repositorySettings,
      requests,
    };
    const fixturePath = join(directory, 'fixture.json');
    await writeFile(fixturePath, JSON.stringify(fixture));
    const preload = join(directory, 'mock-api.mjs');
    await writeFile(
      preload,
      `
import { readFileSync, appendFileSync } from "node:fs";
const fixture=JSON.parse(readFileSync(process.env.BASELINE_ENV_FIXTURE,"utf8"));
globalThis.fetch=async (url,options={})=>{
 const path=new URL(url).pathname;
 const method=options.method??"GET";
 appendFileSync(fixture.requests,JSON.stringify({path,method,body:options.body?JSON.parse(options.body):null})+"\\n");
 const reply=(value,status=200)=>new Response(JSON.stringify(value),{status});
 if(method==="GET" && path==="/orgs/payloadbay") return reply({plan:{name:"team"}});
 if(method==="GET" && path==="/orgs/payloadbay/repos") return reply([{name:fixture.repository}]);
 if(method==="GET" && path.endsWith("/git/ref/heads/master")) return reply({object:{sha:"a".repeat(40)}});
 if(method==="GET" && path==="/repos/payloadbay/"+fixture.repository) return reply({...fixture.settings,name:fixture.repository});
 if(method==="GET" && /\\/(rulesets|labels|autolinks)$/.test(path)) return reply([]);
 if(method==="GET" && path==="/users/TheDanniCraft") return reply({id:fixture.userId,login:"TheDanniCraft"});
 if(method==="GET" && path.includes("/environments/")) return fixture.current?reply(fixture.current):reply({message:"Not Found"},404);
 if(method==="PUT" && path.includes("/environments/")) return reply({name:"alpha-ci-external"});
 throw Error("Unexpected fixture API call: "+method+" "+path);
};
`,
    );
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        preload,
        join(scriptDirectory, 'repository-baseline.mjs'),
        '--repository',
        repository,
        ...(dryRun ? ['--dry-run'] : []),
      ],
      {
        encoding: 'utf8',
        timeout: 10000,
        env: {
          PATH: process.env.PATH,
          GITHUB_TOKEN: randomUUID(),
          BASELINE_ENV_FIXTURE: fixturePath,
        },
      },
    );
    assert.equal(result.error, undefined);
    const calls = (await readFile(requests, 'utf8'))
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(JSON.parse);
    return {
      status: result.status,
      output: result.stdout + result.stderr,
      calls,
    };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('declared protected environment is created only for its exact eligible repository', async () => {
  const result = await environmentBaselineFixture();
  assert.equal(result.status, 0, result.output);
  const mutations = result.calls.filter((call) => call.method !== 'GET');
  assert.equal(
    mutations.length,
    1,
    'Declared reviewer protection must be applied through the baseline CLI',
  );
  assert.equal(
    mutations[0].path,
    '/repos/payloadbay/payloadbay/environments/alpha-ci-external',
  );
  assert.deepEqual(mutations[0].body.reviewers, [
    { type: 'User', id: 66677362 },
  ]);
});

test('protected environment eligibility does not spread to other repositories', async () => {
  for (const repository of ['brand', '.github', 'payloadbay-fork']) {
    const result = await environmentBaselineFixture({ repository });
    assert.equal(result.status, 0, result.output);
    assert.equal(
      result.calls.some(
        (call) =>
          call.path.includes('/environments/') ||
          call.path.startsWith('/users/'),
      ),
      false,
    );
    assert.equal(
      result.calls.some((call) => call.method !== 'GET'),
      false,
    );
  }
});

test('protected environment synchronization preserves unrelated native controls', async () => {
  const current = {
    can_admins_bypass: false,
    deployment_branch_policy: {
      protected_branches: false,
      custom_branch_policies: true,
    },
    protection_rules: [
      { type: 'wait_timer', wait_timer: 17 },
      { type: 'branch_policy' },
      {
        type: 'required_reviewers',
        prevent_self_review: true,
        reviewers: [{ type: 'User', reviewer: { id: 42 } }],
      },
    ],
  };
  const result = await environmentBaselineFixture({ current });
  assert.equal(result.status, 0, result.output);
  const mutations = result.calls.filter((call) => call.method !== 'GET');
  assert.equal(mutations.length, 1);
  assert.deepEqual(mutations[0].body, {
    reviewers: [{ type: 'User', id: 66677362 }],
    prevent_self_review: false,
    wait_timer: 17,
    deployment_branch_policy: current.deployment_branch_policy,
  });
  assert.equal(
    result.calls.some((call) =>
      /secrets|deployment-branch-policies|deployment_protection_rules/.test(
        call.path,
      ),
    ),
    false,
  );
});

test('matching environment protection is idempotent and leaves undeclared controls untouched', async () => {
  const result = await environmentBaselineFixture({
    current: {
      deployment_branch_policy: null,
      protection_rules: [
        {
          type: 'required_reviewers',
          prevent_self_review: false,
          reviewers: [{ type: 'User', reviewer: { id: 66677362 } }],
        },
      ],
    },
  });
  assert.equal(result.status, 0, result.output);
  assert.equal(
    result.calls.some((call) => call.method !== 'GET'),
    false,
  );
});

test('environment dry runs inspect drift without writing policy', async () => {
  const result = await environmentBaselineFixture({ dryRun: true });
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /environment reviewer policy differs/);
  assert.equal(
    result.calls.some((call) => call.method !== 'GET'),
    false,
  );
});

test('reviewer login reuse cannot replace its source-declared immutable identity', async () => {
  const result = await environmentBaselineFixture({ userId: 123 });
  assert.equal(result.status, 1);
  assert.match(result.output, /reviewer identity changed/);
  assert.equal(
    result.calls.some((call) => call.method !== 'GET'),
    false,
  );
});

test('unsupported environment protection is preserved by refusing the mutation', async () => {
  const result = await environmentBaselineFixture({
    current: { protection_rules: [{ type: 'future_protection' }] },
  });
  assert.equal(result.status, 1);
  assert.match(result.output, /existing policy preserved/);
  assert.equal(
    result.calls.some((call) => call.method !== 'GET'),
    false,
  );
});

test('all eligible reviewer identities resolve before the first environment write', async () => {
  const result = await environmentBaselineFixture({
    declarations: [
      {
        name: 'first',
        repositories: ['payloadbay'],
        preventSelfReview: false,
        reviewers: [{ type: 'User', login: 'TheDanniCraft', id: 66677362 }],
      },
      {
        name: 'second',
        repositories: ['payloadbay'],
        preventSelfReview: false,
        reviewers: [{ type: 'User', login: 'TheDanniCraft', id: 123 }],
      },
    ],
  });
  assert.equal(result.status, 1);
  assert.equal(
    result.calls.some((call) => call.method !== 'GET'),
    false,
  );
});

test('unknown environment policy fields cannot be silently ignored', async () => {
  const result = await environmentBaselineFixture({
    declarations: [
      {
        name: 'alpha-ci-external',
        repositories: ['payloadbay'],
        preventSelfReview: false,
        reviewers: [{ type: 'User', login: 'TheDanniCraft', id: 66677362 }],
        requireSecondApproval: true,
      },
    ],
  });
  assert.equal(result.status, 1);
  assert.equal(
    result.calls.some((call) => call.method !== 'GET'),
    false,
  );
});
