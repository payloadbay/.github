#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  resolveModuleContract,
  resolveRepositoryModules,
} from "./repository-baseline.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const baselineRoot = resolve(scriptDirectory, "../..");
const baselineConfigPath = resolve(
  baselineRoot,
  ".github/repository-baseline.json",
);

export function mergeModulePackage(packageContent, contract) {
  let packageJson;
  try {
    packageJson = JSON.parse(packageContent);
  } catch {
    throw new Error("package.json is missing or invalid JSON");
  }

  const next = structuredClone(packageJson);
  const conflicts = [];
  const { fields, scripts, devDependencies } = contract.packagePatch;

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
      `repository module contract conflicts with repository-owned ${conflicts.join(", ")}`,
    );
  }

  return `${JSON.stringify(next, null, 2)}\n`;
}

async function writeModuleFiles(repositoryRoot, contract) {
  for (const path of contract.managedFiles) {
    const sourcePath = resolve(baselineRoot, path);
    const targetPath = resolve(repositoryRoot, path);
    const incoming = await readFile(sourcePath, "utf8");
    let current = null;
    try {
      current = await readFile(targetPath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
    if (current !== null && current !== incoming) {
      throw new Error(`managed file ${path} conflicts with repository-owned content`);
    }
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, incoming);
  }
}

function parseArguments(arguments_) {
  const result = { repositoryRoot: null };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--repository-root") {
      result.repositoryRoot = arguments_[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!result.repositoryRoot) {
    throw new Error("--repository-root is required");
  }
  return result;
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  const config = JSON.parse(await readFile(baselineConfigPath, "utf8"));
  const declarationPath = resolve(arguments_.repositoryRoot, config.moduleConfigPath);
  const declaration = JSON.parse(await readFile(declarationPath, "utf8"));
  const contract = resolveModuleContract(
    resolveRepositoryModules(config, declaration),
  );

  const packagePath = resolve(arguments_.repositoryRoot, "package.json");
  const packageContent = await readFile(packagePath, "utf8");
  await writeFile(packagePath, mergeModulePackage(packageContent, contract));
  await writeModuleFiles(arguments_.repositoryRoot, contract);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
