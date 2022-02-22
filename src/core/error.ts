import type { TaskOutput } from "./run-task"

type Results = Array<{ name: string; code: number | undefined }>

export class RPSError extends Error {
  task: string
  code: number
  results: Results

  constructor(cause: TaskOutput, allResults: Results) {
    super(`"${cause.task}" exited with ${cause.code}.`)

    /**
     * The name of a npm-script which exited with a non-zero code.
     * @type {string}
     */
    this.task = cause.task

    /**
     * The code of a npm-script which exited with a non-zero code.
     * This can be `undefined`.
     * @type {number}
     */
    this.code = cause.code

    /**
     * All result items of npm-scripts.
     * @type {Array.<{name: string, code: (number|undefined)}>}
     */
    this.results = allResults
  }
}
