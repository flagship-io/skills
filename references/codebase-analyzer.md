# Codebase Analyzer

Analyze a codebase to detect feature flag usage across multiple platforms and SDKs.

## Overview

The codebase analyzer scans source files for feature flag patterns from AB Tasty (Flagship SDK) and competitor platforms (LaunchDarkly, OpenFeature, Optimizely, Split, VWO). It extracts flag keys, default values, types, and file locations.

**npm package:** `@abtasty/codebase-analyzer-typescript` ([npmjs.com](https://www.npmjs.com/package/@abtasty/codebase-analyzer-typescript))

## Installation

Install the package globally so it is accessible via `require()` in standalone scripts:

```bash
npm install -g @abtasty/codebase-analyzer-typescript
```

## How to Use

### Programmatic Usage

```typescript
import {
  createConfig,
  analyzeCode,
  extractFlagsInfo,
} from "@abtasty/codebase-analyzer-typescript";

// Create config with defaults
const config = createConfig({
  directory: "/path/to/codebase",
  repositoryURL: "https://github.com/org/repo",
  repositoryBranch: "main",
});

// Analyze and get results (logs scanned files)
const results = analyzeCode(config);

// Or extract without logging
const results = extractFlagsInfo(config);
```

### Configuration Options

| Option              | Type       | Default                                                            | Description                         |
| ------------------- | ---------- | ------------------------------------------------------------------ | ----------------------------------- |
| `directory`         | `string`   | `"."`                                                              | Directory to scan                   |
| `repositoryURL`     | `string`   | `"https://github.com/org/repo"`                                    | Repo URL for generating file links  |
| `repositoryBranch`  | `string`   | `"main"`                                                           | Branch name for file links          |
| `nbLineCodeEdges`   | `number`   | `1`                                                                | Context lines around flag usage     |
| `filesToExclude`    | `string[]` | `[".git", ".github", ".vscode", ".idea", ".yarn", "node_modules"]` | Directories/files to skip           |
| `searchCustomRegex` | `string`   | `""`                                                               | Custom regex patterns (JSON string) |

### Output Format

Returns `FileAnalyzed[]`:

```typescript
interface FileAnalyzed {
  file: string; // Relative file path
  fileURL: string; // Full URL to file in repository
  error: string | null;
  results: FlagAnalyzed[];
}

interface FlagAnalyzed {
  lineNumber: number;
  flagKey: string;
  flagDefaultValue: string;
  flagType: string; // "boolean" | "string" | "number" | "json" | "unknown"
  exists: boolean;
}
```

## Supported Languages & SDKs

### AB Tasty / Flagship SDK (built-in)

| Language              | File Extensions              | Patterns Detected                                    |
| --------------------- | ---------------------------- | ---------------------------------------------------- |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx` | `useFsFlag()`, `getFlag()`, key/defaultValue objects |
| Go                    | `.go`                        | `GetModificationString/Number/Bool/Object/Array()`   |
| Python                | `.py`                        | `get_modification()`                                 |
| Java                  | `.java`                      | `getModification()`, `getFlag()`                     |
| Kotlin                | `.kt`                        | `getModification()`, `getFlag()`, `.value()`         |
| PHP                   | `.php`                       | `->getModification()`, `->getFlag()`, `->getValue()` |
| Swift                 | `.swift`                     | `getModification()`, `getFlag()`, `.value()`         |
| Objective-C           | `.m`                         | `getModification:`, `getFlagWithKey:`                |
| C#/F#                 | `.cs`, `.fs`                 | `GetModification()`, `GetFlag()`, `.GetValue()`      |
| VB.NET                | `.vb`                        | `GetModification()`, `GetFlag()`, `.GetValue()`      |
| Dart/Flutter          | `.dart`                      | `getFlag()`, `.value()`                              |

### Comment-based flags

Any file: `// fe:flag: flagName, type`

### Competitor Platforms (via custom regexes)

Load competitor platform regexes using the regex modules:

```typescript
import {
  getPlatformRegexes,
  getTemplateRegexes,
} from "@abtasty/codebase-analyzer-typescript";

// Get regexes for a specific platform
const ldRegexes = getPlatformRegexes("launchdarkly");
const ofRegexes = getPlatformRegexes("openfeature");
const optRegexes = getPlatformRegexes("optimizely");
const splitRegexes = getPlatformRegexes("split");
const vwoRegexes = getPlatformRegexes("vwo");

// Get template regexes for creating custom patterns
const templates = getTemplateRegexes();

// Use as custom regexes in config
const config = createConfig({
  directory: "/path/to/codebase",
  searchCustomRegex: JSON.stringify(ldRegexes),
});
```

Available platforms: `launchdarkly`, `openfeature`, `optimizely`, `split`, `vwo`

### Custom Regex Patterns

Define your own patterns as a JSON array of `RegexPattern`:

```typescript
const customRegex = JSON.stringify([
  {
    file_extension: "\\.[jt]s$",
    regexes: ["myCustomFlag[(]\\s*[\"'](\\w+)[\"']\\s*,\\s*([^)]+)[)]"],
  },
]);

const config = createConfig({ searchCustomRegex: customRegex });
```

Each regex must have:

- **Capture group 1**: The flag key
- **Capture group 2** (optional): The default value

## Example

See `scripts/analyze-codebase.js` for a complete working example that scans the current directory for AB Tasty and competitor feature flags.
