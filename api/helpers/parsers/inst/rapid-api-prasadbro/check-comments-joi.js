"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');
const sleep = require('util').promisify(setTimeout);

const moduleName = 'parsers:inst:rapid-api-prasadbro:check-comments-joi';


module.exports = {


  friendlyName: 'parsers:inst:rapid-api-prasadbro:check-comments-joi',


  description: 'Проверка оставления комментария',


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

    let commentMade = false;
    let commentText = '';
    let numberOfWords = 0;

    let hasMore = true;
    let endCursor = null;

    const platform = 'Instagram';
    const action = 'parsing';
    const api = 'rapidApiPrasadbro';
    const requestType = 'checkComments';
    const momentStart = moment();

    let status = '';

    try {

      const input = await schema.validateAsync(inputs.params);

      shortCode = input.shortCode;

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      const requestTimeout = sails.config.custom.config.parsers.inst.rapidApiPrasadbro.requestTimeout || null;

      while (!commentMade && hasMore) {

        /**
         * Получаем данные о комментарии
         */

        const getCommentsParams = {
          client,
          shortCode,
        };

        if (endCursor != null) {
          getCommentsParams.endCursor = endCursor;
        }

        const getCommentsJoiRaw = await sails.helpers.parsers.inst.rapidApiPrasadbro.getCommentsJoi(getCommentsParams);

        if (getCommentsJoiRaw.status !== 'success') {

          status = 'error';
          const momentDone = moment();

          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          await LogProcessor.error({
            message: sails.config.custom.INST_PARSER_WRONG_GET_COMMENTS_STATUS.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_WRONG_GET_COMMENTS_STATUS.name,
            location: moduleName,
            payload: {
              getCommentsParams: _.omit(getCommentsParams, 'client'),
              getCommentsJoiRaw,
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
              error: 'wrong getCommentsJoi response status',
              getCommentsParams: _.omit(getCommentsParams, 'client'),
              getCommentsJoiRaw,
            },
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          return exits.success({
            status: 'error',
            message: `${moduleName} performed with error`,
            payload: {
              error: 'wrong getCommentsJoi response status',
            },
            raw: getCommentsJoiRaw,
          })

        }

        if (!_.has(getCommentsJoiRaw.payload, 'body.edges')) {

          status = 'error';
          const momentDone = moment();

          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          await LogProcessor.error({
            message: '"getCommentsJoiRaw.payload" has no "body.edges"',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_WRONG_RESPONSE_DATA.name,
            location: moduleName,
            payload: {
              getCommentsParams: _.omit(getCommentsParams, 'client'),
              getCommentsJoiRaw,
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
              error: '"getCommentsJoiRaw.payload" has no "body.edges"',
              getCommentsParams: _.omit(getCommentsParams, 'client'),
              getCommentsJoiRaw,
            },
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          return exits.success({
            status: 'error',
            message: `${moduleName} performed with error`,
            payload: {
              error: '"getCommentsJoiRaw.payload" has no "body.edges"',
            },
            raw: getCommentsJoiRaw,
          })

        }

        if (!_.isArray(getCommentsJoiRaw.payload.body.edges)) {

          status = 'error';
          const momentDone = moment();

          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          await LogProcessor.error({
            message: '"body.edges" not array',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_WRONG_RESPONSE_DATA.name,
            location: moduleName,
            payload: {
              getCommentsParams: _.omit(getCommentsParams, 'client'),
              getCommentsJoiRaw,
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
              error: '"body.edges" not array',
              getCommentsParams: _.omit(getCommentsParams, 'client'),
              getCommentsJoiRaw,
            },
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          return exits.success({
            status: 'error',
            message: `${moduleName} performed with error`,
            payload: {
              error: '"body.edges" not array',
            },
            raw: getCommentsJoiRaw,
          })

        }

        const commentByProfile = _.find(getCommentsJoiRaw.payload.body.edges, {node: {owner: {username: input.instProfile}}});

        if (commentByProfile != null) {
          const commentWords = _.words(commentByProfile.node.text, /[a-zA-Zа-яА-Яα-ωΑ-Ω0-9_]+/g);
          numberOfWords = commentWords.length;
          commentMade = numberOfWords >= sails.config.custom.config.parsers.inst.minWordsInComment;
          commentText = commentByProfile.node.text;
        }

        hasMore = getCommentsJoiRaw.payload.body.page_info.has_next_page || false;
        endCursor = getCommentsJoiRaw.payload.body.page_info.end_cursor || null;

        if (endCursor == null) {
          hasMore = false;
        }

        if (!_.isNil(requestTimeout)) {
          await sleep(requestTimeout);
        }

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
          commentMade,
          commentText,
          numberOfWords,
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {
          commentMade,
          commentText,
          numberOfWords,
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

