'use strict'

const $ = require('tinyspawn')

module.exports = async cwd => {
  const { stdout } = await $('npm ls --prod --all --parseable', {
    cwd,
    reject: false
  })

  const deps = new Set()

  for (const line of stdout.split('\n')) {
    const i = line.lastIndexOf('node_modules/')
    if (i === -1) continue
    deps.add(line.slice(i + 'node_modules/'.length))
  }

  return [...deps]
}
