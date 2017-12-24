'use strict'

const { execSync } = require('child_process')

const flattenDeps = (obj, deps) => {
  const { dependencies } = obj || {}
  if (typeof dependencies !== 'object') {
    return
  }
  Object.keys(dependencies).forEach(dep => {
    deps[dep] = true
    flattenDeps(dependencies[dep], deps)
  })
}

const readProductionDeps = () => {
  let output
  try {
    output = execSync('npm ls --prod --json 2>/dev/null')
  } catch (e) {
    output = e.stdout
  }
  return JSON.parse(output.toString())
}

module.exports = () => {
  const deps = {}
  const json = readProductionDeps()
  flattenDeps(json, deps)
  return Object.keys(deps)
}
