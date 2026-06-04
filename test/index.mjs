import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { createRequire } from 'module'

import test from 'ava'

const require = createRequire(import.meta.url)

const untracked = require('../src')
const blacklist = require('../src/default/blacklist')
const whitelist = require('../src/default/whitelist')

const createFixture = (opts = {}) => {
  const dir = join(tmpdir(), `untracked-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'test-pkg', ...opts })
  )
  return dir
}

test('output contains start and finish markers', async t => {
  const output = await untracked({ cwd: createFixture() })
  t.true(output.startsWith(untracked.START))
  t.true(output.endsWith(untracked.FINISH))
})

test('blacklist entries are present in output', async t => {
  const output = await untracked({ cwd: createFixture() })
  for (const entry of blacklist.slice(0, 5)) {
    t.true(output.includes(entry), `missing blacklist entry: ${entry}`)
  }
})

test('.npmrc is whitelisted by default', async t => {
  const output = await untracked({ cwd: createFixture() })
  t.true(output.includes('!.npmrc'))
})

test('default whitelist includes .npmrc', t => {
  t.true(whitelist.includes('.npmrc'))
})

test('user config extends defaults', async t => {
  const dir = createFixture({
    untracked: {
      blacklist: ['custom-ignore'],
      whitelist: ['custom-keep']
    }
  })
  const output = await untracked({ cwd: dir })
  t.true(output.includes('custom-ignore'))
  t.true(output.includes('!custom-keep'))
  t.true(output.includes('!.npmrc'), '.npmrc should still be whitelisted')
})

test('write mode replaces content between markers', async t => {
  const dir = createFixture()
  const filepath = join(dir, '.gitignore')
  writeFileSync(
    filepath,
    `# header\n${untracked.START}\nold content\n${untracked.FINISH}\n# footer`
  )

  await untracked.write(filepath, { cwd: dir })
  const result = readFileSync(filepath, 'utf8')

  t.true(result.includes('# header'))
  t.true(result.includes('# footer'))
  t.false(result.includes('old content'))
  t.true(result.includes(untracked.START))
  t.true(result.includes(untracked.FINISH))
})

test('write mode throws when markers are missing', async t => {
  const dir = createFixture()
  const filepath = join(dir, '.gitignore')
  writeFileSync(filepath, 'no markers here')

  await t.throwsAsync(() => untracked.write(filepath, { cwd: dir }), {
    message: /Markers not found/
  })
})
