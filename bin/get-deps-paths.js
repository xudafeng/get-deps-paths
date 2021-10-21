#!/usr/bin/env node

'use strict';

const getDepsPaths = require('..');

const cwd = process.cwd();

console.log(getDepsPaths(cwd));
