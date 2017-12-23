#!/usr/bin/env node

'use strict'

const path = require('path')
const pkg = require('../package.json')
const prune = require('..')

require('update-notifier')({ pkg }).notify()

const { flags: opts } = require('meow')({
  pkg,
  help: require('fs').readFileSync(path.join(__dirname, 'help.txt'), 'utf8')
})
;(async () => {
  const cwd = process.env.NODE_PRUNE_CWD || process.cwd()
  const output = await prune({ cwd, ...opts })
  console.log(output)
})()
