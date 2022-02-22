#!/usr/bin/env node
import { argv } from "process"

import { parseCLIArgs } from "./core/parse-cli-args"
import { runAll } from "./core/run-all"
import { supressMaxListenersExceededWarnings } from "./core/supress-error"

async function runP() {
  supressMaxListenersExceededWarnings()

  const parsedArgv = parseCLIArgs(
    argv,
    { parallel: true },
    { singleMode: true }
  )

  const group = parsedArgv.lastGroup

  return runAll(group.patterns, parsedArgv)
}

runP()
