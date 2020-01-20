'use strict'

const config = require('cosmiconfig').cosmiconfig('untracked')
const { get } = require('lodash')

const DEFAULT = {
  blacklist: require('./default/blacklist')
}

const createCollection = (configFile, propName) => {
  const collection = new Set(get(configFile, `config.${propName}`, []))
  DEFAULT[propName] && DEFAULT[propName].forEach(item => collection.add(item))
  return Array.from(collection)
}

module.exports = async ({ cwd = process.cwd() }) => {
  const configFile = await config.search(cwd)

  return {
    whitelist: createCollection(configFile, 'whitelist'),
    blacklist: createCollection(configFile, 'blacklist')
  }
}
