/**
 * CoreModuleController
 *
 * @description :: Server-side logic for managing coremodules
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const generalServices = require('../services/general');
const storageGatewayServices = require('../services/storageGateway');

const clientCodes = generalServices.clientCodes();
const restLinks = generalServices.RESTLinks();
const generalLinks = generalServices.generalLinks();

const _ = require('lodash');

const t = require('../services/translate');

const moduleName = 'CoreModuleController:: ';

const PromiseBB = require('bluebird');

let lang = 'en';

let passResult;

"use strict";


module.exports = {

  proceedStartCommand: function (req, res) {
    const methodName = 'proceedStartCommand';
    let client;
    let html;
    let message01Params;
    let message02Params;
    let message03Params;
    let clientRec;
    let message01Rec;
    let message02Rec;
    let message03Rec;
    let clientRecId;

    console.log(moduleName + methodName + ', req.url:');
    console.dir(req.url);

    let params = req.allParams();

    console.log(moduleName + methodName + ', params:');
    console.dir(params);

    lang = params.lang;



    // console.log('Check if the client already exists: ' + new Date());
    // console.log('params:');
    // console.dir(params);

    /**
     * Check if this client already exists
     */

    (async () => {

      try {

        client = await checkClient(params);

        await proceedClient(client, params);

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

    res.json(200);
  }, // proceedStartCommand

  proceedHelpCommand: function (req, res) {
    const methodName = 'proceedHelpCommand';
    let client;
    let html;
    let messageParams;

    console.log(moduleName + methodName + ', req.url:');
    console.dir(req.url);

    let params = req.allParams();

    console.log(moduleName + methodName + ', params:');
    console.dir(params);

    lang = params.lang;

    (async () => {

      try {

        /**
         * Check of the client already exists
         */

        client = await checkClient(params);
        // client = await checkClient(false);

        await proceedClientHelpCommand(client, params);



      } catch (err) {
        console.log(moduleName + methodName + ', Error:');
        console.log('statusCode: ' + err.statusCode);
        console.log('message: ' + err.message);
        console.log('error: ');
        console.dir(err.error);
        console.log('options: ');
        console.dir(err.options);
      }

    })();

    res.json(200);
  }, // proceedHelpCommand

};


/**
 * Functions
 */

function checkClient(checkClientParams) {

  const methodName = 'checkClient';
  console.log(moduleName + methodName + ', checkClientParams:');
  console.dir(checkClientParams);

  return generalServices.clientExists(checkClientParams);
} // checkClient

function sendInlineButtons(params) {
    return generalServices.sendREST('POST', restLinks.mgSendInlineButtons, params);
} // sentInlineButtons

function sendSimpleMessage(params) {
    return generalServices.sendREST('POST', restLinks.mgSendSimpleMessage, params);
} // sentInlineButtons

function sendForcedMessage(params) {
    return generalServices.sendREST('POST', restLinks.mgSendForcedMessage, params);
} // sentInlineButtons

function proceedClient(client, params) {

  return new PromiseBB((resolve, reject) => {

    const methodName = 'proceedClient';

    if (!client) {

      /**
       * Proceed with new client
       */

      console.log(moduleName + methodName + ', client does not exists, params:');
      console.dir(params);

      // todo: check special subscription groups and

      (async () => {

        try {

          let clientRec = {
            guid: params.guid,
            first_name: params.firstName,
            last_name: params.lastName,
            chat_id: params.chatId,
            username: params.userName,
            // ref_key: params.ref,
            messenger: params.messenger,
            lang: params.lang,
          };

          let refData = await storageGatewayServices.getRef(params.ref);

          console.log(moduleName + methodName + ', refData:');
          console.dir(refData);

          if (refData && refData.service) {
            let serviceData = await storageGatewayServices.getService(refData.service);

            console.log(moduleName + methodName + ', serviceData:');
            console.dir(serviceData);

            if (serviceData && serviceData.id) {
              clientRec.service = serviceData.id;
            }

            // todo: check what is the service and fill in fields in client
            // record respectively

          } else {
            // todo: make for the case of generic service

            let serviceData = await storageGatewayServices.getService('generic');

            console.log(moduleName + methodName + ', serviceData:');
            console.dir(serviceData);

            if (serviceData && serviceData.id) {
              clientRec.service = serviceData.id;
            }
          }

          if (refData && refData.key) {
            clientRec.ref_key = refData.key;
            clientRec.is_ref = true;
          }

          await saveNewClient(clientRec);

          let saveNewClientRecord = await checkClient({chatId: clientRec.chat_id});

          // todo: make else case for below
          if (saveNewClientRecord && saveNewClientRecord.code == 200) {
            saveNewClientRecord = saveNewClientRecord.data;
          }

          console.log(moduleName + methodName + ', saveNewClientRecord:');
          console.dir(saveNewClientRecord);

          let clientStatus = await getClientStatus(saveNewClientRecord);

          let saveMessageRecord = await storageGatewayServices.messageCreate({
            message: params.text,
            message_format: 'command',
            messenger: saveNewClientRecord.messenger,
            message_originator: 'client',
            owner: saveNewClientRecord.id,
          });

          if (saveMessageRecord && saveMessageRecord.code == 200) {
            resolve();
          } else {
            console.error(moduleName + methodName + ', messageCreate error');
            console.dir(saveMessageRecord);
            reject(new Error('messageCreate error'));
          }


          await proceedClientStatus(clientStatus, saveNewClientRecord);

          resolve();

        } catch (err) {
          console.log(moduleName + methodName + ', Error:');
          // console.log('statusCode: ' + err.statusCode);
          console.log('message: ' + err.message);
          // console.log('error: ');
          // console.dir(err.error);
          // console.log('options: ');
          // console.dir(err.options);

          // reject({
          //   err_location: moduleName + methodName,
          //   // err_statusCode: err.statusCode,
          //   err_message: err.message,
          //   // err_options: err.options,
          // });

          reject(err);
        }

      })();
    } else if (client && client.code == 200) {

      /**
       * Proceed with existing client
       */

      client = client.data;

      console.log(moduleName + methodName + ', client do exists, client:');
      console.dir(client);

      (async () => {

        try {

          let saveMessageRecord = await storageGatewayServices.messageCreate({
            message: params.text,
            message_format: 'command',
            messenger: client.messenger,
            message_originator: 'client',
            owner: client.id,
          });

          if (saveMessageRecord && saveMessageRecord.code == 200) {
            resolve();
          } else {
            console.error(moduleName + methodName + ', messageCreate error');
            console.dir(saveMessageRecord);
            reject(new Error('messageCreate error'));
          }


          let clientStatus = await getClientStatus(client);

          await proceedClientStatus(clientStatus, client);


          // if (!checkProfileProvided()) {
          //   let existingClientNoProfileSendMessage01Record = await existingClientNoProfileSendMessage01(client);
          // } else if (checkDeleted()) {
          //
          // } else if (checkBanned()) {
          //
          // } else if (!checkPaymentPlanSelected()) {
          //   let existingClientNoPaymentPlanSendMessage01Record = await existingClientNoPaymentPlanSendMessage01(client);
          // } else if (!checkPaymentMade()) {
          //   let existingClientNoPaymentMadeSendMessage01Record = await existingClientNoPaymentMadeSendMessage01(client);
          // } else if (!checkSubscriptionMade()) {
          //   let existingClientNoSubscriptionMadeSendMessage01Record = await existingClientNoSubscriptionMadeSendMessage01(client);
          // } else if (!checkSubscriptionFinalized()) {
          //   let existingClientNoSubscriptionFinalizedSendMessage01Record = await existingClientNoSubscriptionFinalizedSendMessage01(client);
          // } else if (!checkSubscriptionPeriodValid()) {
          //   let existingClientProlongSubscriptionSendMessage01Record = await existingClientProlongSubscriptionSendMessage01(client);
          // } else {
          //   let existingClientSendMessage01Record = await existingClientValidSubscriptionSendMessage01(client);
          // }

          resolve();

        } catch (err) {
          console.log(moduleName + methodName + ', Error:');
          // console.log('statusCode: ' + err.statusCode);
          console.log('message: ' + err.message);
          // console.log('error: ');
          // console.dir(err.error);
          // console.log('options: ');
          // console.dir(err.options);

          // reject({
          //   err_location: moduleName + methodName,
          //   // err_statusCode: err.statusCode,
          //   err_message: err.message,
          //   // err_options: err.options,
          // });

          reject(err);
        }
      })();
    }
  });
} // proceedClient

function proceedClientHelpCommand(client, params) {
  return new PromiseBB((resolve, reject) => {

    const methodName = 'proceedClientHelpCommand';

    console.log(moduleName + methodName + ', client:');
    console.dir(client);
    console.log(moduleName + methodName + ', params:');
    console.dir(params);

    if (!client) {

      (async () => {

        try {

          let html = `${t.t(lang, 'NEW_SUBS_ERROR_COMMAND')}`;

          let messageParams = {
            messenger: params.messenger,
            chatId: params.chatId,
            html: html,
          };

          await sendForcedMessage(messageParams);

          resolve({
            code: clientCodes.wrongCommand.code,
            data: {
              code: clientCodes.wrongCommand.ext_code,
              text: clientCodes.wrongCommand.text,
            },
          });

        } catch (err) {
          console.log(moduleName + methodName + ', Catch block, Error:');
          console.log('statusCode: ' + err.statusCode);
          console.log('message: ' + err.message);
          console.log('error: ');
          console.dir(err.error);
          console.log('options: ');
          console.dir(err.options);
        }
      })();



    } else if (client && client.code == 200) {

      /**
       * client do exists in our database
       * and we need to send help info
       * if he got confirmation of his subscription
       * to list of profiles
       */

      client = client.data;

      (async () => {

        try {

          let html = `${t.t(lang, 'MSG_HELP')}`;

          let inline_keyboard_star = [
            [
              {
                text: t.t(lang, 'ACT_NEW_POST'),
                callback_data: 'upload_post'
              },
            ],
            [
              {
                text: t.t(lang, 'ACT_FAQ'),
                url: generalLinks.faq,
              },
              {
                text: t.t(lang, 'ACT_WEB'),
                url: generalLinks.web,
              },
            ],
          ];

          let inline_keyboard_friend = [
            [
              {
                text: t.t(lang, 'ACT_NEW_POST'),
                callback_data: 'upload_post'
              },
            ],
            [
              {
                text: t.t(lang, 'ACT_FAQ'),
                url: generalLinks.faq,
              },
              {
                text: t.t(lang, 'ACT_WEB'),
                url: generalLinks.web,
              },
            ],
          ];

          let inline_keyboard_general = [
            [
              {
                text: t.t(lang, 'ACT_NEW_POST'),
                callback_data: 'upload_post'
              },
            ],
            [
              {
                text: t.t(lang, 'ACT_PAY'),
                callback_data: 'make_next_payment',
              },
            ],
            [
              {
                text: t.t(lang, 'ACT_FAQ'),
                url: generalLinks.faq,
              },
              {
                text: t.t(lang, 'ACT_WEB'),
                url: generalLinks.web,
              },
            ],
          ];

          let use_inline_keyboard;

          if (client.service.name == 'star') {
            use_inline_keyboard = inline_keyboard_star;
          } else if (/^friend_/.test(_.trim(client.service.name))) {
            use_inline_keyboard = inline_keyboard_friend;
          } else {
            use_inline_keyboard = inline_keyboard_general;
          }



          await sendInlineButtons({
            messenger: params.messenger,
            chatId: params.chatId,
            html: html,
            inline_keyboard: use_inline_keyboard,
          });

          let saveMessageRecord = await storageGatewayServices.messageCreate({
            guid: client.guid,
            message: html,
            message_format: 'inline_keyboard',
            message_buttons: JSON.stringify(use_inline_keyboard),
            messenger: params.messenger,
            message_originator: 'bot',
            owner: client.id,
          });

          if (saveMessageRecord && saveMessageRecord.code == 200) {
            resolve();
          } else {
            console.error(moduleName + methodName + ', messageCreate error');
            console.dir(saveMessageRecord);
            reject(new Error('messageCreate error'));
          }


          resolve({
            code: clientCodes.existingClient.code,
            data: {
              code: clientCodes.existingClient.ext_code,
              text: clientCodes.existingClient.text,
            },
          });

        } catch (err) {
          console.error(moduleName + methodName + ', Catch block, Error:');
          console.error('statusCode: ' + err.statusCode);
          console.error('message: ' + err.message);
          console.error('error: ');
          console.dir(err.error);
          console.error('options: ');
          console.dir(err.options);

          reject(err);
        }
      })();

    } else {

      resolve({
        code: clientCodes.noClient.code,
        data: {
          code: clientCodes.noClient.ext_code,
          text: clientCodes.noClient.text,
        },
      });

    };
  });
} // proceedClientHelpCommand

function saveNewClient(rec) {

  const methodName = 'saveNewClient';


  return new PromiseBB((resolve, reject) => {

    // Client.create(rec).exec((err, record) => {
    //
    //   if (err) {
    //     reject(err);
    //   }
    //
    //   if (record) {
    //     resolve(record.toObject());
    //   }
    // });

    (async () => {

      try {

        let createdClientRecord = await storageGatewayServices.clientCreate(rec);

        if (createdClientRecord && createdClientRecord.code == 200) {
          resolve();
        } else {
          sails.log.error(moduleName + methodName + ', clientCreate error:', createdClientRecord);
          reject(new Error(moduleName + methodName + ', clientCreate error:', createdClientRecord));
        }

      } catch (err) {
        console.log(moduleName + methodName + ', Catch block, Error:');
        // console.log('statusCode: ' + err.statusCode);
        console.log('message: ' + err.message);
        // console.log('error: ');
        // console.dir(err.error);
        // console.log('options: ');
        // console.dir(err.options);

        reject(err);
      }
    })();

  });
} // saveNewClient

function newClientSendMessage01(params) {

  const methodName = 'newClientSendMessage01';

  console.log('sendMessage01, params:');
  console.dir(params);


  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let html = `
<b>${t.t(lang, 'NEW_SUBS_WELCOME_01')}, ${params.first_name + ' ' + params.last_name}</b>

<b>${t.t(lang, 'NEW_SUBS_WELCOME_02')}</b>

${t.t(lang, 'NEW_SUBS_WELCOME_03')} 
`;

        let sendSimpleMessageResult = await sendSimpleMessage({
          messenger: params.messenger,
          chatId: params.chat_id,
          html: html,
        });

        if (!_.isNil(sendSimpleMessageResult.status)
          && sendSimpleMessageResult.status == 'ok') {

          sails.log.info('sendSimpleMessageResult.status is ok: ', sendSimpleMessageResult);

          // update the flag that the Message01 was shown

          let clientUpdateResult = await storageGatewayServices.clientUpdate({id: params.id}, {start_msg_01_shown: true});

          if (_.isNil(clientUpdateResult.code) || clientUpdateResult.code != 200) {
            sails.log.error(moduleName + methodName + ', clientUpdate (start_msg_01_shown) error:', clientUpdateResult);
            reject(new Error(moduleName + methodName + ', clientUpdate (start_msg_01_shown) error:', clientUpdateResult));
          }

          // save message to DB

          let saveMessageRecord = await storageGatewayServices.messageCreate({
            message: html,
            message_format: 'simple',
            messenger: params.messenger,
            message_originator: 'bot',
            owner: params.id,
          });

          if (saveMessageRecord && saveMessageRecord.code == 200) {
            resolve();
          } else {
            console.error(moduleName + methodName + ', messageCreate error');
            console.dir(saveMessageRecord);
            reject(new Error('messageCreate error'));
          }

        } else {

          sails.log.error('sendSimpleMessageResult.status is NOT ok: ', sendSimpleMessageResult);
          // reject(new Error({statusCode: 123, message: 'sendSimpleMessage error'}));
          reject(new Error(moduleName + methodName + 'sendSimpleMessageResult.status is NOT ok'));
        }


      } catch (err) {
        console.log(moduleName + methodName + ', Catch block, Error:');
        // console.log('statusCode: ' + err.statusCode);
        console.log('message: ' + err.message);
        // console.log('error: ');
        // console.dir(err.error);
        // console.log('options: ');
        // console.dir(err.options);

        reject(err);
      }
    })();
  });

} // newClientSendMessage01

