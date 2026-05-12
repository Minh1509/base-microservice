#!/usr/bin/env node
/**
 * validate-claude-setup.cjs
 *
 * CI script: validate .claude/ setup integrity
 * Exit 0 = pass, Exit 1 = fail
 *
 * Checks:
 *   1. Critical files exist
 *   2. Hook files referenced in settings.json exist on disk
 *   3. Critical hook files are non-empty (not placeholder-only)
 *   4. settings.json is valid JSON (no comments)
 *   5. adf-config.json is valid JSON
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Script lives in .claude/scripts/ — ROOT is 2 levels up
const ROOT = path.resolve(__dirname, '..', '..');
const CLAUDE_DIR = path.join(ROOT, '.claude');

let errors = 0;
let warnings = 0;

function pass(msg) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); }
function fail(msg) { console.error(`  \x1b[31m✗\x1b[0m ${msg}`); errors++; }
function warn(msg) { console.warn(`  \x1b[33m⚠\x1b[0m ${msg}`); warnings++; }
function section(title) { console.log(`\n\x1b[1m${title}\x1b[0m`); }

// ─── 1. Critical files ────────────────────────────────────────────────────────

section('1. Critical files');

const CRITICAL_FILES = [
  'CLAUDE.md',
  '.claude/settings.json',
  '.claude/config/adf-config.json',
  '.claude/config/adf-ignore.txt',
  '.claude/statusline.cjs',
  '.claude/rules/development-rules.md',
  '.claude/rules/security.md',
  '.claude/context/domain-glossary.md',
  '.claude/memory/checkpoints/current.md',
];

for (const rel of CRITICAL_FILES) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) {
    pass(rel);
  } else {
    fail(`Missing: ${rel}`);
  }
}

// ─── 2. settings.json valid JSON + hook bindings ──────────────────────────────

section('2. settings.json — JSON validity + hook bindings');

let settings = null;
const settingsPath = path.join(CLAUDE_DIR, 'settings.json');

try {
  const raw = fs.readFileSync(settingsPath, 'utf8');
  settings = JSON.parse(raw);
  pass('settings.json is valid JSON');
} catch (e) {
  fail(`settings.json parse error: ${e.message}`);
}

// Extract all hook command paths from settings.json
const boundHooks = new Set();
if (settings?.hooks) {
  for (const lifecycle of Object.values(settings.hooks)) {
    for (const group of lifecycle) {
      for (const hook of (group.hooks || [])) {
        if (hook.command) {
          // Extract the .cjs file path from "node .claude/hooks/xxx.cjs"
          const match = hook.command.match(/node\s+(.+\.cjs)/);
          if (match) boundHooks.add(match[1]);
        }
      }
    }
  }
}

// Verify each bound hook file exists
for (const hookPath of boundHooks) {
  const abs = path.join(ROOT, hookPath);
  if (fs.existsSync(abs)) {
    pass(`Bound hook exists: ${hookPath}`);
  } else {
    fail(`Bound hook missing on disk: ${hookPath}`);
  }
}

// ─── 3. adf-config.json valid JSON ───────────────────────────────────────────

section('3. adf-config.json — JSON validity');

const adfPath = path.join(CLAUDE_DIR, 'config', 'adf-config.json');
try {
  const raw = fs.readFileSync(adfPath, 'utf8');
  const cfg = JSON.parse(raw);
  pass('adf-config.json is valid JSON');

  // Check hooks in adf-config are also bound in settings.json
  if (cfg.hooks) {
    for (const [hookName, enabled] of Object.entries(cfg.hooks)) {
      if (!enabled) continue;
      const expectedFile = `.claude/hooks/${hookName}.cjs`;
      const abs = path.join(ROOT, expectedFile);
      if (!fs.existsSync(abs)) {
        warn(`adf-config enables "${hookName}" but ${expectedFile} does not exist`);
      }
    }
  }
} catch (e) {
  fail(`adf-config.json parse error: ${e.message}`);
}

// ─── 4. Non-empty critical hooks ─────────────────────────────────────────────

section('4. Critical hooks — non-empty check');

// Hooks that must have real implementation (not just a comment line)
const IMPL_REQUIRED = [
  '.claude/hooks/lib/privacy-checker.cjs',
  '.claude/hooks/lib/scout-checker.cjs',
  '.claude/hooks/lib/context-builder.cjs',
  '.claude/hooks/lib/ck-config-utils.cjs',
  '.claude/hooks/scout-block/pattern-matcher.cjs',
  '.claude/hooks/scout-block/path-extractor.cjs',
  '.claude/hooks/scout-block/broad-pattern-detector.cjs',
  '.claude/statusline.cjs',
];

const PLACEHOLDER_THRESHOLD = 5; // lines — below this = likely placeholder

for (const rel of IMPL_REQUIRED) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    fail(`Implementation file missing: ${rel}`);
    continue;
  }
  const lines = fs.readFileSync(abs, 'utf8').split('\n').filter(l => l.trim()).length;
  if (lines < PLACEHOLDER_THRESHOLD) {
    warn(`Likely placeholder (${lines} non-empty lines): ${rel}`);
  } else {
    pass(`Has implementation (${lines} lines): ${rel}`);
  }
}

// Entrypoint hooks — warn if still placeholder
const ENTRYPOINT_HOOKS = [
  '.claude/hooks/session-init.cjs',
  '.claude/hooks/dev-rules-reminder.cjs',
  '.claude/hooks/security-reminder.cjs',
  '.claude/hooks/privacy-block.cjs',
  '.claude/hooks/protected-files-block.cjs',
  '.claude/hooks/scout-block.cjs',
  '.claude/hooks/minimal-diff-enforcer.cjs',
  '.claude/hooks/post-edit-review.cjs',
  '.claude/hooks/post-edit-simplify-reminder.cjs',
  '.claude/hooks/write-checkpoint.cjs',
  '.claude/hooks/context-tracking.cjs',
  '.claude/hooks/usage-context-awareness.cjs',
];

section('5. Entrypoint hooks — placeholder check');

for (const rel of ENTRYPOINT_HOOKS) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    fail(`Entrypoint hook missing: ${rel}`);
    continue;
  }
  const lines = fs.readFileSync(abs, 'utf8').split('\n').filter(l => l.trim()).length;
  if (lines < PLACEHOLDER_THRESHOLD) {
    warn(`Placeholder (needs implementation): ${rel}`);
  } else {
    pass(`Implemented: ${rel}`);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50));
if (errors === 0 && warnings === 0) {
  console.log('\x1b[32m✓ All checks passed\x1b[0m');
} else {
  if (errors > 0) console.error(`\x1b[31m✗ ${errors} error(s)\x1b[0m`);
  if (warnings > 0) console.warn(`\x1b[33m⚠ ${warnings} warning(s)\x1b[0m`);
}

process.exit(errors > 0 ? 1 : 0);
