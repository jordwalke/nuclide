'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

const fs = require('fs');
const {RemoteConnection} = require('../lib/RemoteConnection');
const {ServerConnection, __test__} = require('../lib/ServerConnection');
const path = require('path');
const pathToFakePk = path.join(__dirname, 'fakepk');

describe('RemoteConnection', () => {
  const testConnections = __test__.connections;
  let testConnection;
  const testHostname = 'foo.nuclide.com';
  const testPath = '/home/foo/test';

  beforeEach(() => {
    fs.writeFileSync(pathToFakePk, '');
    const server = new ServerConnection({
      host: testHostname,
      port: 8192,
    });
    testConnections.set(testHostname, server);
    testConnection = new RemoteConnection(server, testPath);
    server.addConnection(testConnection);
  });

  afterEach(() => {
    testConnections.delete(testHostname);
    if (fs.existsSync(pathToFakePk)) {
      fs.unlink(pathToFakePk);
    }
  });

  describe('getByHostnameAndPath()', () => {
    it('gets a connection if the hostname and path matches', () => {
      const conn = RemoteConnection.getByHostnameAndPath(testHostname, testPath);
      expect(conn).toBe(testConnection);
    });

    it('returns undefined if the path is not matching', () => {
      const conn = RemoteConnection.getByHostnameAndPath(testHostname, '/home/bar/test');
      expect(conn).toBeUndefined();
    });

    it('returns undefined if the hostname is not matching', () => {
      const conn = RemoteConnection.getByHostnameAndPath('bar.nuclide.com', testPath);
      expect(conn).toBeUndefined();
    });

    it('returns a connection if given a file path deep into the directory path', () => {
      const conn = RemoteConnection.getByHostnameAndPath(testHostname, testPath + '/def/abc.txt');
      expect(conn).toBe(testConnection);
    });
  });

  describe('getForUri()', () => {
    it('gets a connection if the hostname and path matches', () => {
      const conn = RemoteConnection.getForUri(`nuclide://${testHostname}:8919${testPath}`);
      expect(conn).toBe(testConnection);
    });

    it('returns undefined if the path is not matching', () => {
      const conn = RemoteConnection.getForUri(`nuclide://${testHostname}:9292$/home/bar/test`);
      expect(conn).toBeUndefined();
    });

    it('returns undefined if the hostname is not matching', () => {
      const conn = RemoteConnection.getForUri(`nuclide://bar.nuclide.com:9292${testPath}`);
      expect(conn).toBeUndefined();
    });


    it('returns a connection if given a file path deep into the directory path', () => {
      const conn = RemoteConnection.getForUri(`nuclide://${testHostname}:7685${testPath}/def/abc.txt`);
      expect(conn).toBe(testConnection);
    });
  });

});
