import fs, {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  writeFileSync
} from 'fs'
import { dirname, join } from 'path'
import { tmpdir } from 'os'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'

import test from 'ava'

const require = createRequire(import.meta.url)

const { prune } = require('../src')
const { isPrunable } = require('../src/prune')

const BIN = join(dirname(fileURLToPath(import.meta.url)), '../bin/index.js')

const PRUNED = [
  '.pnpm/pkg@1.0.0/node_modules/pkg/dist/index.js.map',
  '.pnpm/pkg@1.0.0/node_modules/pkg/dist/index.d.ts',
  '.pnpm/pkg@1.0.0/node_modules/pkg/dist/index.d.mts',
  '.pnpm/pkg@1.0.0/node_modules/pkg/dist/index.d.cts',
  '.pnpm/pkg@1.0.0/node_modules/pkg/dist/index.d.mts.map',
  '.pnpm/pkg@1.0.0/node_modules/pkg/lib/index.js.flow',
  '.pnpm/pkg@1.0.0/node_modules/pkg/README.md',
  '.pnpm/pkg@1.0.0/node_modules/pkg/CHANGELOG',
  '.pnpm/pkg@1.0.0/node_modules/pkg/History.markdown',
  '.pnpm/pkg@1.0.0/node_modules/pkg/readme.txt',
  'legacy/README'
]

const KEPT = [
  '.pnpm/pkg@1.0.0/node_modules/pkg/package.json',
  '.pnpm/pkg@1.0.0/node_modules/pkg/LICENSE',
  '.pnpm/pkg@1.0.0/node_modules/pkg/license.md',
  '.pnpm/pkg@1.0.0/node_modules/pkg/dist/index.js',
  '.pnpm/pkg@1.0.0/node_modules/pkg/lib/history.js',
  '.pnpm/pkg@1.0.0/node_modules/pkg/lib/readme.js',
  '.pnpm/pkg@1.0.0/node_modules/pkg/test/index.js',
  '.pnpm/pkg@1.0.0/node_modules/pkg/docs/index.js',
  '.pnpm/pkg@1.0.0/node_modules/pkg/.npmignore',
  '.pnpm/pkg@1.0.0/node_modules/pkg/.eslintrc.map',
  '.pnpm/typescript@5.0.0/node_modules/typescript/lib/lib.dom.d.ts',
  'custom/keep/types.d.ts',
  '.cache/chrome/chrome'
]

const createTree = () => {
  const root = mkdtempSync(join(tmpdir(), 'untracked-prune-'))
  const dir = join(root, 'node_modules')
  for (const file of PRUNED.concat(KEPT)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    const content = file.endsWith('package.json') ? '{"name":"pkg"}' : 'x'
    writeFileSync(join(dir, file), content.padEnd(10))
  }
  writeFileSync(
    join(dir, '.pnpm/typescript@5.0.0/node_modules/typescript/package.json'),
    JSON.stringify({ name: 'typescript' })
  )
  const outside = join(root, 'outside')
  mkdirSync(outside)
  writeFileSync(join(outside, 'index.d.ts'), 'x')
  symlinkSync('.pnpm/pkg@1.0.0/node_modules/pkg', join(dir, 'pkg'))
  symlinkSync(outside, join(dir, 'linked'))
  return { dir, outside }
}

const exists = (dir, files) => files.filter(file => existsSync(join(dir, file)))

test('deletes maps, types, flow sources and docs, and keeps the rest', t => {
  const { dir } = createTree()
  const { files, bytes } = prune(dir, { keep: ['custom/keep'] })
  t.deepEqual(exists(dir, PRUNED), [])
  t.deepEqual(exists(dir, KEPT), KEPT)
  t.is(files.length, PRUNED.length)
  t.is(bytes, PRUNED.length * 10)
})

test('never follows symlinks out of the tree', t => {
  const { dir, outside } = createTree()
  prune(dir)
  t.true(existsSync(join(outside, 'index.d.ts')))
  t.true(existsSync(join(dir, 'pkg')))
})

test('keeps typescript/lib without being told', t => {
  const { dir } = createTree()
  prune(dir)
  t.true(existsSync(join(dir, KEPT[10])))
  t.false(existsSync(join(dir, 'custom/keep/types.d.ts')))
})

