"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'parsers:inst:inapi:check-comments-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:check-comments-joi',


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

    let mediaId;

    let commentMade = false;
    let commentText = '';
    let numberOfWords = 0;

    const platform = 'Instagram';
    const action = 'parsing';
    const api = 'inapi';
    const requestType = 'checkComments';
    const momentStart = moment();

    let status = '';

    try {

      const input = await schema.validateAsync(inputs.params);

      mediaId = input.postMediaId;

      const client = input.client;
      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      /**
       * Получаем данные о комментарии
       */

      const getCommentsParams = {
        client,
        mediaId,
      };

      const getCommentsJoiRaw = await sails.helpers.parsers.inst.inapi.getCommentsJoi(getCommentsParams);

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

      const commentByProfile = _.find(getCommentsJoiRaw.payload.comments, {user: {username: input.instProfile}});

      if (commentByProfile != null) {
        // const commentWords = _.words(commentByProfile.text, /\w+/g);
        const commentWords = _.words(commentByProfile.text, /[a-zA-Zа-яА-Яα-ωΑ-Ω0-9_]+/g);
        numberOfWords = commentWords.length;
        commentMade = numberOfWords >= sails.config.custom.config.parsers.inst.minWordsInComment;
        commentText = commentByProfile.text;
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
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }
    }

  }

};

