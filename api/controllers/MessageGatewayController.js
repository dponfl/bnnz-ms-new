/**
 * MessageGatewayController
 *
 * @description :: Server-side logic for managing Messagegateways
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const generalServices = require('../../api/services/general');
const _ = require('lodash');


module.exports = {
  sendInlineButtons: function (req, res) {
    let params = req.allParams();

    console.log('MessageGatewayController::sendInlineButtons, params:');
    console.dir(params);
    sails.log.info('inline_keyboard:', params.inline_keyboard);


    switch (params.messenger) {
      case 'telegram' :
        callTelegram('/mbt/sendinlinebuttons', params)
          .then((result) => {
            sails.log.info('!!!!!!!! MessageGatewayController::sendInlineMessage, result:', result);
            if (!_.isNil(result.status) && result.status == 'ok') {
              res.status(200).json({status: 'ok', payload: result});
            } else {
              res.status(200).json({status: 'error'});
            }
          })
          .catch((err) => {
            res.status(200).json({status: 'catch error', error: err});
          });
        break;
      case 'facebook':
        break;
    }

  }, // sendInlineButtons

  sendForcedMessage: function (req, res) {

    let params = req.allParams();

    console.log('MessageGatewayController::sendForcedMessage, params:');
    console.dir(params);

    switch (params.messenger) {
      case 'telegram' :
        callTelegram('/mbt/sendforcedmessage', params)
          .then((result) => {
            sails.log.info('!!!!!!!! MessageGatewayController::sendForcedMessage, result:', result);
            if (!_.isNil(result.status) && result.status == 'ok') {
              res.status(200).json({status: 'ok', payload: result});
            } else {
              res.status(200).json({status: 'error'});
            }
          }).catch((err) => {
          res.status(200).json({status: 'catch error', error: err});
        });
        break;
      case 'facebook':
        break;
    }

  }, // sendForcedMessage

  sendSimpleMessage: function (req, res) {

    let params = req.allParams();
    let ttt;

    console.log('MessageGatewayController::sendSimpleMessage, params:');
    console.dir(params);

    switch (params.messenger) {
      case 'telegram' :
        callTelegram('/mbt/sendsimplemessage', params)
          .then((result) => {
            sails.log.info('!!!!!!!! MessageGatewayController::sendSimpleMessage, result:', result);
            if (!_.isNil(result.status) && result.status == 'ok') {
              res.status(200).json({status: 'ok', payload: result});
            } else {
              res.status(200).json({status: 'error'});
            }
          }).catch((err) => {
          res.status(200).json({status: 'catch error', error: err});
        });
        break;
      case 'facebook':
        break;
    }

  }, // sendSimpleMessage

  sendKeyboard: function (req, res) {

    let params = req.allParams();

    console.log('MessageGatewayController::sendKeyboard, params:');
    console.dir(params);

    switch (params.messenger) {
      case 'telegram' :
        callTelegram('/mbt/sendkeyboard', params)
          .then((result) => {
            sails.log.info('!!!!!!!! MessageGatewayController::sendKeyboardMessage, result:', result);
            if (!_.isNil(result.status) && result.status == 'ok') {
              res.status(200).json({status: 'ok', payload: result});
            } else {
              res.status(200).json({status: 'error'});
            }
          }).catch((err) => {
          res.status(200).json({status: 'catch error', error: err});
        });
        break;
      case 'facebook':
        break;
    }

  }, // sendKeyboard


};

async function callTelegram(route, callTelegramParams) {

  try {
    return await sails.helpers.general.sendRest('POST', route, callTelegramParams);

  } catch (err) {
    console.log('MessageGatewayController::callTelegram, Error:');
    // console.log('statusCode: ' + err.statusCode);
    console.log('message: ' + err.message);
    // console.log('error: ');
    // console.dir(err.error);
    // console.log('options: ');
    // console.dir(err.options);

    return false;
  }

} // callTelegram

