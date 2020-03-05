"use strict";

const moduleName = 'parsers:inst:ninja:check-likes';


module.exports = {


  friendlyName: 'parsers:inst:ninja:check-likes',


  description: 'Проверка постановки лайка',


  inputs: {

    profile: {
      friendlyName: 'account Inst profile',
      description: 'account Inst profile',
      type: 'string',
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

    let likeDone = false;

    try {



      return exits.success({
        status: 'ok',
        message: 'Check likes performed',
        payload: likeDone,
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

