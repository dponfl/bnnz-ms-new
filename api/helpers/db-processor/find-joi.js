"use strict";

const Joi = require('@hapi/joi');
const sleep = require('util').promisify(setTimeout);

const moduleName = 'api/helpers/db-processor/find.js';


module.exports = {


  friendlyName: 'api/helpers/db-processor/find.js',


  description: 'api/helpers/db-processor/find.js',


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
      model: Joi
        .string()
        .description('model/table name')
        .valid(
          'Account',
        )
        .required(),
      params: Joi
        .any()
        .description('where search conditions')
        .required(),
      populate: Joi
        .any()
        .description('array of table names')
        .default([]),
    });

    let input;

    let res = null;

    let done = false;
    let iterationsDone = 0;


    try {

      input = await schema.validateAsync(inputs.params);

      while (!done) {

        iterationsDone++;

        switch (input.model) {
          case 'Account':
            switch (input.populate.length) {
              case 0:
                // res = await Account.find({where: input.params})
                //   .tolerate(async (err) => {
                //     err.details = {
                //       iterationsDone,
                //       inputModel: input.model,
                //       inputParams: input.params,
                //       inputPopulate: input.populate,
                //     };
                //     await logError(err);
                //     return null;
                //   });
                //
                // if (res != null) {
                //   done = true;
                // }

                break;
              case 1:
                // res = await Account.find({where: input.params})
                //   .populate(input.populate[0])
                //   .tolerate(async (err) => {
                //     err.details = {
                //       iterationsDone,
                //       inputModel: input.model,
                //       inputParams: input.params,
                //       inputPopulate: input.populate,
                //     };
                //     await logError(err);
                //     return null;
                //   });
                //
                // if (res != null) {
                //   done = true;
                // }

                break;
              case 2:
                // res = await Account.find({where: input.params})
                //   .populate(input.populate[0])
                //   .populate(input.populate[1])
                //   .tolerate(async (err) => {
                //     err.details = {
                //       iterationsDone,
                //       inputModel: input.model,
                //       inputParams: input.params,
                //       inputPopulate: input.populate,
                //     };
                //     await logError(err);
                //     return null;
                //   });
                //
                // if (res != null) {
                //   done = true;
                // }

                break;
              case 3:

                try {

                  // Account.find({where: input.params})
                  //   .populate(input.populate[0])
                  //   .populate(input.populate[1])
                  //   .populate(input.populate[2])
                  //   .exec(async (err, rec) => {
                  //
                  //     if (err) {
                  //       err.details = {
                  //         iterationsDone,
                  //         inputModel: input.model,
                  //         inputParams: input.params,
                  //         inputPopulate: input.populate,
                  //       };
                  //       await logError(err);
                  //       res = null;
                  //       return res;
                  //     }
                  //
                  //     res = rec;
                  //     done = true;
                  //     return res;
                  //   });

                  res = await Account.find({where: input.params})
                    .populate(input.populate[0])
                    .populate(input.populate[1])
                    .populate(input.populate[2])
                    .tolerate(async (err) => {
                      err.details = {
                        iterationsDone,
                        inputModel: input.model,
                        inputParams: input.params,
                        inputPopulate: input.populate,
                      };
                      await logError(err);
                      return null;
                    });

                  if (res != null) {
                    done = true;
                  }

                } catch (internalErr) {
                  sails.log.error('<<<<<<<<<<<<<< ERROR >>>>>>>>>>>>>>>>>>>>');
                }

                break;
            }

            break;
        }

        // TODO: Задать порог числа итераций через конфиг
        if (!done && iterationsDone >= 100) {

          /**
           * Логируем критическую ошибку и выходим из цикла
           */

          await LogProcessor.critical({
            message: sails.config.custom.DB_ERROR_CRITICAL.message,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
            location: moduleName,
            payload: {
            },
            createDbRecord: false,
          });

          done = true;

          return exits.success({
            status: 'error',
            message: `${moduleName}: ${sails.config.custom.DB_ERROR_CRITICAL.message}`,
            payload: [],
          })

        } else if (!done) {

          // TODO: Задать диапазон задержек через конфиг
          await sleep(_.random(300, 3000));

        }

      }

      if (res == null) {
        res = [];
      }

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: res,
      })

    } catch (e) {

      const throwError = false;
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
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};

async function logError(err) {
  await LogProcessor.error({
    message: sails.config.custom.DB_ERROR_MEDIUM.message,
    // requestId: null,
    // childRequestId: null,
    errorName: sails.config.custom.DB_ERROR_MEDIUM.name,
    emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
    location: moduleName,
    payload: {
      name: err.name || null,
      message: _.truncate(err.message, {
        length: 500,
        omission: ' [...]',
      }) || null,
      code: err.code || null,
      stack: _.truncate(err.stack, {
        length: 500,
        omission: ' [...]',
      })  || null,
      details: err.details || 'none',
    },
    createDbRecord: false,
  });
}

