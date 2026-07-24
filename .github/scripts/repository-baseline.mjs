#!/usr/bin/env node

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const baselineConfigPath = resolve(
  repositoryRoot,
  ".github/repository-baseline.json",
);
const labelsPath = resolve(repositoryRoot, ".github/labels.json");

export function hashContent(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function selectRepositories(repositories, config, requestedRepository) {
  const excluded = new Set(config.excludedRepositories);

  return repositories
    .filter((repository) => !repository.archived)
    .filter((repository) => !repository.fork)
    .filter((repository) => !excluded.has(repository.name))
    .filter(
      (repository) =>
        !requestedRepository || repository.name === requestedRepository,
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function planLabelChanges(currentLabels, desiredLabels) {
  const currentByName = new Map(
    currentLabels.map((label) => [label.name, label]),
  );
  const create = [];
  const update = [];

  for (const desired of desiredLabels) {
    const current = currentByName.get(desired.name);
    if (!current) {
      create.push(desired);
      continue;
    }

    if (
      current.color.toLowerCase() !== desired.color.toLowerCase() ||
      (current.description ?? "") !== (desired.description ?? "")
    ) {
      update.push(desired);
    }
  }

  const desiredNames = new Set(desiredLabels.map((label) => label.name));
  const unmanaged = currentLabels
    .filter((label) => !desiredNames.has(label.name))
    .map((label) => label.name)
    .sort();

  return { create, update, unmanaged };
}

export function portableRepositorySettings(sourceRepository) {
  return {
    default_branch: sourceRepository.default_branch,
    allow_squash_merge: sourceRepository.allow_squash_merge,
    allow_merge_commit: sourceRepository.allow_merge_commit,
    allow_rebase_merge: sourceRepository.allow_rebase_merge,
    allow_auto_merge: sourceRepository.allow_auto_merge,
    delete_branch_on_merge: sourceRepository.delete_branch_on_merge,
    allow_update_branch: sourceRepository.allow_update_branch,
    squash_merge_commit_title: sourceRepository.squash_merge_commit_title,
    squash_merge_commit_message: sourceRepository.squash_merge_commit_message,
  };
}

export function repositorySettingsDiffer(currentRepository, desiredSettings) {
  return Object.entries(desiredSettings).some(
    ([key, value]) => value !== undefined && currentRepository[key] !== value,
  );
}

export function normalizeRuleset(ruleset, options = {}) {
  const { appId, injectAppBypass = false } = options;
  const bypassActors = (ruleset.bypass_actors ?? [])
    .filter(
      (actor) =>
        !(
          actor.actor_type === "Integration" &&
          Number(actor.actor_id) === Number(appId)
        ),
    )
    .map((actor) => ({
      actor_id: actor.actor_id,
      actor_type: actor.actor_type,
      bypass_mode: actor.bypass_mode,
    }));

  if (injectAppBypass) {
    if (!appId) {
      throw new Error("BASELINE_APP_ID is required to inject a ruleset bypass");
    }
    bypassActors.push({
      actor_id: Number(appId),
      actor_type: "Integration",
      bypass_mode: "always",
    });
  }

  return {
    name: ruleset.name,
    target: ruleset.target,
    enforcement: ruleset.enforcement,
    bypass_actors: bypassActors,
    conditions: ruleset.conditions,
    rules: ruleset.rules,
  };
}

function rulesetsEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function planRulesetChanges(sourceRulesets, targetRulesets, prefix) {
  const sourceByName = new Map(
    sourceRulesets
      .filter((ruleset) => ruleset.name.startsWith(prefix))
      .map((ruleset) => [ruleset.name, ruleset]),
  );
  const targetByName = new Map(
    targetRulesets
      .filter((ruleset) => ruleset.name.startsWith(prefix))
      .map((ruleset) => [ruleset.name, ruleset]),
  );

  if (
    sourceByName.size !==
    sourceRulesets.filter((ruleset) => ruleset.name.startsWith(prefix)).length
  ) {
    throw new Error(
      `Duplicate source ruleset name in reserved namespace ${prefix}`,
    );
  }

  const upsert = [...sourceByName.values()];
  const remove = [...targetByName.values()].filter(
    (ruleset) => !sourceByName.has(ruleset.name),
  );

  return { upsert, remove };
}

export function hasCentralRenovatePreset(path, content, preset) {
  if (!content) {
    return false;
  }

  if (path === "package.json") {
    try {
      const packageJson = JSON.parse(content);
      return JSON.stringify(packageJson.renovate ?? {}).includes(preset);
    } catch {
      return false;
    }
  }

  return content.includes(preset);
}

export async function mergeManagedFile({ base, current, incoming }) {
  if (current === incoming) {
    return { content: incoming, conflict: false };
  }
  if (current === base) {
    return { content: incoming, conflict: false };
  }
  if (incoming === base) {
    return { content: current, conflict: false };
  }

  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "payloadbay-baseline-"),
  );
  const currentPath = join(temporaryDirectory, "current");
  const basePath = join(temporaryDirectory, "base");
  const incomingPath = join(temporaryDirectory, "incoming");

  try {
    await Promise.all([
      writeFile(currentPath, current),
      writeFile(basePath, base),
      writeFile(incomingPath, incoming),
    ]);

    try {
      const { stdout } = await execFileAsync("git", [
        "merge-file",
        "-p",
        currentPath,
        basePath,
        incomingPath,
      ]);
      return { content: stdout, conflict: false };
    } catch (error) {
      if (error.code === 1) {
        return { content: incoming, conflict: true };
      }
      throw error;
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

class GitHubApi {
  constructor(token, dryRun) {
    this.token = token;
    this.dryRun = dryRun;
  }

  async request(path, options = {}) {
    const response = await fetch(`https://api.github.com${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: options.accept ?? "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "payloadbay-repository-baseline",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (options.allowNotFound && response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `${options.method ?? "GET"} ${path} failed with ${response.status}: ${details}`,
      );
    }

    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  async paginate(path) {
    const results = [];
    let page = 1;
    while (true) {
      const separator = path.includes("?") ? "&" : "?";
      const response = await this.request(
        `${path}${separator}per_page=100&page=${page}`,
      );
      results.push(...response);
      if (response.length < 100) {
        return results;
      }
      page += 1;
    }
  }

  async mutate(path, options) {
    if (this.dryRun) {
      return null;
    }
    return this.request(path, options);
  }
}

function encodePath(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function getRepositoryFile(api, owner, repository, path, ref) {
  const file = await api.request(
    `/repos/${owner}/${repository}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`,
    { allowNotFound: true },
  );
  if (!file || Array.isArray(file) || file.type !== "file") {
    return null;
  }
  return Buffer.from(file.content.replaceAll("\n", ""), "base64").toString();
}

async function getRef(api, owner, repository, branch) {
  return api.request(
    `/repos/${owner}/${repository}/git/ref/heads/${encodePath(branch)}`,
    { allowNotFound: true },
  );
}

async function createCommit(
  api,
  { owner, repository, branch, changes, message, force = false },
) {
  if (api.dryRun) {
    return { dryRun: true };
  }

  const ref = await getRef(api, owner, repository, branch);
  if (!ref) {
    throw new Error(`${owner}/${repository} has no branch named ${branch}`);
  }

  const parentSha = ref.object.sha;
  const parent = await api.request(
    `/repos/${owner}/${repository}/git/commits/${parentSha}`,
  );
  const treeEntries = [];

  for (const change of changes) {
    if (change.content === null) {
      treeEntries.push({
        path: change.path,
        mode: "100644",
        type: "blob",
        sha: null,
      });
      continue;
    }

    const blob = await api.request(`/repos/${owner}/${repository}/git/blobs`, {
      method: "POST",
      body: {
        content: Buffer.from(change.content).toString("base64"),
        encoding: "base64",
      },
    });
    treeEntries.push({
      path: change.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const tree = await api.request(`/repos/${owner}/${repository}/git/trees`, {
    method: "POST",
    body: {
      base_tree: parent.tree.sha,
      tree: treeEntries,
    },
  });
  const commit = await api.request(
    `/repos/${owner}/${repository}/git/commits`,
    {
      method: "POST",
      body: {
        message,
        tree: tree.sha,
        parents: [parentSha],
      },
    },
  );
  await api.request(
    `/repos/${owner}/${repository}/git/refs/heads/${encodePath(branch)}`,
    {
      method: "PATCH",
      body: { sha: commit.sha, force },
    },
  );
  return commit;
}

async function synchronizeLabels(api, owner, repository, desiredLabels) {
  const current = await api.paginate(`/repos/${owner}/${repository}/labels`);
  const plan = planLabelChanges(current, desiredLabels);

  for (const label of plan.create) {
    console.log(`  label + ${label.name}`);
    await api.mutate(`/repos/${owner}/${repository}/labels`, {
      method: "POST",
      body: label,
    });
  }
  for (const label of plan.update) {
    console.log(`  label ~ ${label.name}`);
    await api.mutate(
      `/repos/${owner}/${repository}/labels/${encodeURIComponent(label.name)}`,
      {
        method: "PATCH",
        body: {
          new_name: label.name,
          color: label.color,
          description: label.description,
        },
      },
    );
  }
  if (plan.unmanaged.length > 0) {
    console.log(`  unmanaged labels: ${plan.unmanaged.join(", ")}`);
  }
}

async function synchronizeSettings(
  api,
  owner,
  repository,
  currentRepository,
  desiredSettings,
) {
  const applicableSettings = { ...desiredSettings };
  let effectiveDefaultBranch = currentRepository.default_branch;

  if (
    desiredSettings.default_branch &&
    desiredSettings.default_branch !== currentRepository.default_branch
  ) {
    const desiredRef = await getRef(
      api,
      owner,
      repository,
      desiredSettings.default_branch,
    );
    if (desiredRef) {
      effectiveDefaultBranch = desiredSettings.default_branch;
    } else {
      delete applicableSettings.default_branch;
      console.log(
        `  warning: cannot select missing default branch ${desiredSettings.default_branch}`,
      );
    }
  }

  if (!repositorySettingsDiffer(currentRepository, applicableSettings)) {
    return effectiveDefaultBranch;
  }
  console.log("  repository merge settings differ");
  await api.mutate(`/repos/${owner}/${repository}`, {
    method: "PATCH",
    body: applicableSettings,
  });
  return effectiveDefaultBranch;
}

async function loadDetailedRulesets(api, owner, repository) {
  const summaries = await api.paginate(
    `/repos/${owner}/${repository}/rulesets`,
  );
  return Promise.all(
    summaries.map((ruleset) =>
      api.request(`/repos/${owner}/${repository}/rulesets/${ruleset.id}`),
    ),
  );
}

async function synchronizeRulesets({
  api,
  owner,
  repository,
  sourceRulesets,
  prefix,
  appId,
}) {
  const targetRulesets = await loadDetailedRulesets(api, owner, repository);
  const plan = planRulesetChanges(sourceRulesets, targetRulesets, prefix);
  const targetByName = new Map(
    targetRulesets.map((ruleset) => [ruleset.name, ruleset]),
  );

  for (const sourceRuleset of plan.upsert) {
    const targetRuleset = targetByName.get(sourceRuleset.name);
    const desired = normalizeRuleset(sourceRuleset, {
      appId,
      injectAppBypass: true,
    });
    if (targetRuleset) {
      const current = normalizeRuleset(targetRuleset, {
        appId,
        injectAppBypass: true,
      });
      if (rulesetsEqual(current, desired)) {
        continue;
      }
      console.log(`  ruleset ~ ${desired.name}`);
      await api.mutate(
        `/repos/${owner}/${repository}/rulesets/${targetRuleset.id}`,
        { method: "PUT", body: desired },
      );
    } else {
      console.log(`  ruleset + ${desired.name}`);
      await api.mutate(`/repos/${owner}/${repository}/rulesets`, {
        method: "POST",
        body: desired,
      });
    }
  }

  for (const ruleset of plan.remove) {
    console.log(`  ruleset - ${ruleset.name}`);
    await api.mutate(`/repos/${owner}/${repository}/rulesets/${ruleset.id}`, {
      method: "DELETE",
    });
  }
}

async function loadLocalBaseline(config) {
  const files = new Map();
  for (const path of config.managedFiles) {
    files.set(path, await readFile(resolve(repositoryRoot, path), "utf8"));
  }
  return files;
}

function serializeState(sourceCommit, baselineFiles) {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      sourceCommit,
      files: Object.fromEntries(
        [...baselineFiles.entries()].map(([path, content]) => [
          path,
          {
            hash: hashContent(content),
            content: Buffer.from(content).toString("base64"),
          },
        ]),
      ),
    },
    null,
    2,
  )}\n`;
}

function parseState(content) {
  if (!content) {
    return null;
  }
  const state = JSON.parse(content);
  if (state.schemaVersion !== 1 || typeof state.files !== "object") {
    throw new Error("Unsupported baseline state format");
  }
  return state;
}

async function planFileSynchronization({
  api,
  owner,
  repository,
  branch,
  config,
  baselineFiles,
  sourceCommit,
}) {
  const currentStateContent = await getRepositoryFile(
    api,
    owner,
    repository,
    config.statePath,
    branch,
  );
  const state = parseState(currentStateContent);
  const changes = [];
  const conflicts = [];

  for (const [path, incoming] of baselineFiles) {
    const current = await getRepositoryFile(
      api,
      owner,
      repository,
      path,
      branch,
    );
    const previous = state?.files?.[path];

    if (current === null) {
      changes.push({ path, content: incoming });
      continue;
    }
    if (!previous) {
      if (current !== incoming) {
        conflicts.push(path);
        changes.push({ path, content: incoming });
      }
      continue;
    }

    const base = Buffer.from(previous.content, "base64").toString();
    const merged = await mergeManagedFile({ base, current, incoming });
    if (merged.conflict) {
      conflicts.push(path);
    }
    if (merged.content !== current) {
      changes.push({ path, content: merged.content });
    }
  }

  for (const [path, previous] of Object.entries(state?.files ?? {})) {
    if (baselineFiles.has(path)) {
      continue;
    }
    const current = await getRepositoryFile(
      api,
      owner,
      repository,
      path,
      branch,
    );
    if (current === null) {
      continue;
    }
    const base = Buffer.from(previous.content, "base64").toString();
    if (current === base) {
      changes.push({ path, content: null });
    } else {
      conflicts.push(path);
      changes.push({ path, content: null });
    }
  }

  const baselineChanged =
    !state ||
    [...baselineFiles.entries()].some(
      ([path, content]) => state.files?.[path]?.hash !== hashContent(content),
    ) ||
    Object.keys(state.files).some((path) => !baselineFiles.has(path));

  if (baselineChanged) {
    changes.push({
      path: config.statePath,
      content: serializeState(sourceCommit, baselineFiles),
    });
  }

  return { changes, conflicts };
}

async function planRenovateBootstrap({
  api,
  owner,
  repository,
  branch,
  renovate,
}) {
  const found = [];
  for (const path of renovate.configPaths) {
    const content = await getRepositoryFile(
      api,
      owner,
      repository,
      path,
      branch,
    );
    if (content !== null && path === "package.json") {
      try {
        const packageJson = JSON.parse(content);
        if (packageJson.renovate !== undefined) {
          found.push({ path, content });
        }
      } catch {
        console.log(`  warning: ${path} is not valid JSON`);
      }
    } else if (content !== null) {
      found.push({ path, content });
    }
  }

  if (found.length === 0) {
    return {
      changes: [
        {
          path: renovate.bootstrapPath,
          content: `${JSON.stringify(
            {
              $schema: "https://docs.renovatebot.com/renovate-schema.json",
              extends: [renovate.preset],
            },
            null,
            2,
          )}\n`,
        },
      ],
      warning: null,
    };
  }

  const usesPreset = found.some(({ path, content }) =>
    hasCentralRenovatePreset(path, content, renovate.preset),
  );
  return {
    changes: [],
    warning: usesPreset
      ? null
      : `Renovate config does not extend ${renovate.preset}`,
  };
}

async function createOrUpdateConflictPullRequest({
  api,
  owner,
  repository,
  defaultBranch,
  syncBranch,
  changes,
  conflicts,
}) {
  console.log(`  conflict PR required for: ${conflicts.join(", ")}`);
  if (api.dryRun) {
    return;
  }

  const defaultRef = await getRef(api, owner, repository, defaultBranch);
  const syncRef = await getRef(api, owner, repository, syncBranch);
  if (syncRef) {
    await api.request(
      `/repos/${owner}/${repository}/git/refs/heads/${encodePath(syncBranch)}`,
      {
        method: "PATCH",
        body: { sha: defaultRef.object.sha, force: true },
      },
    );
  } else {
    await api.request(`/repos/${owner}/${repository}/git/refs`, {
      method: "POST",
      body: {
        ref: `refs/heads/${syncBranch}`,
        sha: defaultRef.object.sha,
      },
    });
  }

  await createCommit(api, {
    owner,
    repository,
    branch: syncBranch,
    changes,
    message: "chore: synchronize repository baseline",
    force: true,
  });

  const pulls = await api.request(
    `/repos/${owner}/${repository}/pulls?state=open&head=${encodeURIComponent(`${owner}:${syncBranch}`)}&base=${encodeURIComponent(defaultBranch)}`,
  );
  const body = [
    "The central Payload Bay repository baseline could not be merged automatically.",
    "",
    "Conflicting managed paths:",
    "",
    ...conflicts.map((path) => `- \`${path}\``),
    "",
    "Resolve the repository-specific changes against the current baseline, then merge this pull request.",
  ].join("\n");

  if (pulls.length === 0) {
    const pull = await api.request(`/repos/${owner}/${repository}/pulls`, {
      method: "POST",
      body: {
        title: "chore: synchronize repository baseline",
        head: syncBranch,
        base: defaultBranch,
        body,
      },
    });
    await api.request(
      `/repos/${owner}/${repository}/issues/${pull.number}/labels`,
      {
        method: "POST",
        body: { labels: ["maintenance", "area:infrastructure"] },
      },
    );
  } else {
    await api.request(
      `/repos/${owner}/${repository}/pulls/${pulls[0].number}`,
      {
        method: "PATCH",
        body: {
          title: "chore: synchronize repository baseline",
          body,
        },
      },
    );
  }
}

function parseArguments(arguments_) {
  const result = {
    dryRun: false,
    repository: null,
  };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--dry-run") {
      result.dryRun = true;
    } else if (argument === "--repository") {
      result.repository = arguments_[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return result;
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is required");
  }

  const [config, desiredLabels] = await Promise.all([
    readFile(baselineConfigPath, "utf8").then(JSON.parse),
    readFile(labelsPath, "utf8").then(JSON.parse),
  ]);
  const api = new GitHubApi(token, arguments_.dryRun);
  const owner = config.organization;
  const sourceRepositoryName = config.sourceRepository;
  const sourceRepository = await api.request(
    `/repos/${owner}/${sourceRepositoryName}`,
  );
  const organization = await api.request(`/orgs/${owner}`);
  const sourceCommit = (
    await getRef(api, owner, sourceRepositoryName, config.sourceBranch)
  ).object.sha;
  const desiredSettings = portableRepositorySettings(sourceRepository);
  const sourceRulesets = await loadDetailedRulesets(
    api,
    owner,
    sourceRepositoryName,
  );
  const baselineFiles = await loadLocalBaseline(config);
  const repositories = selectRepositories(
    await api.paginate(`/orgs/${owner}/repos?type=all`),
    config,
    arguments_.repository,
  );

  if (arguments_.repository && repositories.length === 0) {
    throw new Error(
      `Repository ${arguments_.repository} was not found or is excluded`,
    );
  }

  console.log(
    `${arguments_.dryRun ? "Dry-running" : "Synchronizing"} ${repositories.length} repositories`,
  );

  const failures = [];
  for (const repository of repositories) {
    console.log(`\n${owner}/${repository.name}`);
    try {
      await synchronizeLabels(api, owner, repository.name, desiredLabels);
      const targetBranch = await synchronizeSettings(
        api,
        owner,
        repository.name,
        repository,
        desiredSettings,
      );

      if (
        repository.name !== sourceRepositoryName &&
        !(repository.private && organization.plan?.name === "free")
      ) {
        await synchronizeRulesets({
          api,
          owner,
          repository: repository.name,
          sourceRulesets,
          prefix: config.rulesetPrefix,
          appId: process.env.BASELINE_APP_ID,
        });
      } else if (
        repository.name !== sourceRepositoryName &&
        repository.private &&
        organization.plan?.name === "free"
      ) {
        console.log(
          "  warning: rulesets are unavailable for this private repository on GitHub Free",
        );
      }

      if (repository.name === sourceRepositoryName) {
        continue;
      }
      if (!targetBranch) {
        console.log("  skipped files: repository has no default branch");
        continue;
      }

      const filePlan = await planFileSynchronization({
        api,
        owner,
        repository: repository.name,
        branch: targetBranch,
        config,
        baselineFiles,
        sourceCommit,
      });
      const renovatePlan = await planRenovateBootstrap({
        api,
        owner,
        repository: repository.name,
        branch: targetBranch,
        renovate: config.renovate,
      });
      if (renovatePlan.warning) {
        console.log(`  warning: ${renovatePlan.warning}`);
      }
      const changes = [...filePlan.changes, ...renovatePlan.changes];
      if (changes.length === 0) {
        console.log("  files are current");
      } else if (filePlan.conflicts.length > 0) {
        await createOrUpdateConflictPullRequest({
          api,
          owner,
          repository: repository.name,
          defaultBranch: targetBranch,
          syncBranch: config.syncBranch,
          changes,
          conflicts: filePlan.conflicts,
        });
      } else {
        console.log(`  direct baseline commit (${changes.length} paths)`);
        await createCommit(api, {
          owner,
          repository: repository.name,
          branch: targetBranch,
          changes,
          message: "chore: synchronize repository baseline",
        });
      }
    } catch (error) {
      failures.push({ repository: repository.name, error });
      console.error(`  failed: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    console.error("\nFailures:");
    for (const failure of failures) {
      console.error(`- ${failure.repository}: ${failure.error.message}`);
    }
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
