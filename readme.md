# RPS

Run pnpm/npm/yarn scripts in sequential or in parallel, cross-platform. This is a hard fork of [`npm-run-all`](https://github.com/mysticatea/npm-run-all/) with the following enhancement:x

- Rewrite in Typescript, with esbuild bundling
- Automated dependencies upkeep with renovate bot
- Run logic are decoupled between syncronous vs asyncronous, allowing much cleaner spawn code, [audit it here](https://github.com/plasmo-corp/rps/blob/main/src/core/run-task-list.ts#L50-L57)

# Usage

## package.json scripts

Install the package as a dev dependency, swapping `pnpm` with your preferred package manager:

```bash
pnpm i -D @plasmo-corp/rps
```

Then, in your package.json scripts, you can replace sequential script with `run-s`:

```diff
-  "prepare": "pnpm run clean && pnpm run build"

+  "prepare": "run-s clean build"
```

Or parallel script with `run-p`:

```diff
-  "start": "pnpm run watch & pnpm run serve"

+  "start": "run-p watch serve"
```

You can also use glob patterns:

```json
  "build": "run-s build:* compile",
  "build:codegen": "node ./scripts/codegen.mjs",
  "build:docs": "node ./scripts/docs.mjs",
  "build:lint": "node ./scripts/lint.mjs",
  "compile": "run-p compile:*",
  "compile:linux": "node ./scripts/linux.mjs",
  "compile:macosx": "node ./scripts/macosx.mjs",
  "compile:win32": "node ./scripts/win32.mjs",
```

## nodejs API

You can import the runners from this module and use it like so:

```ts
#!/usr/bin/env node
import { run } from "@plasmo-corp/rps"

run(["clean", "build"]) // sequential

run(["watch", "serve"], true) // parallel
```

# Acknowledgment

- [npm-run-all](https://github.com/mysticatea/npm-run-all/)

# License

[MIT](./license) 🚀 [Plasmo Corp.](https://plasmo.com)
