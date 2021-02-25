"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'keyboards:common:account:stats-joi';


module.exports = {


  friendlyName: 'keyboards:common:account:stats-joi',


  description: 'keyboards:common:account:stats-joi',


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


      const intervalStart = moment().subtract(5, 'days').startOf('day').format();
      const intervalEnd = moment().format();

      /**
       * Количество сделанных постов
       */

      const numPosts = await Posts.count({
        where: {
          createdAt: {
            '>=': moment(intervalStart).format(),
            '<=': moment(intervalEnd).format()
          },
          accountGuid,
        },
      })
        .tolerate(async (err) => {

          err.details = {
            where: {
              createdAt: {
                '>=': moment(intervalStart).format(),
                '<=': moment(intervalEnd).format()
              },
              accountGuid,
            },
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Posts.count() error',
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
       * Количество полученных лайков
       */

      const numLikes = await Posts.sum('receivedLikes', {
        where: {
          createdAt: {
            '>=': moment(intervalStart).format(),
            '<=': moment(intervalEnd).format()
          },
          accountGuid,
        },
      })
        .tolerate(async (err) => {

          err.details = {
            where: {
              createdAt: {
                '>=': moment(intervalStart).format(),
                '<=': moment(intervalEnd).format()
              },
              accountGuid,
            },
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Posts.count() error',
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
       * Количество полученных комментариев
       */

      const numComments = await Posts.sum('receivedComments', {
        where: {
          createdAt: {
            '>=': moment(intervalStart).format(),
            '<=': moment(intervalEnd).format()
          },
          accountGuid,
        },
      })
        .tolerate(async (err) => {

          err.details = {
            where: {
              createdAt: {
                '>=': moment(intervalStart).format(),
                '<=': moment(intervalEnd).format()
              },
              accountGuid,
            },
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Posts.count() error',
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



      messageDataPath = 'keyboards.account.stats';
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
            token: '$NumPostsMade$',
            value: numPosts,
          },
          {
            token: '$NumLikesReceived$',
            value: numLikes,
          },
          {
            token: '$NumCommentsReceived$',
            value: numComments,
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