function newClientSendMessage02(params) {

  const methodName = 'newClientSendMessage02';

  console.log('sendMessage02, params:');
  console.dir(params);

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let html = `
${t.t(lang, 'NEW_SUBS_INST_01')} 
`;

        let sendForcedMessageResult = await sendForcedMessage({
          messenger: params.messenger,
          chatId: params.chat_id,
          html: html,
        });

        if (!_.isNil(sendForcedMessageResult.status)
        && sendForcedMessageResult.status == 'ok') {

          sails.log.info('sendForcedMessageResult.status is ok: ', sendForcedMessageResult.status);

          // update the flag that the Message02 was shown

          let clientUpdateResult = await storageGatewayServices.clientUpdate({id: params.id}, {start_msg_02_shown: true});

          if (_.isNil(clientUpdateResult.code) || clientUpdateResult.code != 200) {
            sails.log.error(moduleName + methodName + ', clientUpdate (start_msg_02_shown) error:', clientUpdateResult);
            reject(new Error(moduleName + methodName + ', clientUpdate (start_msg_02_shown) error:', clientUpdateResult));
          }

          // save message

          let saveMessageRecord = await storageGatewayServices.messageCreate({
            message: html,
            message_format: 'forced',
            messenger: params.messenger,
            message_originator: 'bot',
            owner: params.id,
          });

          if (saveMessageRecord && saveMessageRecord.code == 200) {
            resolve();
          } else {
            console.error(moduleName + methodName + ', messageCreate error');
            console.dir(saveMessageRecord);
            reject(new Error('messageCreate error'));
          }

        } else {

          sails.log.error('sendForcedMessageResult.status is NOT ok: ', sendForcedMessageResult.status);

          reject(new Error(moduleName + methodName + 'sendForcedMessageResult.status is NOT okr'));
        }


      } catch (err) {
        console.error(moduleName + methodName + ', Catch block, Error:');
        console.log('statusCode: ' + err.statusCode);
        console.log('message: ' + err.message);
        console.log('error: ');
        console.dir(err.error);
        console.log('options: ');
        console.dir(err.options);

        reject(err);
      }
    })();

  });

} // newClientSendMessage02

