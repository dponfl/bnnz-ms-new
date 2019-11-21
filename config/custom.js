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

  apiUuid: process.env.API_UUID || '',

  tokens: {},

  enums: {
    paymentStatus: {
      INVOICE: 'invoice',
      INVOICE_ERROR: 'invoice_error',
      PRECHECKOUT: 'pre_checkout',
      PRECHECKOUT_ERROR: 'pre_checkout_error',
      CHECKOUT: 'checkout',
      CHECKOUT_ERROR: 'checkout_error',
      SUCCESS: 'successful_payment',
      SUCCESS_ERROR: 'successful_payment_error',
      SUCCESS_COMMISSION: 'successful_commission',
      ERROR_COMMISSION: 'error_commission',
    },

    paymentType: {
      DEPOSIT: 'deposit',
      WITHDRAWAL: 'withdrawal',
      REFUND: 'refund',
      COMMISSION_CALCULATION: 'commission_calculation',
      // COMMISSION_DEPOSIT: 'commission_deposit',
      // COMMISSION_WITHDRAWAL: 'commission_withdrawal',
    },

    paymentProvider: {
      DEFAULT: 'ref commission provider default',
    },

    analytics: {
      frequency: {
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
      },
      event: {
        COM_VAL: 'commissions_value',
        CLIENTS_ACTIVE: 'clients_active',
        CLIENTS_DEL: 'clients_deleted',
        CLIENTS_BANNED: 'clients_banned',
      }
    },

    messenger: {
      TELEGRAM: 'telegram',
    }

  },

  testClient: {},

  JUNCTION: '::',

  SCR: `
`,

  DCR: `
  
`,

  ERROR_MSG_LENGTH: 800,

  /**
   * ============================
   * Global chat config
   * ============================
   */

  config: null,


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
   * clientGet
   * ----------------------------
   */

  CLIENT_NOT_FOUND: 'Client was not found',
  CLIENT_FOUND: 'Client was found',
  ACCOUNT_NOT_FOUND: 'Account was not found',
  ACCOUNT_FOUND: 'Account was found',
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
   * accountCreate
   * ----------------------------
   */

  ACCOUNTCREATE_ERROR: 'Account record create error',

  /**
   * ----------------------------
   * accountGet
   * ----------------------------
   */

  ACCOUNTGET_ERROR: 'Account record get error',

  /**
   * ----------------------------
   * clientUpdate
   * ----------------------------
   */

  CLIENTUPDATE_ERROR: 'Client record update error',

  /**
   * ----------------------------
   * clientFieldsPut
   * ----------------------------
   */

  CLIENTFIELDSPUT_ERROR: 'ClientFields record create error',


  /**
   * ----------------------------
   * accountFieldsPut
   * ----------------------------
   */

  ACCOUNTFIELDSPUT_ERROR: 'AccountFields record create error',



  /**
   * ----------------------------
   * accountUpdate
   * ----------------------------
   */

  ACCOUNTUPDATE_ERROR: 'Account record update error',


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
   * paymentCreate
   * ----------------------------
   */

  PAYMENT_CREATE_ERROR: 'Payment record create error',

  /**
   * ----------------------------
   * paymentGetByIdAndStatus
   * ----------------------------
   */

  PAYMENT_GET_BY_PAYMENT_ID_ERROR: 'Payment get by payment id error',
  PAYMENT_RECORD_NOT_FOUND: 'Payment record was not found',
  PAYMENT_RECORD_FOUND: 'Payment record was found',


  /**
   * ----------------------------
   * checkPreCheckout
   * ----------------------------
   */

  CHECK_PRE_CHECKOUT_ERROR: 'Check pre_checkout error',
  CHECK_PRE_CHECKOUT_OK: 'Check pre_checkout success',

  /**
   * ----------------------------
   * checkSuccessfulPayment
   * ----------------------------
   */

  CHECK_SUCCESSFUL_PAYMENT_ERROR: 'Check successful_payment error',
  CHECK_SUCCESSFUL_PAYMENT_OK: 'Check successful_payment success',

  /**
   * ----------------------------
   * answerPreCheckoutQuery
   * ----------------------------
   */

  ANSWER_PRE_CHECKOUT_QUERY_ERROR: 'answer_pre_checkout_query error',
  ANSWER_PRE_CHECKOUT_QUERY_OK: 'answer_pre_checkout_query success',
  ANSWER_PRE_CHECKOUT_QUERY_NOK: 'answer_pre_checkout_query NOT successful',

  /**
   * ----------------------------
   * onPreCheckoutQuery
   * ----------------------------
   */

  ON_PRE_CHECKOUT_QUERY_ERROR: 'pre_checkout_query error',
  ON_PRE_CHECKOUT_QUERY_OK: 'pre_checkout_query success',

  /**
   * ----------------------------
   * onSuccessfulPayment
   * ----------------------------
   */

  ON_SUCCESSFUL_PAYMENT_ERROR: 'successful_payment error',
  ON_SUCCESSFUL_PAYMENT_OK: 'successful_payment success',

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
  PROCEED_NEXT_BLOCK_BLOCKMODIFYEHELPER_PARSE_ERROR: 'Cannot parse blockModifyHelper error',

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
  CONFIRM_PAYMENT_PAYMENT_WAS_MADE: 'confirmPayment, client record has flag that this client already made payment',
  CONFIRM_PAYMENT_SUCCESS: 'confirmPayment, success',
  CONFIRM_PAYMENT_GENERAL_ERROR: 'confirmPayment, general error',


  /**
   * confirmSubsciption
   */

  CONFIRM_SUBSCRIPTION_CLIENT_NOT_FOUND: 'confirmSubsciption, client was not found',
  CONFIRM_SUBSCRIPTION_SUBSCRIPTION_WAS_MADE: 'confirmSubsciption, client record has flag that the client already made subscription',
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
   * update controller
   * ----------------------------
   */


  UPDATE_CONTROLLER_ERROR: 'Config update controller error',


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
