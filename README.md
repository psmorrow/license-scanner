# License Scanner
A license scanner that enumerates all a NodeJS project's NPM dependencies and displays their licenses and some cumulative statistics.

To use via the CLI: `license-scanner`

To use within code: `require("license-scanner").scan()`

    Parameters:

    Directory (optional): The relative path to scan. [Default: "./node_modules"]
    Format (optional): The format for the scan results. "print" || "json" [Default: "print"]

[![Sonarcloud Status](https://sonarcloud.io/api/project_badges/measure?project=psmorrow_license-scanner&metric=alert_status)](https://sonarcloud.io/dashboard?id=psmorrow_license-scanner)
