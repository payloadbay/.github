import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import base from "../tooling/eslint/base.mjs";
import prettierBase from "../tooling/prettier/base.mjs";
import { selectManagedFilePaths } from "./repository-baseline.mjs";

const require = createRequire(process.env.PAYLOADBAY_TOOLING_MODULES ?? import.meta.url);
const { Linter } = require("eslint");
const parser = require("@typescript-eslint/parser");
const prettier = require("prettier");
const linter = new Linter();
const config = [{ files: ["**/*.{js,ts,tsx}"], languageOptions: { parser } }, base];

function messages(source) {
	return linter.verify(source, config, { filename: "example.tsx" });
}

function fix(source) {
	return linter.verifyAndFix(source, config, { filename: "example.tsx" });
}

test("tooling sync is explicitly eligible and leaves project configs unmanaged", () => {
	const manifest = JSON.parse(readFileSync(new URL("../repository-baseline.json", import.meta.url), "utf8"));
	const group = manifest.managedFileGroups.find(({ name }) => name === "typescript");
	assert.deepEqual(group.repositories, ["payloadbay"]);
	assert.equal(group.files.length, 4);
	for (const file of group.files) {
		assert.ok(existsSync(new URL("../../" + file, import.meta.url)), file);
		assert.ok(selectManagedFilePaths(manifest, "payloadbay").includes(file));
		for (const repository of ["brand", "future-product", ".github"]) assert.ok(!selectManagedFilePaths(manifest, repository).includes(file));
	}
	for (const file of ["eslint.config.mjs", ".prettierrc.mjs", ".prettierrc.json", "tsconfig.json", "package.json", ".vscode/settings.json", "AGENTS.local.md"]) assert.ok(!selectManagedFilePaths(manifest, "payloadbay").includes(file), file);
});

test("directives imports declarations and handlers receive structural spacing", () => {
	const source = '"use client";\nimport { useState, useEffect } from "react";\nconst settings = {one: 1, two: 2, three: 3, four: 4};\nexport function Page() {\nconst [loading, setLoading] = useState(true), [error, setError] = useState("");\nuseEffect(() => {}, []);\nfunction submit() { const value = 1; return value; }\nreturn null;\n}';
	const failures = messages(source);
	for (const rule of ["padding-line-between-statements", "one-var", "object-curly-newline", "readability/logical-sections"])
		assert.ok(
			failures.some(({ ruleId }) => ruleId === rule),
			rule,
		);
	const result = fix(source);
	assert.deepEqual(result.messages, []);
	assert.match(result.output, /"use client";\n\nimport/);
	assert.match(result.output, /const \[loading, setLoading\][^;]+;\s*const \[error, setError\]/);
	assert.match(result.output, /;\n\nuseEffect/);
});

test("substantial named types remain multiline after Prettier and ESLint", async () => {
	const source = "type Props = { id: string; name: string; enabled: boolean; count: number };\nexport function Page(props: Props) { return props.id; }";
	assert.ok(messages(source).some(({ ruleId }) => ruleId === "readability/multiline-types"));
	const output = await prettier.format(fix(source).output, { ...prettierBase, parser: "typescript" });
	assert.deepEqual(messages(output), []);
	assert.match(output, /type Props = \{\n\tid: string;/);
});

test("related state stays grouped and formatting is stable", async () => {
	const source = '"use client";\n\nimport { useState } from "react";\n\nexport function Page() {\nconst [loading, setLoading] = useState(true);\nconst [error, setError] = useState("");\n\nreturn null;\n}';
	const output = await prettier.format(fix(source).output, { ...prettierBase, parser: "typescript" });
	assert.deepEqual(messages(output), []);
	assert.match(output, /useState\(true\);\n\tconst \[error/);
	assert.equal(fix(output).output, output);
	assert.equal(await prettier.format(output, { ...prettierBase, parser: "typescript" }), output);
});

test("Prettier base matches Clipify and project overrides remain possible", () => {
	assert.deepEqual(prettierBase, { useTabs: true, jsxSingleQuote: true, printWidth: 500 });
	assert.equal({ ...prettierBase, printWidth: 120 }.printWidth, 120);
	const projectConfig = [...config, { rules: { "one-var": "off" } }];
	assert.ok(!linter.verify("const first = 1, second = 2;", projectConfig, { filename: "example.tsx" }).some(({ ruleId }) => ruleId === "one-var"));
});
