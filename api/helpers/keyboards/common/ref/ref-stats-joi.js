"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'keyboards:common:ref:ref-stats-joi';


module.exports = {


  friendlyName: 'keyboards:common:ref:ref-stats-joi',


  description: 'keyboards:common:ref:ref-stats-joi',


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

      let messageDataPath = 'general.holdOnMessages.performsCalculation';
      let messageData = _.get(pushMessage, messageDataPath, null);

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


      const intervalStart = moment().subtract(30, 'days').startOf('day').format();
      const intervalEnd = moment().format();

      /**
       * Количество обычных подписчиков
       */

      const numNormalRefSubs = await RefDown.count({
        where: {
          ref_account_guid: accountGuid,
          type: sails.config.custom.enums.ref.refDownType.NORMAL,
        },
      })
        .tolerate(async (err) => {

          err.details = {
            where: {
              ref_account_guid: accountGuid,
              type: sails.config.custom.enums.ref.refDownType.NORMAL,
            },
          };

          await LogProcessor.dbError({
            error: err,
            message: 'RefDown.count() error',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              conditions: err.details,
            },
          });

          return 0;
        });



      /**
       * Количество подписчиков без реф ссылки
       */

      const numNoRefSubs = await RefDown.count({
        where: {
          ref_account_guid: accountGuid,
          type: sails.config.custom.enums.ref.refDownType.NOREF,
        },
      })
        .tolerate(async (err) => {

          err.details = {
            where: {
              ref_account_guid: accountGuid,
              type: sails.config.custom.enums.ref.refDownType.NOREF,
            },
          };

          await LogProcessor.dbError({
            error: err,
            message: 'RefDown.count() error',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              conditions: err.details,
            },
          });

          return 0;
        });



      /**
       * Количество подписчиков по "переливу"
       */

      const numOverflowRefSubs = await RefDown.count({
        where: {
          ref_account_guid: accountGuid,
          type: sails.config.custom.enums.ref.refDownType.OVERFLOW,
        },
      })
        .tolerate(async (err) => {

          err.details = {
            where: {
              ref_account_guid: accountGuid,
              type: sails.config.custom.enums.ref.refDownType.OVERFLOW,
            },
          };

          await LogProcessor.dbError({
            error: err,
            message: 'RefDown.count() error',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              conditions: err.details,
            },
          });

          return 0;
        });





      messageDataPath = 'keyboards.ref.refStats';
      messageData = _.get(pushMessage, messageDataPath, null);

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
        additionalTokens: [
          {
            token: '$CurrentAccount$',
            value: currentAccount.inst_profile,
          },
          {
            token: '$NormalRefSubs$',
            value: numNormalRefSubs,
          },
          {
            token: '$OverflowRefSubs$',
            value: numNoRefSubs + numOverflowRefSubs,
          },
        ],
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
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};

