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

    if (!uuid.isAPIKey(inputs.categoryKey)) {

      const errorLocation = 'api/helpers/storage/get-category-ref';
      const errorMsg = sails.config.custom.CATEGORYREF_NOT_API_KEY;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', {
        params: inputs,
      });

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

    let categoryRefRecord;
    let updatedCategoryRefRec;

    try {

      categoryRefRecord = await CategoryRef.findOne({
        key: inputs.categoryKey,
        used: false,
        deleted: false,
      });

    } catch (e) {

      const errorLocation = 'api/helpers/storage/get-category-ref';
      const errorMsg = sails.config.custom.CATEGORYREF_GENERAL_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

    // sails.log.info('CategoryRef.findOne, categoryRefRecord: ', categoryRefRecord);

    if (!categoryRefRecord) {

      /**
       * record for the specified criteria was not found
       */

      const errorLocation = 'api/helpers/storage/get-category-ref';
      const errorMsg = sails.config.custom.CATEGORYREF_NOT_FOUND;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', {
        params: inputs,
      });

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

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

        const errorLocation = 'api/helpers/storage/get-category-ref';
        const errorMsg = sails.config.custom.CATEGORYREF_UPDATE_ERROR;

        sails.log.error(errorLocation + ', error: ' + errorMsg);
        sails.log.error(errorLocation + ', error details: ', e);

        throw {err: {
            module: errorLocation,
            message: errorMsg,
            payload: {},
          }
        };
      }

    }

  }


};

