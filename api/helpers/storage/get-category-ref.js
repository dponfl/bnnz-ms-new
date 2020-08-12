"use strict";

const uuid = require('uuid-apikey');

module.exports = {


  friendlyName: 'Get category',


  description: 'Get category',


  inputs: {
    categoryKey: {
      friendlyName: 'categoryKey',
      description: 'Category key',
      type: 'string',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {


    let categoryRefRecord;
    let updatedCategoryRefRec;
    let categoryRefParams;

    try {

      categoryRefParams = {
        key: inputs.categoryKey,
        used: false,
        deleted: false,
      };

      categoryRefRecord = await CategoryRef.findOne(categoryRefParams);

    } catch (e) {

      // const errorLocation = 'api/helpers/storage/get-category-ref';
      // const errorMsg = sails.config.custom.CATEGORYREF_GENERAL_ERROR;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {},
      //   }
      // };

      const throwError = true;
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
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

    // sails.log.info('CategoryRef.findOne, categoryRefRecord: ', categoryRefRecord);

    if (categoryRefRecord == null) {

      /**
       * record for the specified criteria was not found
       */

      // const errorLocation = 'api/helpers/storage/get-category-ref';
      // const errorMsg = sails.config.custom.CATEGORYREF_NOT_FOUND;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', {
      //   params: inputs,
      // });
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {},
      //   }
      // };

      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.ERROR,
        location: moduleName,
        message: 'categoryRef for the specified criteria was not found',
        errorName: sails.config.custom.STORAGE_ERROR.name,
        payload: {
          categoryRefParams,
          categoryRefRecord,
        },
      });


    } else {

      /**
       * found record for the specified criteria
       */

      try {

        if (categoryRefRecord.unique) {

          updatedCategoryRefRec = await CategoryRef.updateOne({key: inputs.categoryKey}).set({used: true});

        } else {

          updatedCategoryRefRec = categoryRefRecord;

        }

        return exits.success({
          status: 'ok',
          message: sails.config.custom.CATEGORYREF_FOUND,
          payload: updatedCategoryRefRec,
        });

      } catch (e) {

        // const errorLocation = 'api/helpers/storage/get-category-ref';
        // const errorMsg = sails.config.custom.CATEGORYREF_UPDATE_ERROR;
        //
        // sails.log.error(errorLocation + ', error: ' + errorMsg);
        // sails.log.error(errorLocation + ', error details: ', e);
        //
        // throw {err: {
        //     module: errorLocation,
        //     message: errorMsg,
        //     payload: {},
        //   }
        // };

        const throwError = true;
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
            status: 'ok',
            message: `${moduleName} performed`,
            payload: {},
          });
        }

      }

    }

  }


};

