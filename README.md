# License Scanner
A license scanner that enumerates all a NodeJS project's NPM dependencies and displays their licenses and some cumulative statistics.

To use via the CLI: `license-scanner`

To use within code: `require("license-scanner").scan()`

### Optional Parameters

| Name        | Type    | Description                                            | Default        |
| ----------- | ------- | -------------------------------------------------------| -------------- |
| `directory` | String  | The relative path to scan.                             | ./node_modules |
| `format`    | String  | The format for the scan results, either print or json. | print          |

<br>

[![Sonarcloud Status](https://sonarcloud.io/api/project_badges/measure?project=psmorrow_license-scanner&metric=alert_status)](https://sonarcloud.io/dashboard?id=psmorrow_license-scanner)
