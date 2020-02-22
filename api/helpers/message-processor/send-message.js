"use strict";

const moduleName = 'message-processor:send-message';


module.exports = {


  friendlyName: 'message-processor:send-message',


  description: 'Send message',


  inputs: {

    client: {
      friendlyName: 'Client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },

    messageData: {
      friendlyName: 'message data',
      description: 'message data',
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

      switch (inputs.messageData.actionType) {

        case 'text':

          /**
           * Send simple text message
           */

          let htmlSimpleRaw = parseMessageStyle(inputs.client, clientName, block.message, inputs.client.lang);

          let {text: htmlSimple} = await activateBeforeHelper(inputs.client, block, inputs.msg || null, htmlSimpleRaw);

          // sails.log.debug('htmlSimple: ', htmlSimple);

          let simpleRes = await sails.helpers.mgw[inputs.client.messenger]['simpleMessage'].with({
            chatId: inputs.client.chat_id,
            html: htmlSimple,
          });

          // sails.log.debug('simpleRes: ', simpleRes);
          // sails.log.debug('simpleRes payload: ', simpleRes.payload);

          block.message_id = simpleRes.payload.message_id;

          block.shown = true;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message_id: simpleRes.payload.message_id || 0,
            message: htmlSimple,
            message_format: 'simple',
            messenger: inputs.client.messenger,
            message_originator: 'bot',
            client_id: inputs.client.id,
            client_guid: inputs.client.guid
          });

          break;

        case 'img':

          /**
           * Send img message
           */

          let htmlImgRaw = parseMessageStyle(inputs.client, clientName, block.message, inputs.client.lang);

          let {text: htmlImg} = await activateBeforeHelper(inputs.client, block, inputs.msg || null, htmlImgRaw);

          let imgRes = await sails.helpers.mgw[inputs.client.messenger]['imgMessage'].with({
            chatId: inputs.client.chat_id,
            imgPath: sails.config.custom.cloudinaryImgUrl + block.message.img,
            html: htmlImg,
          });

          // sails.log.debug('imgRes: ', imgRes);
          // sails.log.debug('imgRes payload: ', imgRes.payload);

          block.message_id = imgRes.payload.message_id;

          block.shown = true;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message_id: imgRes.payload.message_id || 0,
            message: JSON.stringify({
              img: sails.config.custom.cloudinaryImgUrl + block.message.img,
              html: htmlImg,
            }),
            message_format: 'img',
            messenger: inputs.client.messenger,
            message_originator: 'bot',
            client_id: inputs.client.id,
            client_guid: inputs.client.guid
          });

          break;

        case 'video':

          /**
           * Send video message
           */

          let htmlVideoRaw = parseMessageStyle(inputs.client, clientName, block.message, inputs.client.lang);

          let {text: htmlVideo} = await activateBeforeHelper(inputs.client, block, inputs.msg || null, htmlVideoRaw);

          let videoRes = await sails.helpers.mgw[inputs.client.messenger]['videoMessage'].with({
            chatId: inputs.client.chat_id,
            videoPath: sails.config.custom.cloudinaryVideoUrl + block.message.video,
            html: htmlVideo,
          });

          // sails.log.debug('videoRes: ', videoRes);
          // sails.log.debug('videoRes payload: ', videoRes.payload);

          block.message_id = videoRes.payload.message_id;

          block.shown = true;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message_id: videoRes.payload.message_id || 0,
            message: JSON.stringify({
              video: sails.config.custom.cloudinaryVideoUrl + block.message.img,
              html: htmlVideo,
            }),
            message_format: 'video',
            messenger: inputs.client.messenger,
            message_originator: 'bot',
            client_id: inputs.client.id,
            client_guid: inputs.client.guid
          });

          break;

        case 'forced':

          /**
           * Send forced reply message
           */

          let htmlForcedRaw = parseMessageStyle(inputs.client, clientName, block.message, inputs.client.lang);

          let {text: htmlForced} = await activateBeforeHelper(inputs.client, block, inputs.msg || null, htmlForcedRaw);

          let forcedRes = await sails.helpers.mgw[inputs.client.messenger]['forcedMessage'].with({
            chatId: inputs.client.chat_id,
            html: htmlForced,
          });

          // sails.log.debug('forcedRes: ', forcedRes);
          // sails.log.debug('forcedRes payload: ', forcedRes.payload);

          block.message_id = forcedRes.payload.message_id;

          block.shown = true;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message_id: forcedRes.payload.message_id || 0,
            message: htmlForced,
            message_format: 'forced',
            messenger: inputs.client.messenger,
            message_originator: 'bot',
            client_id: inputs.client.id,
            client_guid: inputs.client.guid
          });

          break;

        case 'inline_keyboard':

          /**
           * Send inline keyboard message
           */

          let htmlInlineRaw = parseMessageStyle(inputs.client, clientName, block.message, inputs.client.lang);

          let {text: htmlInline, inline_keyboard: keyboardInline} = await activateBeforeHelper(inputs.client, block, inputs.msg || null, htmlInlineRaw);

          let objAfter = mapDeep(inputs.client, clientName, inputs.client.lang, keyboardInline);

          // sails.log.debug('objAfter: ');
          // console.dir(objAfter);

          let inlineRes = await sails.helpers.mgw[inputs.client.messenger]['inlineKeyboardMessage'].with({
            chatId: inputs.client.chat_id,
            html: htmlInline,
            inlineKeyboard: objAfter,
          });

          // sails.log.debug('inlineRes: ', inlineRes);
          // sails.log.debug('inlineRes payload: ', inlineRes.payload);

          block.message_id = inlineRes.payload.message_id;

          block.shown = true;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message_id: inlineRes.payload.message_id || 0,
            message: htmlInline,
            message_format: 'callback',
            messenger: inputs.client.messenger,
            message_originator: 'bot',
            client_id: inputs.client.id,
            client_guid: inputs.client.guid,
            message_buttons: objAfter
          });

          break;


      }

      return exits.success({
        status: 'ok',
        message: '**************',
        payload: {},
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

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

