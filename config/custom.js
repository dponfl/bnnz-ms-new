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
  cloudinaryDocUrl: process.env.CLOUDINARY_DOC_URL || '',

  instParserUrl: process.env.INST_PARSER_URL || '',
  instParserApiKey: process.env.INST_PARSER_API_KEY || '',

  apiUuid: process.env.API_UUID || '',

  postRegExp: process.env.POST_REGEXP || '\^\(http\|https\):\\/\\/www\\.instagram\\.com\\/p\\/(\\S+)',

  tokens: {},

  enums: {

    dummyGuid: "00000000-0000-0000-0000-000000000000",

    paymentCurrency: {
      RUB: 'RUB',
      EUR: 'EUR',
      USD: 'USD',
    },

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

    paymentGroupStatus: {
      PENDING: 'pending',
      PROCESSING: 'processing',
      SUCCESS: 'success',
      ERROR: 'error',
      REJECTED: 'rejected',
    },

    paymentGroupType: {
      DEPOSIT: 'deposit',
      WITHDRAWAL: 'withdrawal',
      REFUND: 'refund',
      COMMISSION_CALCULATION: 'commission_calculation',
      TRANSFER: 'transfer',
      // COMMISSION_DEPOSIT: 'commission_deposit',
      COMMISSION_WITHDRAWAL: 'commission_withdrawal',
    },

    paymentProvider: {
      DEFAULT: 'ref commission provider default',
    },

    analytics: {
      frequency: {
        HOURLY: 'hourly',
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
      },
      event: {
        NUM_POSTS: 'num_posts',
        NUM_POSTS_ALL_LIKES: 'num_posts_all_likes',
        NUM_POSTS_ALL_COMMENTS: 'num_posts_all_comments',
        NUM_POSTS_ACC_AV: 'num_posts_acc_av',
        NUM_POSTS_ACC_MIN: 'num_posts_acc_min',
        NUM_POSTS_ACC_MAX: 'num_posts_acc_max',
        CLIENTS_ACTIVE_TOTAL: 'clients_active_total',
        CLIENTS_DELETED_TOTAL: 'clients_deleted_total',
        CLIENTS_BANNED_TOTAL: 'clients_banned_total',
        NEW_CLIENTS: 'new_clients',
        ACCOUNTS_ACTIVE_ALL_TOTAL: 'accounts_active_all_total',
        ACCOUNTS_NOT_ACTIVE_ALL_TOTAL: 'accounts_not_active_all_total',
        ACCOUNTS_DELETED_ALL_TOTAL: 'accounts_deleted_all_total',
        ACCOUNTS_BANNED_ALL_TOTAL: 'accounts_banned_all_total',
        ACCOUNTS_ACTIVE_TEST_PERSONAL_TOTAL: 'accounts_active_test_personal_total',
        ACCOUNTS_DELETED_TEST_PERSONAL_TOTAL: 'accounts_deleted_test_personal_total',
        ACCOUNTS_BANNED_TEST_PERSONAL_TOTAL: 'accounts_banned_test_personal_total',
        ACCOUNTS_ACTIVE_BRONZE_PERSONAL_TOTAL: 'accounts_active_bronze_personal_total',
        ACCOUNTS_NOT_ACTIVE_BRONZE_PERSONAL_TOTAL: 'accounts_not_active_bronze_personal_total',
        ACCOUNTS_DELETED_BRONZE_PERSONAL_TOTAL: 'accounts_deleted_bronze_personal_total',
        ACCOUNTS_BANNED_BRONZE_PERSONAL_TOTAL: 'accounts_banned_bronze_personal_total',
        ACCOUNTS_ACTIVE_SILVER_PERSONAL_TOTAL: 'accounts_active_silver_personal_total',
        ACCOUNTS_NOT_ACTIVE_SILVER_PERSONAL_TOTAL: 'accounts_not_active_silver_personal_total',
        ACCOUNTS_DELETED_SILVER_PERSONAL_TOTAL: 'accounts_deleted_silver_personal_total',
        ACCOUNTS_BANNED_SILVER_PERSONAL_TOTAL: 'accounts_banned_silver_personal_total',
        ACCOUNTS_ACTIVE_GOLD_PERSONAL_TOTAL: 'accounts_active_gold_personal_total',
        ACCOUNTS_NOT_ACTIVE_GOLD_PERSONAL_TOTAL: 'accounts_not_active_gold_personal_total',
        ACCOUNTS_DELETED_GOLD_PERSONAL_TOTAL: 'accounts_deleted_gold_personal_total',
        ACCOUNTS_BANNED_GOLD_PERSONAL_TOTAL: 'accounts_banned_gold_personal_total',
        ACCOUNTS_ACTIVE_PLATINUM_PERSONAL_TOTAL: 'accounts_active_platinum_personal_total',
        ACCOUNTS_NOT_ACTIVE_PLATINUM_PERSONAL_TOTAL: 'accounts_not_active_platinum_personal_total',
        ACCOUNTS_DELETED_PLATINUM_PERSONAL_TOTAL: 'accounts_deleted_platinum_personal_total',
        ACCOUNTS_BANNED_PLATINUM_PERSONAL_TOTAL: 'accounts_banned_platinum_personal_total',
        ACCOUNTS_ACTIVE_TEST_COMMERCIAL_TOTAL: 'accounts_active_test_commercial_total',
        ACCOUNTS_DELETED_TEST_COMMERCIAL_TOTAL: 'accounts_deleted_test_commercial_total',
        ACCOUNTS_BANNED_TEST_COMMERCIAL_TOTAL: 'accounts_banned_test_commercial_total',
        ACCOUNTS_ACTIVE_BRONZE_COMMERCIAL_TOTAL: 'accounts_active_bronze_commercial_total',
        ACCOUNTS_NOT_ACTIVE_BRONZE_COMMERCIAL_TOTAL: 'accounts_not_active_bronze_commercial_total',
        ACCOUNTS_DELETED_BRONZE_COMMERCIAL_TOTAL: 'accounts_deleted_bronze_commercial_total',
        ACCOUNTS_BANNED_BRONZE_COMMERCIAL_TOTAL: 'accounts_banned_bronze_commercial_total',
        ACCOUNTS_ACTIVE_SILVER_COMMERCIAL_TOTAL: 'accounts_active_silver_commercial_total',
        ACCOUNTS_NOT_ACTIVE_SILVER_COMMERCIAL_TOTAL: 'accounts_not_active_silver_commercial_total',
        ACCOUNTS_DELETED_SILVER_COMMERCIAL_TOTAL: 'accounts_deleted_silver_commercial_total',
        ACCOUNTS_BANNED_SILVER_COMMERCIAL_TOTAL: 'accounts_banned_silver_commercial_total',
        ACCOUNTS_ACTIVE_GOLD_COMMERCIAL_TOTAL: 'accounts_active_gold_commercial_total',
        ACCOUNTS_NOT_ACTIVE_GOLD_COMMERCIAL_TOTAL: 'accounts_not_active_gold_commercial_total',
        ACCOUNTS_DELETED_GOLD_COMMERCIAL_TOTAL: 'accounts_deleted_gold_commercial_total',
        ACCOUNTS_BANNED_GOLD_COMMERCIAL_TOTAL: 'accounts_banned_gold_commercial_total',
        ACCOUNTS_ACTIVE_PLATINUM_COMMERCIAL_TOTAL: 'accounts_active_platinum_commercial_total',
        ACCOUNTS_NOT_ACTIVE_PLATINUM_COMMERCIAL_TOTAL: 'accounts_not_active_platinum_commercial_total',
        ACCOUNTS_DELETED_PLATINUM_COMMERCIAL_TOTAL: 'accounts_deleted_platinum_commercial_total',
        ACCOUNTS_BANNED_PLATINUM_COMMERCIAL_TOTAL: 'accounts_banned_platinum_commercial_total',
        NEW_ACCOUNTS_ACTIVE_ALL: 'new_accounts_active_all',
        NEW_ACCOUNTS_NOT_ACTIVE_ALL: 'new_accounts_not_active_all',
        NEW_ACCOUNTS_ACTIVE_TEST_PERSONAL: 'new_accounts_active_test_personal',
        NEW_ACCOUNTS_ACTIVE_BRONZE_PERSONAL: 'new_accounts_active_bronze_personal',
        NEW_ACCOUNTS_NOT_ACTIVE_BRONZE_PERSONAL: 'new_accounts_not_active_bronze_personal',
        NEW_ACCOUNTS_ACTIVE_SILVER_PERSONAL: 'new_accounts_active_silver_personal',
        NEW_ACCOUNTS_NOT_ACTIVE_SILVER_PERSONAL: 'new_accounts_not_active_silver_personal',
        NEW_ACCOUNTS_ACTIVE_GOLD_PERSONAL: 'new_accounts_active_gold_personal',
        NEW_ACCOUNTS_NOT_ACTIVE_GOLD_PERSONAL: 'new_accounts_not_active_gold_personal',
        NEW_ACCOUNTS_ACTIVE_PLATINUM_PERSONAL: 'new_accounts_active_platinum_personal',
        NEW_ACCOUNTS_NOT_ACTIVE_PLATINUM_PERSONAL: 'new_accounts_not_active_platinum_personal',
        NEW_ACCOUNTS_ACTIVE_TEST_COMMERCIAL: 'new_accounts_active_test_commercial',
        NEW_ACCOUNTS_ACTIVE_BRONZE_COMMERCIAL: 'new_accounts_active_bronze_commercial',
        NEW_ACCOUNTS_NOT_ACTIVE_BRONZE_COMMERCIAL: 'new_accounts_not_active_bronze_commercial',
        NEW_ACCOUNTS_ACTIVE_SILVER_COMMERCIAL: 'new_accounts_active_silver_commercial',
        NEW_ACCOUNTS_NOT_ACTIVE_SILVER_COMMERCIAL: 'new_accounts_not_active_silver_commercial',
        NEW_ACCOUNTS_ACTIVE_GOLD_COMMERCIAL: 'new_accounts_active_gold_commercial',
        NEW_ACCOUNTS_NOT_ACTIVE_GOLD_COMMERCIAL: 'new_accounts_not_active_gold_commercial',
        NEW_ACCOUNTS_ACTIVE_PLATINUM_COMMERCIAL: 'new_accounts_active_platinum_commercial',
        NEW_ACCOUNTS_NOT_ACTIVE_PLATINUM_COMMERCIAL: 'new_accounts_not_active_platinum_commercial',
        DEPOSITS_RECEIVED_RUB: 'deposits_received_rub',
        REFUNDS_RUB: 'refunds_rub',
        COMMISSIONS_RUB: 'commissions_rub',
      }
    },

    ref: {
      refDownType: {
        FIRST: 'first',
        NORMAL: 'normal',
        OVERFLOW: 'overflow',
        NOREF: 'no_ref',
      },
    },

    messenger: {
      TELEGRAM: 'telegram',
    },

    messageFormat: {
      SIMPLE: 'simple',
      CALLBACK: 'callback',
      FORCED: 'forced',
      IMG: 'img',
      VIDEO: 'video',
      STICKER: 'sticker',
      DOC: 'doc',
      POSTBROADCAST: 'postBroadcast',
      PUSHSIMPLE: 'pushSimple',
      PUSHCALLBACK: 'pushCallback',
      PUSHFORCED: 'pushForced',
      PUSHIMG: 'pushImg',
      PUSHVIDEO: 'pushVideo',
      PUSHSTICKER: 'pushSticker',
    },

    messageOriginator: {
      CLIENT: 'client',
      BOT: 'bot',
    },

    emergencyLevels: {
      HIGHEST: 'highest',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low',
    },

    errorType: {
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
      CRITICAL: 'critical',
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
   * Push messages data
   * ============================
   */

  pushMessages: null,


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
   * accountGetJoi
   * ----------------------------
   */

  ACCOUNTGETJOI_ERROR: 'Account record get error',

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
   * getCategoryRef
   * ----------------------------
   */

  CATEGORYREF_GENERAL_ERROR: 'Category ref general error',
  CATEGORYREF_NOT_API_KEY: 'Category ref id is NOT API Key',
  CATEGORYREF_NOT_FOUND: 'Category ref id was not found, deleted or in use already',
  CATEGORYREF_FOUND: 'Category ref id was found',
  CATEGORYREF_UPDATE_ERROR: 'Category ref record update error',

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
   * paymentGroupCreate
   * ----------------------------
   */

  PAYMENTGROUP_CREATE_ERROR: 'Payment group record create error',

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
  KEYBOARD_REMOVE_SEND_ERROR: 'Keyboard remove send error',
  IMG_MESSAGE_SEND_ERROR: 'Img message send error',
  VIDEO_MESSAGE_SEND_ERROR: 'Video message send error',
  STICKER_MESSAGE_SEND_ERROR: 'Sticker message send error',
  DOCUMENT_MESSAGE_SEND_ERROR: 'Document message send error',

  /**
   * ----------------------------
   * proceedNextBlock
   * ----------------------------
   */

  PROCEED_NEXT_BLOCK_ERROR: 'proceedNextBlock error',
  PROCEED_NEXT_BLOCK_JOI_ERROR: 'proceedNextBlockJoi error',
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

  SUPERVISOR_CALLBACK_HELPER_ERROR: 'supervisorCallbackJoi error',
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


  /**
   * ----------------------------
   * Inst parser errors
   * ----------------------------
   */

  INST_PARSER_WRONG_RESPONSE_STATUS: {
    name: 'ERR_INST_PARSER_WRONG_RESPONSE_STATUS',
    message: 'Wrong parser response status',
  },

  INST_PARSER_NO_USERS: {
    name: 'ERR_INST_PARSER_NO_USERS',
    message: 'Wrong parser response: no response.instagram.users',
  },

  INST_PARSER_NO_COMMENTS: {
    name: 'ERR_INST_PARSER_NO_COMMENTS',
    message: 'Wrong parser response: no response.instagram.comments',
  },

  INST_PARSER_WRONG_GET_FOLLOWINGS_STATUS: {
    name: 'ERR_INST_PARSER_WRONG_GET_FOLLOWINGS_STATUS',
    message: 'Wrong getFollowingsJoi response status',
  },

  INST_PARSER_WRONG_GET_USER_ID_BY_PROFILE_STATUS: {
    name: 'INST_PARSER_WRONG_GET_USER_ID_BY_PROFILE_STATUS',
    message: 'Wrong getUserIdByProfileJoi response status',
  },

  INST_PARSER_WRONG_GET_MEDIA_ID_STATUS: {
    name: 'INST_PARSER_WRONG_GET_MEDIA_ID_STATUS',
    message: 'Wrong getMediaIdJoi response status',
  },

  INST_PARSER_WRONG_GET_MEDIA_ID_RESPONSE: {
    name: 'INST_PARSER_WRONG_GET_MEDIA_ID_RESPONSE',
    message: 'Wrong getMediaIdJoi response: no payload.mediaId',
  },

  INST_PARSER_WRONG_GET_LIKES_STATUS: {
    name: 'INST_PARSER_WRONG_GET_LIKES_STATUS',
    message: 'Wrong getLikesJoi response status',
  },

  INST_PARSER_WRONG_GET_COMMENTS_STATUS: {
    name: 'INST_PARSER_WRONG_GET_COMMENTS_STATUS',
    message: 'Wrong getCommentsJoi response status',
  },

  INST_PARSER_CHECK_PROFILE_EXISTS_ERROR: {
    name: 'INST_PARSER_CHECK_PROFILE_EXISTS_ERROR',
    message: 'Unexpected response from checkProfileExistsJoi',
  },

  INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL: {
    name: 'INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL',
    message: 'COULD NOT GET THE EXPECTED RESPONSE FROM CHECKPROFILEEXISTSJOI',
  },

  INST_PARSER_CHECK_PROFILE_SUBSCRIPTION_ERROR: {
    name: 'INST_PARSER_CHECK_PROFILE_SUBSCRIPTION_ERROR',
    message: 'Unexpected response from checkProfileSubscriptionJoi',
  },

  INST_PARSER_CHECK_PROFILE_SUBSCRIPTION_ERROR_FINAL: {
    name: 'INST_PARSER_CHECK_PROFILE_SUBSCRIPTION_ERROR_FINAL',
    message: 'COULD NOT GET THE EXPECTED RESPONSE FROM CHECKPROFILESUBSCRIPTIONJOI',
  },

  ANALITICS_ERROR: {
    name: 'ERR_ANALITICS_GENERAL',
  },

  CHAT_LISTENER_TELEGRAM_ERROR: {
    name: 'ERR_CHAT_LISTENER_TELEGRAM_GENERAL',
  },

  FUNNELS_ERROR: {
    name: 'ERR_FUNNELS_GENERAL',
  },

  GENERAL_ERROR: {
    name: 'ERR_GENERAL_GENERAL',
  },

  KEYBOARD_PROCESSOR_ERROR: {
    name: 'ERR_KEYBOARD_PROCESSOR_GENERAL',
  },

  KEYBOARDS_ERROR: {
    name: 'ERR_KEYBOARDS_GENERAL',
  },

  MESSAGE_PROCESSOR_ERROR: {
    name: 'ERR_MESSAGE_PROCESSOR_GENERAL',
  },

  MGW_TELEGRAM_ERROR: {
    name: 'ERR_MGW_TELEGRAM_GENERAL',
  },

  PGW_ERROR: {
    name: 'ERR_PGW_GENERAL',
  },

  PUSH_MESSAGES_ERROR: {
    name: 'ERR_PUSH_MESSAGES_GENERAL',
  },

  REF_ERROR: {
    name: 'ERR_REF_GENERAL',
  },

  STORAGE_ERROR: {
    name: 'ERR_STORAGE_GENERAL',
  },

  TASKS_ERROR: {
    name: 'ERR_TASKS_GENERAL',
  },




};
