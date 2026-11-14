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

const readLibOwner = dir => {
  if (path.basename(dir) !== 'lib') return {}
  const manifest = path.join(path.dirname(dir), 'package.json')
  try {
    return { name: JSON.parse(fs.readFileSync(manifest, 'utf8')).name }
  } catch (error) {
    return error.code === 'ENOENT' ? {} : { error }
  }
}

const isTypescriptLib = (dir, onError) => {
  const { name, error } = readLibOwner(dir)
  if (error) onError(error)
  return name === 'typescript' || Boolean(error)
}

const isInsideTypescriptLib = (dir, onError) => {
  if (isTypescriptLib(dir, onError)) return true
  for (let current = path.dirname(dir); ; current = path.dirname(current)) {
    if (readLibOwner(current).name === 'typescript') return true
    if (path.dirname(current) === current) return false
  }
}

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
    const absolute = toPosix(filepath)
    const relative = `/${toPosix(path.relative(root, filepath))}/`
    return rules.some(rule =>
      rule.absolute
        ? isInside(absolute, rule.absolute)
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
  const onError = error => errors.push(error)
  const pending =
    isKept(root) || isInsideTypescriptLib(root, onError) ? [] : [root]

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
      if (entry.isDirectory()) {
        if (!isTypescriptLib(entryPath, onError)) pending.push(entryPath)
      } else if (entry.isFile() && isPrunable(entry.name)) removeFile(entryPath)
    }
  }

  return { files, bytes, errors }
}

module.exports = prune
module.exports.isPrunable = isPrunable
