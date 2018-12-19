"use strict";

const generalServices = require('../../../../api/services/general');
const storageGatewayServices = require('../../../../api/services/storageGateway');
const paymentGatewayServices = require('../../../../api/services/paymentGateway');

const t = require('../../../../api/services/translate');

const messageGatewayServices = require('../../../../api/services/messageGateway');

const convScript = require('./telegramListenerConvScript');

const uuid = require('uuid-apikey');
const _ = require('lodash');

const bot = messageGatewayServices.getTelegramBot();

const moduleName = 'telegramListener:: ';

let useLang = 'en';

onCallbackQuery();

onMessage();

/**
 * Functions
 */

function getUserLang(data) {

  const methodName = 'getUserLang';

  if (!_.isNil(data.from.language_code)) {

    // console.log('getUserLang, data.from.language_code: ' + data.from.language_code);

    let res = data.from.language_code.match(/ru|en/i);

    // console.log('getUserLang, res:');
    // console.dir(res);

    if (res && res[0]) {
      useLang = res[0];
    }

  }

} // getUserLang

function onCallbackQuery() {

  const methodName = 'onCallbackQuery';

  bot.on('callback_query', query => {

    let route ='';
    let params = {};
    let sendREST = false;

    console.log(moduleName + methodName + ', query:');
    console.dir(query);

    getUserLang(query);

    (async () => {

      // console.log('inside async...');
      // console.log('useLang: ' + useLang);
      // console.log('query:');
      // console.dir(query);

      try {

        await bot.answerCallbackQuery(query.id);

        let queryScript = {};

        if (query.data == 'make_payment_plan_platinum'
          || query.data == 'make_payment_plan_gold'
          || query.data == 'make_payment_plan_bronze'
          || query.data == 'instagram_profile_yes') {

          let listProfiles = '';

          _.forEach(sails.config.superProfiles, (el) => {
            let listElem = `"https://instagram.com/${el}"`;
            listProfiles = listProfiles +
              `<a href=${listElem}>${el}</a>
`;
          });

          queryScript = await convScript.onCallbackQueryScript(useLang, query.message.chat.id, listProfiles);

        } else {

          queryScript = await convScript.onCallbackQueryScript(useLang, query.message.chat.id);

        }

        sails.log.info(moduleName + methodName + ', queryScript:', queryScript);

        queryScript.steps.map((elem) => {

          (async () => {

            if (elem.req == query.data) {

              route = elem.route;
              params = elem.params;

              // save info that the client selected payment plan

              if (elem.req == 'make_payment_plan_platinum'
                || elem.req == 'make_payment_plan_gold'
                || elem.req == 'make_payment_plan_bronze') {

                let paymentPlan = '';

                switch (elem.req) {
                  case 'make_payment_plan_platinum':
                    paymentPlan = 'platinum';
                    break;
                  case 'make_payment_plan_gold':
                    paymentPlan = 'gold';
                    break;
                  case 'make_payment_plan_bronze':
                    paymentPlan = 'bronze';
                    break;
                }

                // making payment

                let paymentResult = await paymentGatewayServices.makePayment({});

                // checking payment result

                if (!_.isNil(paymentResult.code)
                  && paymentResult.code == 200
                  && !_.isNil(paymentResult.data.res)
                  && paymentResult.data.res == 'ok'
                ) {

                  let clientUpdateResult = await storageGatewayServices.clientUpdate({id: queryScript.clientId}, {payment_plan: paymentPlan, payment_made: true});

                  if (!_.isNil(clientUpdateResult.code) && clientUpdateResult.code == 200) {

                    await sails.helpers.general.sendRest('POST', route, params);

                  } else {

                    sails.log.error(moduleName + methodName + ', clientUpdate (payment_plan_selected) error:', clientUpdateResult);

                  }

                } else {

                  sails.log.error(moduleName + methodName + ', paymentResult error:', paymentResult);

                }



              } else {

                await sails.helpers.general.sendRest('POST', route, params);
              }

            }
          })();

        });

      } catch (err) {
        console.log(moduleName + methodName + ', Error:');
        // console.log('statusCode: ' + err.statusCode);
        console.log('message: ' + err.message);
        // console.log('error: ');
        // console.dir(err.error);
        // console.log('options: ');
        // console.dir(err.options);
      }
    })();

  })

} // onCallbackQuery

