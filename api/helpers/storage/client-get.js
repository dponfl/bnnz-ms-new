"use strict";

const _ = require('lodash');

const moduleName = 'Helper general:get-client';

module.exports = {


  friendlyName: 'Get client',


  description: 'Returns the client record by messenger and chat_id',


  inputs: {
    messenger: {
      friendlyName: 'messenger',
      description: 'Messenger name',
      type: 'string',
      required: true,
    },
    msg: {
      friendlyName: 'Message',
      description: 'Message object',
      type: 'ref',
      required: true,
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    // sails.log.info(moduleName + ', inputs: ', inputs);

    let clientRecord;
    let accountRecord;


    /**
     * Get chat_id depends on message type (text message or callback query
     */

    let chatId =  null;

    if (
      !_.isNil(inputs.msg.chat)
      && !_.isNil(inputs.msg.chat.id)
    ) {

      chatId = inputs.msg.chat.id;

    } else if (
      !_.isNil(inputs.msg.message)
      && !_.isNil(inputs.msg.message.chat)
      && !_.isNil(inputs.msg.message.chat.id)
    ) {

      chatId = inputs.msg.message.chat.id;

    }

    if (_.isNil(chatId)) {

      // sails.log.error('clientGet, no chat id in the message, input.msg: ', inputs.msg);

      // throw {err: {
      //     module: 'api/helpers/storage/get-client',
      //     message: sails.config.custom.NO_CHAT_ID,
      //     payload: {
      //       messenger: inputs.messenger,
      //       msg: inputs.msg,
      //     },
      //   }
      // };

      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.ERROR,
        location: moduleName,
        message: 'No chat id in the message',
        errorName: sails.config.custom.STORAGE_ERROR.name,
        payload: {
          msg: inputs.msg,
        },
      });


    }

    try {

      clientRecord = await Client.findOne({
        chat_id: chatId,
        messenger: inputs.messenger
      });

      if (!clientRecord) {

        /**
         * Record for the client was not found
         */

        // sails.log(moduleName + ', client was NOT FOUND');

        return exits.success({
          status: 'not_found',
          message: sails.config.custom.CLIENT_NOT_FOUND,
          payload: {
            messenger: inputs.messenger,
            msg: inputs.msg,
          },
        });

      } else {

        /**
         * found clientRecord for the specified criteria
         */

        // sails.log(moduleName + ', client was FOUND: ', clientRecord);

        const accountRecordRaw = await sails.helpers.storage.accountGetJoi({
          clientId: clientRecord.id,
        });

        accountRecord = accountRecordRaw.payload;

        if (accountRecord.length === 0) {

          /**
           * Record(s) for the client's account(s) not found
           */

          // sails.log(moduleName + ', account(s) NOT FOUND');

          return exits.success({
            status: 'not_found',
            message: sails.config.custom.ACCOUNT_NOT_FOUND,
            payload: {
              messenger: inputs.messenger,
              msg: inputs.msg,
            },
          });

        } else {

          /**
           * found accountRecord for the specified criteria
           */

          // sails.log(moduleName + ', accout(s) FOUND: ', accountRecord);

          return exits.success({
            status: 'found',
            message: sails.config.custom.CLIENT_FOUND,
            payload: _.assignIn(clientRecord, {accounts: accountRecord}),
          });

        }


      }

    } catch (e) {

      // const errorLocation = 'api/helpers/storage/get-client';
      // const errorMsg = sails.config.custom.CLIENT_GENERAL_ERROR;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {},
      //   }
      // };

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
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }


};


