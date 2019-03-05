# License Scanner
A license scanner that enumerates all NPM dependencies and displays their licenses and statistics.

[![Build Status](https://travis-ci.com/psmorrow/license-scanner.svg?branch=master)](https://travis-ci.com/psmorrow/license-scanner) [![Sonarcloud Status](https://sonarcloud.io/api/project_badges/measure?project=psmorrow_license-scanner&metric=alert_status)](https://sonarcloud.io/dashboard?id=psmorrow_license-scanner) [![Known Vulnerabilities](https://snyk.io/test/github/psmorrow/license-scanner/badge.svg?targetFile=package.json)](https://snyk.io/test/github/psmorrow/license-scanner?targetFile=package.json)

## Installation

To install locally within the current project:
```
npm install https://github.com/psmorrow/license-scanner.git
```

To install globally within the operating system:
```
npm install -g https://github.com/psmorrow/license-scanner.git
```

## Usage

To use locally within the current project (call from code):
```
require("license-scanner").scan([directory], [format])
```

To use globally within the operating system (execute via command line):
```bash
license-scanner [directory] [format]
```

### Optional Parameters

| Name        | Type    | Description                                        | Default          |
| ----------- | ------- | -------------------------------------------------- | ---------------- |
| `directory` | String  | The relative path to scan.                         | `./node_modules` |
| `format`    | String  | The scan results format, either `print` or `json`. | `print`          |

## License
[MIT](LICENSE)
