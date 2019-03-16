module.exports = {


  friendlyName: 'optin::callbackPaidBronze',


  description: 'optin::callbackPaidBronze',


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
    query: {
      friendlyName: 'query',
      description: 'Callback query received',
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

      sails.log.debug('/*************** optin::callbackPaidBronze ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);
      sails.log.debug('Query: ', inputs.query);

      let updateBlock;
      let getBlock;
      let splitRes;
      let updateFunnel;
      let updateId;

      const keys = [
        'clientId',
        'firstName',
        'lastName',
        'instagramProfile',
        'paymentPlan',
      ];

      const lables = {
        'clientId': 'ID клиента: ',
        'firstName': 'Имя: ',
        'lastName': 'Фамилия: ',
        'instagramProfile': 'Инстаграм: ',
        'paymentPlan': 'Категория: ',
      };

      const subject = 'Подтверждение подписки на профили';
      let html = `
          <h2>Поступило подтверждение подписки на профили</h2>
          <hr>
          <h3>Информация о клиенте</h3>
          <table style="border: 1px; color: #8AB512;">
        `;

      const clientData = {
        'clientId': inputs.client.guid,
        'firstName': inputs.client.first_name,
        'lastName': inputs.client.last_name,
        'instagramProfile': inputs.client.inst_profile,
        'paymentPlan': _.toUpper(inputs.client.payment_plan),
      };

      let i = 0;
      const styleOne = 'style = "background:#FFF; color:#000"';
      const styleTwo = 'style = "background:#DFE7C0; color:#000"';
      keys.forEach(function (key) {
        if (clientData[key]) {
          if (i%2) {
            html += `
              <tr ${styleOne}>
                <td>${lables[key]}</td>
                <td>${clientData[key]}</td>
              </tr>
            `;
          } else {
            html += `
              <tr ${styleTwo}>
                <td>${lables[key]}</td>
                <td>${clientData[key]}</td>
              </tr>
            `;
          }
          i++;
        }
      });

      html += '</table>';



      switch (inputs.query.data) {
        case 'subscription_confirm':

          inputs.client.subscription_confirmed_by_client = true;

          /**
           * Generate email to admin that the client confirmed subscription
           */

          await sails.helpers.general.sendMailgun(subject, html);


          inputs.block.next = 'optin::wait_subscription_check';

          /**
           * Update optin::wait_subscription_check block
           */

          updateBlock = 'optin::wait_subscription_check';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.previous = 'optin::bronze_paid';
          }

          inputs.block.done = true;

          await sails.helpers.funnel.afterHelperGeneric.with({
            client: inputs.client,
            block: inputs.block,
            msg: inputs.query,
            next: true,
            previous: true,
            switchFunnel: true,
          });


          break;
        default:
          throw new Error(`Wrong callback data: ${inputs.query.data}`);
      }

    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/callback-paid-bronze',
          message: 'api/helpers/funnel/optin/callback-paid-bronze error',
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }


    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: {}
    });
  }


};

