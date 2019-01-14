const uuid = require('uuid-apikey');

module.exports = {


  friendlyName: 'Get service level',


  description: 'Get info depends on service level',


  inputs: {
    sl: {
      friendlyName: 'serviceLevel',
      description: 'Service level',
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

    if (!uuid.isAPIKey(inputs.sl)) {

      return exits.success({
        status: 'nok',
        message: sails.config.custom.SL_NOT_API_KEY,
        payload: inputs.sl
      });

    }

    let slRecord = await Ref.findOne({
      key: inputs.sl,
      used: false,
      deleted: false,
    });

    if (!slRecord) {

      /**
       * record for the specified criteria was not found
       */

      return exits.success({
        status: 'nok',
        message: sails.config.custom.SL_NOT_FOUND,
        payload: inputs.sl
      });

    } else {

      /**
       * found record for the specified criteria
       */

      let rec = await Ref.update({key: inputs.sl}).set({used: true}).fetch();

      if (!rec) {

        return exits.success({
          status: 'nok',
          message: sails.config.custom.SL_UPDATE_ERROR,
          payload: inputs.sl
        });

      } else {

        return exits.success({
          status: 'ok',
          message: sails.config.custom.SL_FOUND,
          payload: {
            guid: rec.guid,
            key: rec.key,
            service: rec.service,
          }
        });

      }

    }

  }


};

