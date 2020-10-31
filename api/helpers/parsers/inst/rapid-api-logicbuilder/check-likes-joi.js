"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');
const sleep = require('util').promisify(setTimeout);

const moduleName = 'parsers:inst:rapid-api-logicbuilder:check-likes-joi';


module.exports = {


  friendlyName: 'parsers:inst:rapid-api-logicbuilder:check-likes-joi',


  description: 'Проверка постановки лайка',


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
      instProfile: Joi
        .string()
        .required(),
      shortCode: Joi
        .string()
        .description('Instagram post shortcode')
        .required(),
      postMediaId: Joi
        .string()
        .description('Instagram post media id')
        .required(),
    });

    let clientGuid;
    let accountGuid;

    let shortCode;

    let likeMade = false;

    let hasMore = true;
    let endCursor = null;

    let totalLikers = 0;
    let checkedLikers = 0;

    const platform = 'Instagram';
    const action = 'parsing';
    const api = 'rapidApiLogicbuilder';
    const requestType = 'checkLikes';
    const momentStart = moment();

    let status = '';

    try {

      const input = await schema.validateAsync(inputs.params);

      shortCode = input.shortCode;

      const client = input.client;
      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      while (!likeMade && hasMore) {

        /**
         * Получаем данные о тех, кто поставил лайк
         */

        const getLikesParams = {
          client,
          shortCode,
        };

        if (endCursor != null) {
          getLikesParams.endCursor = endCursor;
        }

        const getLikesJoiRaw = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getLikesJoi(getLikesParams);

        if (getLikesJoiRaw.status !== 'success') {

          status = 'error';
          const momentDone = moment();

          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          await LogProcessor.error({
            message: sails.config.custom.INST_PARSER_WRONG_GET_LIKES_STATUS.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_WRONG_GET_LIKES_STATUS.name,
            location: moduleName,
            payload: {
              getLikesParams,
              getLikesJoiRaw,
            }
          });

          const performanceCreateParams = {
            platform,
            action,
            api,
            requestType,
            requestDuration,
            status,
            clientGuid,
            accountGuid,
            comments: {
              error: 'wrong getLikesJoi response status',
              getLikesParams: _.omit(getLikesParams, 'client'),
              getLikesJoiRaw,
            },
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          return exits.success({
            status: 'error',
            message: `${moduleName} performed with error`,
            payload: {
              error: 'wrong getLikesJoi response status',
            },
            raw: getLikesJoiRaw,
          })

        }

        const likeByProfile = _.find(getLikesJoiRaw.payload.collector, {username: input.instProfile});

        if (likeByProfile != null) {
          likeMade = true;
        }

        totalLikers = getLikesJoiRaw.payload.count;
        checkedLikers = checkedLikers + getLikesJoiRaw.payload.collector.length;

        hasMore = getLikesJoiRaw.payload.has_more || false;
        endCursor = getLikesJoiRaw.payload.end_cursor || null;

        if (endCursor == null) {
          hasMore = false;
        }

        // TODO: Убрать после того, как лимит на 1 запрос в сек будет убран
        await sleep(1000);

      }

      status = 'success';

      const momentDone = moment();

      const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

      const performanceCreateParams = {
        platform,
        action,
        api,
        requestType,
        requestDuration,
        status,
        clientGuid,
        accountGuid,
        comments: {
          input: _.omit(input, 'client'),
          likeMade,
          totalLikers,
          checkedLikers,
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {
          likeMade,
        },
      })

    } catch (e) {
      const throwError = false;
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
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }
    }

  }

};

