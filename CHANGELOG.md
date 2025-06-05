# Changelog

## [1.3.4](https://github.com/cloudinary/web-speed-test-server/compare/v1.3.3...v1.3.4) (2025-06-05)


### Bug Fixes

* use api key in all requests (ONCALL-7076) ([#136](https://github.com/cloudinary/web-speed-test-server/issues/136)) ([786d7d1](https://github.com/cloudinary/web-speed-test-server/commit/786d7d1532c2d4d7b5fb29a5d479ce51ce45dd62))

## [1.3.3](https://github.com/cloudinary/web-speed-test-server/compare/v1.3.2...v1.3.3) (2025-03-12)


### Bug Fixes

* improve logging of errors (closes DELO-4986) ([#121](https://github.com/cloudinary/web-speed-test-server/issues/121)) ([5e77604](https://github.com/cloudinary/web-speed-test-server/commit/5e776043b461ea4978ed6b79abcecb15dad97356))

## [1.3.2](https://github.com/cloudinary/web-speed-test-server/compare/v1.3.1...v1.3.2) (2025-02-12)


### Bug Fixes

* typo in logger function name ([0a8ca2e](https://github.com/cloudinary/web-speed-test-server/commit/0a8ca2ea7162abfda6b8deffa49fe59c13b6cc09))

## [1.3.1](https://github.com/cloudinary/web-speed-test-server/compare/v1.3.0...v1.3.1) (2025-02-12)


### Bug Fixes

* do not exit on unhandled rejection or uncaught exception ([a01ab77](https://github.com/cloudinary/web-speed-test-server/commit/a01ab77d35902729f44a6154cb1e98eba8792b9f))

## [1.3.0](https://github.com/cloudinary/web-speed-test-server/compare/v1.2.2...v1.3.0) (2025-02-11)


### Features

* verbose logging and metrics (closes DELO-4898) ([#110](https://github.com/cloudinary/web-speed-test-server/issues/110)) ([47057cf](https://github.com/cloudinary/web-speed-test-server/commit/47057cfc4d89c01fd93fb11823c9308b2e2586c3))

## [1.2.2](https://github.com/cloudinary/web-speed-test-server/compare/v1.2.1...v1.2.2) (2024-12-10)


### Bug Fixes

* changed name of WTP_LS_ALLOW_REGEX to WTP_LS_ALLOWED_LOCATIONS_REGEX and introduced a new option WTP_LS_ENABLED ([#102](https://github.com/cloudinary/web-speed-test-server/issues/102)) ([ed3f881](https://github.com/cloudinary/web-speed-test-server/commit/ed3f88128ed08825fa2ded97034233e5d356262b))

## [1.2.1](https://github.com/cloudinary/web-speed-test-server/compare/v1.2.0...v1.2.1) (2024-12-10)


### Bug Fixes

* region selection criteria should be configurable ([#98](https://github.com/cloudinary/web-speed-test-server/issues/98)) ([1c06bff](https://github.com/cloudinary/web-speed-test-server/commit/1c06bff1bf3646a1c6d6413759f31a7f74f13a60))

## [1.2.0](https://github.com/cloudinary/web-speed-test-server/compare/v1.1.8...v1.2.0) (2024-12-10)


### Features

* add WPT queue WST selected region monitoring (DELO-4838) ([#97](https://github.com/cloudinary/web-speed-test-server/issues/97)) ([ae132d2](https://github.com/cloudinary/web-speed-test-server/commit/ae132d20344e5fde293f1d9d3c6e82b3ebcafd6d))
* load balance test location in WPT (DELO-4766) ([#95](https://github.com/cloudinary/web-speed-test-server/issues/95)) ([1b5be14](https://github.com/cloudinary/web-speed-test-server/commit/1b5be1497cd16830b648c4ff84f815714451ea6f))

## [1.1.8](https://github.com/cloudinary/web-speed-test-server/compare/v1.1.7...v1.1.8) (2024-10-10)


### Bug Fixes

* security update https://snyk.io/vuln/SNYK-JS-BODYPARSER-7926860 (DELO-4731) ([#90](https://github.com/cloudinary/web-speed-test-server/issues/90)) ([83690d3](https://github.com/cloudinary/web-speed-test-server/commit/83690d36bee9918f3e34e9a683a6b5a6e611661b))

## [1.1.7](https://github.com/cloudinary/web-speed-test-server/compare/v1.1.6...v1.1.7) (2024-08-13)


### Bug Fixes

* set rollbar environment properly ([f6d58ef](https://github.com/cloudinary/web-speed-test-server/commit/f6d58ef42f874779550da9d56e5ddd918d73a1a9))

## [1.1.6](https://github.com/cloudinary/web-speed-test-server/compare/v1.1.5...v1.1.6) (2024-08-13)


### Bug Fixes

* not all WPT API errors logged (DELO-4614) ([#77](https://github.com/cloudinary/web-speed-test-server/issues/77)) ([9fa85b0](https://github.com/cloudinary/web-speed-test-server/commit/9fa85b001af7f47498e26d7adfb019822a5d018a))

## [1.1.5](https://github.com/cloudinary/web-speed-test-server/compare/v1.1.4...v1.1.5) (2024-06-04)


### Bug Fixes

* lcp incorrectly handled in results parser ([#71](https://github.com/cloudinary/web-speed-test-server/issues/71)) ([fe3da81](https://github.com/cloudinary/web-speed-test-server/commit/fe3da81280f232e0dbf3b82f4bcaf69f9ccf867b))

## [1.1.4](https://github.com/cloudinary/web-speed-test-server/compare/v1.1.3...v1.1.4) (2024-03-26)


### Bug Fixes

* WPT API change wrt auth ([15a7d2e](https://github.com/cloudinary/web-speed-test-server/commit/15a7d2ea388b34497746d0107920644f23b3ef44))

## [1.1.3](https://github.com/cloudinary/web-speed-test-server/compare/v1.1.2...v1.1.3) (2023-10-09)


### Bug Fixes

* **security:** Bump semver from 7.5.1 to 7.5.3 ([#52](https://github.com/cloudinary/web-speed-test-server/issues/52)) ([8b97e62](https://github.com/cloudinary/web-speed-test-server/commit/8b97e622c406d7dd662901fada93f7c34c667311))
