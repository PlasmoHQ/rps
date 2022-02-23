#!/usr/bin/env node
import { argv } from "process"

import { supressMaxListenersExceededWarnings } from "./core/supress-error.js"
import { run } from "./index.js"

async function runP() {
  try {
    supressMaxListenersExceededWarnings()
    run(argv.slice(2), true)
  } catch (error) {
    console.error(error)
  }
}

runP()
