import { TaskOptions, TaskOutput, runTask } from "./run-task"

const signalMap: Partial<Record<NodeJS.Signals, number>> = {
  SIGABRT: 6,
  SIGALRM: 14,
  SIGBUS: 10,
  SIGCHLD: 20,
  SIGCONT: 19,
  SIGFPE: 8,
  SIGHUP: 1,
  SIGILL: 4,
  SIGINT: 2,
  SIGKILL: 9,
  SIGPIPE: 13,
  SIGQUIT: 3,
  SIGSEGV: 11,
  SIGSTOP: 17,
  SIGTERM: 15,
  SIGTRAP: 5,
  SIGTSTP: 18,
  SIGTTIN: 21,
  SIGTTOU: 22,
  SIGUSR1: 30,
  SIGUSR2: 31
}

/**
 * Converts a signal name to a number.
 * @param {string} signal - the signal name to convert into a number
 * @returns {number} - the return code for the signal
 */
function lookupSignalCode(signal: NodeJS.Signals): number {
  return signalMap[signal] || 0
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * Run npm-scripts of given names in parallel.
 *
 * If a npm-script exited with a non-zero code, this aborts other all npm-scripts.
 */

type TaskListOptions = {
  parallel?: boolean
} & TaskOptions

export async function runTaskList(tasks: string[], options: TaskListOptions) {
  if (tasks.length === 0) {
    return []
  }
  return options.parallel
    ? await runParallel(tasks, options)
    : await runSequential(tasks, options)
}

async function runParallel(tasks: string[], options: TaskListOptions) {
  const results = await Promise.allSettled(
    tasks.map((task) => runTask(task, Object.assign({}, options)))
  )

  return results.map((result) => {
    if (result.status === "rejected") {
      console.error(result.reason)
      return null
    }

    return appendErrorCode(result.value)
  })
}

async function runSequential(tasks: string[], options: TaskListOptions) {
  const output: TaskOutput[] = []
  for (const task of tasks) {
    try {
      const result = await runTask(task, Object.assign({}, options))
      output.push(appendErrorCode(result))
    } catch (error) {
      console.error(error)
      output.push(null)
    }
  }
  return output
}

function appendErrorCode(output: TaskOutput) {
  if (output.code === null && output.signal !== null) {
    // An exit caused by a signal must return a status code
    // of 128 plus the value of the signal code.
    // Ref: https://nodejs.org/api/process.html#process_exit_codes
    output.code = 128 + lookupSignalCode(output.signal)
  }
  return output
}