function onMessage() {

  const methodName = 'onMessage';

  bot.on('message', (msg) => {

    let result;
    let sendREST = false;
    let REST = {
      route: '',
      params: {},
    };

    console.log(moduleName + methodName + ', message:');
    console.dir(msg);

    getUserLang(msg);

    (async () => {

      try {

        /**
         * Start command
         */

        if (/\/start/i.test(_.trim(msg.text))) {

          console.log(moduleName + methodName + ', got start command');

          REST = convScript.onMessageStart(msg, useLang);

          sendREST = true;

        }

        /**
         * Set language
         */

        // else if (/\/lang/i.test(_.trim(msg.text))) {
        //
        //   /**
        //    * lang command
        //    */
        //
        //   let result = _.trim(msg.text).match(/\/lang(=|\s?)(en|ru)/i);
        //
        //   console.log(moduleName + methodName + ', check /lang, result:');
        //   console.dir(result);
        //
        //   if (result) {
        //     // t.setLang(result[2]);
        //
        //     useLang = result[2];
        //
        //     REST.route = '/mg/sendsimplemessage';
        //     REST.params = {
        //       messenger: 'telegram',
        //       chatId: msg.chat.id,
        //       html: `${t.t(useLang, 'CMD_LANG')}` + `${t.t(useLang, 'CMD_LANG_' + result[2].toUpperCase())}`,
        //     };
        //
        //     sendREST = true;
        //   }
        // }

        /**
         * Help command
         */

        else if (/\/help/i.test(_.trim(msg.text))) {

          console.log(moduleName + methodName + ', got help command');

          REST = convScript.onMessageHelp(msg, useLang);

          sendREST = true;

        }

        /**
         * Reply to forced messages
         */

        else if (!_.isNil(msg.reply_to_message)
          && !_.isNil(msg.reply_to_message.text)) {

          switch (msg.reply_to_message.text) {

            /**
             * case 'Reply with your Instagram account'
             */

            case t.t(useLang, 'NEW_SUBS_INST_01'):

              console.log(moduleName + methodName + ', got reply with Instagram account');

              sails.log.info(moduleName + methodName + ', got reply with Instagram account', msg);

              (async () => {

                let clientExistsResult = await sails.helpers.general.clientExists({chatId: msg.chat.id});

                if (!_.isNil(clientExistsResult.status) && clientExistsResult.status == 'ok') {
                  sails.log.warn('!!!!!!!!!!!!!! clientExistsResult.data: ', clientExistsResult.data);

                  let clientUpdateResult = await storageGatewayServices.clientUpdate({id: clientExistsResult.data.id}, {inst_profile: msg.text, profile_provided: true});

                  sails.log.warn('!!!!!!!!!!!!!!!! clientUpdateResult: ', clientUpdateResult);

                  if (!_.isNil(clientUpdateResult.code) && clientUpdateResult.code == 200) {

                    sails.log.warn('111111111111111111111111111111111111111');
                    REST = convScript.onMessageNewInstagramAccount(msg, useLang);
                    sendREST = true;

                    result = await sails.helpers.general.sendRest('POST', REST.route, REST.params);

                    console.log('REST request and result:');
                    console.log('Request:');
                    console.dir(REST);
                    console.log('Response:');
                    console.dir(result);
                  }

                }

              })();
              break;

            case t.t(useLang, 'POST_UPLOAD'):

              /**
               * case 'Place your Instagram post'
               */

              REST = convScript.onMessageNewInstagramPost(msg, useLang);

              console.log('<<<<<<< REST:');
              console.dir(REST);

              if (!REST) {
                sendREST = false;
              } else {
                sendREST = true;
              }



              break;
            default:

              console.log(moduleName + methodName + ', got wrong forced message');

              REST = convScript.onMessageHelp(msg, useLang);

              sendREST = true;

          }

        }

        else {

          /**
           * Generic message
           */

          console.log(moduleName + methodName + ', got general message');

          REST = convScript.onMessageHelp(msg, useLang);

          sendREST = true;

        }

        if (sendREST) {

          let ttt = 'sendRest';

          // result = await sails.helpers.general.sendRest('POST', REST.route, REST.params);
          result = await sails.helpers.general[ttt]('POST', REST.route, REST.params);

          console.log('REST request and result:');
          console.log('Request:');
          console.dir(REST);
          console.log('Response:');
          console.dir(result);

        }

      } catch (err) {
        console.log(moduleName + methodName + ', Error:');
        // console.log('statusCode: ' + err.statusCode);
        console.log('message: ' + err.message);
        sails.log.warn(err.raw);
        // console.log('error: ');
        // console.dir(err.error);
        // console.log('options: ');
        // console.dir(err.options);
      }

    })();

  })
} // onMessage
