'use strict'

const cwd = process.env.NODE_PRUNE_CWD || process.cwd()
const config = require('cosmiconfig')('untracked').load(cwd)
const get = require('lodash.get')

const DEFAULT = {
  blacklist: require('./default/blacklist')
}

let singletonConfig

const createCollection = (configFile, propName) => {
  const collection = new Set(get(configFile, `config.${propName}`, []))
  DEFAULT[propName] && DEFAULT[propName].forEach(item => collection.add(item))
  return Array.from(collection)
}

module.exports = ({ cwd }) =>
  singletonConfig ||
  Promise.resolve(config).then(configFile => {
    singletonConfig = {
      whitelist: createCollection(configFile, 'whitelist'),
      blacklist: createCollection(configFile, 'blacklist')
    }
    return singletonConfig
  })
