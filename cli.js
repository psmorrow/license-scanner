#!/usr/bin/env node

"use strict";

let directory;
if (process.argv.length > 2) {
	directory = process.argv[2];
}

let format; // print || json
if (process.argv.length > 3) {
	format = process.argv[3];
}

const data = require("./index.js").scan(directory, format);

if (format === "json") {
	console.log(data);
}
