import type { ChildProcess, SpawnOptions } from "child_process"
import crossSpawn from "cross-spawn"
import pidtree from "pidtree"
import { kill, platform } from "process"

export class Spawn {
  child: ChildProcess

  constructor(command: string, args: string[], options: SpawnOptions) {
    this.child = crossSpawn(command, args, options)

    process.on("SIGINT", () => this.kill())
  }

  async kill() {
    if (platform === "win32") {
      crossSpawn("taskkill", ["/F", "/T", "/PID", this.child.pid + ""])
    } else {
      const childPids = await pidtree(this.child.pid, { root: true }).catch(
        (_) => []
      )

      for (const pid of childPids) {
        kill(pid)
      }
    }
  }
}
