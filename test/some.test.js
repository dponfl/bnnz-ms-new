"use strict";

const mlog = require('mocha-logger');

describe('Test group title', function () {
  it ('Test title', async function () {

    mlog.log('This is .log()');
    mlog.pending('This is .pending()');
    mlog.success('This is .success()');
    mlog.error('This is .error()');

  });
});