test('dry run reports the same files and deletes none', t => {
  const { dir } = createTree()
  const { files, bytes } = prune(dir, { dryRun: true, keep: ['custom/keep'] })
  t.is(files.length, PRUNED.length)
  t.is(bytes, PRUNED.length * 10)
  t.deepEqual(exists(dir, PRUNED), PRUNED)
})

test('throws on a path that is not a directory', t => {
  t.throws(() => prune(join(tmpdir(), 'untracked-missing-dir')), {
    message: /Not a directory/
  })
})

test('isPrunable matches by basename, case insensitive', t => {
  t.true(isPrunable('ReadMe.MD'))
  t.true(isPrunable('changes'))
  t.true(isPrunable('code_of_conduct.rst'))
  t.false(isPrunable('readme.js'))
  t.false(isPrunable('LICENSE'))
  t.false(isPrunable('.d.ts'))
})

test('cli prunes the given directory and reports what it removed', t => {
  const { dir } = createTree()
  const stdout = execFileSync(
    'node',
    [BIN, 'prune', dir, '--keep', 'custom/keep'],
    { env: { ...process.env, NO_UPDATE_NOTIFIER: '1' } }
  ).toString()
  t.true(stdout.includes(`Pruned ${PRUNED.length} files (0.0 MB) from ${dir}`))
  t.deepEqual(exists(dir, PRUNED), [])
})

test('cli dry run lists files and exits non-zero on a missing directory', t => {
  const { dir } = createTree()
  const env = { ...process.env, NO_UPDATE_NOTIFIER: '1' }
  const stdout = execFileSync('node', [BIN, 'prune', dir, '--dry-run'], {
    env
  }).toString()
  t.true(stdout.includes('index.js.map'))
  t.true(stdout.includes('Would prune'))
  t.deepEqual(exists(dir, PRUNED), PRUNED)
  const error = t.throws(() =>
    execFileSync('node', [BIN, 'prune', join(dir, 'nope')], {
      env,
      stdio: 'pipe'
    })
  )
  t.is(error.status, 1)
})

const KEEP_FILE = 'custom/keep/types.d.ts'

for (const [form, toKeep] of [
  ['relative', () => 'custom/keep'],
  ['dot relative', () => './custom/keep'],
  ['trailing slash', () => 'custom/keep/'],
  ['windows separators', () => 'custom\\keep'],
  ['absolute', dir => join(dir, 'custom/keep')],
  ['absolute with trailing slash', dir => `${join(dir, 'custom/keep')}/`],
  ['single file', () => KEEP_FILE]
]) {
  test(`--keep accepts a ${form} path`, t => {
    const { dir } = createTree()
    prune(dir, { keep: [toKeep(dir)] })
    t.true(existsSync(join(dir, KEEP_FILE)))
    t.deepEqual(exists(dir, PRUNED), [])
  })
}

test('a kept root prunes nothing', t => {
  const { dir } = createTree()
  const root = join(dir, '.pnpm/typescript@5.0.0/node_modules/typescript/lib')
  const { files } = prune(root)
  t.deepEqual(files, [])
  t.true(existsSync(join(dir, KEPT[10])))
})

test('an unreadable directory is reported and the rest is still pruned', t => {
  if (process.getuid && process.getuid() === 0) return t.pass()
  const { dir } = createTree()
  const locked = join(dir, 'locked')
  mkdirSync(locked)
  writeFileSync(join(locked, 'index.d.ts'), 'x')
  chmodSync(locked, 0o000)
  try {
    const { files, errors } = prune(dir, { keep: ['custom/keep'] })
    t.is(errors.length, 1)
    t.is(errors[0].code, 'EACCES')
    t.is(files.length, PRUNED.length)
    t.deepEqual(exists(dir, PRUNED), [])
  } finally {
    chmodSync(locked, 0o755)
  }
})

const runCli = (args, cwd) => {
  try {
    const stdout = execFileSync('node', [BIN, 'prune', ...args], {
      cwd,
      env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
      stdio: 'pipe'
    }).toString()
    return { status: 0, stdout, stderr: '' }
  } catch (error) {
    return {
      status: error.status,
      stdout: error.stdout.toString(),
      stderr: error.stderr.toString()
    }
  }
}

