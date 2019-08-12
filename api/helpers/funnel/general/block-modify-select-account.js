module.exports = {


  friendlyName: 'general::blockModifySelectAccount',


  description: 'general::blockModifySelectAccount',


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

    let resBlock = inputs.block;
    // let messageInlineKeyboard = inputs.block.message.inline_keyboard;
    let messageInlineKeyboard = [];

    try {

      sails.log.info('/*************** general::blockModifySelectAccount ***************/');

      // sails.log.debug('Client: ', inputs.client);
      // sails.log.debug('Block: ', inputs.block);

      _.forEach(inputs.client.accounts, (acc) => {

        // sails.log.warn('acc: ', acc);
        // sails.log.warn('acc.inst_profile: ', acc.inst_profile);

        // let textStr = acc.inst_profile + ((acc.guid === inputs.client.account_use) ? " (*)" : "");

        if (acc.subscription_active) {

          messageInlineKeyboard = _.concat(messageInlineKeyboard, [[
            {
              // "text": textStr,
              "text": acc.inst_profile + ((acc.guid === inputs.client.account_use) ? " (*)" : ""),
              "callback_data": "acc_" + acc.guid
            }
          ]]);

        }

        // sails.log.warn('messageInlineKeyboard: ', messageInlineKeyboard);

      });

      resBlock.message.inline_keyboard = messageInlineKeyboard;

      // sails.log.warn('resBlock.message.inline_keyboard: ', resBlock.message.inline_keyboard);

      return exits.success(resBlock);


    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/general/block-modify-select-account',
          message: 'api/helpers/funnel/general/block-modify-select-account error',
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

