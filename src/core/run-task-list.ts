import { TaskOptions, runTask } from "./run-task"

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

export async function runTaskList(tasks: string[], options: TaskOptions) {
  if (tasks.length === 0) {
    return []
  }

  const runResults = await Promise.allSettled(
    tasks.map((task) => runTask(task, Object.assign({}, options)))
  )

  return runResults.map((result) => {
    if (result.status === "rejected") {
      return null
    }
    if (result.status === "fulfilled") {
      if (result.value.code === null && result.value.signal !== null) {
        // An exit caused by a signal must return a status code
        // of 128 plus the value of the signal code.
        // Ref: https://nodejs.org/api/process.html#process_exit_codes
        result.value.code = 128 + lookupSignalCode(result.value.signal)
      }
    }
    return result.value
  })
}
