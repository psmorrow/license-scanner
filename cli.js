#!/usr/bin/env node

'use strict';

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
