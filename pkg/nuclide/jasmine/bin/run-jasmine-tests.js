#!/usr/bin/env node
'use strict';
/* @noflow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/*eslint-disable no-var, prefer-const, no-console*/

// Jasmine-node test runner with es6/es7 auto transpiling support.

// Set NODE_ENV here since `jasmine-node/lib/jasmine-node/cli.js` doesn't set it up.
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Set this up before we call the jasmine cli.js. The jasmine cli.js does this same
// trick, but neglects to respect the exit code, so we beat the to the punch.
function onExit(code) {
  process.removeListener('exit', onExit);
  process.exit(code);
}
process.on('exit', onExit);

// Load nuclide-node-transpiler to start transpiling.
require('../../node-transpiler');

// Load waitsForPromise into global.
global.waitsForPromise = require('../lib/waitsForPromise');
global.window = global;

require('../lib/unspy');
require('../lib/faketimer');

try {
  // This loads the CLI for Jasmine.
  require('jasmine-node/bin/jasmine-node');
} catch (e) {
  // Note that the process.exit(1) works now because of the onExit handler
  // installed at the start of this script.
  console.error(e.toString());
  console.error(e.stack);

  process.exit(1);
}
