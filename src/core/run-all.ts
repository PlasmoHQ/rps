import { quote } from "shell-quote"

import { matchTasks } from "./match-tasks"
import type { ArgumentSet } from "./parse-cli-args"
import { runTaskList } from "./run-task-list"
import { readPackageJson } from "./utils"

const ARGS_PATTERN = /\{(!)?([*@]|\d+)([^}]+)?}/g

function toArray(x: string | string[]) {
  if (x == null) {
    return []
  }
  return Array.isArray(x) ? x : [x]
}

function parsePatterns(patternOrPatterns: string | string[], args: string[]) {
  const patterns = toArray(patternOrPatterns)
  const hasPlaceholder = patterns.some((pattern) => ARGS_PATTERN.test(pattern))

  return hasPlaceholder ? applyArguments(patterns, args) : patterns
}

/**
 * Replaces argument placeholders (such as `{1}`) by arguments.
 */
function applyArguments(patterns: string[], args: string[]): string[] {
  const defaults = Object.create(null)

  return patterns.map((pattern: string) =>
    pattern.replace(
      ARGS_PATTERN,
      (whole: any, indirectionMark: any, id: string, options: string) => {
        if (indirectionMark != null) {
          throw Error(`Invalid Placeholder: ${whole}`)
        }
        if (id === "@") {
          return quote(args)
        }
        if (id === "*") {
          return quote([args.join(" ")])
        }

        const position = parseInt(id, 10)
        if (position >= 1 && position <= args.length) {
          return quote([args[position - 1]])
        }

        // Address default values
        if (options != null) {
          const prefix = options.slice(0, 2)

          if (prefix === ":=") {
            defaults[id] = quote([options.slice(2)])
            return defaults[id]
          }
          if (prefix === ":-") {
            return quote([options.slice(2)])
          }

          throw new Error(`Invalid Placeholder: ${whole}`)
        }
        if (defaults[id] != null) {
          return defaults[id]
        }

        return ""
      }
    )
  )
}

export async function runAll(
  pat: string | string[],
  args: ArgumentSet,
  io = {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr
  }
) {
  const patterns = parsePatterns(pat, args.arguments)

  if (patterns.length === 0) {
    return null
  }

  const { taskList } = await readPackageJson()

  console.log({
    patterns,
    taskList
  })

  const tasks = matchTasks(taskList, patterns)

  return runTaskList(tasks, io)
}
