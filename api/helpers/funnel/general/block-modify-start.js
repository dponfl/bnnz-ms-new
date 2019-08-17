module.exports = {


  friendlyName: 'general::blockModifyStart',


  description: 'general::blockModifyStart',


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
    let messageHtml = inputs.block.message.html;
    let messageInlineKeyboard = inputs.block.message.inline_keyboard;

    try {

      sails.log.info('/*************** general::blockModifyStart ***************/');

      // sails.log.debug('Client: ', inputs.client);
      // sails.log.debug('Block: ', inputs.block);

      if (inputs.client.accounts.length > 1
        && inputs.block.message.html.length <= 1
      ) {

        messageHtml = _.concat({
          "text": "MSG_GENERAL_START_ACCOUNT",
          "style": "b",
          "cr": "DCR"
        }, inputs.block.message.html);

        messageInlineKeyboard = _.concat(inputs.block.message.inline_keyboard, [[
          {
            "text": "MSG_GENERAL_BTN_CHANGE_ACCOUNT",
            "callback_data": "start_change_account"
          }
        ]]);

        resBlock.message.html = messageHtml;
        resBlock.message.inline_keyboard = messageInlineKeyboard;

      }

      return exits.success(resBlock);


    } catch (e) {

      sails.log.error('api/helpers/funnel/general/block-modify-start, error: ', e);

      throw {err: {
          module: 'api/helpers/funnel/general/block-modify-start',
          message: 'api/helpers/funnel/general/block-modify-start error',
          payload: {},
        }
      };
    }
  }
};

