"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboards:common:help:how-perform-task-joi';


module.exports = {


  friendlyName: 'keyboards:common:help:how-perform-task-joi',


  description: 'keyboards:common:help:how-perform-task-joi',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
      type: 'ref',
      required: true,
    },

  },


  exits: {
    success: {
      description: 'All done.',
    },
    err: {
      description: 'Error',
    }
  },


  fn: async function (inputs, exits) {

    const schema = Joi.object({
      client: Joi
        .any()
        .description('Client record')
        .required(),
    });

    let input;

    let client;
    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;


      const currentAccount = _.find(client.accounts, {guid: client.account_use});

      /**
       * Достаём данные PushMessage
       */

      const pushMessageName = currentAccount.service.push_message_name;

      const pushMessageGetParams = {
        pushMessageName,
      };

      const pushMessageGetRaw = await sails.helpers.storage.pushMessageGetJoi(pushMessageGetParams);

      if (pushMessageGetRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong pushMessageGetJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            pushMessageGetParams,
            pushMessageGetRaw,
          },
        });

      }

      const pushMessage = pushMessageGetRaw.payload;


      const messageDataPath = 'keyboards.help.howPerformTask';
      const messageData = _.get(pushMessage, messageDataPath, null);

      if (messageData == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No expected messageData',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            pushMessage,
            messageDataPath,
            messageData,
          },
        });
      }

      await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        disableWebPagePreview: true,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};

