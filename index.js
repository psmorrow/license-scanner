"use strict";

/**
 * License Scanner
 *
 * Scan a NodeJS project's NPM dependencies for all the dependant license agreements.
 * What licenses do you have to be in compliance with? What are your obligations?
 *
 * Copyright (C) 2019 Patrick Morrow
 * MIT Licensed
 */

const fs = require('fs');

// The SPDX License List at https://spdx.org/licenses/
const spdxLicenseSimpleList = require('spdx-license-list/simple');
const spdxLicenses = Array.from(spdxLicenseSimpleList).map((x) => { return x.toUpperCase(); });

const NODEMODULES_DIRECTORY = 'node_modules';
const PACKAGE_FILENAME = 'package.json';

const HIERARCHY_PADDING = '    ';
const NOLICENSE = 'NOLICENSE';
const UNLICENSED = 'UNLICENSED';
const CUSTOMLICENSE = 'SEE LICENSE IN';

const COLOR_RESET = '\x1b[0m';
//const COLOR_FOREGROUND_RED = '\x1b[31m';
const COLOR_FOREGROUND_GREEN = '\x1b[32m';
const COLOR_FOREGROUND_YELLOW = '\x1b[33m';
const COLOR_FOREGROUND_BLUE = '\x1b[34m';
const COLOR_BACKGROUND_RED = '\x1b[41m';
//const COLOR_BACKGROUND_GREEN = '\x1b[42m';
//const COLOR_BACKGROUND_YELLOW = '\x1b[43m';
//const COLOR_BACKGROUND_BLUE = '\x1b[44m';

function getLicenses(directory) {
	let licenses = [];

	if (fs.existsSync(directory)) {
		const files = fs.readdirSync(directory, {withFileTypes: true});
		files.sort((f1, f2) => { return f1.name === f2.name ? 0 : (f1.name < f2.name ? -1 : 1); });
		files.forEach((f) => {
			if (f.isDirectory()) {
				const nextDirectory = `${directory}${f.name}`;
				const filename = `${nextDirectory}/${PACKAGE_FILENAME}`;
				if (fs.existsSync(filename)) {
					const data = require(filename);

					const name = data.name || f.name;
					const version = data.version || '0.0.0';
					const isPrivate = data.private || false;
					let license = isPrivate ? UNLICENSED : data.license || NOLICENSE;

					if (!isPrivate) {
						if (Array.isArray(license)) {
							let spdxExpression = '';
							license.forEach((l, i) => {
								spdxExpression += (i > 0 ? ' OR ' : '') + l.toUpperCase();
							});
							license = `(${spdxExpression})`;
						} else if (typeof license === 'object' && license.type) {
							license = license.type.toUpperCase();
						} else {
							license = license.toUpperCase();
						}
					}

					const isSpdx = (license[0] === '(' && license[license.length-1] === ')');
					if (!isSpdx && !license.startsWith(CUSTOMLICENSE)) {
						license = `(${license})`;
					}

					const dependencies = getLicenses(`${nextDirectory}/${NODEMODULES_DIRECTORY}/`);

					licenses.push({
						filename,
						name,
						license,
						version,
						dependencies
					});
				}
			}
		});
	}

	return licenses;
}

function printLicenses(licenses, depth) {
	depth = (depth === undefined ? 0 : depth);
	if (depth === 0) {
		console.log(`${COLOR_FOREGROUND_GREEN}### LICENSES ###${COLOR_RESET}`);
		console.log();
	}

	let padding = HIERARCHY_PADDING.repeat(depth);
	licenses.forEach((l) => {
		// TODO: Support SPDX expressions - look for all the embedded licenses and the boolean logic in the expression.
		const spdx = l.license.substring(1, l.license.length-1);
		if (!l.license.startsWith(CUSTOMLICENSE) && spdxLicenses.includes(spdx)) {
			console.log(`${padding}${l.name}@${l.version} ${l.license}`);
		} else {
			console.log(`${padding}${l.name}@${l.version} ${COLOR_BACKGROUND_RED}${l.license}${COLOR_RESET}`);
		}
		printLicenses(l.dependencies, depth+1);
	});
}

