import { readPackage } from "read-pkg"

export const readPackageJson = async () => {
  const body = await readPackage()
  return {
    taskList: Object.keys(body.scripts || {}),
    packageInfo: { body }
  }
}