function existingClientValidSubscriptionSendMessage01(params) {

  const methodName = 'existingClientValidSubscriptionSendMessage01';

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let html = `
<b>${t.t(lang, 'NEW_SUBS_EXISTS_01')}</b>

${t.t(lang, 'NEW_SUBS_EXISTS_02')}
`;

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: html,
          inline_keyboard: [
            [
              {
                text: t.t(lang, 'POST_UPLOAD_BUTTON'),
                callback_data: 'upload_post'
              },
            ],
          ],
        };

        sendInlineButtons(messageParams);

        let saveMessageRecord = await storageGatewayServices.messageCreate({
          message: messageParams.html,
          message_format: 'inline_keyboard',
          message_buttons: JSON.stringify(messageParams.inline_keyboard),
          messenger: params.messenger,
          message_originator: 'bot',
          owner: params.id,
        });

        if (saveMessageRecord && saveMessageRecord.code == 200) {
          resolve();
        } else {
          console.error(moduleName + methodName + ', messageCreate error');
          console.dir(saveMessageRecord);
          reject(new Error('messageCreate error'));
        }

      } catch (err) {
        console.error(moduleName + methodName + ', Catch block, Error:');
        console.error('statusCode: ' + err.statusCode);
        console.error('message: ' + err.message);
        console.error('error: ');
        console.dir(err.error);
        console.error('options: ');
        console.dir(err.options);

        reject(err);
      }
    })();

  });

} // existingClientValidSubscriptionSendMessage01

