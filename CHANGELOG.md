# [1.2.0](https://github.com/ElJijuna/vite-legacy-pass-through/compare/v1.1.0...v1.2.0) (2026-04-05)


### Features

* add apply option to control when the plugin runs ([d3a998c](https://github.com/ElJijuna/vite-legacy-pass-through/commit/d3a998c83ba5a11b6d8b5731009f8a10569d11cb))

# [1.1.0](https://github.com/ElJijuna/vite-legacy-pass-through/compare/v1.0.0...v1.1.0) (2026-04-05)


### Bug Fixes

* remove emnapi peer deps from lock file and restrict resolveId to .js imports ([badbd10](https://github.com/ElJijuna/vite-legacy-pass-through/commit/badbd10d607065df6e8cdb563881e0912d0c0889))
* restrict interception to .js files and restore npm ci in CI. ([95830d4](https://github.com/ElJijuna/vite-legacy-pass-through/commit/95830d405e3f3f6862669c97b8855bc5323e895a))
* revert to npm install in CI to support cross-platform optional deps ([056e948](https://github.com/ElJijuna/vite-legacy-pass-through/commit/056e9486589be8791d647f7fc27d80496933fbf1))
* use npm ci --omit=optional to handle cross-platform native deps in CI ([495faa2](https://github.com/ElJijuna/vite-legacy-pass-through/commit/495faa26abbcaf0b7ab3804206d8e8c136442433))


### Features

* add excludeExtensions option to skip non-JS imports from pass-through ([e4b6293](https://github.com/ElJijuna/vite-legacy-pass-through/commit/e4b6293bd8d2b2c77efae75f1e5be71e14eea375))


### Reverts

* remove .js extension check from resolveId, imports have no extension. ([877b8f1](https://github.com/ElJijuna/vite-legacy-pass-through/commit/877b8f1b22e5e4d84f08653f8ca3ef2ac6e3a334))

## [1.0.1](https://github.com/ElJijuna/vite-legacy-pass-through/compare/v1.0.0...v1.0.1) (2026-04-05)


### Bug Fixes

* remove emnapi peer deps from lock file and restrict resolveId to .js imports ([badbd10](https://github.com/ElJijuna/vite-legacy-pass-through/commit/badbd10d607065df6e8cdb563881e0912d0c0889))
* restrict interception to .js files and restore npm ci in CI. ([95830d4](https://github.com/ElJijuna/vite-legacy-pass-through/commit/95830d405e3f3f6862669c97b8855bc5323e895a))
* revert to npm install in CI to support cross-platform optional deps ([056e948](https://github.com/ElJijuna/vite-legacy-pass-through/commit/056e9486589be8791d647f7fc27d80496933fbf1))
* use npm ci --omit=optional to handle cross-platform native deps in CI ([495faa2](https://github.com/ElJijuna/vite-legacy-pass-through/commit/495faa26abbcaf0b7ab3804206d8e8c136442433))


### Reverts

* remove .js extension check from resolveId, imports have no extension. ([877b8f1](https://github.com/ElJijuna/vite-legacy-pass-through/commit/877b8f1b22e5e4d84f08653f8ca3ef2ac6e3a334))

# 1.0.0 (2026-04-05)


### Bug Fixes

* add TSDoc, semantic-release, and update workflow to auto-publish on push to main ([d31feed](https://github.com/ElJijuna/vite-legacy-pass-through/commit/d31feed40953a64680e6e6b24b53c68cf7e4591e))
* use npm install instead of npm ci to handle cross-platform optional deps ([6fb8204](https://github.com/ElJijuna/vite-legacy-pass-through/commit/6fb8204df8c60a4ca9ea033cb00e3f48b0a9b687))


### Features

* initial release of vite-legacy-pass-through v1.0.0 ([e1edf25](https://github.com/ElJijuna/vite-legacy-pass-through/commit/e1edf25cfc0836504a7e0cfc4c7b0b9b9c26a23e))
