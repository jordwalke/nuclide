'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {HomeFragments} from '../../../home-interfaces';
import type {nuclide_debugger$Service} from '../../interfaces/service';
import type OutputService from '../../../output/lib/OutputService';

import {setOutputService} from './OutputServiceManager';

module.exports = {
  activate(state: mixed): void {
  },

  consumeOutputService(api: OutputService): void {
    setOutputService(api);
  },

  provideNuclideDebuggerHhvm(): nuclide_debugger$Service {
    const Service = require('./Service');
    return Service;
  },

  getHomeFragments(): HomeFragments {
    return {
      feature: {
        title: 'HHVM Debugger',
        icon: 'plug',
        description: 'Connect to a HHVM server process and debug Hack code from within Nuclide.',
        command: 'nuclide-debugger:toggle',
      },
      priority: 6,
    };
  },

};
