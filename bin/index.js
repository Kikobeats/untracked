#!/usr/bin/env node

'use strict'

const path = require('path')
const mri = require('mri')

const pkg = require('../package.json')
const untracked = require('..')

require('update-notifier')({ pkg }).notify()

const argv = mri(process.argv.slice(2), {
  alias: {
    help: 'h',
    write: 'w'
  }
})

if (argv.help) {
  console.log(
    require('fs').readFileSync(path.join(__dirname, 'help.txt'), 'utf8')
  )
  process.exit()
}

const loadConfig = require('../src/load-config')

loadConfig(argv).then(config => {
  const write = argv.write || config.write

  if (write) {
    const filepath = typeof write === 'string' ? write : '.dockerignore'
    untracked
      .write(filepath, argv)
      .then(() => console.log(`Updated ${filepath}`))
      .catch(error => console.error(error) || process.exit(1))
  } else {
    untracked(argv)
      .then(output => console.log(output))
      .catch(error => console.error(error) || process.exit(1))
  }
})
