---
detected_at: 5d48b12
ecosystems: [javascript-tooling, python-preset-validation]
default: javascript-tooling
stacks:
  javascript-tooling:
    cwd: .
    runner: node:test
    single: null
    file: 'node --test {file}'
    suite: node --test .github/scripts/repository-baseline.test.mjs
    watch: null
    coverage: null
    mutation: null
    acceptance: null
    property: null
    approval: null
    contract: null
    test_glob: .github/scripts/*.test.mjs
    exemplar:
      unit: .github/scripts/repository-baseline.test.mjs
    helpers: []
  python-preset-validation:
    cwd: .
    runner: unittest
    single: 'python {file} {name}'
    file: 'python {file}'
    suite: python .github/scripts/test-speckit.py
    watch: null
    coverage: null
    mutation: null
    acceptance: python .github/scripts/test-speckit.py
    property: null
    approval: null
    contract: null
    test_glob: .github/scripts/test-speckit.py
    exemplar:
      integration: .github/scripts/test-speckit.py
    helpers: []
verified: [file, suite]
suite_baseline: green
---

# Organization tooling TDD profile

## Conventions and verified execution

- JavaScript assertions use `node:assert/strict` and `node:test`. The file covers
  synchronization eligibility, simulated GitHub contents, conflict handling and
  baseline governance. Run the whole file for Red/Green cycles. An existing name
  filter ran one test, but a nonexistent name exited successfully with no tests;
  name filtering is therefore not a verified Red-phase command.
- The JavaScript suite passed 18 tests. A behavioral Red was observed when Core's
  selected file set omitted the SpecKit asset; the same check passed after the
  eligible file group was implemented.
- Python assertions use `unittest.TestCase`. Tests own disposable directories,
  initialize the pinned CLI, install/refresh the preset, switch Codex/Claude and
  verify preservation of repository-owned content. Run with an activated Python
  environment containing the pinned PyYAML and the pinned `specify` on PATH.
- The Python suite passed two tests. The known single selection
  `SpecKitPresetTests.test_distributed_inventory_is_complete_and_project_state_is_excluded`
  passed; a nonexistent test raised an error and exited 1. The Python `single`
  command is safe when using the fully qualified class/method selector.
- Both suites are small enough for completed-slice checks. CI runs them as the
  validation gate; do not call real downstream mutations from tests.

## Missing capabilities

Coverage, mutation, property testing, watch and snapshots are not configured.
Coverage is unmeasured, not assumed. Use requirement-to-test mapping and targeted
deliberate-fault checks for high-risk behavior until those capabilities are added
through separately scoped work. No application browser suite exists here.

## Navigation and platform limits

No repository Graphify graph is currently present. Use `rg` for exact searches;
query a project graph when one is built and verified current. Node and Python
commands were verified on Linux. Windows execution has not been tested here.
