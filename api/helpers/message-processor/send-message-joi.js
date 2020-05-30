"use strict";

const Joi = require('@hapi/joi');

// const parseMessageStyle = require('../../services/ParseMessageStyle').parseMessageStyle;
// const mapDeep = require('../../services/MapDeep').mapDeep;

const moduleName = 'message-processor:send-message-joi';


module.exports = {


  friendlyName: 'message-processor:send-message-joi',


  description: 'Send message',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
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

    const schema = Joi
      .object({
        client: Joi
          .any()
          .required(),
        messageData: Joi
          .any()
          .required(),
        additionalTokens: Joi
          .any(),
        additionalParams: Joi
          .any(),
        blockModifyHelperParams: Joi
          .any(),
        beforeHelperParams: Joi
          .any(),
        afterHelperParams: Joi
          .any(),
        disableWebPagePreview: Joi
          .boolean()
          .description('flag to disable web page preview at message'),
    });

    let sendMessageResult = null;
    let messageData = null;

    try {

      const input = await schema.validateAsync(inputs.params);

      messageData = input.messageData;

      const disableWebPagePreview = input.disableWebPagePreview || false;

      /**
       * Call blockModifyHelper to update block if needed
       */

      if (input.blockModifyHelperParams != null) {

        const performBlockModifyHelperJoiParams = {
          client: input.client,
          messageData,
          additionalParams: input.blockModifyHelperParams,
        };

        messageData = await sails.helpers.messageProcessor.performBlockModifyHelperJoi(performBlockModifyHelperJoiParams);

      }

      switch (messageData.actionType) {

        case 'text':

          /**
           * Send simple text message
           */

          const htmlSimple = MessageProcessor.parseMessageStyle({
            client: input.client,
            message: messageData.message,
            additionalTokens: input.additionalTokens,
          });

          /**
           * Call beforeHelper to update block if needed
           */

            // put "beforeHelper" call here...



          const simpleRes = await sails.helpers.mgw[input.client.messenger]['simpleMessageJoi']({
            chatId: input.client.chat_id,
            html: htmlSimple,
            disableWebPagePreview,
          });

          sendMessageResult = simpleRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: simpleRes.payload.message_id || 0,
            message: htmlSimple,
            message_format: sails.config.custom.enums.messageFormat.PUSHSIMPLE,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid
          });

          break;

        case 'img':

          /**
           * Send img message
           */

          const htmlImg = MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const imgRes = await sails.helpers.mgw[input.client.messenger]['imgMessageJoi']({
            chatId: input.client.chat_id,
            imgPath: sails.config.custom.cloudinaryImgUrl + input.messageData.message.img,
            html: htmlImg,
          });

          sendMessageResult = imgRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: imgRes.payload.message_id || 0,
            message: JSON.stringify({
              img: sails.config.custom.cloudinaryImgUrl + input.messageData.message.img,
              html: htmlImg,
            }),
            message_format: sails.config.custom.enums.messageFormat.PUSHIMG,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid
          });

          break;

        case 'video':

          /**
           * Send video message
           */

          const htmlVideo = MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const videoRes = await sails.helpers.mgw[input.client.messenger]['videoMessageJoi']({
            chatId: input.client.chat_id,
            videoPath: sails.config.custom.cloudinaryVideoUrl + input.messageData.message.video,
            html: htmlVideo,
          });

          sendMessageResult = videoRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: videoRes.payload.message_id || 0,
            message: JSON.stringify({
              video: sails.config.custom.cloudinaryVideoUrl + input.messageData.message.video,
              html: htmlVideo,
            }),
            message_format: sails.config.custom.enums.messageFormat.PUSHVIDEO,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid
          });

          break;

        case 'doc':

          /**
           * Send document message
           */

          let htmlDoc = MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          let docRes = await sails.helpers.mgw[input.client.messenger]['docMessageJoi']({
            chatId: input.client.chat_id,
            docPath: sails.config.custom.cloudinaryDocUrl + input.messageData.message.doc,
            html: htmlDoc,
          });

          sendMessageResult = docRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: docRes.payload.message_id || 0,
            message: JSON.stringify({
              doc: sails.config.custom.cloudinaryDocUrl + input.messageData.message.doc,
              html: htmlDoc,
            }),
            message_format: sails.config.custom.enums.messageFormat.DOC,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid
          });

          break;

        case 'forced':

          /**
           * Send forced reply message
           */

          const htmlForced = MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const forcedRes = await sails.helpers.mgw[input.client.messenger]['forcedMessageJoi']({
            chatId: input.client.chat_id,
            html: htmlForced,
          });

          sendMessageResult = forcedRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: forcedRes.payload.message_id || 0,
            message: htmlForced,
            message_format: sails.config.custom.enums.messageFormat.PUSHFORCED,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid
          });

          break;

        case 'inline_keyboard':

          /**
           * Send inline keyboard message
           */

          const htmlInline = MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const inlineKeyboard = MessageProcessor.mapDeep({
            client: input.client,
            data: input.messageData.message.inline_keyboard,
            additionalTokens: input.additionalTokens,
          });

          const inlineRes = await sails.helpers.mgw[input.client.messenger]['inlineKeyboardMessageJoi']({
            chatId: input.client.chat_id,
            html: htmlInline,
            inlineKeyboard: inlineKeyboard,
            disableWebPagePreview,
          });

          sendMessageResult = inlineRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: inlineRes.payload.message_id || 0,
            message: htmlInline,
            message_format: sails.config.custom.enums.messageFormat.PUSHCALLBACK,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid,
            message_buttons: inlineKeyboard,
          });

          break;

        case 'edit_message_text':

          /**
           * Edit message text
           */

          const htmlEditMessageText = MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });


          const editMessageTextRes = await sails.helpers.mgw[input.client.messenger]['editMessageTextJoi']({
            html: htmlEditMessageText,
            optionalParams: input.additionalParams,
          });

          if (
            _.isArray(input.messageData.message.inline_keyboard)
            && input.messageData.message.inline_keyboard.length > 0
          ) {

            const editMessageInlineKeyboard = MessageProcessor.mapDeep({
              client: input.client,
              data: input.messageData.message.inline_keyboard,
              additionalTokens: input.additionalTokens,
            });

            const editMessageReplyMarkupRes = await sails.helpers.mgw[input.client.messenger]['editMessageReplyMarkupJoi']({
              replyMarkup: {
                inline_keyboard: editMessageInlineKeyboard
              },
              optionalParams: input.additionalParams,
            });

          }


          sendMessageResult = editMessageTextRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: editMessageTextRes.payload.message_id || 0,
            message: htmlEditMessageText,
            message_format: sails.config.custom.enums.messageFormat.PUSHCALLBACK,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid,
          });

          break;


      }

      /**
       * Call afterHelper to update block if needed
       */

      // put "afterHelper" call here...



      return exits.success(sendMessageResult);

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};