function existingClientProlongSubscriptionSendMessage01(params) {

  const methodName = 'existingClientProlongSubscriptionSendMessage01';

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let html = `
<b>${t.t(lang, 'NEW_SUBS_EXISTS_01')}</b>

${t.t(lang, 'NEW_SUBS_EXISTS_03')}
`;

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: html,
          inline_keyboard: [
            [
              {
                text: t.t(lang, 'ACT_PAY'),
                callback_data: 'make_next_payment'
              },
            ],
          ],
        };

        sendInlineButtons();

        let saveMessageRecord = await storageGatewayServices.messageCreate({
          message: messageParams.html,
          message_format: 'inline_keyboard',
          message_buttons: JSON.stringify(messageParams.inline_keyboard),
          messenger: params.messenger,
          message_originator: 'bot',
          owner: params.id,
        });

        if (saveMessageRecord && saveMessageRecord.code == 200) {
          resolve();
        } else {
          console.error(moduleName + methodName + ', messageCreate error');
          console.dir(saveMessageRecord);
          reject(new Error('messageCreate error'));
        }

      } catch (err) {
        console.error(moduleName + methodName + ', Catch block, Error:');
        console.error('statusCode: ' + err.statusCode);
        console.error('message: ' + err.message);
        console.error('error: ');
        console.dir(err.error);
        console.error('options: ');
        console.dir(err.options);

        reject(err);
      }
    })();
  });

} // existingClientProlongSubscriptionSendMessage01

