import { parseCLIArgs } from "./core/parse-cli-args"
import { runAll } from "./core/run-all"

export type { TaskOptions, TaskOutput } from "./core/run-task"
export { runParallel, runSequential, runTaskList } from "./core/run-task-list"
export { Spawn } from "./core/spawn"
export { parseCLIArgs, runAll }

export const run = (input: string[], parallel = false) => {
  const parsedArgv = parseCLIArgs(input, { parallel }, { singleMode: true })

  const group = parsedArgv.lastGroup

  return runAll(group.patterns, parsedArgv)
}
