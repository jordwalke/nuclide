/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

// NOTE: This file is run as-is from Node, which is why we do not use let or Flow types.
/* eslint-disable no-var, no-console */

var child_process = require('child_process');
var net = require('net');
var path = require('path');
var temp = require('temp').track();

var server;
var domainSocket = path.join(temp.mkdirSync(), 'my.sock');
function exit(code) {
  if (server != null) {
    server.close();
  }
  // Flush process.stdout, if possible?
  process.exit(code);
}

var entryPoint = process.argv[2];
if (typeof entryPoint !== 'string') {
  console.error('First argument must be a path to a file to run.');
  exit(1);
}
if (!path.isAbsolute(entryPoint)) {
  entryPoint = path.resolve(process.env['PWD'], entryPoint);
}

/**
 * Runs the appropriate `atom --test` command and exits when the test completes.
 *
 * Note that all data that is passed to the user's script are encoded via the --log-file
 * argument because that is the only communication channel we have between the command line
 * and the user's code (other than environment variables).
 */
function runAtom() {
  var scriptArgs = {
    path: entryPoint,
    args: process.argv.slice(3),
    stdout: domainSocket,
  };
  var args = [
    '--test',
    require.resolve('../lib/test-runner'),
    '--log-file',
    JSON.stringify(scriptArgs),
  ];

  var atomTest = child_process.spawn('atom', args);
  // Currently, we forward stdout and stderr from the Atom process to stderr so
  // that the stdout is only what is written by `console.log()` in the Atom process.
  var writeToStderr = process.stderr.write.bind(process.stderr);
  atomTest.stdout.on('data', writeToStderr);
  atomTest.stderr.on('data', writeToStderr);
  atomTest.on('close', exit);
}

function main() {
  server = net.createServer(function(connection) {
    connection.on('data', function(bufferOrString) {
      var data = bufferOrString.toString();
      // Until a fix for suppressing this debug info is upstreamed:
      // https://github.com/atom/atom/commit/a4b9b9c6cd27e1403bd1ea4b82bd02f97031fc6a#commitcomment-16378936
      // We special-case content that starts with this prefix:
      var PREFIX = 'Window load time: ';
      // We use this technique instead of startsWith() so this works on Node 0.12.0.
      if (data.substring(0, PREFIX.length) !== PREFIX) {
        process.stdout.write(bufferOrString);
      }
    });
  });
  server.listen({path: domainSocket}, runAtom);
}

module.exports = main;
