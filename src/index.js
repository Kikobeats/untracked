'use strict'

const ignore = require('ignore')
const path = require('path')

const getProductionDeps = require('./getProductionDeps')
const loadConfig = require('./load-config')

const notIgnore = dep => `!${dep}`

const getProductionFiles = productionDeps =>
  productionDeps.reduce((acc, dependencyName) => {
    const dependencyPath = path.resolve('node_modules', dependencyName)

    try {
      const { files } = require(path.resolve(dependencyPath, 'package.json'))
      if (files) {
        return acc.concat(
          files.map(file => path.join('node_modules', dependencyName, file))
        )
      }
    } catch (err) {}

    return acc
  }, [])

module.exports = async opts => {
  const { blacklist, whitelist } = await loadConfig(opts)

  const isBlacklisted = (() => {
    const ig = ignore().add(blacklist)
    return filepath => !ig.ignores(filepath)
  })()

  const productionDeps = getProductionDeps()
  const productionFiles = getProductionFiles(productionDeps).filter(
    isBlacklisted
  )

  return ['**']
    .concat(whitelist.map(notIgnore), productionFiles.map(notIgnore))
    .join('\n')
}