test('cli rejects unknown flags without deleting anything', t => {
  const { dir } = createTree()
  const { status, stderr } = runCli([dir, '--dryRun'])
  t.is(status, 1)
  t.true(stderr.includes('Unknown flag: --dryRun'))
  t.deepEqual(exists(dir, PRUNED), PRUNED)
})

test('cli treats --dry-run as a flag, not as the directory', t => {
  const { dir } = createTree()
  const { status, stdout } = runCli(['--dry-run', dir])
  t.is(status, 0)
  t.true(stdout.includes(`Would prune ${PRUNED.length + 1} files`))
  t.deepEqual(exists(dir, PRUNED), PRUNED)
})

test('cli rejects --keep without a path and extra directories', t => {
  const { dir } = createTree()
  t.is(runCli([dir, '--keep']).status, 1)
  t.is(runCli([dir, dir]).status, 1)
  t.deepEqual(exists(dir, PRUNED), PRUNED)
})

test('cli dry run prints paths relative to the working directory', t => {
  const { dir } = createTree()
  const { stdout } = runCli(['--dry-run', 'node_modules'], dirname(dir))
  t.true(
    stdout
      .split('\n')
      .includes(join('node_modules', PRUNED[0]))
  )
})

test('cli exits non-zero when part of the tree cannot be read', t => {
  if (process.getuid && process.getuid() === 0) return t.pass()
  const { dir } = createTree()
  const locked = join(dir, 'locked')
  mkdirSync(locked)
  chmodSync(locked, 0o000)
  try {
    const { status, stdout, stderr } = runCli([dir])
    t.is(status, 1)
    t.true(stdout.includes('Pruned'))
    t.true(stderr.includes('EACCES'))
  } finally {
    chmodSync(locked, 0o755)
  }
})

test('a file that cannot be deleted is reported, not counted', t => {
  if (process.getuid && process.getuid() === 0) return t.pass()
  const { dir } = createTree()
  const readonly = join(dir, 'readonly')
  mkdirSync(readonly)
  writeFileSync(join(readonly, 'index.d.ts'), 'x'.repeat(10))
  chmodSync(readonly, 0o555)
  try {
    const { files, bytes, errors } = prune(dir, { keep: ['custom/keep'] })
    t.is(errors.length, 1)
    t.is(files.length, PRUNED.length)
    t.is(bytes, PRUNED.length * 10)
    t.true(existsSync(join(readonly, 'index.d.ts')))
  } finally {
    chmodSync(readonly, 0o755)
  }
})

test('a relative keep never matches above the prune root', t => {
  const root = mkdtempSync(join(tmpdir(), 'untracked-prune-'))
  const dir = join(root, 'custom/keep/node_modules')
  mkdirSync(join(dir, 'pkg'), { recursive: true })
  writeFileSync(join(dir, 'pkg/index.d.ts'), 'x')
  const { files } = prune(dir, { keep: ['custom/keep'] })
  t.is(files.length, 1)
})

test('an ancestor named typescript/lib does not stop the walk', t => {
  const root = mkdtempSync(join(tmpdir(), 'untracked-prune-'))
  const dir = join(root, 'typescript/lib/app/node_modules')
  mkdirSync(join(dir, 'pkg'), { recursive: true })
  writeFileSync(join(dir, 'pkg/index.d.ts'), 'x')
  const { files } = prune(dir)
  t.is(files.length, 1)
})

test('--keep / keeps everything instead of the working directory', t => {
  const { dir } = createTree()
  const { files } = prune(dir, { keep: ['/'] })
  t.deepEqual(files, [])
})

test('cli dry run output survives a pipe on a large tree', t => {
  const { dir } = createTree()
  const many = join(dir, 'many')
  mkdirSync(many)
  const COUNT = 20000
  for (let i = 0; i < COUNT; i++) writeFileSync(join(many, `${i}.d.ts`), '')
  const stdout = execFileSync(
    'sh',
    ['-c', `node "${BIN}" prune "${dir}" --dry-run | cat`],
    { env: { ...process.env, NO_UPDATE_NOTIFIER: '1' }, maxBuffer: 64 * 1024 * 1024 }
  ).toString()
  t.true(stdout.includes(`Would prune ${COUNT + PRUNED.length + 1} files`))
})

