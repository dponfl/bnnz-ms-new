/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */



module.exports.custom = {

  /***************************************************************************
  *                                                                          *
  * Any other custom config this Sails app should use during development.    *
  *                                                                          *
  ***************************************************************************/
  // mailgunDomain: 'transactional-mail.example.com',
  // mailgunSecret: 'key-testkeyb183848139913858e8abd9a3',
  // stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',
  // …

  telegramBot: null,

  cloudinaryImgUrl: process.env.CLOUDINARY_IMG_URL || '',
  cloudinaryVideoUrl: process.env.CLOUDINARY_VIDEO_URL || '',

  tokens: {},

  testClient: {},

  JUNCTION: '::',

  SCR: `
`,

  DCR: `
  
`,

  /**
   * ============================
   * Global chat config
   * ============================
   */

  chatConfig: null,


  /**
   * ============================
   * Tokens
   * ============================
   */

  /**
   * ----------------------------
   * General helper errors
   * ----------------------------
   */

  GENERAL_HELPER_ERROR: 'General helper error',


  /**
   * ----------------------------
   * onMessage
   * ----------------------------
   */

  ON_MESSAGE_ERROR: 'onMessage error',

  /**
   * ----------------------------
   * onCallbackQuery
   * ----------------------------
   */

  ON_CALLBACK_QUERY_ERROR: 'onCallbackQuery error',


  /**
   * ----------------------------
   * getClient
   * ----------------------------
   */

  CLIENT_NOT_FOUND: 'Client was not found',
  CLIENT_FOUND: 'Client was found',
  NO_CHAT_ID: 'No chat id in the message',
  CLIENT_GENERAL_ERROR: 'Client general error',

  /**
   * ----------------------------
   * clientCreate
   * ----------------------------
   */

  CLIENTCREATE_ERROR: 'Client record create error',

  /**
   * ----------------------------
   * clientUpdate
   * ----------------------------
   */

  CLIENTUPDATE_ERROR: 'Client record update error',


  /**
   * ----------------------------
   * getServiceRef
   * ----------------------------
   */

  SERVICEREF_GENERAL_ERROR: 'Service ref general error',
  SERVICEREF_NOT_API_KEY: 'Service ref id is NOT API Key',
  SERVICEREF_NOT_FOUND: 'Service ref id was not found, deleted or in use already',
  SERVICEREF_FOUND: 'Service ref id was found',
  SERVICEREF_UPDATE_ERROR: 'Service ref record update error',

  /**
   * ----------------------------
   * getService
   * ----------------------------
   */

  SERVICE_GENERAL_ERROR: 'Service general error',
  SERVICE_NOT_FOUND: 'Service was not found or deleted',
  SERVICE_FOUND: 'Service was found',

  /**
   * ----------------------------
   * checkFunnels
   * ----------------------------
   */

  CHECKFUNNELS_GENERAL_ERROR: 'Check funnels was not successful',
  CHECKFUNNELS_SUCCESS: 'Check funnels was successful',

  /**
   * ----------------------------
   * sendRest
   * ----------------------------
   */

  SENDREST_NO_METHOD: 'No method or wrong method',
  SENDREST_NO_URL: 'No url',
  SENDREST_NO_RESULT: 'No result from rp',

  /**
   * ----------------------------
   * messageSave
   * ----------------------------
   */

  MESSAGESAVE_ERROR: 'Message record create error',

  /**
   * ----------------------------
   * message gateways
   * ----------------------------
   */

  SIMPLE_MESSAGE_SEND_ERROR: 'Simple message send error',
  FORCED_MESSAGE_SEND_ERROR: 'Forced message send error',
  INLINE_KEYBOARD_MESSAGE_SEND_ERROR: 'Inline keyboard message send error',
  KEYBOARD_MESSAGE_SEND_ERROR: 'Keyboard message send error',
  IMG_MESSAGE_SEND_ERROR: 'Img message send error',

  /**
   * ----------------------------
   * proceedNextBlock
   * ----------------------------
   */

  PROCEED_NEXT_BLOCK_ERROR: 'proceedNextBlock error',
  PROCEED_NEXT_BLOCK_AFTERHELPER_PARSE_ERROR: 'Cannot parse afterHelper error',
  PROCEED_NEXT_BLOCK_BEFOREHELPER_PARSE_ERROR: 'Cannot parse beforeHelper error',

  /**
   * ----------------------------
   * afterHelperGeneric
   * ----------------------------
   */

  AFTERHELPERGENERIC_ERROR: 'afterHelperGeneric error',

  /**
   * ----------------------------
   * supervisorTextHelper
   * ----------------------------
   */

  SUPERVISORTEXTHELPER_ERROR: 'supervisorTextHelper error',
  SUPERVISORTEXTHELPER_FORCEDHELPER_PARSE_ERROR: 'Cannot parse forcedHelper error',
  SUPERVISORTEXTHELPER_INITIAL_BLOCK_FIND_ERROR: 'Initial block was not found of its ID is not defined',
  SUPERVISORTEXTHELPER_FORCEDREPLY_BLOCK_FIND_ERROR: 'Forced reply block was not find by message_id',

  /**
   * ----------------------------
   * supervisorCallbackHelper
   * ----------------------------
   */

  SUPERVISOR_CALLBACK_HELPER_ERROR: 'supervisorCallbackHelper error',
  SUPERVISOR_CALLBACK_HELPER_PARSE_ERROR: 'Cannot parse callbackHelper error',
  SUPERVISOR_CALLBACK_HELPER_INITIAL_BLOCK_FIND_ERROR: 'Initial block was not found of its ID is not defined',
  SUPERVISOR_CALLBACK_HELPER_BLOCK_FIND_ERROR: 'Block was not find by message_id',

  /**
   * ----------------------------
   * performedFunnelsSave
   * ----------------------------
   */

  PERFORMEDFUNNELSSAVE_ERROR: 'Performed_funnels record create error',

  /**
   * confirmPayment
   */

  CONFIRM_PAYMENT_CLIENT_NOT_FOUND: 'confirmPayment, client was not found',
  CONFIRM_PAYMENT_WRONG_SL: 'confirmPayment, client record payment plan does not correspond with helper parameter',
  CONFIRM_PAYMENT_SUCCESS: 'confirmPayment, success',
  CONFIRM_PAYMENT_GENERAL_ERROR: 'confirmPayment, general error',


  /**
   * confirmSubsciption
   */

  CONFIRM_SUBSCRIPTION_CLIENT_NOT_FOUND: 'confirmSubsciption, client was not found',
  CONFIRM_SUBSCRIPTION_SUCCESS: 'confirmSubsciption, success',
  CONFIRM_SUBSCRIPTION_GENERAL_ERROR: 'confirmSubsciption, general error',


  /**
   * ----------------------------
   * API controllers
   * ----------------------------
   */


  /**
   * ----------------------------
   * payment controller
   * ----------------------------
   */


  PAYMENT_CONTROLLER_ERROR: 'Payment controller error',


  /**
   * ----------------------------
   * subscription controller
   * ----------------------------
   */


  SUBSCRIPTION_CONTROLLER_ERROR: 'Subscription controller error',



  /**
   * ----------------------------
   * sendMailgum helper
   * ----------------------------
   */


  SEND_MAILGUN_GENERAL_ERROR: 'Send email general error',
  SEND_MAILGUN_SEND_MESSAGE_ERROR: 'Send email message error',


  /**
   * ----------------------------
   * checkMaxPosts helper
   * ----------------------------
   */


  CHECKMAXPOSTS_GENERAL_ERROR: 'Send email general error',
  CHECKMAXPOSTS_OK: 'Max daily limit was not reached',
  CHECKMAXPOSTS_NOK: 'Max daily limit was reached',




};
