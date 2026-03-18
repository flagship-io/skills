#!/usr/bin/env node

/**
 * Codebase Analyzer - Example Script
 *
 * Scans a directory for feature flag usage across AB Tasty (Flagship SDK)
 * and competitor platforms (LaunchDarkly, OpenFeature, Optimizely, Split, VWO).
 *
 * Prerequisites:
 *   npm install -g @abtasty/codebase-analyzer-typescript
 *
 * Usage:
 *   node scripts/analyze-codebase.js [directory] [--platform <name>]
 *
 * Examples:
 *   node scripts/analyze-codebase.js ./src
 *   node scripts/analyze-codebase.js ./src --platform launchdarkly
 *   node scripts/analyze-codebase.js  (defaults to scripts/example-codebase)
 */

let analyzer;
try {
  analyzer = require("@abtasty/codebase-analyzer-typescript");
} catch {
  console.error(
    "Error: @abtasty/codebase-analyzer-typescript not found.\n" +
    "Install it globally with: npm install -g @abtasty/codebase-analyzer-typescript"
  );
  process.exit(1);
}

const path = require("path");

// --- Parse CLI arguments ---
const args = process.argv.slice(2);
let directory = path.join(__dirname, "example-codebase");
let platform = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--platform" && args[i + 1]) {
    platform = args[++i];
  } else if (!args[i].startsWith("--")) {
    directory = path.resolve(args[i]);
  }
}

// --- Build config ---
const configOptions = {
  directory,
  repositoryURL: "https://github.com/example/repo",
  repositoryBranch: "main",
};

// If a competitor platform is specified, load its regexes
if (platform) {
  const platformRegexes = analyzer.getPlatformRegexes(platform);
  if (!platformRegexes) {
    console.error(
      `Unknown platform: "${platform}". ` +
      "Available: launchdarkly, openfeature, optimizely, split, vwo"
    );
    process.exit(1);
  }
  configOptions.searchCustomRegex = JSON.stringify(platformRegexes);
  console.log(`\nLoaded regex patterns for platform: ${platform}`);
}

const config = analyzer.createConfig(configOptions);

// --- Run analysis ---
console.log(`\nAnalyzing directory: ${directory}\n`);
console.log("=".repeat(60));

const results = analyzer.extractFlagsInfo(config);

// --- Display results ---
let totalFlags = 0;
const filesWithFlags = [];

for (const fileResult of results) {
  if (fileResult.results.length > 0) {
    filesWithFlags.push(fileResult);
    totalFlags += fileResult.results.length;
  }
}

if (filesWithFlags.length === 0) {
  console.log("\nNo feature flags detected.");
  console.log(
    "\nTip: Make sure the directory contains files with supported SDK patterns."
  );
  process.exit(0);
}

console.log(`\nFound ${totalFlags} flag(s) in ${filesWithFlags.length} file(s):\n`);

for (const fileResult of filesWithFlags) {
  const relPath = path.relative(directory, fileResult.file);
  console.log(`--- ${relPath} ---`);

  for (const flag of fileResult.results) {
    const parts = [`  Flag: "${flag.flagKey}"`];
    if (flag.flagDefaultValue) parts.push(`default=${flag.flagDefaultValue}`);
    if (flag.flagType !== "unknown") parts.push(`type=${flag.flagType}`);
    parts.push(`line=${flag.lineNumber}`);
    console.log(parts.join("  |  "));
  }
  console.log();
}

// --- Summary table ---
console.log("=".repeat(60));
console.log("\nSummary:");
console.log(`  Total flags found:    ${totalFlags}`);
console.log(`  Files with flags:     ${filesWithFlags.length}`);
console.log(`  Total files scanned:  ${results.length}`);

// Group by type
const byType = {};
for (const f of filesWithFlags) {
  for (const flag of f.results) {
    byType[flag.flagType] = (byType[flag.flagType] || 0) + 1;
  }
}
console.log("\n  By type:");
for (const [type, count] of Object.entries(byType)) {
  console.log(`    ${type}: ${count}`);
}
console.log();
