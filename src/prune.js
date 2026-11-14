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

const NESTED_TYPESCRIPT_LIB = '/node_modules/typescript/lib/'
const TOP_LEVEL_TYPESCRIPT_LIB = '/typescript/lib/'

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

const isTypescriptLib = (absolute, relative) =>
  absolute.includes(NESTED_TYPESCRIPT_LIB) ||
  relative.startsWith(TOP_LEVEL_TYPESCRIPT_LIB)

const normalizeKeep = (root, entry) => {
  const posix = entry.replace(/\\/g, '/').replace(/(.)\/+$/, '$1')
  if (path.posix.isAbsolute(posix) || path.isAbsolute(entry)) {
    return { absolute: toPosix(resolveReal(posix)) }
  }
  const normalized = path.posix.normalize(posix).replace(/^\.\//, '')
  if (normalized === '.') return { absolute: toPosix(root) }
  return { segment: `/${normalized}/` }
}

const isInside = (absolute, parent) =>
  absolute === parent || absolute.startsWith(parent.replace(/\/?$/, '/'))

const createKeepMatcher = (root, keep) => {
  const rules = keep.map(entry => normalizeKeep(root, entry))
  return filepath => {
    const absolute = `${toPosix(filepath)}/`
    const relative = `/${toPosix(path.relative(root, filepath))}/`
    if (isTypescriptLib(absolute, relative)) return true
    return rules.some(rule =>
      rule.absolute
        ? isInside(absolute.slice(0, -1), rule.absolute)
        : relative.includes(rule.segment)
    )
  }
}

const prune = (dir, { dryRun = false, keep = [] } = {}) => {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new TypeError(`Not a directory: ${dir}`)
  }

  const root = fs.realpathSync(dir)
  const isKept = createKeepMatcher(root, keep)
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
