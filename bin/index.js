#!/usr/bin/env node

'use strict'

const path = require('path')

const pkg = require('../package.json')
const untracked = require('..')

require('update-notifier')({ pkg }).notify()

const { flags: opts } = require('meow')({
  pkg,
  help: require('fs').readFileSync(path.join(__dirname, 'help.txt'), 'utf8')
})
;(async () => {
  const output = await untracked(opts)
  console.log(output)
})()