// function parseMessageStyle(params) {
//
//   const schema = Joi.object({
//     client: Joi.any().required(),
//     message: Joi.any().required(),
//     additionalTokens: Joi.any(),
//   });
//
//   const inputRaw = schema.validate(params);
//   const input = inputRaw.value;
//
//   let resultHtml = '';
//
//   for (let i = 0; i < input.message.html.length; i++) {
//     resultHtml = resultHtml +
//       (/b/i.test(input.message.html[i].style) ? '<b>' : '') +
//       (/i/i.test(input.message.html[i].style) ? '<i>' : '') +
//       (/url/i.test(input.message.html[i].style) ? `<a href="${input.message.html[i].url}">` : '') +
//       t(input.client.lang, input.message.html[i].text) +
//       (/i/i.test(input.message.html[i].style) ? '</i>' : '') +
//       (/b/i.test(input.message.html[i].style) ? '</b>' : '') +
//       (/url/i.test(input.message.html[i].style) ? '</a>' : '') +
//       (input.message.html.length > 1
//         ? (input.message.html[i].cr
//           ? sails.config.custom[input.message.html[i].cr]
//           : '')
//         : '');
//   }
//
//   resultHtml = parseSpecialTokens({
//     client: input.client,
//     message: resultHtml,
//     additionalTokens: input.additionalTokens,
//   });
//
//   return resultHtml;
//
// }

