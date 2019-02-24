'use strict';

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
const spdxLicenseList = require('spdx-license-list');
const spdxLicenseSimpleList = require('spdx-license-list/simple');

const spdxLicenses = Array.from(spdxLicenseSimpleList).map((x) => { return x.toUpperCase(); });
const spdxOsiApproved = [];
Object.keys(spdxLicenseList).forEach((key) => {
	spdxOsiApproved[key.toUpperCase()] = spdxLicenseList[key].osiApproved;
});

const NODEMODULES_DIRECTORY = 'node_modules';
const PACKAGE_FILENAME = 'package.json';

const HIERARCHY_PADDING = '    ';
const NOLICENSE = 'NOLICENSE';
const UNLICENSED = 'UNLICENSED';
const CUSTOMLICENSE = 'SEE LICENSE IN';
const LICENSE_SEPARATORS = [' AND ', ' OR ', ' WITH '];

const COLOR_RESET = '\x1b[0m';
const COLOR_FOREGROUND_RED = '\x1b[31m';
const COLOR_FOREGROUND_GREEN = '\x1b[32m';
const COLOR_FOREGROUND_YELLOW = '\x1b[33m';
const COLOR_FOREGROUND_BLUE = '\x1b[34m';
//const COLOR_BACKGROUND_RED = '\x1b[41m';
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

function isOsiApproved(license) {
	let osiApproved = true;

	if (!license.startsWith(CUSTOMLICENSE)) {
		license = (license[0] === '(' && license[license.length-1] === ')' ? license.substring(1, license.length-1) : license);
		const elements = license.split(new RegExp(LICENSE_SEPARATORS.join('|'), 'g'));
		for (let i = 0; i < elements.length; ++i) {
			const element = elements[i];
			if (!spdxOsiApproved[element]) {
				osiApproved = false;
				break;
			}
		}
	}

	return osiApproved;
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
		totalNonCompliantLicenses: 0,
		totalUniqueLicenses: 0,
		uniques: {}
	};

	licenses.forEach((l) => {
		statistics.totalModules += 1;
		statistics.totalNonSpdxLicenses += (isSpdx(l.license) ? 0 : 1);
		statistics.totalNolicense += (l.license === `(${NOLICENSE})` ? 1 : 0);
		statistics.totalUnlicensed += (l.license === UNLICENSED ? 1 : 0);
		statistics.uniques[l.license] = (statistics.uniques[l.license] || 0) + 1;

		const s = getLicensesAndStatistics(l.dependencies, depth+1);
		statistics.totalModules += s.totalModules;
		statistics.totalNonSpdxLicenses += s.totalNonSpdxLicenses;
		statistics.totalNolicense += s.totalNolicense;
		statistics.totalUnlicensed += s.totalUnlicensed;
		for (let k in s.uniques) {
			const count = s.uniques[k];
			statistics.uniques[k] = (statistics.uniques[k] || 0) + count;
		}
	});

	if (depth === 0) {
		const uniquesKeys = Object.keys(statistics.uniques);

		uniquesKeys.forEach((license) => {
			const spdx = isSpdx(license);
			if (spdx) {
				const osiApproved = isOsiApproved(license);
				 if (!osiApproved) {
					statistics.totalNonCompliantLicenses += 1;
				}
			} else {
				statistics.totalNonCompliantLicenses += 1;
			}
		});

		statistics.totalUniqueLicenses = uniquesKeys.length;

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
			const osiApproved = isOsiApproved(l.license);
			if (osiApproved) {
				console.log(`${padding}${l.name}@${l.version} ${l.license}`);
			} else {
				console.log(`${padding}${l.name}@${l.version} ${COLOR_FOREGROUND_RED}${l.license}${COLOR_RESET}`);
			}
		} else {
			console.log(`${padding}${l.name}@${l.version} ${COLOR_FOREGROUND_YELLOW}${l.license}${COLOR_RESET}`);
		}
		printLicenses(l.dependencies, depth+1);
	});

	if (depth === 0 && licenses.length === 0) {
		console.log(`${COLOR_FOREGROUND_YELLOW}There are no dependencies.${COLOR_RESET}`);
	}
}

function printStatistics(licenses) {
	const data = getLicensesAndStatistics(licenses);
	const statistics = data.statistics;

	console.log(`${COLOR_FOREGROUND_GREEN}### STATISTICS ###${COLOR_RESET}`);
	console.log();
	console.log(`Total modules: ${statistics.totalModules}`);
	console.log(`Non-SPDX licenses: ${statistics.totalNonSpdxLicenses}`);
	console.log(`Nolicense: ${statistics.totalNolicense}`);
	console.log(`Unlicensed (Private): ${statistics.totalUnlicensed}`);
	console.log(`Unique licenses: ${statistics.totalUniqueLicenses}`);
	console.log();

	const uniquesKeys = Object.keys(statistics.uniques);
	uniquesKeys.sort();
	uniquesKeys.forEach((license) => {
		const count = statistics.uniques[license];
		const spdx = isSpdx(license);
		if (spdx) {
			const osiApproved = isOsiApproved(license);
 			if (osiApproved) {
				console.log(`${license}: ${count}`);
			} else {
				console.log(`${COLOR_FOREGROUND_RED}${license}${COLOR_RESET}: ${count}`);
			}
		} else {
			console.log(`${COLOR_FOREGROUND_YELLOW}${license}${COLOR_RESET}: ${count}`);
		}
	});

	if (licenses.length > 0) {
		console.log();
		if (data.statistics.totalNonCompliantLicenses === 0) {
			console.log(`${COLOR_FOREGROUND_GREEN}Congratulations! You are in compliance.${COLOR_RESET}`);
		} else {
			console.log(`${COLOR_FOREGROUND_YELLOW}There are ${data.statistics.totalNonCompliantLicenses} non-compliant licenses. Review the highlighted licenses.${COLOR_RESET}`);
		}
	} else {
		console.log(`${COLOR_FOREGROUND_GREEN}There are no dependencies.${COLOR_RESET}`);
	}

	return data;
}

const scanner = {
	scan: (directory, format) => {
		directory = directory || `./${NODEMODULES_DIRECTORY}`;
		format = format || 'print'; // print || json

		var data = {};
		if (format === 'json') {
			const licenses = getLicenses(directory);
			data = getLicensesAndStatistics(licenses);
		} else if (format === 'print') {
			const packageVersion = require(`./${PACKAGE_FILENAME}`).version;
			console.log(`${COLOR_FOREGROUND_GREEN}License Scanner v${packageVersion}${COLOR_RESET}`);
			console.log();
			console.log(`${COLOR_FOREGROUND_BLUE}A license scanner that enumerates all NPM dependencies and displays their licenses and statistics.${COLOR_RESET}`);
			console.log(`${COLOR_FOREGROUND_BLUE}What licenses do you have to be in compliance with? What are your obligations?${COLOR_RESET}`);
			console.log();
			console.log(`${COLOR_FOREGROUND_BLUE}Copyright (C) 2019 Patrick Morrow${COLOR_RESET}`);
			console.log(`${COLOR_FOREGROUND_BLUE}MIT Licensed${COLOR_RESET}`);
			console.log();

			const licenses = getLicenses(directory);
			printLicenses(licenses);
			console.log();
			data = printStatistics(licenses);
			console.log();
		}
		return data;
	}
};

module.exports = scanner;
