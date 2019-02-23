"use strict";

/**
 * License Scanner
 *
 * A license scanner that enumerates all NPM dependencies and displays their licenses and statistics.
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
const LICENSE_SEPARATORS = [' AND ', ' OR ', ' WITH '];

const COLOR_RESET = '\x1b[0m';
//const COLOR_FOREGROUND_RED = '\x1b[31m';
const COLOR_FOREGROUND_GREEN = '\x1b[32m';
const COLOR_FOREGROUND_YELLOW = '\x1b[33m';
const COLOR_FOREGROUND_BLUE = '\x1b[34m';
const COLOR_BACKGROUND_RED = '\x1b[41m';
//const COLOR_BACKGROUND_GREEN = '\x1b[42m';
//const COLOR_BACKGROUND_YELLOW = '\x1b[43m';
//const COLOR_BACKGROUND_BLUE = '\x1b[44m';

function isSpdx(license) {
	let spdx = true;

	if (!license.startsWith(CUSTOMLICENSE)) {
		license = (license[0] === '(' && license[license.length-1] === ')' ? license.substring(1, license.length-1) : license);

		const elements = license.split(new RegExp(LICENSE_SEPARATORS.join('|'), 'g'));
		for (let i = 0; i < elements.length; ++i) {
			const element = elements[i];
			if (!spdxLicenses.includes(element)) {
				spdx = false;
				break;
			}
		}
	}

	return spdx;
}

function getLicenses(directory) {
	let licenses = [];
	if (fs.existsSync(directory)) {
		const files = fs.readdirSync(directory, {withFileTypes: true});
		files.sort((f1, f2) => { return f1.name === f2.name ? 0 : (f1.name < f2.name ? -1 : 1); });
		files.forEach((f) => {
			if (f.isDirectory() && !f.name.startsWith('.')) {
				const nextDirectory = `${directory}/${f.name}`;
				const packageFilename = `${nextDirectory}/${PACKAGE_FILENAME}`;
				if (fs.existsSync(packageFilename)) {
					const realPackageFilename = fs.realpathSync(packageFilename);
					const data = require(realPackageFilename);

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

					if (!license.startsWith(CUSTOMLICENSE) && !(license[0] === '(' && license[license.length-1] === ')')) {
						license = `(${license})`;
					}

					const dependencies = getLicenses(`${nextDirectory}/${NODEMODULES_DIRECTORY}`);

					licenses.push({
						name,
						version,
						license,
						dependencies
					});
				} else if (f.name.startsWith('@')) {
					const morelicenses = getLicenses(`${nextDirectory}`);
					licenses.push(...morelicenses);
				}
			}
		});
	}

	return licenses;
}

function getLicensesAndStatistics(licenses, depth) {
	depth = (depth === undefined ? 0 : depth);

	let statistics = {
		totalModules: 0,
		totalNonSpdxLicenses: 0,
		totalNolicense: 0,
		totalUnlicensed: 0,
		totalUnique: 0,
		licenses: {}
	};

	licenses.forEach((l) => {
		statistics.totalModules += 1;
		statistics.totalNonSpdxLicenses += (isSpdx(l.license) ? 0 : 1);
		statistics.totalNolicense += (l.license === `(${NOLICENSE})` ? 1 : 0);
		statistics.totalUnlicensed += (l.license === UNLICENSED ? 1 : 0);
		statistics.licenses[l.license] = (statistics.licenses[l.license] || 0) + 1;

		const s = getLicensesAndStatistics(l.dependencies, depth+1);
		statistics.totalModules += s.totalModules;
		statistics.totalNonSpdxLicenses += s.totalNonSpdxLicenses;
		statistics.totalNolicense += s.totalNolicense;
		statistics.totalUnlicensed += s.totalUnlicensed;
		for (let k in s.licenses) {
			const count = s.licenses[k];
			statistics.licenses[k] = (statistics.licenses[k] || 0) + count;
		}
	});

	if (depth === 0) {
		statistics.totalUnique = Object.keys(statistics.licenses).length;
		return {
			licenses,
			statistics
		}
	}

	return statistics;
}

function printLicenses(licenses, depth) {
	depth = (depth === undefined ? 0 : depth);
	if (depth === 0) {
		console.log(`${COLOR_FOREGROUND_GREEN}### LICENSES ###${COLOR_RESET}`);
		console.log();
	}

	let padding = HIERARCHY_PADDING.repeat(depth);
	licenses.forEach((l) => {
		const spdx = isSpdx(l.license);
		if (spdx) {
			console.log(`${padding}${l.name}@${l.version} ${l.license}`);
		} else {
			console.log(`${padding}${l.name}@${l.version} ${COLOR_BACKGROUND_RED}${l.license}${COLOR_RESET}`);
		}
		printLicenses(l.dependencies, depth+1);
	});

	if (depth === 0 && licenses.length === 0) {
		console.log(`${COLOR_FOREGROUND_YELLOW}There are no dependencies.${COLOR_RESET}`);
	}
}

function printStatistics(licenses) {
	const data = getLicensesAndStatistics(licenses);

	console.log(`${COLOR_FOREGROUND_GREEN}### STATISTICS ###${COLOR_RESET}`);
	console.log();
	console.log(`Total modules: ${data.statistics.totalModules}`);
	console.log(`Non-SPDX licenses: ${data.statistics.totalNonSpdxLicenses}`);
	console.log(`Nolicense: ${data.statistics.totalNolicense}`);
	console.log(`Unlicensed (Private): ${data.statistics.totalUnlicensed}`);
	console.log(`Unique licenses: ${data.statistics.totalUnique}`);
	console.log();

	const licenseKeys = Object.keys(data.statistics.licenses);
	licenseKeys.forEach((l) => {
		const count = data.statistics.licenses[l];
		const spdx = isSpdx(l);
		if (spdx) {
			console.log(`${l}: ${count}`);
		} else {
			console.log(`${COLOR_BACKGROUND_RED}${l}${COLOR_RESET}: ${count}`);
		}
	});

	// TODO: Evaluate each license and are there requirements that we need to fullfill?

	if (licenses.length > 0) {
		console.log();
		if (data.statistics.totalNonSpdxLicenses === 0 && data.statistics.totalUnlicensed === 0 && data.statistics.totalNolicense) {
			console.log(`${COLOR_FOREGROUND_GREEN}Congratulations! You are in compliance.${COLOR_RESET}`);
		} else {
			console.log(`${COLOR_FOREGROUND_YELLOW}Oops! You are NOT in compliance. Review your dependencies and their licenses.${COLOR_RESET}`);
		}
	} else {
		console.log(`${COLOR_FOREGROUND_YELLOW}There are no dependencies.${COLOR_RESET}`);
	}
}

const scanner = {
	scan: (directory, format) => {
		directory = directory || `./${NODEMODULES_DIRECTORY}`;
		format = format || 'print'; // print || json

		if (format === 'json') {
			const licenses = getLicenses(directory);
			return getLicensesAndStatistics(licenses);
		} else if (format === 'print') {
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
	}
};

module.exports = scanner;
