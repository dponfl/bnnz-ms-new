"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');
const sleep = require('util').promisify(setTimeout);

const moduleName = 'parsers:inst:rapid-api-logicbuilder:check-comments-joi';


module.exports = {


  friendlyName: 'parsers:inst:rapid-api-logicbuilder:check-comments-joi',


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

    let clientGuid;
    let accountGuid;

    let shortCode;

    let commentMade = false;
    let commentText = '';
    let numberOfWords = 0;

    let hasMore = true;
    let endCursor = null;

    let totalComments = 0;
    let checkedComments = 0;

    const platform = 'Instagram';
    const action = 'parsing';
    const api = 'rapidApiLogicbuilder';
    const requestType = 'checkComments';
    const momentStart = moment();

    let status = '';

    try {

      const input = await schema.validateAsync(inputs.params);

      shortCode = input.shortCode;

      const client = input.client;
      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

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

        const getCommentsJoiRaw = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getCommentsJoi(getCommentsParams);

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

        const commentByProfile = _.find(getCommentsJoiRaw.payload.collector, {owner: {username: input.instProfile}});

        if (commentByProfile != null) {
          // const commentWords = _.words(commentByProfile.text, /\w+/g);
          const commentWords = _.words(commentByProfile.text, /[a-zA-Zа-яА-Яα-ωΑ-Ω0-9_]+/g);
          numberOfWords = commentWords.length;
          commentMade = numberOfWords >= sails.config.custom.config.parsers.inst.minWordsInComment;
          commentText = commentByProfile.text;
        }

        // TODO: Предусмотреть случай, когда
        //  getCommentsJoiRaw.payload.collector == undefined

        totalComments = getCommentsJoiRaw.payload.count;
        checkedComments = checkedComments + getCommentsJoiRaw.payload.collector.length;

        hasMore = getCommentsJoiRaw.payload.has_more || false;
        endCursor = getCommentsJoiRaw.payload.end_cursor || null;

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
          commentMade,
          commentText,
          numberOfWords,
          totalComments,
          checkedComments,
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

