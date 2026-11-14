'use strict'

const fs = require('fs')
const path = require('path')

const MARKUP_FORMATS = require('./default/markup-formats')

const PRUNABLE_SUFFIXES = ['.map', '.d.ts', '.d.mts', '.d.cts', '.flow']

const DOC_NAMES = [
  'authors',
  'changelog',
  'changes',
  'code_of_conduct',
  'contributing',
  'contributors',
  'history',
  'readme'
]

const DEFAULT_KEEP = ['typescript/lib']

const PRUNABLE_DOCS = new Set(
  DOC_NAMES.flatMap(name => [
    name,
    ...MARKUP_FORMATS.map(format => `${name}.${format}`)
  ])
)

const isPrunable = filename => {
  if (filename.startsWith('.')) return false
  const name = filename.toLowerCase()
  return (
    PRUNABLE_DOCS.has(name) ||
    PRUNABLE_SUFFIXES.some(suffix => name.endsWith(suffix))
  )
}

const resolveReal = filepath =>
  fs.existsSync(filepath) ? fs.realpathSync(filepath) : path.resolve(filepath)

const toPosix = filepath => filepath.split(path.sep).join('/')

const createKeepMatcher = keep => {
  const normalized = keep.map(entry => {
    const trimmed = entry.replace(/\\/g, '/').replace(/\/+$/, '')
    return path.posix.isAbsolute(trimmed) || path.isAbsolute(entry)
      ? { absolute: toPosix(resolveReal(trimmed)) }
      : { segment: `/${path.posix.normalize(trimmed).replace(/^\.\//, '')}/` }
  })
  return filepath => {
    const candidate = toPosix(filepath)
    return normalized.some(({ absolute, segment }) =>
      absolute
        ? candidate === absolute || candidate.startsWith(`${absolute}/`)
        : `${candidate}/`.includes(segment)
    )
  }
}

const prune = (dir, { dryRun = false, keep = [] } = {}) => {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new TypeError(`Not a directory: ${dir}`)
  }

  const isKept = createKeepMatcher(DEFAULT_KEEP.concat(keep))
  const root = fs.realpathSync(dir)
  const files = []
  const errors = []
  let bytes = 0
  const pending = isKept(root) ? [] : [root]

  const removeFile = filepath => {
    try {
      const { size } = fs.lstatSync(filepath)
      if (!dryRun) fs.unlinkSync(filepath)
      bytes += size
      files.push(filepath)
    } catch (error) {
      errors.push(error)
    }
  }

  const readEntries = dirpath => {
    try {
      return fs.readdirSync(dirpath, { withFileTypes: true })
    } catch (error) {
      errors.push(error)
      return []
    }
  }

  while (pending.length > 0) {
    const current = pending.pop()
    for (const entry of readEntries(current)) {
      const entryPath = path.join(current, entry.name)
      if (isKept(entryPath)) continue
      if (entry.isDirectory()) pending.push(entryPath)
      else if (entry.isFile() && isPrunable(entry.name)) removeFile(entryPath)
    }
  }

  return { files, bytes, errors }
}

module.exports = prune
module.exports.isPrunable = isPrunable
