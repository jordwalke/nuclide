'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {Collection} from '../types/ast';
import type {SourceOptions} from '../options/SourceOptions';

const getDeclaredIdentifiers = require('./getDeclaredIdentifiers');
const getJSXIdentifiers = require('./getJSXIdentifiers');

function getUndeclaredJSXIdentifiers(
  root: Collection,
  options: SourceOptions
): Set<string> {
  const declaredIdentifiers = getDeclaredIdentifiers(root, options);
  const jsxIdentifiers = getJSXIdentifiers(root);
  const undeclared = new Set();
  for (const id of jsxIdentifiers) {
    if (!declaredIdentifiers.has(id)) {
      undeclared.add(id);
    }
  }
  return undeclared;
}

module.exports = getUndeclaredJSXIdentifiers;