// function parseSpecialTokens(params) {
//
//   const schema = Joi.object({
//     client: Joi
//       .any()
//       .required(),
//     message: Joi
//       .string()
//       .required(),
//     additionalTokens: Joi
//       .any(),
//   });
//
//   const inputRaw = schema.validate(params);
//   const input = inputRaw.value;
//
//   let resultStr = input.message;
//
//   const firstName = input.client.first_name || '';
//   const lastName = input.client.last_name || '';
//
//   const configPricePlatinum = confObj(input.client.lang).price.platinum;
//   const configPriceGold = confObj(input.client.lang).price.gold;
//   const configPriceBronze = confObj(input.client.lang).price.bronze;
//
//   let mandatoryProfileList = '';
//
//   for (let i = 0; i < confObj(input.client.lang).profiles.length; i++) {
//
//     mandatoryProfileList = mandatoryProfileList + `<a href="${confObj(input.client.lang).profiles[i].url}">${confObj(input.client.lang).profiles[i].text}</a>` + sails.config.custom.SCR;
//
//   }
//
//   mandatoryProfileList = mandatoryProfileList + sails.config.custom.DCR;
//
//
//   resultStr = _.replace(resultStr, '$FirstName$', firstName);
//   resultStr = _.replace(resultStr, '$LastName$', lastName);
//
//   resultStr = _.replace(resultStr, '$PricePlatinum$', `${configPricePlatinum.text}: ${configPricePlatinum.value_text} ${configPricePlatinum.currency_text}/${configPricePlatinum.period_text}`);
//   resultStr = _.replace(resultStr, '$PriceGold$', `${configPriceGold.text}: ${configPriceGold.value_text} ${configPriceGold.currency_text}/${configPriceGold.period_text}`);
//   resultStr = _.replace(resultStr, '$PriceBronze$', `${configPriceBronze.text}: ${configPriceBronze.value_text} ${configPriceBronze.currency_text}/${configPriceBronze.period_text}`);
//
//   resultStr = _.replace(resultStr, '$NamePlatinum$', `${configPricePlatinum.text}`);
//   resultStr = _.replace(resultStr, '$NameGold$', `${configPriceGold.text}`);
//   resultStr = _.replace(resultStr, '$NameBronze$', `${configPriceBronze.text}`);
//
//   resultStr = _.replace(resultStr, '$MandatoryProfiles$', mandatoryProfileList);
//
//   const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
//   const profileOfCurrentAccount = currentAccount.inst_profile;
//   resultStr = _.replace(resultStr, '$CurrentAccount$', profileOfCurrentAccount);
//
//   /**
//    * Кол-во сообщений, отправленных с текущего аккаунта за сутки
//    */
//
//   const numberOfMessagesSentToday = currentAccount.posts_made_day;
//   resultStr = _.replace(resultStr, '$PostsSent$', numberOfMessagesSentToday);
//
//   if (input.additionalTokens != null) {
//
//     _.forEach(input.additionalTokens, (elem) => {
//
//       resultStr = _.replace(resultStr, elem.token, elem.value);
//
//     });
//
//   }
//
//   resultStr = emoji.emojify(resultStr, () => '');
//
//   return resultStr;
//
// }

// function mapDeep(params) {
//
//   const schema = Joi.object({
//     client: Joi
//       .any()
//       .required(),
//     data: Joi
//       .any()
//       .required(),
//     additionalTokens: Joi
//       .any(),
//   });
//
//   const inputRaw = schema.validate(params);
//   const input = inputRaw.value;
//
//   if (_.isArray(input.data)) {
//     const arr = input.data.map((innerObj) => mapDeep({
//       client: input.client,
//       data: innerObj,
//       additionalTokens: input.additionalTokens,
//     }));
//
//     return arr;
//
//   } else if (_.isObject(input.data)) {
//     let ob = _.forEach(input.data, (val, key, o) => {
//       if (key === 'text' || key === 'url') {
//         o[key] = parseSpecialTokens({
//           client: input.client,
//           message: t(input.client.lang, val),
//           additionalTokens: input.additionalTokens,
//         });
//       }
//     });
//
//     return ob;
//
//   }
//
// }