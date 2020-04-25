"use strict";

const moduleName = 'storage:posts-update';


module.exports = {


  friendlyName: 'storage:posts-update',


  description: 'Posts record update',


  inputs: {

    criteria: {
      friendlyName: 'criteria',
      description: 'Criteria to update posts record',
      type: 'ref',
      required: true,
    },

    data: {
      friendlyName: 'data',
      description: 'Data to update to the posts record',
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

    try {

      await Posts.update(inputs.criteria).set(inputs.data);

      return exits.success({
        status: 'ok',
        message: '**************',
        payload: {},
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

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

};

