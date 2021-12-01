'use strict'

const { get } = require('lodash')
const JoyCon = require('joycon')

const joycon = new JoyCon({
  packageKey: 'untracked',
  files: [
    'package.json',
    '.untrackedrc',
    '.untrackedrc.json',
    '.untrackedrc.js',
    'untracked.config.js'
  ]
})

const DEFAULT = {
  blacklist: require('./default/blacklist')
}

const createCollection = (configFile, propName) => {
  const collection = new Set(get(configFile, `config.${propName}`, []))
  DEFAULT[propName] && DEFAULT[propName].forEach(item => collection.add(item))
  return Array.from(collection)
}

module.exports = async ({ cwd = process.cwd() }) => {
  const { data: configFile } = await joycon.load()

  return {
    whitelist: createCollection(configFile, 'whitelist'),
    blacklist: createCollection(configFile, 'blacklist')
  }
}
