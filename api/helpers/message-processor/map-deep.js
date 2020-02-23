"use strict";

const t = require('../../services/translate').t;

const moduleName = 'message-processor:map-deep';


module.exports = {


  friendlyName: 'message-processor:map-deep',


  description: 'Map message objects in depth',


  inputs: {

    client: {
      friendlyName: 'client record',
      description: 'client record',
      type: 'ref',
      required: true,
    },

    data: {
      friendlyName: 'data',
      description: 'data',
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

      if (_.isArray(inputs.data)) {
        const arr = inputs.data.map(async (innerObj) => await sails.helpers.messageProcessor.mapDeep.with({
          client: inputs.client,
          data: innerObj,
        }));

        return exits.success(arr);

      } else if (_.isObject(inputs.data)) {
        let ob = _.forEach(inputs.data, async (val, key, o) => {
          if (key === 'text') {
            o[key] = await sails.helpers.messageProcessor.parseSpecialTokens.with({
              client: inputs.client,
              message: t(inputs.client.lang, val),
            });
          }
        });

        return exits.success(ob);

      }

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

