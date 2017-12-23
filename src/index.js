'use strict'

const path = require('path')

const loadConfig = require('./load-config')

const doNotIgnore = dep => `!${dep}`

module.exports = async ({ cwd }) => {
  const { dependencies } = require(path.resolve(cwd, 'package.json'))
  const { blacklist, whitelist } = await loadConfig({ cwd })

  const removeBlacklistedDeps = dep => !blacklist.includes(dep)
  const includeNamespaces = dep =>
    dep.indexOf('/') >= 0 ? dep.split('/')[0] : dep

  const productionDeps = Object.keys(dependencies)
    .filter(removeBlacklistedDeps)
    .map(includeNamespaces)

  const output = []
    .concat(
      blacklist,
      whitelist.map(doNotIgnore),
      productionDeps.map(doNotIgnore)
    )
    .join('\n')

  return output
}
