'use strict'

const getProductionDeps = require('./getProductionDeps')
const loadConfig = require('./load-config')

const doNotIgnore = dep => `!${dep}`

module.exports = async opts => {
  const { blacklist, whitelist } = await loadConfig(opts)
  const removeBlacklistedDeps = dep => !blacklist.includes(dep)
  const includeNamespaces = dep =>
    dep.indexOf('/') >= 0 ? dep.split('/')[0] : dep

  const productionDeps = getProductionDeps()
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
