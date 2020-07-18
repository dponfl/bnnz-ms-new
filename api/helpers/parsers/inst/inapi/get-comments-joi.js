"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const moment = require('moment');

const moduleName = 'parsers:inst:inapi:get-comments-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:get-comments-joi',


  description: 'Получение информации о тех, кто оставил комментарий и текста комментария',


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
      mediaId: Joi
        .string()
        .description('Instagram media id')
        .required(),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'inapi';
      const requestType = 'getComments';
      const momentStart = moment();

      const options = {
        uri: sails.config.custom.instParserUrl + sails.config.custom.config.parsers[sails.config.custom.config.parsers.inst].paths.getComments,
        method: 'GET',
        qs: {
          api_key: sails.config.custom.instParserApiKey,
          mediaId: input.mediaId,
        },
        json: true,
      };

      const requestRes = await rp(options);

      const responseStatusMain = _.get(requestRes, 'status', null);
      const responseStatusInner = _.get(requestRes, 'response.status', null);

      if (responseStatusMain !== 'success' || responseStatusInner !== 'success') {
        throw new Error(`${moduleName}, error => wrong parser response:
        request params: ${JSON.stringify(options, null, 3)}
        request response: ${JSON.stringify(requestRes, null, 3)}`);
      }

      const comments = _.get(requestRes, 'response.instagram.comments', null);

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
          comments
        },
        raw: requestRes,
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
