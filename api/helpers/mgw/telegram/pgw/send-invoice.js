module.exports = {


  friendlyName: 'sendInvoice',


  description: 'sendInvoice',


  inputs: {

    chatId: {
      friendlyName: 'chatId',
      description: 'client chat id we use to send message',
      type: 'string',
      required: true,
    },

    title: {
      friendlyName: 'title',
      description: 'Product name', // 1-32 characters
      type: 'string',
      required: true,
    },

    description: {
      friendlyName: 'description',
      description: 'Product description', // 1-255 characters
      type: 'string',
      required: true,
    },

    payload: {
      friendlyName: 'payload',
      description: 'Bot defined invoice payload',
      type: 'string',
      required: true,
    },

    startParameter: {
      friendlyName: 'startParameter',
      description: 'Deep-linking parameter',
      type: 'string',
      required: true,
    },

    currency: {
      friendlyName: 'currency',
      description: 'Three-letter ISO 4217 currency code',
      type: 'string', // Three-letter ISO 4217 currency code (https://core.telegram.org/bots/payments#supported-currencies)
      required: true,
    },

    prices: {
      friendlyName: 'prices',
      description: 'Breakdown of prices',
      type: 'ref', // Array of LabeledPrice (https://core.telegram.org/bots/api#labeledprice)
      required: true,
    },

    options: {
      friendlyName: 'options',
      description: 'Additional Telegram query options',
      type: 'ref',
    },

  },

  exits: {

    success: {
      description: 'All done.',
    },

  },

  fn: async function (inputs, exits) {

    sails.log.info('Telegram sendInvoice: ', inputs);

    try {

      const paymentProviderTokenResponseRaw = await sails.helpers.general.getPaymentToken();

      if (paymentProviderTokenResponseRaw.status === 'ok'
      ) {

        const paymentProviderToken = paymentProviderTokenResponseRaw.payload.paymentProviderToken;

        if (paymentProviderToken == null) {
          throw new Error('Error: Cannot get payment provider token');
        }

        const sendInvoiceResult = await sails.config.custom.telegramBot.sendInvoice(
          inputs.chatId,
          inputs.title,
          inputs.description,
          inputs.payload,
          paymentProviderToken,
          inputs.startParameter,
          inputs.currency,
          inputs.prices,
          inputs.options || {},
        );

        return exits.success({
          status: 'ok',
          message: 'Test success',
          payload: {},
        })

      }

    } catch (e) {

      const errorLocation = 'api/helpers/mgw/telegram/pgw/send-invoice';
      const errorMsg = "Unknown error";

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

