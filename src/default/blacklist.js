'use strict'

const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1)

const cases = word => [
  `${word.toUpperCase()}.*`,
  `${word.toUpperCase()}`,
  `${word}.*`,
  `${word}`,
  `${capitalize(word)}.*`,
  `${capitalize(word)}`
]

module.exports = [
  '__*__',
  '_config.yml',
  '.*',
  '*.d.ts',
  '*.flow',
  '*.map.json',
  '*.map',
  '*.opts',
  'appveyor.yml',
  'circle.yml',
  'coverage/',
  'demo/',
  'doc/*',
  'docs/*',
  'eslint',
  'example.*',
  'example/*',
  'examples',
  'Gruntfile.js',
  'gulpfile.js',
  'Gulpfile.js',
  'htmllint.js',
  'jest.config.js',
  'karma.conf.js',
  'Makefile',
  'node_modules/*',
  'npm-*.log',
  'package-lock.json',
  'stylelint*',
  'test*',
  'tsconfig.json',
  'yarn-*.log',
  'yarn.lock'
]
  .concat(cases('author'))
  .concat(cases('authors'))
  .concat(cases('changelog'))
  .concat(cases('changes'))
  .concat(cases('contributing'))
  .concat(cases('contribution'))
  .concat(cases('contributors'))
  .concat(cases('code_of_conduct'))
  .concat(cases('governance'))
  .concat(cases('licence'))
  .concat(cases('license'))
  .concat(cases('history'))
  .concat(cases('readme'))
  .concat(cases('security'))
  .concat(cases('pull_request_template'))
  .concat(cases('issue_template'))
