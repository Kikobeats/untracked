'use strict'

const getProductionDeps = require('./getProductionDeps')
const loadConfig = require('./load-config')

const doNotIgnore = dep => `!${dep}`

const cleanup = array => [...new Set(array)].sort((a, b) => a.localeCompare(b))

const START = '### start auto generated using `untracked`'
const FINISH = '### finished auto generated using `untracked`'

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
      cleanup(blacklist),
      cleanup(productionDeps.concat(whitelist).map(doNotIgnore))
    )
    .join('\n')

  return `${START}\n${output}\n${FINISH}`
}
