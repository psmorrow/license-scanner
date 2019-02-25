#!/usr/bin/env node

'use strict';

/**
 * License Scanner CLI
 *
 * A license scanner that enumerates all NPM dependencies and displays their licenses and statistics.
 * What licenses do you have to be in compliance with? What are your obligations?
 *
 * Copyright (C) 2019 Patrick Morrow
 * MIT Licensed
 */

const cli = {
	scan: (directory, format) => {
		return require('./index.js').scan(directory, format);
	}
};

if (require.main === module) {
	const args = process.argv.slice(2);

	const directory = (args.length >= 1 ? args[0] : undefined);
	const format = (args.length >= 2 ? args[1] : undefined);

	const data = cli.scan(directory, format);
	if (format === 'json') {
		return console.log(data);
	}
} else {
	module.exports = cli;
}
