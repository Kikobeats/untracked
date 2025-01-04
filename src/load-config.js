'use strict'

const { get } = require('lodash')
const JoyCon = require('joycon')

const DEFAULT = {
  blacklist: require('./default/blacklist')
}

const loadConfig = async cwd => {
  const joycon = new JoyCon({
    cwd,
    packageKey: 'untracked',
    files: [
      'package.json',
      '.untrackedrc',
      '.untrackedrc.json',
      '.untrackedrc.js',
      'untracked.config.js'
    ]
  })
  const { data: configFile = {} } = (await joycon.load()) || {}

  return configFile
}

const createCollection = (configFile, propName) => {
  const collection = new Set(get(configFile, propName, []))
  DEFAULT[propName] && DEFAULT[propName].forEach(item => collection.add(item))
  return Array.from(collection)
}

module.exports = async ({ cwd = process.cwd() } = {}) => {
  const configFile = await loadConfig(cwd)

  return {
    whitelist: createCollection(configFile, 'whitelist'),
    blacklist: createCollection(configFile, 'blacklist')
  }
}
