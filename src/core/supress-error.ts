// https://github.com/mysticatea/npm-run-all/issues/105
export const supressMaxListenersExceededWarnings = () => {
  process.stdout.setMaxListeners(0)
  process.stderr.setMaxListeners(0)
  process.stdin.setMaxListeners(0)
}
