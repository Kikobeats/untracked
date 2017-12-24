# untracked

![Last version](https://img.shields.io/github/tag/Kikobeats/untracked.svg?style=flat-square)
[![Build Status](https://img.shields.io/travis/Kikobeats/untracked/master.svg?style=flat-square)](https://travis-ci.org/Kikobeats/untracked)
[![Dependency status](https://img.shields.io/david/Kikobeats/untracked.svg?style=flat-square)](https://david-dm.org/Kikobeats/untracked)
[![Dev Dependencies Status](https://img.shields.io/david/dev/Kikobeats/untracked.svg?style=flat-square)](https://david-dm.org/Kikobeats/untracked#info=devDependencies)
[![NPM Status](https://img.shields.io/npm/dm/untracked.svg?style=flat-square)](https://www.npmjs.org/package/untracked)
[![Donate](https://img.shields.io/badge/donate-paypal-blue.svg?style=flat-square)](https://paypal.me/Kikobeats)

> Specifies intentionally untracked files to ignore.

## Install

```bash
$ npm install untracked --global
```

## Usage

Just declare a `untracked` field in your `package.json` with:

- **whitelist**: Files you want to include.
- **blacklist**: Files you want to ignore.

For example:

```json
{
  "untracked": {
    "whitelist": [
      "build",
      "bin",
      ".metascraperrc"
    ],
    "blacklist": [
      "node_modules/puppeteer/.local-chromium"
    ]
  },
}
```

Files declared need to follow [gitignore pattern format](https://git-scm.com/docs/gitignore#_pattern_format). Your `dependencies` are included by default.

Then just run the command:

```bash
$ untracked > .upignore
```

## Related

- [node-prune](https://github.com/tj/node-prune) – Remove unnecessary files from node_modules (.md, .ts, ...).
- [lambdapack](https://github.com/toriihq/lambdapack) – Package your AWS Lambda efficiently.

## License

**untracked** © [Kiko Beats](https://kikobeats.com), Released under the [MIT](https://github.com/Kikobeats/untracked/blob/master/LICENSE.md) License.<br>
Authored and maintained by Kiko Beats with help from [contributors](https://github.com/Kikobeats/untracked/contributors).

> [kikobeats.com](https://kikobeats.com) · GitHub [@Kiko Beats](https://github.com/Kikobeats) · Twitter [@Kikobeats](https://twitter.com/Kikobeats)
