/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': { view: 'pages/homepage' },


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/

  /**
   * CoreModuleController
   */

  'POST /core/start': 'core-module/proceed-start-command',
  'POST /core/help': 'core-module/proceed-help-command',

  /**
   * MessageGatewayController
   */

  'POST /mg/sendinlinebuttons':   'MessageGatewayController.sendInlineButtons',
  'POST /mg/sendforcedmessage':   'MessageGatewayController.sendForcedMessage',
  'POST /mg/sendsimplemessage':   'MessageGatewayController.sendSimpleMessage',
  'POST /mg/sendkeyboard':        'MessageGatewayController.sendKeyboard',

  /**
   * MessageBrokerTelegramController
   */

  'POST /mbt/sendinlinebuttons':  'MessageBrokerTelegramController.sendInlineButtons',
  'POST /mbt/sendforcedmessage':  'MessageBrokerTelegramController.sendForceMessage',
  'POST /mbt/sendsimplemessage':  'MessageBrokerTelegramController.sendSimpleMessage',
  'POST /mbt/sendkeyboard':       'MessageBrokerTelegramController.sendKeyboard',
};
