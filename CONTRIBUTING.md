# Contributing

## Development

Use Node.js 22.14 or newer for release tooling, then install the locked dependency tree:

```bash
npm ci
```

Before opening a pull request, run:

```bash
npm run check
npm run build
npm run docs
npm audit --audit-level=high
```

`npm run check` enforces linting, formatting, type checking, tests, and 100% V8 coverage. Add or update tests for every behavior change; integration coverage should exercise the plugin through a Vite build where applicable.

## Commits and releases

Use Conventional Commits, such as `feat: support bare imports` or `fix: ignore queried asset imports`. Releases are created from `main` by semantic-release.

## npm trusted publishing

The release workflow requests an OIDC identity and can publish through npm trusted publishing. Before removing the legacy `NPM_TOKEN` secret, configure npm's trusted publisher with:

- owner: `ElJijuna`
- repository: `vite-legacy-pass-through`
- workflow: `publish.yml`
- allowed action: `npm publish`

After the first successful OIDC release, remove `NPM_TOKEN` from the repository secrets. npm then creates provenance automatically for public releases.