function printStatistics(licenses, depth) {
	depth = (depth === undefined ? 0 : depth);

	let statistics = {
		totalModules: 0,
		totalNonSpdxLicenses: 0,
		totalUnlicensed: 0,
		totalNolicense: 0,
		licenses: []
	};

	licenses.forEach((l) => {
		statistics.totalModules += 1;

		// TODO: Support SPDX expressions - look for all the embedded licenses and the boolean logic in the expression.
		const spdx = l.license.substring(1, l.license.length-1);
		if (!spdxLicenses.includes(spdx)) {
			statistics.totalNonSpdxLicenses += 1;
		}

		statistics.totalUnlicensed += (l.license === UNLICENSED ? 1 : 0);
		statistics.totalNolicense += (l.license === `(${NOLICENSE})` ? 1 : 0);
		statistics.licenses[l.license] = (statistics.licenses[l.license] || 0) + 1;

		const s = printStatistics(l.dependencies, depth+1);
		statistics.totalModules += s.totalModules;
		statistics.totalNonSpdxLicenses += s.totalNonSpdxLicenses;
		statistics.totalUnlicensed += s.totalUnlicensed;
		statistics.totalNolicense += s.totalNolicense;
		for (let k in s.licenses) {
			const count = s.licenses[k];
			statistics.licenses[k] = (statistics.licenses[k] || 0) + count;
		}
	});

	if (depth === 0) {
		const licenseKeys = Object.keys(statistics.licenses);
		licenseKeys.sort();

		console.log(`${COLOR_FOREGROUND_GREEN}### STATISTICS ###${COLOR_RESET}`);
		console.log();
		console.log(`Dependant modules: ${statistics.totalModules}`);
		console.log(`Non-SPDX licenses: ${statistics.totalNonSpdxLicenses}`);
		console.log(`Different licenses: ${licenseKeys.length}`);
		console.log(`Unlicensed (Private): ${statistics.totalUnlicensed}`);
		console.log(`Nolicense: ${statistics.totalNolicense}`);
		console.log();

		licenseKeys.forEach((l) => {
			const count = statistics.licenses[l];

			// TODO: Support SPDX expressions - look for all the embedded licenses and the boolean logic in the expression.
			const spdx = l.substring(1, l.length-1);
			if (spdxLicenses.includes(spdx)) {
				console.log(`${l}: ${count}`);
			} else {
				console.log(`${COLOR_BACKGROUND_RED}${l}${COLOR_RESET}: ${count}`);
			}
		});
		console.log();

		// TODO: Evaluate each license and are there requirements that we need to fullfill?

		if (statistics.totalNonSpdxLicenses === 0 && statistics.totalUnlicensed === 0 && statistics.totalNolicense) {
			console.log(`${COLOR_FOREGROUND_GREEN}Congratulations! You are in compliance.${COLOR_RESET}`);
		} else {
			console.log(`${COLOR_FOREGROUND_YELLOW}Oops! You have work to do to get into compliance.${COLOR_RESET}`);
		}
	}

	return statistics;
}

const scanner = {
	scan: (directory) => {
		const directory = directory || `./${NODEMODULES_DIRECTORY}/`;

		console.log(`${COLOR_FOREGROUND_GREEN}License Scanner v1.0.0${COLOR_RESET}`);
		console.log();
		console.log(`${COLOR_FOREGROUND_BLUE}Scan a NodeJS project's NPM dependencies for all the dependant license agreements.${COLOR_RESET}`);
		console.log(`${COLOR_FOREGROUND_BLUE}What licenses do you have to be in compliance with? What are your obligations?${COLOR_RESET}`);
		console.log();
		console.log(`${COLOR_FOREGROUND_BLUE}Copyright (C) 2019 Patrick Morrow${COLOR_RESET}`);
		console.log(`${COLOR_FOREGROUND_BLUE}MIT Licensed${COLOR_RESET}`);
		console.log();

		const licenses = getLicenses(directory);
		printLicenses(licenses);
		console.log();
		printStatistics(licenses);
		console.log();
	}
};

exports.scanner = scanner;
