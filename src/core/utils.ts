import { join } from "path"
import { cwd } from "process"
import { readPackage } from "read-pkg"

export const readPackageJson = async () => {
  const pkgPath = join(cwd(), "package.json")
  const body = await readPackage()
  return {
    taskList: Object.keys(body.scripts || {}),
    packageInfo: { path: pkgPath, body }
  }
}
