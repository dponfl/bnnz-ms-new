"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../sdk/client.js');

describe('pushMessages.supervisorCallback test', () => {



  let messageSaveJoiStub;

  // const stubRes = [
  //   {
  //     helper: 'checkStubOne',
  //     data: {
  //       order: 1,
  //       message: 'prop-1 stub response',
  //     }
  //   },
  //   {
  //     helper: 'checkStubTwo',
  //     data: {
  //       order: 2,
  //       message: 'prop-2 stub response',
  //     }
  //   },
  // ];

  // sinon.addBehavior('with', (fake, obj) => {
  //   fake.onCall(0).returns(stubRes[0]);
  //   fake.onCall(1).returns(stubRes[1]);
  //   fake.onCall(2).returns(stubRes[2]);
  // });

  // beforeEach(() => {
  //   checkStubOneStub = sinon.addBehavior('with', (fake, obj) => {
  //     fake.returns(stubRes[0]);
  //   }).stub(sails.helpers.storage, 'checkStubOne');
  //
  //   checkStubTwoStub = sinon.addBehavior('with', (fake, obj) => {
  //     fake.returns(stubRes[1]);
  //   }).stub(sails.helpers.storage, 'checkStubTwo');
  // });

  // afterEach(() => {
  //   checkStubOneStub.restore();
  //   checkStubTwoStub.restore();
  // });

  beforeEach(() => {
    messageSaveJoiStub = sinon.stub(sails.helpers.storage, 'messageSaveJoi');
  });

  afterEach(() => {
    checkStubOneStub.restore();
  });

  describe('Callback prefix analysis', () => {

    it('should throw error for unknown prefix', async () => {
      
    });


    it ('Likes task', async () => {

      // mlog.log('This is .log()');
      // mlog.pending('This is .pending()');
      // mlog.success('This is .success()');
      // mlog.error('This is .error()');

      const client  = await clientSdk.createClient();
      const query = {
        id: casual.integer(1000, 1000000),
        message: {
          message_id: casual.integer(1000, 1000000),
        },
        data: `push_msg_tsk_l_${casual.uuid}`,
      };

      // messageSaveStub.returns(Promise.resolve({
      //   status: 'ok',
      //   message: 'Message record created',
      //   payload: {},
      // }));

      const messageSave = messageSaveStub.with({
        status: 'ok',
        message: 'Some message',
      });

      const callbackLikes = sinon.stub(sails.helpers.pushMessages.tasks, 'callbackLikes')
        .returns({
          status: 'ok',
          message: 'callbackLikes performed',
          payload: {},
        });

      const supervisorCallbackRes = await sails.helpers.pushMessages.supervisorCallback.with({
        client: client,
        query: query,
      });

      // expect(messageSave()).to.be.equal('aaa');
      expect(messageSaveStub.calledOnce).to.be.true;
      expect(callbackLikes.calledOnce).to.be.true;
      expect(supervisorCallbackRes).to.have.property('status', 'ok');
      expect(supervisorCallbackRes).to.have.property('message', 'PushMessages SupervisorCallback performed');

    });

  });
});
