# License Scanner
A license scanner that enumerates all NPM dependencies and displays their licenses and statistics.

[![Sonarcloud Status](https://sonarcloud.io/api/project_badges/measure?project=psmorrow_license-scanner&metric=alert_status)](https://sonarcloud.io/dashboard?id=psmorrow_license-scanner)

## Usage

To use at the command line:
```bash
license-scanner
```

To use within code:
```
require("license-scanner").scan()
```

### Optional Parameters

| Name        | Type    | Description                                                | Default          |
| ----------- | ------- | ---------------------------------------------------------- | ---------------- |
| `directory` | String  | The relative path to scan.                                 | `./node_modules` |
| `format`    | String  | The format for the scan results, either `print` or `json`. | `print`          |

## License
MIT
