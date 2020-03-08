"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../sdk/client.js');

describe('Test sinon stubs', () => {
  it ('First test', async () => {

    // mlog.log('This is .log()');
    // mlog.pending('This is .pending()');
    // mlog.success('This is .success()');
    // mlog.error('This is .error()');

    const client = await clientSdk.createClient({username: 'AAA'});

    if (client != null) {
      mlog.success(`Client created: \n${JSON.stringify(client)}`);
    };

    mlog.log('Start of tests...');
    const sinonStub = sinon.stub(sails.helpers.pushMessages.tasks, 'testSinonStubs')
      .returns({
        status: 'ok',
        message: 'sinonStub performed',
        payload: {},
      });
    const testSinonStubsRes = await sails.helpers.pushMessages.tasks.testSinonStubs();
    expect(sinonStub.calledOnce).to.be.true;
    expect(testSinonStubsRes).to.have.property('status', 'ok');
    expect(testSinonStubsRes).to.have.property('message', 'sinonStub performed');
    mlog.log('End of tests...');
  });
});
