"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');
const sleep = require('util').promisify(setTimeout);

const moduleName = 'parsers:inst:rapid-api-prasadbro:check-likes-joi';


module.exports = {


  friendlyName: 'parsers:inst:rapid-api-prasadbro:check-likes-joi',


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

    let client;
    let clientGuid;
    let accountGuid;

    let shortCode;

    let likeMade = false;

    let hasMore = true;
    let endCursor = null;

    const platform = 'Instagram';
    const action = 'parsing';
    const api = 'rapidApiPrasadbro';
    const requestType = 'checkLikes';
    const momentStart = moment();

    let status = '';

    try {

      const input = await schema.validateAsync(inputs.params);

      shortCode = input.shortCode;

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      const requestTimeout = sails.config.custom.config.parsers.inst.rapidApiPrasadbro.requestTimeout;

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

        const getLikesJoiRaw = await sails.helpers.parsers.inst.rapidApiPrasadbro.getLikesJoi(getLikesParams);

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
              getLikesParams: _.omit(getLikesParams, 'client'),
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

        if (!_.has(getLikesJoiRaw.payload, 'body.edge_liked_by.edges')) {

          status = 'error';
          const momentDone = moment();

          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          await LogProcessor.error({
            message: '"getLikesJoiRaw.payload" has no "body.edge_liked_by.edges"',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_WRONG_RESPONSE_DATA.name,
            location: moduleName,
            payload: {
              getLikesParams: _.omit(getLikesParams, 'client'),
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
              error: '"getLikesJoiRaw.payload" has no "body.edge_liked_by.edges"',
              getLikesParams: _.omit(getLikesParams, 'client'),
              getLikesJoiRaw,
            },
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          return exits.success({
            status: 'error',
            message: `${moduleName} performed with error`,
            payload: {
              error: '"getLikesJoiRaw.payload" has no "body.edge_liked_by.edges"',
            },
            raw: getLikesJoiRaw,
          })

        }

        if (!_.isArray(getLikesJoiRaw.payload.body.edge_liked_by.edges)) {

          status = 'error';
          const momentDone = moment();

          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          await LogProcessor.error({
            message: '"body.edge_liked_by.edges" not array',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_WRONG_RESPONSE_DATA.name,
            location: moduleName,
            payload: {
              getLikesParams: _.omit(getLikesParams, 'client'),
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
              error: '"body.edge_liked_by.edges" not array',
              getLikesParams: _.omit(getLikesParams, 'client'),
              getLikesJoiRaw,
            },
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          return exits.success({
            status: 'error',
            message: `${moduleName} performed with error`,
            payload: {
              error: '"body.edge_liked_by.edges" not array',
            },
            raw: getLikesJoiRaw,
          })

        }

        const likeByProfile = _.find(getLikesJoiRaw.payload.body.edge_liked_by.edges, {node: {username: input.instProfile}});

        if (likeByProfile != null) {
          likeMade = true;
        }

        hasMore = getLikesJoiRaw.payload.body.edge_liked_by.page_info.has_next_page || false;
        endCursor = getLikesJoiRaw.payload.body.edge_liked_by.page_info.end_cursor || null;

        if (endCursor == null) {
          hasMore = false;
        }

        await sleep(requestTimeout);

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
          message: `${moduleName} performed`,
          payload: {},
        });
      }
    }

  }

};