function getClientStatus(client) {

  let methodName = 'getClientStatus';

  return new PromiseBB((resolve, reject) => {

    // console.log(moduleName + methodName);

    resolve({
      deletedFlag: client.deleted,
      bannedFlag: client.banned,
      noStartMsg01ShownFlag: !client.start_msg_01_shown,
      noStartMsg02ShownFlag: !client.start_msg_02_shown,
      noProfileProvidedFlag: !client.profile_provided,
      noProfileConfirmedFlag: !client.profile_confirmed,
      noPaymentPlanSelectedFlag: !client.payment_plan_selected,
      noPaymentFlag: !client.payment_made,
      noSubscriptionFlag: !client.subscription_made,
      noSubscriptionFinalizedFlag: !client.service_subscription_finalized,
      profileFlag: !!client.service.check_profile,
      paymentFlag: !!client.service.check_payment,
      subscriptionFlag: !!client.service.check_subscription,
    });

    // console.log(new Date());
    // setTimeout(() => {
    //   console.log(moduleName + methodName);
    //   console.log(new Date());
    //   resolve('deleted');
    // }, 2000);
  });
} // getClientStatus

function proceedClientStatus(statusObj, client) {

  let methodName = 'proceedClientStatus';

  return new PromiseBB((resolve, reject) => {

    console.log(moduleName + methodName);
    console.log('statusObj:');
    console.dir(statusObj);

    let {deletedFlag, bannedFlag, noStartMsg01ShownFlag, noStartMsg02ShownFlag,
    noProfileProvidedFlag, noProfileConfirmedFlag, noPaymentPlanSelectedFlag,
    noPaymentFlag, noSubscriptionFlag, noSubscriptionFinalizedFlag,
    profileFlag, paymentFlag, subscriptionFlag} = statusObj;

    (async () => {

      try {

        if (deletedFlag) {
          // console.log('before proceedDeleted: ' + new Date());
          await proceedDeleted(client);
          // console.log('after proceedDeleted: ' + new Date());
          resolve();
        } else if (bannedFlag) {
          await proceedBanned(client);
          resolve();
        } else if (!profileFlag && !paymentFlag
          && !subscriptionFlag && noStartMsg01ShownFlag) {
          await newClientSendMessage01(client);
          await clientConfirmSubscriptionConfirmed(client);
          resolve();
        } else if (noStartMsg01ShownFlag) {
          await newClientSendMessage01(client);
          await newClientSendMessage02(client);
          resolve();
        } else if (noStartMsg02ShownFlag) {
          await newClientSendMessage02(client);
          resolve();
        } else if (profileFlag && noProfileProvidedFlag) {
          await newClientSendMessage02(client);
          resolve();
        } else if (profileFlag && noProfileConfirmedFlag) {
          await clientConfirmProfile(client);
        } else if (paymentFlag && noPaymentPlanSelectedFlag) {
          await clientSelectPaymentPlan(client);
        } else if (paymentFlag && noPaymentFlag) {
          switch (client.service.name) {
            case 'bronze':
              await clientBronzePlanSelected(client);
              break;
            case 'gold':
              await clientGoldPlanSelected(client);
              break;
            case 'platinum':
              await clientPlatinumPlanSelected(client);
              break;
            case 'generic':
              switch (client.payment_plan) {
                case 'bronze':
                  await clientBronzePlanSelected(client);
                  break;
                case 'gold':
                  await clientGoldPlanSelected(client);
                  break;
                case 'platinum':
                  await clientPlatinumPlanSelected(client);
                  break;
                default:
                  await clientSelectPaymentPlan(client);
              }
          }
        } else if (subscriptionFlag && noSubscriptionFlag) {
          await clientConfirmSubscription(client);
        } else if (subscriptionFlag && noSubscriptionFinalizedFlag) {
          await clientConfirmSubscriptionNotConfirmed(client);
        } else {
          await clientConfirmSubscriptionConfirmed(client);
        }

      } catch (err) {
        // reject({
        //   err_location: moduleName + methodName,
        //   // err_statusCode: err.statusCode,
        //   err_message: err.message,
        //   // err_options: err.options,
        // });
        reject(err);
      }
    })();
  });
} // proceedClientStatus

function proceedDeleted(params) {

  let methodName = 'proceedDeleted';

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        // console.log(moduleName + methodName);

        let html = `
<b>${t.t(lang, 'EXISTING_DELETED')}</b>
`;

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: html,
        };

        let sendSimpleMessageResult = await sendSimpleMessage(messageParams);

        if (!_.isNil(sendSimpleMessageResult.status)
          && sendSimpleMessageResult.status == 'ok') {

          resolve();

        } else {}


      } catch (err) {
        sails.log.error(moduleName + methodName + 'sendSimpleMessage error');
        reject(err);
      }

    })();

  });
} // proceedDeleted

