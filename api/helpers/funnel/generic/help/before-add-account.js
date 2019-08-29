module.exports = {


  friendlyName: 'help::beforeAddAccount',


  description: 'help::beforeAddAccount',


  inputs: {
    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    block: {
      friendlyName: 'block',
      description: 'Current funnel block',
      type: 'ref',
      required: true,
    },
    msg: {
      friendlyName: 'message',
      description: 'Message received',
      type: 'ref',
      // required: true,
    },
    payload: {
      friendlyName: '{text, inline_keyboard} object',
      description: '{text, inline_keyboard} object',
      type: 'ref',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs,exits) {

    let resHtml = inputs.htmlMsg;

    try {

      sails.log.info('/*************** help::beforeAddAccount ***************/');

      /**
       * Replace placeholder by the list of active Instagram profiles
       */

      let activeProfilesList = sails.config.custom.DCR;

      _.forEach(inputs.client.accounts, (acc) => {

        if (acc.subscription_active) {

          activeProfilesList = activeProfilesList + "• " + acc.inst_profile + sails.config.custom.SCR;

        }

      });

      // activeProfilesList = activeProfilesList + sails.config.custom.SCR;


      resHtml = _.replace(inputs.payload.text, '$connectedInstProfiles$', activeProfilesList);

      return exits.success({
        text: resHtml,
        inline_keyboard: inputs.payload.inline_keyboard,
      });

    } catch (e) {

      const errorLocation = 'api/helpers/funnel/help/before-confirm-profile';
      const errorMsg = 'Error';

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

