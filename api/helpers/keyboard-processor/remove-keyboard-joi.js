"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboard-processor:remove-keyboard-joi';


module.exports = {


  friendlyName: 'keyboard-processor:remove-keyboard-joi',


  description: 'keyboard-processor:remove-keyboard-joi',


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

    const schema = Joi
      .object({
        client: Joi
          .any()
          .required(),
        messageData: Joi
          .any()
          .required(),
        additionalTokens: Joi
          .any(),
        disableWebPagePreview: Joi
          .boolean()
          .description('flag to disable web page preview at message'),
      });

    let input;

    let clientGuid;
    let accountGuid;
    let clientId;

    let msgSaveParams;
    let msgSaveRec;
    let messageGuid;
    let msgQueueCreateParams;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;
      clientId = input.client.id;


      const html = await KeyboardProcessor.parseMessageStyle({
        client: input.client,
        message: input.messageData,
        additionalTokens: input.additionalTokens,
      });

      // const res = await sails.helpers.mgw.telegram.keyboardRemoveJoi({
      //   chatId: input.client.chat_id,
      //   html,
      // });

      msgSaveParams = {
        msgSaveParams: {
          action: sails.config.custom.enums.messageSaveActions.CREATE,
          clientGuid,
          accountGuid,
          clientId,
        },
        createdBy: moduleName,
      };

      msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

      messageGuid = msgSaveRec.messageGuid;

      msgQueueCreateParams = {
        clientGuid,
        accountGuid,
        messageGuid,
        channel: input.client.messenger,
        chatId: input.client.chat_id,
        clientId,
        msgType: 'keyboardRemoveJoi',
        payload: {
          chatId: input.client.chat_id,
          html,
        },
      };

      await sails.helpers.storage.msgQueueCreateWrapper({
        msgQueueCreateParams,
        createdBy: moduleName,
      });


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: msgSaveRec,
      })

    } catch (e) {
      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }
    }

  }

};