function proceedBanned(params) {

  let methodName = 'proceedBanned';

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        // console.log(moduleName + methodName);

        let html = `
<b>${t.t(lang, 'EXISTING_BANNED')}</b>
`;

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: html,
        };

        let sendSimpleMessageResult = await sendSimpleMessage(messageParams);

        if (!_.isNil(sendSimpleMessageResult.status)
        && sendSimpleMessageResult.status == 'ok') {

          resolve();

        } else {
          reject(new Error(moduleName + methodName + 'sendSimpleMessage error'));
        }

      } catch (err) {

        sails.log.error(moduleName + methodName + 'sendSimpleMessage error: ')
        reject(err);

      }

    })();

  });
} // proceedBanned

function clientConfirmProfile(params) {

  let methodName = 'clientConfirmProfile';

  console.log(moduleName + methodName + ', params:');
  console.dir(params);

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let instUrl = 'https://www.instagram.com/' + _.trim(params.inst_profile);
        let instConfHtml = `
${t.t(lang, 'NEW_SUBS_INST_02')}
<a href="${instUrl}">${instUrl}</a>
`;

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: instConfHtml,
          inline_keyboard: [
            [
              {
                text: t.t(lang, 'ACT_YES'),
                callback_data: 'instagram_profile_yes'
              },
              {
                text: t.t(lang, 'ACT_NO'),
                callback_data: 'instagram_profile_no'
              }
            ],
          ],
        };

        var sendInlineButtonsResult = await sendInlineButtons(messageParams);

        if (!_.isNil(sendInlineButtonsResult.status)
          && sendInlineButtonsResult.status == 'ok') {

          sails.log.info('sendInlineButtonsResult.status is ok: ', sendInlineButtonsResult.status);

          // update the flag that the profile was confirmed

          let clientUpdateResult = await storageGatewayServices.clientUpdate({id: params.id}, {profile_confirmed: true});

          if (_.isNil(clientUpdateResult.code) || clientUpdateResult.code != 200) {
            sails.log.error(moduleName + methodName + ', clientUpdate (profile_confirmed) error:', clientUpdateResult);
            reject(new Error(moduleName + methodName + ', clientUpdate (profile_confirmed) error:', clientUpdateResult));
          }

          // save message

          let saveMessageRecord = await storageGatewayServices.messageCreate({
            message: messageParams.html,
            message_format: 'inline_keyboard',
            message_buttons: JSON.stringify(messageParams.inline_keyboard),
            messenger: params.messenger,
            message_originator: 'bot',
            owner: params.id,
          });

          if (saveMessageRecord && saveMessageRecord.code == 200) {
            resolve();
          } else {
            console.error(moduleName + methodName + ', messageCreate error');
            console.dir(saveMessageRecord);
            reject(new Error('messageCreate error'));
          }

        } else {

          sails.log.error('sendInlineButtonsResult.status is NOT ok: ', sendInlineButtonsResult.status);

          reject(new Error(moduleName + methodName + 'sendInlineButtonsResult.status is NOT okr'));
        }


      } catch (err) {
        sails.log.error(moduleName + methodName + ', Catch block, Error:');
        // console.error('statusCode: ' + err.statusCode);
        sails.log.error('message: ' + err.message);
        // console.error('error: ');
        // console.dir(err.error);
        // console.error('options: ');
        // console.dir(err.options);

        reject(err);
      }
    })();
  });
} // clientConfirmProfile

function clientSelectPaymentPlan(params) {

  let methodName = 'clientSelectPaymentPlan';

  console.log(moduleName + methodName + ', params:');
  console.dir(params);

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let html = `
${t.t(lang, 'NEW_SUBS_INST_05')}

${t.t(lang, 'NEW_SUBS_INST_06')}
`;

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: html,
          inline_keyboard: [
            [
              {
                text: t.t(lang, 'PLAN_PLATINUM'),
                callback_data: 'instagram_plan_platinum'
              },
            ],
            [
              {
                text: t.t(lang, 'PLAN_GOLD'),
                callback_data: 'instagram_plan_gold'
              },
            ],
            [
              {
                text: t.t(lang, 'PLAN_BRONZE'),
                callback_data: 'instagram_plan_bronze'
              },
            ],
          ],
        };

        var sendInlineButtonsResult = await sendInlineButtons(messageParams);

        if (!_.isNil(sendInlineButtonsResult.status)
          && sendInlineButtonsResult.status == 'ok') {

          sails.log.info('sendInlineButtonsResult.status is ok: ', sendInlineButtonsResult.status);

          let clientUpdateResult = await storageGatewayServices.clientUpdate({id: params.id}, {payment_plan_selected: true});

          if (_.isNil(clientUpdateResult.code) || clientUpdateResult.code != 200) {
            sails.log.error(moduleName + methodName + ', clientUpdate (payment_plan_selected) error:', clientUpdateResult);
            reject(new Error(moduleName + methodName + ', clientUpdate (payment_plan_selected) error:', clientUpdateResult));
          }

          // save message

          let saveMessageRecord = await storageGatewayServices.messageCreate({
            message: messageParams.html,
            message_format: 'inline_keyboard',
            message_buttons: JSON.stringify(messageParams.inline_keyboard),
            messenger: params.messenger,
            message_originator: 'bot',
            owner: params.id,
          });

          if (saveMessageRecord && saveMessageRecord.code == 200) {
            resolve();
          } else {
            console.error(moduleName + methodName + ', messageCreate error');
            console.dir(saveMessageRecord);
            reject(new Error('messageCreate error'));
          }

        } else {

          sails.log.error('sendInlineButtonsResult.status is NOT ok: ', sendInlineButtonsResult.status);

          reject(new Error(moduleName + methodName + 'sendInlineButtonsResult.status is NOT okr'));
        }

      } catch (err) {
        sails.log.error(moduleName + methodName + ', Catch block, Error:');
        // console.error('statusCode: ' + err.statusCode);
        sails.log.error('message: ' + err.message);
        // console.error('error: ');
        // console.dir(err.error);
        // console.error('options: ');
        // console.dir(err.options);

        reject(err);
      }
    })();



  });
} // clientSelectPaymentPlan

