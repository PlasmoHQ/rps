#!/usr/bin/env node
import { argv } from "process"

import { supressMaxListenersExceededWarnings } from "./core/supress-error.js"
import { run } from "./index.js"

async function runP() {
  try {
    supressMaxListenersExceededWarnings()
    const outputs = await run(argv.slice(2), true)
    const exitCcode = Math.max(...outputs.map(x => x.code))

    // Exit the process with the highest exit code.
    process.exit(exitCcode)
  } catch (error) {
    console.error(error)
  }
}

runP()
