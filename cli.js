#!/usr/bin/env node

"use strict";

let directory;
if (process.argv.length > 2) {
	directory = process.argv[2];
}

let format;
if (process.argv.length > 3) {
	format = process.argv[3];
}

console.log(require("./index.js").scan(directory, format));
