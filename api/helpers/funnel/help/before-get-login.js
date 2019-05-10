module.exports = {


  friendlyName: 'help::beforeGetLogin',


  description: 'help::beforeGetLogin',


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
    htmlMsg: {
      friendlyName: 'html message',
      description: 'HTML message',
      type: 'string',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs,exits) {


    try {

      /**
       * Update help::wrong_profile block
       */

      updateBlock = 'help::wrong_profile';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {

        getBlock.shown = false;
        getBlock.done = false;
        getBlock.enabled = false;

      } else {

        throw new Error(`Wrong block decoding for data: ${updateBlock}`);

      }

      /**
       * Update help::profile_exists block
       */

      updateBlock = 'help::profile_exists';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {

        getBlock.shown = false;
        getBlock.done = false;
        getBlock.enabled = false;
        getBlock.next = null;

      } else {

        throw new Error(`Wrong block decoding for data: ${updateBlock}`);

      }

      /**
       * Update help::confirm_profile block
       */

      updateBlock = 'help::confirm_profile';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {

        getBlock.shown = false;
        getBlock.done = false;
        getBlock.enabled = false;
        getBlock.next = null;

      } else {

        throw new Error(`Wrong block decoding for data: ${updateBlock}`);

      }

      return exits.success(inputs.htmlMsg);

    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/help/before-confirm-profile',
          message: 'api/helpers/funnel/help/before-confirm-profile error',
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

  }


};

