#!/usr/bin/env node
import { argv } from "process"

import { parseCLIArgs } from "./core/parse-cli-args"
import { runAll } from "./core/run-all"
import { supressMaxListenersExceededWarnings } from "./core/supress-error"

async function runP() {
  try {
    supressMaxListenersExceededWarnings()

    const parsedArgv = parseCLIArgs(
      argv.slice(2),
      { parallel: true },
      { singleMode: true }
    )

    const group = parsedArgv.lastGroup

    return runAll(group.patterns, parsedArgv)
  } catch (error) {
    console.error(error)
    return null
  }
}

runP()
