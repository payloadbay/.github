"""Verify the real SpecKit preset in disposable projects; never invoke an agent."""

from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / ".github/speckit"
SETUP = json.loads((SOURCE / "setup.json").read_text(encoding="utf-8"))
SPECIFY = os.environ.get("SPECIFY_EXECUTABLE") or shutil.which("specify")


def run(cwd: Path, *args: str) -> str:
    result = subprocess.run(
        args, cwd=cwd, text=True, encoding="utf-8", capture_output=True,
        timeout=60, check=False,
        env={key: value for key, value in os.environ.items()
             if not key.startswith(("SPECIFY_", "SPECKIT_"))},
    )
    if result.returncode:
        raise AssertionError(
            f"Command failed ({result.returncode}): {args}\n"
            f"{result.stdout}\n{result.stderr}"
        )
    return result.stdout


class SpecKitPresetTests(unittest.TestCase):
    def test_distributed_inventory_is_complete_and_project_state_is_excluded(self):
        baseline = json.loads((ROOT / ".github/repository-baseline.json").read_text())
        group = next(group for group in baseline["managedFileGroups"] if group["name"] == "speckit")
        inventory = {path.relative_to(ROOT).as_posix()
                     for path in SOURCE.rglob("*") if path.is_file()}
        self.assertEqual(set(group["files"]), inventory)
        self.assertTrue(all(path.startswith(".github/speckit/") for path in group["files"]))

    def test_real_installation_refresh_and_agent_switch(self):
        self.assertIsNotNone(SPECIFY, "Install the pinned specify-cli first")
        # The generated Python helpers need PyYAML in their execution environment,
        # not merely inside uvx's private CLI environment.
        import yaml

        self.assertEqual(yaml.__version__, SETUP["pythonDependencies"]["PyYAML"])
        self.assertEqual(run(ROOT, SPECIFY, "--version").strip(), f"specify {SETUP['specifyVersion']}")
        with tempfile.TemporaryDirectory(prefix="payloadbay-speckit-") as temporary:
            project = Path(temporary)
            shutil.copytree(SOURCE, project / ".github/speckit")
            run(project, SPECIFY, "init", "--here", "--force", "--non-interactive",
                "--ignore-agent-tools", "--integration", SETUP["defaultIntegration"],
                "--script", SETUP["script"])
            options = json.loads((project / ".specify/init-options.json").read_text())
            self.assertEqual(options["script"], "py")
            self.assertEqual(options["speckit_version"], SETUP["specifyVersion"])

            owned = {
                ".specify/memory/constitution.md": "# Project constitution\nKeep the local architecture.\n",
                ".specify/memory/tdd-profile.md": "# Local test commands\nVerified locally.\n",
                "specs/001-delivery/spec.md": "# Local delivery specification\n",
            }
            for path, content in owned.items():
                target = project / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(content, encoding="utf-8")

            preset_path = str(project / ".github/speckit/presets/payloadbay")
            run(project, SPECIFY, "preset", "add", "--dev", preset_path,
                "--priority", str(SETUP["presetPriority"]))
            presets = json.loads(run(project, SPECIFY, "preset", "list", "--json"))
            self.assertEqual([(p["id"], p["version"]) for p in presets],
                             [(SETUP["preset"], SETUP["presetVersion"])])

            templates = ["constitution", "spec", "plan", "tasks"]
            for name in templates:
                helper = str(project / ".specify/scripts/python/resolve_template.py")
                resolved = json.loads(run(project, sys.executable, helper, f"{name}-template", "--json"))
                core = (project / f".specify/templates/{name}-template.md").read_text(encoding="utf-8").strip()
                addendum = (Path(preset_path) / f"templates/{name}-addendum.md").read_text(encoding="utf-8").strip()
                self.assertIn(core, resolved["TEMPLATE_CONTENT"])
                self.assertIn(addendum, resolved["TEMPLATE_CONTENT"])

            helper = str(project / ".specify/scripts/python/check_prerequisites.py")
            self.assertIn("Usage:", run(project, sys.executable, helper, "--help"))
            self.check_skills(project, SETUP["defaultIntegration"])

            # Updating distributed source must refresh the installed copy and the
            # active skills, while preserving all repository-owned content.
            wrapper = Path(preset_path) / "commands/speckit.implement.md"
            wrapper.write_text(wrapper.read_text(encoding="utf-8") + "\nRefresh probe.\n", encoding="utf-8")
            run(project, SPECIFY, "preset", "update", "payloadbay", "--dev", preset_path,
                "--priority", str(SETUP["presetPriority"]))
            self.check_skills(project, "codex", refreshed=True)

            run(project, SPECIFY, "integration", "install", "claude", "--script", "py")
            run(project, SPECIFY, "integration", "use", "claude")
            self.check_skills(project, "claude", refreshed=True)
            run(project, SPECIFY, "integration", "use", "codex")
            self.check_skills(project, "codex", refreshed=True)

            for path, content in owned.items():
                self.assertEqual((project / path).read_text(encoding="utf-8"), content)

    def check_skills(self, project: Path, integration: str, refreshed: bool = False):
        directory = ".agents" if integration == "codex" else ".claude"
        for name in ["constitution", "specify", "plan", "tasks", "implement", "analyze"]:
            skill = (project / directory / "skills" / f"speckit-{name}" / "SKILL.md").read_text(encoding="utf-8")
            self.assertIn("Payload Bay", skill)
            self.assertIn("## User Input", skill)  # Core content survives wrapping.
            self.assertNotIn("{CORE_TEMPLATE}", skill)
            self.assertNotIn(".specify/scripts/bash/", skill)
            self.assertNotIn(".specify/scripts/powershell/", skill)
            if name in ["plan", "tasks", "implement", "analyze"]:
                self.assertIn(".specify/scripts/python/", skill)
            if refreshed and name == "implement":
                self.assertIn("Refresh probe.", skill)


if __name__ == "__main__":
    unittest.main(verbosity=2)
