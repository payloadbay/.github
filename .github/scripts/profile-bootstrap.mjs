#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = resolve(fileURLToPath(import.meta.url), "..");
const repositoryRoot = resolve(scriptDirectory, "../..");
const baselineConfigPath = resolve(
  repositoryRoot,
  ".github/repository-baseline.json",
);

export function mergeProfilePackage(packageContent, profile) {
  let packageJson;
  try {
    packageJson = JSON.parse(packageContent);
  } catch {
    throw new Error("package.json is missing or invalid JSON");
  }

  const next = structuredClone(packageJson);
  const conflicts = [];
  const { fields, scripts, devDependencies } = profile.packagePatch;

  for (const [key, value] of Object.entries(fields)) {
    if (next[key] === undefined) {
      next[key] = value;
    } else if (next[key] !== value) {
      conflicts.push(`field ${key}`);
    }
  }

  next.scripts ??= {};
  for (const [name, command] of Object.entries(scripts)) {
    if (next.scripts[name] === undefined) {
      next.scripts[name] = command;
    } else if (next.scripts[name] !== command) {
      conflicts.push(`script ${name}`);
    }
  }

  next.devDependencies ??= {};
  for (const [name, version] of Object.entries(devDependencies)) {
    if (next.devDependencies[name] === undefined) {
      next.devDependencies[name] = version;
    } else if (next.devDependencies[name] !== version) {
      conflicts.push(`devDependency ${name}`);
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `profile ${profile.name} conflicts with repository-owned ${conflicts.join(", ")}`,
    );
  }

  return `${JSON.stringify(next, null, 2)}\n`;
}

function parseArguments(arguments_) {
  const result = { profile: null, repositoryRoot: null };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--profile") {
      result.profile = arguments_[index + 1];
      index += 1;
    } else if (argument === "--repository-root") {
      result.repositoryRoot = arguments_[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!result.profile || !result.repositoryRoot) {
    throw new Error("--profile and --repository-root are required");
  }

  return result;
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  const config = JSON.parse(await readFile(baselineConfigPath, "utf8"));
  const profile = config.profiles?.[arguments_.profile];
  if (!profile) {
    throw new Error(`Unknown profile: ${arguments_.profile}`);
  }

  const packagePath = resolve(arguments_.repositoryRoot, "package.json");
  const content = await readFile(packagePath, "utf8");
  const merged = mergeProfilePackage(content, {
    name: arguments_.profile,
    ...profile,
  });
  await writeFile(packagePath, merged);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
