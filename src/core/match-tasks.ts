import { Minimatch } from "minimatch"

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const COLON_OR_SLASH = /[:/]/g
const CONVERT_MAP = { ":": "/", "/": ":" }

/**
 * Swaps ":" and "/", in order to use ":" as the separator in minimatch.
 */
function swapColonAndSlash(s: string): string {
  return s.replace(COLON_OR_SLASH, (matched) => CONVERT_MAP[matched])
}

/**
 * Creates a filter from user-specified pattern text.
 *
 * The task name is the part until the first space.
 * The rest part is the arguments for this task.
 *
 */
function createFilter(pattern: string): {
  match: Function
  task: string
  args: string
} {
  const trimmed = pattern.trim()
  const spacePos = trimmed.indexOf(" ")
  const task = spacePos < 0 ? trimmed : trimmed.slice(0, spacePos)
  const args = spacePos < 0 ? "" : trimmed.slice(spacePos)
  const matcher = new Minimatch(swapColonAndSlash(task), { nonegate: true })
  const match = matcher.match.bind(matcher)

  return { match, task, args }
}

/**
 * The set to remove overlapped task.
 */
class TaskSet {
  result = [] as Array<string>
  sourceMap = {} as Record<string, Array<string>>

  /**
   * Adds a command (a pattern) into this set if it's not overlapped.
   * "Overlapped" is meaning that the command was added from a different source.
   */
  add(command: string, source: string): void {
    const sourceList = this.getSourceList(command)
    if (sourceList.length === 0 || sourceList.indexOf(source) !== -1) {
      this.result.push(command)
    }
    sourceList.push(source)
  }

  getSourceList(command: string) {
    return this.sourceMap[command] || (this.sourceMap[command] = [])
  }
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * Enumerates tasks which matches with given patterns.
 */
export function matchTasks(taskList: string[], patterns: string[]): string[] {
  const filters = patterns.map(createFilter)
  const candidates = taskList.map(swapColonAndSlash)
  const taskSet = new TaskSet()
  const unknownSet = new Set<string>()

  // Take tasks while keep the order of patterns.
  for (const filter of filters) {
    let found = false

    for (const candidate of candidates) {
      if (filter.match(candidate)) {
        found = true
        taskSet.add(swapColonAndSlash(candidate) + filter.args, filter.task)
      }
    }

    // Built-in tasks should be allowed.
    if (!found && (filter.task === "restart" || filter.task === "env")) {
      taskSet.add(filter.task + filter.args, filter.task)
      found = true
    }

    if (!found) {
      unknownSet.add(filter.task)
    }
  }

  if (unknownSet.size > 0) {
    const unknownList = Array.from(unknownSet)
    throw new Error(`Task not found: "${unknownList.join('", ')}"`)
  }

  return taskSet.result
}
