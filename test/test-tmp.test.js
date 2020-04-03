"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('./sdk/client');

describe('Test group title', function () {
  it ('Test title', async function () {

    // mlog.log('This is .log()');
    // mlog.pending('This is .pending()');
    // mlog.success('This is .success()');
    // mlog.error('This is .error()');

    try {

      expect(postsRecFromDB).to.be.deep.include(paramsObj);

    } catch (e) {
      expect.fail(`Expect failed:\n${JSON.stringify(e, null, 3)}`);
    }

  });
});