test('typescript/lib at the top of a custom root is kept', t => {
  const root = mkdtempSync(join(tmpdir(), 'untracked-prune-'))
  const dir = join(root, 'deps')
  mkdirSync(join(dir, 'typescript/lib'), { recursive: true })
  writeFileSync(join(dir, 'typescript/package.json'), '{"name":"typescript"}')
  writeFileSync(join(dir, 'typescript/lib/lib.d.ts'), 'x')
  writeFileSync(join(dir, 'index.d.ts'), 'x')
  const { files } = prune(dir)
  t.true(existsSync(join(dir, 'typescript/lib/lib.d.ts')))
  t.is(files.length, 1)
})

for (const keep of ['.', './']) {
  test(`--keep ${keep} keeps the whole root`, t => {
    const { dir } = createTree()
    const { files } = prune(dir, { keep: [keep] })
    t.deepEqual(files, [])
    t.deepEqual(exists(dir, PRUNED), PRUNED)
  })
}

const createTypescriptPackage = () => {
  const root = mkdtempSync(join(tmpdir(), 'untracked-prune-'))
  const pkg = join(root, 'typescript')
  mkdirSync(join(pkg, 'lib'), { recursive: true })
  writeFileSync(join(pkg, 'package.json'), '{"name":"typescript"}')
  writeFileSync(join(pkg, 'lib/lib.d.ts'), 'x')
  writeFileSync(join(pkg, 'README.md'), 'x')
  return pkg
}

test('the typescript package as the root keeps its lib', t => {
  const pkg = createTypescriptPackage()
  const { files } = prune(pkg)
  t.true(existsSync(join(pkg, 'lib/lib.d.ts')))
  t.deepEqual(files, [join(fs.realpathSync(pkg), 'README.md')])
})

test('typescript lib as the root prunes nothing', t => {
  const pkg = createTypescriptPackage()
  t.deepEqual(prune(join(pkg, 'lib')).files, [])
  t.true(existsSync(join(pkg, 'lib/lib.d.ts')))
})

test('a lib directory of any other package is pruned', t => {
  const root = mkdtempSync(join(tmpdir(), 'untracked-prune-'))
  const dir = join(root, 'node_modules/typescript-like')
  mkdirSync(join(dir, 'lib'), { recursive: true })
  writeFileSync(join(dir, 'package.json'), '{"name":"typescript-like"}')
  writeFileSync(join(dir, 'lib/index.d.ts'), 'x')
  t.is(prune(join(root, 'node_modules')).files.length, 1)
})

test('an unreadable typescript package.json keeps its lib and is reported', t => {
  if (process.getuid && process.getuid() === 0) return t.pass()
  const pkg = createTypescriptPackage()
  const manifest = join(pkg, 'package.json')
  chmodSync(manifest, 0o000)
  try {
    const { files, errors } = prune(dirname(pkg))
    t.true(existsSync(join(pkg, 'lib/lib.d.ts')))
    t.is(files.length, 1)
    t.is(errors.length, 1)
    t.is(errors[0].code, 'EACCES')
  } finally {
    chmodSync(manifest, 0o644)
  }
})

test('an invalid package.json next to a lib keeps it and is reported', t => {
  const pkg = createTypescriptPackage()
  writeFileSync(join(pkg, 'package.json'), '{')
  const { errors } = prune(dirname(pkg))
  t.true(existsSync(join(pkg, 'lib/lib.d.ts')))
  t.is(errors.length, 1)
  t.true(errors[0] instanceof SyntaxError)
})

for (const [state, breakManifest] of [
  ['invalid', manifest => writeFileSync(manifest, '{')],
  ['unreadable', manifest => chmodSync(manifest, 0o000)]
]) {
  test(`an ${state} package.json above the root does not stop the prune`, t => {
    if (process.getuid && process.getuid() === 0) return t.pass()
    const root = mkdtempSync(join(tmpdir(), 'untracked-prune-'))
    const manifest = join(root, 'package.json')
    writeFileSync(manifest, '{"name":"app"}')
    const dir = join(root, 'lib/node_modules')
    mkdirSync(join(dir, 'pkg'), { recursive: true })
    writeFileSync(join(dir, 'pkg/index.d.ts'), 'x')
    breakManifest(manifest)
    try {
      const { files, errors } = prune(dir)
      t.is(files.length, 1)
      t.deepEqual(errors, [])
    } finally {
      chmodSync(manifest, 0o644)
    }
  })
}
