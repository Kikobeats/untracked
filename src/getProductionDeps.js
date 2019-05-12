'use strict'

const { isObject, forEach, get } = require('lodash')
const { execSync } = require('child_process')

const flattenDeps = (pkg, acc) => {
  const dependencies = get(pkg, 'dependencies')
  if (!isObject(dependencies)) return

  forEach(dependencies, (dependencyPkg, dependencyName) => {
    acc[dependencyName] = true
    flattenDeps(dependencyPkg, acc)
  })
}

const readProductionDeps = () => {
  let output
  try {
    output = execSync('npm ls --prod --json 2>/dev/null')
  } catch (err) {
    output = err.stdout
  }
  return JSON.parse(output.toString())
}

module.exports = () => {
  const deps = {}
  const pkg = readProductionDeps()
  flattenDeps(pkg, deps)
  return Object.keys(deps)
}