function clientBronzePlanSelected(params) {

  let methodName = 'clientBronzePlanSelected';

  console.log(moduleName + methodName + ', params:');
  console.dir(params);

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let html = `
${t.t(lang, 'PLAN_BRONZE_THANKS_MSG')} 

${t.t(lang, 'PLAN_THANKS_MSG')} 
`;

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: html,
          inline_keyboard: [
            [
              {
                text: t.t(lang, 'PLAN_PAY_BUTTON'),
                callback_data: 'make_payment_plan_bronze'
              },
              {
                text: t.t(lang, 'PLAN_TC_BUTTON'),
                url: 'https://policies.google.com/terms'
              },
            ],
          ],
        };

        sendInlineButtons(messageParams);

        let saveMessageRecord = await storageGatewayServices.messageCreate({
          message: messageParams.html,
          message_format: 'inline_keyboard',
          message_buttons: JSON.stringify(messageParams.inline_keyboard),
          messenger: params.messenger,
          message_originator: 'bot',
          owner: params.id,
        });

        if (saveMessageRecord && saveMessageRecord.code == 200) {
          resolve();
        } else {
          console.error(moduleName + methodName + ', messageCreate error');
          console.dir(saveMessageRecord);
          reject(new Error('messageCreate error'));
        }


      } catch (err) {
        console.error(moduleName + methodName + ', Catch block, Error:');
        console.error('statusCode: ' + err.statusCode);
        console.error('message: ' + err.message);
        console.error('error: ');
        console.dir(err.error);
        console.error('options: ');
        console.dir(err.options);

        reject(err);
      }
    })();



  });
} // clientBronzePlanSelected

function clientGoldPlanSelected(params) {

  let methodName = 'clientGoldPlanSelected';

  console.log(moduleName + methodName + ', params:');
  console.dir(params);

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let html = `
${t.t(lang, 'PLAN_GOLD_THANKS_MSG')} 

${t.t(lang, 'PLAN_THANKS_MSG')} 
`;

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: html,
          inline_keyboard: [
            [
              {
                text: t.t(lang, 'PLAN_PAY_BUTTON'),
                callback_data: 'make_payment_plan_gold'
              },
              {
                text: t.t(lang, 'PLAN_TC_BUTTON'),
                url: 'https://policies.google.com/terms'
              },
            ],
          ],
        };

        sendInlineButtons(messageParams);

        let saveMessageRecord = await storageGatewayServices.messageCreate({
          message: messageParams.html,
          message_format: 'inline_keyboard',
          message_buttons: JSON.stringify(messageParams.inline_keyboard),
          messenger: params.messenger,
          message_originator: 'bot',
          owner: params.id,
        });

        if (saveMessageRecord && saveMessageRecord.code == 200) {
          resolve();
        } else {
          console.error(moduleName + methodName + ', messageCreate error');
          console.dir(saveMessageRecord);
          reject(new Error('messageCreate error'));
        }

      } catch (err) {
        console.error(moduleName + methodName + ', Catch block, Error:');
        console.error('statusCode: ' + err.statusCode);
        console.error('message: ' + err.message);
        console.error('error: ');
        console.dir(err.error);
        console.error('options: ');
        console.dir(err.options);

        reject(err);
      }
    })();



  });
} // clientGoldPlanSelected

function clientPlatinumPlanSelected(params) {

  let methodName = 'clientPlatinumPlanSelected';

  console.log(moduleName + methodName + ', params:');
  console.dir(params);

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let html = `
${t.t(lang, 'PLAN_PLATINUM_THANKS_MSG')} 

${t.t(lang, 'PLAN_THANKS_MSG')} 
`;

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: html,
          inline_keyboard: [
            [
              {
                text: t.t(lang, 'PLAN_PAY_BUTTON'),
                callback_data: 'make_payment_plan_platinum'
              },
              {
                text: t.t(lang, 'PLAN_TC_BUTTON'),
                url: 'https://policies.google.com/terms'
              },
            ],
          ],
        };

        sendInlineButtons(messageParams);

        let saveMessageRecord = await storageGatewayServices.messageCreate({
          message: messageParams.html,
          message_format: 'inline_keyboard',
          message_buttons: JSON.stringify(messageParams.inline_keyboard),
          messenger: params.messenger,
          message_originator: 'bot',
          owner: params.id,
        });

        if (saveMessageRecord && saveMessageRecord.code == 200) {
          resolve();
        } else {
          console.error(moduleName + methodName + ', messageCreate error');
          console.dir(saveMessageRecord);
          reject(new Error('messageCreate error'));
        }

      } catch (err) {
        console.error(moduleName + methodName + ', Catch block, Error:');
        console.error('statusCode: ' + err.statusCode);
        console.error('message: ' + err.message);
        console.error('error: ');
        console.dir(err.error);
        console.error('options: ');
        console.dir(err.options);

        reject(err);
      }
    })();



  });
} // clientPlatinumPlanSelected

