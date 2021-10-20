#!/usr/bin/env node

'use strict';

const getDepsPaths = require('..');

const cwd = process.cwd();

console.log('paths:', getDepsPaths(cwd));
