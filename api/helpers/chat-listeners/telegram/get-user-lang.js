module.exports = {


  friendlyName: 'Get user language',


  description: 'Get user language from Telegram message',


  inputs: {
    msg: {
      friendlyName: 'Message',
      description: 'Telegram message object',
      type: 'ref',
      required: true,
    }
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

    if (!_.isNil(inputs.msg.from.language_code)) {


      let lang = inputs.msg.from.language_code.match(/ru|en/i);


      if (lang && lang[0]) {

        return exits.success({
          status: 'ok',
          message: 'Success',
          payload: {lang: lang[0]}
        });


      } else {

        return exits.success({
          status: 'ok',
          message: 'Success',
          payload: {lang: 'en'}
        });

      }

    }


  }


};

