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
      instProfile: Joi.string().required(),
      instPostCode: Joi.string().required(),
    });


    let commentMade = false;
    let commentText = '';
    let numberOfWords = 0;

    try {

      const input = await schema.validateAsync(inputs.params);

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'inapi';
      const requestType = 'checkComments';
      const momentStart = moment();

      /**
       * Получаем mediaId поста
       */

      const getMediaIdParams = {
        shortCode: input.instPostCode,
      };

      const getMediaIdRaw = await sails.helpers.parsers.inst.inapi.getMediaIdJoi(getMediaIdParams);

      if (getMediaIdRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong getMediaIdJoi response
        getMediaIdParams: ${JSON.stringify(getMediaIdParams, null, 3)}
        getMediaIdRaw: ${JSON.stringify(getMediaIdRaw, null, 3)}`);
      }

      const mediaId = _.get(getMediaIdRaw, 'payload.mediaId', null);

      if (mediaId == null) {
        throw new Error(`${moduleName}, error: getMediaIdJoi no payload.mediaId
        getMediaIdParams: ${JSON.stringify(getMediaIdParams, null, 3)}
        getMediaIdRaw: ${JSON.stringify(getMediaIdRaw, null, 3)}`);
      }

      /**
       * Получаем данные о комментарии
       */

      const getCommentsParams = {
        mediaId,
      };

      const getCommentsJoiRaw = await sails.helpers.parsers.inst.inapi.getCommentsJoi(getCommentsParams);

      if (getCommentsJoiRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong getLikesJoi response
        getCommentsParams: ${JSON.stringify(getCommentsParams, null, 3)}
        getCommentsJoiRaw: ${JSON.stringify(getCommentsJoiRaw, null, 3)}`);
      }

      const commentByProfile = _.find(getCommentsJoiRaw.payload.comments, {user: {username: input.instProfile}});

      if (commentByProfile != null) {
        // const commentWords = _.words(commentByProfile.text, /\w+/g);
        const commentWords = _.words(commentByProfile.text, /[a-zA-Zа-яА-Яα-ωΑ-Ω0-9_]+/g);
        numberOfWords = commentWords.length;
        commentMade = numberOfWords >= sails.config.custom.config.parsers.minWordsInComment;
        commentText = commentByProfile.text;
      }

      const momentDone = moment();

      const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

      const performanceCreateParams = {
        platform,
        action,
        api,
        requestType,
        requestDuration,
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          commentMade,
          commentText,
          numberOfWords,
        },
      })


    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};

