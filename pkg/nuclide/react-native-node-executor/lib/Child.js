'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */


import type {ServerReplyCallback} from './types';
import type {EventEmitter} from 'events';

import {forkWithExecEnvironment} from '../../commons/lib/process';
import path from 'path';
import Rx from 'rx';

export default class Child {

  _closed: Promise<mixed>;
  _execScriptMessageId: number;
  _process$: Rx.Observable<child_process$ChildProcess>;
  _input$: Rx.Subject<Object>;

  constructor(onReply: ServerReplyCallback, emitter: EventEmitter) {
    this._execScriptMessageId = -1;

    const process$ = this._process$ = Rx.Observable.fromPromise(
      // TODO: The node location/path needs to be more configurable. We need to figure out a way to
      //   handle this across the board.
      forkWithExecEnvironment(path.join(__dirname, 'executor.js'), [], {execPath: 'node'})
    );

    this._closed = process$.flatMap(process => Rx.Observable.fromEvent(process, 'close'))
      .first()
      .toPromise();

    // A stream of messages we're sending to the executor.
    this._input$ = new Rx.Subject();

    // The messages we're receiving from the executor.
    const output$ = process$.flatMap(process => Rx.Observable.fromEvent(process, 'message'));

    // Emit the eval_application_script event when we get the message that corresponds to it.
    output$
      .filter(message => message.replyId === this._execScriptMessageId)
      .first()
      .combineLatest(process$)
      .map(([, process]) => process.pid)
      .subscribe(pid => {
        emitter.emit('eval_application_script', pid);
      });

    // Forward the output we get from the process to subscribers
    output$.subscribe(message => {
      onReply(message.replyId, message.result);
    });

    // Buffer the messages until we have a process to send them to, then send them.
    const bufferedMessage$ = this._input$.takeUntil(process$).buffer(process$).flatMap(x => x);
    const remainingMessages = this._input$.skipUntil(process$);
    bufferedMessage$.concat(remainingMessages)
      .combineLatest(process$)
      .subscribe(([message, process]) => {
        process.send(message);
      });
  }

  async kill(): Promise<void> {
    // Kill the process once we have one.
    this._process$.subscribe(process => { process.kill(); });
    await this._closed;
  }

  execScript(script: string, inject: string, id: number) {
    this._execScriptMessageId = id;
    this._input$.onNext({
      id,
      op: 'evalScript',
      data: {
        script,
        inject,
      },
    });
  }

  execCall(payload: Object, id: number) {
    this._input$.onNext({
      id,
      op: 'call',
      data: {
        method: payload.method,
        arguments: payload.arguments,
      },
    });
  }
}
