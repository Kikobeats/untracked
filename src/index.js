'use strict'

const getProductionDeps = require('./getProductionDeps')
const loadConfig = require('./load-config')

const doNotIgnore = dep => `!${dep}`

const cleanup = array => [...new Set(array)].sort((a, b) => a.localeCompare(b))

const START = '### start auto generated using `untracked`'
const FINISH = '### finished auto generated using `untracked`'

const LINE_BREAK = /\r?\n/

const untrackedWrite = async (filepath, opts) => {
  const fs = require('fs')
  const content = fs.readFileSync(filepath, 'utf8')
  const lines = content.split(LINE_BREAK)

  const startIndex = lines.indexOf(START)
  const endIndex = lines.indexOf(FINISH)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Markers not found in ${filepath}`)
  }
  if (endIndex < startIndex) {
    throw new Error(`Finish marker appears before start marker in ${filepath}`)
  }

  const lineEnding = content.match(LINE_BREAK)[0]
  const output = await untracked(opts)
  const updatedLines = [
    ...lines.slice(0, startIndex),
    ...output.split('\n'),
    ...lines.slice(endIndex + 1)
  ]

  fs.writeFileSync(filepath, updatedLines.join(lineEnding), 'utf8')
}

const untracked = async opts => {
  const { cwd = process.cwd() } = opts || {}
  const { blacklist, whitelist } = await loadConfig(opts)
  const removeBlacklistedDeps = dep => !blacklist.includes(dep)
  const includeNamespaces = dep => {
    if (dep.startsWith('@')) return dep
    return dep.indexOf('/') >= 0 ? dep.split('/')[0] : dep
  }

  const productionDeps = (await getProductionDeps(cwd))
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

module.exports = untracked
module.exports.write = untrackedWrite
module.exports.prune = require('./prune')
module.exports.START = START
module.exports.FINISH = FINISH
