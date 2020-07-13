"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'parsers:inst:inapi:check-likes-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:check-likes-joi',


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
      instProfile: Joi.string().required(),
      instPostCode: Joi.string().required(),
    });


    let likeMade = false;

    try {

      const input = await schema.validateAsync(inputs.params);

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'inapi';
      const requestType = 'checkLikes';
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
       * Получаем данные о тех, кто поставил лайк
       */

      const getLikesParams = {
        mediaId,
      };

      const getLikesJoiRaw = await sails.helpers.parsers.inst.inapi.getLikesJoi(getLikesParams);

      if (getLikesJoiRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong getLikesJoi response
        getLikesParams: ${JSON.stringify(getLikesParams, null, 3)}
        getLikesJoiRaw: ${JSON.stringify(getLikesJoiRaw, null, 3)}`);
      }

      const likeByProfile = _.find(getLikesJoiRaw.payload.users, {username: input.instProfile});

      if (likeByProfile != null) {
        likeMade = true;
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
          likeMade,
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

