module.exports = {


  friendlyName: 'general::blockModifyMaxPosts',


  description: 'general::blockModifyMaxPosts',


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

      sails.log.debug('/*************** general::blockModifyMaxPosts ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);

      if (inputs.client.accounts.length > 1
        && inputs.block.message.html.length <= 1
      ) {

        messageHtml = _.concat(inputs.block.message.html,{
          "text": "MSG_GENERAL_LIMIT_ACHEIVED_ACOUNT",
          "style": "b",
          "cr": ""
        });

        messageInlineKeyboard = _.concat(inputs.block.message.inline_keyboard, [[
          {
            "text": "MSG_GENERAL_BTN_CHANGE_ACCOUNT",
            "callback_data": "сhange_account"
          }
        ]]);

        resBlock.message.html = messageHtml;
        resBlock.message.inline_keyboard = messageInlineKeyboard;

      }

      return exits.success(resBlock);


    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/general/block-modify-max-posts',
          message: 'api/helpers/funnel/general/block-modify-max-posts error',
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

