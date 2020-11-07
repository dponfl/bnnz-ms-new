"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'parsers:get-parser-joi';


module.exports = {


  friendlyName: 'parsers:get-parser-joi',


  description: 'parsers:get-parser-joi',


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
      platformName: Joi
        .string()
        .description('platform name')
        .required(),
      moduleName: Joi
        .string()
        .description('module name')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const apiStatusRec = await ApiStatus.findOne({
        active: true,
      })
        .tolerate(async (err) => {

          err.details = {
            active: true,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'ApiStatus.findOne() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              searchCondition: {
                active: true,
              },
            },
          });

          return null;
        });

      if (apiStatusRec == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No ApiStatus record found',
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            searchCondition: {
              active: true,
            },
          },
        });

      }

      const parsersArray = _.get(apiStatusRec.data, `parsers.${input.platformName}.${input.moduleName}`, null);

      if (parsersArray == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
          location: moduleName,
          message: `API status module for "parsers.${input.platformName}.${input.moduleName}" not found`,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            apiStatusRec,
          },
        });
      }

      for (const pars of parsersArray) {

        if (_.get(pars, 'enabled', false)
          && _.get(pars, 'active', false)
        ) {
          return exits.success(_.get(pars, 'parserName', null))
        }

      }

      return exits.success(null)

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            input,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            input,
          },
        });
        return exits.success(null);
      }

    }

  }

};

