#!/usr/bin/env node
import { argv } from "process"

import { supressMaxListenersExceededWarnings } from "./core/supress-error"
import { run } from "./index.js"

async function runS() {
  try {
    supressMaxListenersExceededWarnings()
    run(argv.slice(2))
  } catch (error) {
    console.error(error)
  }
}

runS()
