import { env, execPath } from "process"
import { parse as parseArgs } from "shell-quote"
import type { Readable, Stream, Writable } from "stream"

import { LabelState, PrefixTransform } from "./prefix-transform"
import { Spawn } from "./spawn"

function wrapLabeling(
  taskName: string,
  source: any,
  labelState = {} as LabelState
) {
  if (source == null || !labelState.enabled) {
    return source
  }

  const label = taskName.padEnd(labelState.width)

  const stream = new PrefixTransform(label, labelState)

  stream.pipe(source)

  return stream
}

function detectStreamKind(
  stream: Stream,
  std:
    | (NodeJS.ReadStream & { fd: 0 })
    | (NodeJS.WriteStream & { fd: 1 })
    | (NodeJS.WriteStream & { fd: 2 })
) {
  return stream == null
    ? "ignore"
    : // `|| !std.isTTY` is needed for the workaround of https://github.com/nodejs/node/issues/5620
    stream !== std || !std.isTTY
    ? "pipe"
    : /* else */ stream
}

function cleanTaskArg(arg: { pattern: string; op: string } & string) {
  return arg.pattern || arg.op || arg
}

export type TaskOptions = {
  stdin: Readable
  stdout: Writable
  stderr: Writable

  labelState?: LabelState

  packageManager?: "npm" | "yarn" | "pnpm"
}

export type TaskOutput = {
  task: string
  code: number
  signal: NodeJS.Signals
}

export async function runTask(
  task: string,
  options: TaskOptions
): Promise<TaskOutput> {
  return new Promise((resolve, reject) => {
    const stdin = options.stdin
    const stdout = wrapLabeling(task, options.stdout, options.labelState)
    const stderr = wrapLabeling(task, options.stderr, options.labelState)
    const stdinKind = detectStreamKind(stdin, process.stdin)
    const stdoutKind = detectStreamKind(stdout, process.stdout)
    const stderrKind = detectStreamKind(stderr, process.stderr)
    const spawnOptions = { stdio: [stdinKind, stdoutKind, stderrKind] }

    const spawnArgs = [
      options.packageManager || "pnpm",
      "run",
      ...parseArgs(task).map(cleanTaskArg)
    ]

    console.log(env)

    return
    const spawned = new Spawn(execPath, spawnArgs, spawnOptions)

    const childProcess = spawned.child

    // Piping stdio.
    if (stdinKind === "pipe") {
      stdin.pipe(childProcess.stdin)
    }
    if (stdoutKind === "pipe") {
      childProcess.stdout.pipe(stdout, { end: false })
    }
    if (stderrKind === "pipe") {
      childProcess.stderr.pipe(stderr, { end: false })
    }

    // Register
    childProcess.on("error", (err: Error) => {
      reject(err)
    })
    childProcess.on("close", (code: number, signal: NodeJS.Signals) => {
      resolve({ task, code, signal })
    })
  })
}
