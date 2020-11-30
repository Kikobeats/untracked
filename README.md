# untracked

![Last version](https://img.shields.io/github/tag/Kikobeats/untracked.svg?style=flat-square)
[![Build Status](https://img.shields.io/travis/Kikobeats/untracked/master.svg?style=flat-square)](https://travis-ci.org/Kikobeats/untracked)
[![Dependency status](https://img.shields.io/david/Kikobeats/untracked.svg?style=flat-square)](https://david-dm.org/Kikobeats/untracked)
[![Dev Dependencies Status](https://img.shields.io/david/dev/Kikobeats/untracked.svg?style=flat-square)](https://david-dm.org/Kikobeats/untracked#info=devDependencies)
[![NPM Status](https://img.shields.io/npm/dm/untracked.svg?style=flat-square)](https://www.npmjs.org/package/untracked)

<div align="center">
	<br>
	<br>
	<img width="1200" src="/demo.png">
	<br>
	<br>
	<br>
</div>

**untracked** is a universal way for ingnoring unnecessary common files (such as `README.md`, `LICENSE.md`, `Makefile`, `Gruntfile`, `Gulpfile`, `karma.conf.js`, etc) to fit your bundle and create **smallest production ready bunddle** possible.

## Usage

Just run the command

```
npx untracked
```

The files to ignore will be detected automagically ✨.

### Using with Up

You need to write the output as [`.upignore`](https://up.docs.apex.sh/#configuration.ignoring_files).

For doing that you can run the command directly

```
npx untracked > .upignore
```

Also, you can declare it as build [hook](https://up.docs.apex.sh/#configuration.hook_scripts) in your `up.json`:

```json
{
  "hooks": {
  "build": [
    "npx untracked > .upignore"
  ],
  "clean": [
    "rm -f .upignore"
  ]
}
```

### Using with Heroku

You need to write the output as [`.slugignore`](https://devcenter.heroku.com/articles/slug-compiler#ignoring-files-with-slugignore).

For doing that you can run the command directly

```
npx untracked > .slugignore
```

Also, you can declare it as [`heroku-prebuild`](https://devcenter.heroku.com/articles/nodejs-support#heroku-specific-build-steps) at `scripts` in your `package.json`:

```json
{
  "scripts": {
    "heroku-prebuild": "npx untracked > .slugignore"
  }
}
```

### Using with ZEIT Now

Just you need to write the output at [`.nowignore`](https://zeit.co/guides/prevent-uploading-sourcepaths-with-nowignore) file.

```
npx untracked > .nowignore
```

### Using with Yarn

[Yarn](https://yarnpkg.com) supports remove unnecessary files via [`.yarnclean`](https://yarnpkg.com/en/docs/cli/autoclean).

```bash
yarn install --production
npx untracked > .yarnclean
yarn autoclean --force
```

### Using with Docker

Just you need to write the output at [`.dockerignore`](https://docs.docker.com/engine/reference/builder/#dockerignore-file) file.

```
npx untracked > .dockerignore
```


## Additional Files

Sometimes you need to declare an extra file to include/ignore in the bundle.

That's could be achieve just declaring a `untracked` field into your `package.json`:

```json
{
  "untracked": {
    "whitelist": [
      "bin"
    ],
    "blacklist": [
      "bench",
      "node_modules/@ffprobe-installer/darwin-x64",
      "node_modules/@ffprobe-installer/linux-ia32",
      "node_modules/@ffprobe-installer/win32-ia32",
      "node_modules/@ffprobe-installer/win32-x64",
      "node_modules/puppeteer/.local-chromium",
      "scripts"
    ]
  }
}
```


If you need to declare this files programatically, you can use any of the [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) supported ways for loading the configuration.

## How It Works™

**untracked** create a list of common files to ignore using [gitignore pattern format](https://git-scm.com/docs/gitignore#_pattern_format). 

This makes it compatible with any builder process that supports ignore files based on this pattern declaration.

Under the hood, **untracked** supports file name variations for files such as

- Documentation (`docs`, `LICENSE`, `README`, etc).
- Toolings configuration (`Makefile`, `Gruntfile`, `Gulpfile`, `karma.conf.js`,etc).
- Assets (`*.map`, `*.d.ts`, `*.flow`, etc).

It creates the properly gitpattern for ignoring any of these files.

## Related

- [lambda-prune](https://github.com/Kikobeats/lambda-prune) – Cleanup old AWS Lambda functions.
- [node-prune](https://github.com/tj/node-prune) – Remove unnecessary files from node_modules (.md, .ts, ...).
- [lambdapack](https://github.com/toriihq/lambdapack) – Package your AWS Lambda efficiently.


## License

**untracked** © [Kiko Beats](https://kikobeats.com), Released under the [MIT](https://github.com/Kikobeats/untracked/blob/master/LICENSE.md) License.<br>
Authored and maintained by Kiko Beats with help from [contributors](https://github.com/Kikobeats/untracked/contributors).

> [kikobeats.com](https://kikobeats.com) · GitHub [@Kiko Beats](https://github.com/Kikobeats) · Twitter [@Kikobeats](https://twitter.com/Kikobeats)
