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

const BYTES_PER_MB = 1024 * 1024
const PRUNE_FLAGS = ['_', 'dry-run', 'keep']

const parsePruneArgs = args => {
  const parsed = mri(args, { boolean: ['dry-run'], string: ['keep'] })
  const unknown = Object.keys(parsed).filter(
    flag => !PRUNE_FLAGS.includes(flag)
  )
  if (unknown.length > 0) {
    throw new TypeError(`Unknown flag: --${unknown[0]}`)
  }
  const keep = parsed.keep === undefined ? [] : [].concat(parsed.keep)
  if (keep.some(entry => entry === '')) {
    throw new TypeError('--keep needs a path')
  }
  if (parsed._.length > 1) {
    throw new TypeError(`Expected one directory, got: ${parsed._.join(' ')}`)
  }
  return { dir: parsed._[0] || 'node_modules', dryRun: parsed['dry-run'], keep }
}

const runPrune = args => {
  const { dir, dryRun, keep } = parsePruneArgs(args)
  const { files, bytes, errors } = untracked.prune(dir, { dryRun, keep })
  const cwd = require('fs').realpathSync(process.cwd())
  if (dryRun) files.forEach(file => console.log(path.relative(cwd, file)))
  const verb = dryRun ? 'Would prune' : 'Pruned'
  const size = (bytes / BYTES_PER_MB).toFixed(1)
  console.log(`${verb} ${files.length} files (${size} MB) from ${dir}`)
  errors.forEach(error => console.error(error.message))
  return errors.length === 0
}

const runPruneCommand = () => {
  try {
    process.exitCode = runPrune(process.argv.slice(3)) ? 0 : 1
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

const runIgnoreCommand = () =>
  require('../src/load-config')(argv).then(config => {
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

if (process.argv[2] === 'prune') runPruneCommand()
else runIgnoreCommand()
