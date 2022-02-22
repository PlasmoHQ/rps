const OVERWRITE_OPTION = /^--([^:]+?):([^=]+?)(?:=(.+))?$/
const CONFIG_OPTION = /^--([^=]+?)(?:=(.+))$/
const PACKAGE_CONFIG_PATTERN = /^npm_package_config_(.+)$/
const CONCAT_OPTIONS = /^-[clnprs]+$/

type ArgumentSetOptions = {
  singleMode?: boolean
}

export type ArgumentGroup = {
  parallel: boolean
  patterns: string[]
}

/**
 * Overwrites a specified package config.
 */
function overwriteConfig(
  config: Record<string, any>,
  packageName: string,
  variable: string,
  value: string
) {
  const scope = config[packageName] || (config[packageName] = {})
  scope[variable] = value
}

/**
 * Creates a package config object.
 * This checks `process.env` and creates the default value.
 */
function createPackageConfig() {
  const retv = {}
  const packageName = process.title
  if (!packageName) {
    return retv
  }

  for (const key of Object.keys(process.env)) {
    const m = PACKAGE_CONFIG_PATTERN.exec(key)
    if (m != null) {
      overwriteConfig(retv, packageName, m[1], process.env[key])
    }
  }

  return retv
}

/**
 * Adds a new group into a given list.
 */
function addToGroup(groups: ArgumentGroup[], initialValues = {}) {
  groups.push({ parallel: false, patterns: [], ...initialValues })
}

/**
 * ArgumentSet is values of parsed CLI arguments.
 * This class provides the getter to get the last group.
 */
export class ArgumentSet {
  config = {}
  groups = [] as ArgumentGroup[]
  singleMode: boolean
  packageConfig = createPackageConfig()

  arguments = [] as string[]

  constructor(initialValues = {}, options: ArgumentSetOptions) {
    this.packageConfig = createPackageConfig()

    this.singleMode = Boolean(options && options.singleMode)

    addToGroup(this.groups, initialValues)
  }

  /**
   * Gets the last group.
   */
  get lastGroup() {
    return this.groups[this.groups.length - 1]
  }

  /**
   * Gets "parallel" flag.
   */
  get parallel() {
    return this.groups.some((g) => g.parallel)
  }
}

/**
 * Parses CLI arguments.
 */
function parseCLIArgsCore(set: ArgumentSet, args: string[]): ArgumentSet {
  ROOT_LOOP: for (let i = 0; i < args.length; ++i) {
    const arg = args[i]

    switch (arg) {
      case "--":
        set.arguments = args.slice(1 + i)
        break ROOT_LOOP
      case "-s":
      case "--sequential":
      case "--serial":
        if (set.singleMode && arg === "-s") {
          break
        }

        addToGroup(set.groups)
        break

      case "-p":
      case "--parallel":
        if (set.singleMode) {
          throw new Error(`Invalid Option: ${arg}`)
        }

        addToGroup(set.groups, { parallel: true })
        break
      default: {
        let matched = null
        if ((matched = OVERWRITE_OPTION.exec(arg))) {
          overwriteConfig(
            set.packageConfig,
            matched[1],
            matched[2],
            matched[3] || args[++i]
          )
        } else if ((matched = CONFIG_OPTION.exec(arg))) {
          set.config[matched[1]] = matched[2]
        } else if (CONCAT_OPTIONS.test(arg)) {
          parseCLIArgsCore(
            set,
            arg
              .slice(1)
              .split("")
              .map((c) => `-${c}`)
          )
        } else if (arg[0] === "-") {
          throw new Error(`Invalid Option: ${arg}`)
        } else {
          set.lastGroup.patterns.push(arg)
        }

        break
      }
    }
  }

  return set
}

/**
 * Parses CLI arguments.
 */
export function parseCLIArgs(
  args: string[],
  initialValues: Record<string, any>,
  options: ArgumentSetOptions
) {
  return parseCLIArgsCore(new ArgumentSet(initialValues, options), args)
}
