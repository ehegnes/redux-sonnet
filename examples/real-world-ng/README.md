# "Real World" Example Application

> [!WARNING]  
> This example project is a work-in-progress.

This application serves as a dogfooding playground for `redux-sonnet`. It is
based loosely on [Redux Saga's `examples/real-world`
application][redux-saga-real-world], although this is written in TypeScript
rather than JavaScript and makes use of substantially more modern supporting
software:

- [Nix / Flakes][nix-flakes]: for reproducible development environment
  instantiation
- [`@octokit/rest.js`][octokit-rest]: for querying GitHub data
- [`vite`][vite]: for HMR, transpilation, bundling, etc. and CORS proxy server
- [`wouter`][wouter]: for routing

## Environment Setup
- Install [Nix with Flakes][nix-flakes] support. See
  [Determinate Nix Installer][determinate-nix] for non-NixOS systems.
- Install and configue [direnv][direnv].
- *(optional)* configure `VITE_PORT` (default: 3000) environment variable to
  adjust development server port.

## Targets
| Target | Description |
| ------ | ----------- |
| `dev`  | Start HMR server and GitHub proxy on `http://localhost:${VITE_PORT}` |

[determinate-nix]: https://github.com/DeterminateSystems/nix-installer
[direnv]: https://github.com/direnv/direnv
[nix-flakes]: https://nixos.wiki/wiki/flakes
[octokit-rest]: https://github.com/octokit/rest.js/
[redux-saga-real-world]: https://github.com/redux-saga/redux-saga/tree/main/examples/real-world
[wouter]: https://github.com/molefrog/wouter