function clientConfirmSubscription(params) {

  let methodName = 'clientConfirmSubscription';

  console.log(moduleName + methodName + ', params:');
  console.dir(params);

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let listProfiles = '';

        _.forEach(sails.config.superProfiles, (el) => {
          let listElem = `"https://instagram.com/${el}"`;
          listProfiles = listProfiles +
            `<a href=${listElem}>${el}</a>
`;
        });

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: `
${t.t(lang, 'NEW_SUBS_INST_08')} 
${listProfiles}

${t.t(lang, 'NEW_SUBS_INST_09')} 
`,
          inline_keyboard: [
            [
              {
                text: t.t(lang, 'ACT_SUBSCRIBE'),
                callback_data: 'subscribed'
              },
            ],
          ],
        };

        sendInlineButtons(messageParams);

        let saveMessageRecord = await storageGatewayServices.messageCreate({
          message: messageParams.html,
          message_format: 'inline_keyboard',
          message_buttons: JSON.stringify(messageParams.inline_keyboard),
          messenger: params.messenger,
          message_originator: 'bot',
          owner: params.id,
        });

        if (saveMessageRecord && saveMessageRecord.code == 200) {
          resolve();
        } else {
          console.error(moduleName + methodName + ', messageCreate error');
          console.dir(saveMessageRecord);
          reject(new Error('messageCreate error'));
        }

      } catch (err) {
        console.error(moduleName + methodName + ', Catch block, Error:');
        console.error('statusCode: ' + err.statusCode);
        console.error('message: ' + err.message);
        console.error('error: ');
        console.dir(err.error);
        console.error('options: ');
        console.dir(err.options);

        reject(err);
      }
    })();



  });
} // clientConfirmSubscription

function clientConfirmSubscriptionNotConfirmed(params) {

  let methodName = 'clientConfirmSubscriptionNotConfirmed';

  console.log(moduleName + methodName + ', params:');
  console.dir(params);

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: `
${t.t(lang, 'PLAN_THANKS_MSG_02')} 
`,
        };

        let sendSimpleMessageResult = await sendSimpleMessage(messageParams);

        if (!_.isNil(sendSimpleMessageResult.status)
        && sendSimpleMessageResult.status == 'ok') {

          let saveMessageRecord = await storageGatewayServices.messageCreate({
            message: messageParams.html,
            message_format: 'simple',
            messenger: params.messenger,
            message_originator: 'bot',
            owner: params.id,
          });

          if (saveMessageRecord && saveMessageRecord.code == 200) {
            resolve();
          } else {
            console.error(moduleName + methodName + ', messageCreate error');
            console.dir(saveMessageRecord);
            reject(new Error('messageCreate error'));
          }

        } else {

          reject(new Error(moduleName + methodName +
          'sendSimpleMessageResult.status is NOT ok'));

        }

      } catch (err) {
        console.error(moduleName + methodName + ', Catch block, Error:');
        // console.error('statusCode: ' + err.statusCode);
        console.error('message: ' + err.message);
        // console.error('error: ');
        // console.dir(err.error);
        // console.error('options: ');
        // console.dir(err.options);

        reject(err);
      }
    })();
  });
} // clientConfirmSubscriptionNotConfirmed

function clientConfirmSubscriptionConfirmed(params) {

  let methodName = 'clientConfirmSubscriptionConfirmed';

  console.log(moduleName + methodName + ', params:');
  console.dir(params);

  return new PromiseBB((resolve, reject) => {

    (async () => {

      try {

        let messageParams = {
          messenger: params.messenger,
          chatId: params.chat_id,
          html: `
${t.t(lang, 'PLAN_THANKS_MSG_03')} 
`,
          inline_keyboard: [
            [
              {
                text: t.t(lang, 'POST_UPLOAD_BUTTON'),
                callback_data: 'upload_post'
              },
            ],
          ],
        };

        sendInlineButtons(messageParams);

        let saveMessageRecord = await storageGatewayServices.messageCreate({
          message: messageParams.html,
          message_format: 'inline_keyboard',
          message_buttons: JSON.stringify(messageParams.inline_keyboard),
          messenger: params.messenger,
          message_originator: 'bot',
          owner: params.id,
        });

        if (saveMessageRecord && saveMessageRecord.code == 200) {
          resolve();
        } else {
          console.error(moduleName + methodName + ', messageCreate error');
          console.dir(saveMessageRecord);
          reject(new Error('messageCreate error'));
        }

      } catch (err) {
        console.error(moduleName + methodName + ', Catch block, Error:');
        console.error('statusCode: ' + err.statusCode);
        console.error('message: ' + err.message);
        console.error('error: ');
        console.dir(err.error);
        console.error('options: ');
        console.dir(err.options);

        reject(err);
      }
    })();



  });
} // clientConfirmSubscriptionConfirmed

function fakeMethod() {

  return new PromiseBB((resolve, reject) => {

    console.log('fakeMethod: ' + new Date());
    resolve();
  });
} // fakeMethod

