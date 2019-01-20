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

  tokens: {},

  testClient: {},

  JUNCTION: '::',

  SCR: `
`,

  DCR: `
  
`,

  /**
   * Reply tokens
   */

  CLIENT_NOT_FOUND: 'Client was not found',
  CLIENT_FOUND: 'Client was found',
  NO_CHAT_ID: 'No chat id in the message',
  CLIENT_GENERAL_ERROR: 'Client general error',

  /**
   * Service Ref
   */

  SERVICEREF_GENERAL_ERROR: 'Service ref general error',
  SERVICEREF_NOT_API_KEY: 'Service ref id is NOT API Key',
  SERVICEREF_NOT_FOUND: 'Service ref id was not found, deleted or in use already',
  SERVICEREF_FOUND: 'Service ref id was found',
  SERVICEREF_UPDATE_ERROR: 'Service ref record update error',

  /**
   * Service
   */

  SERVICE_GENERAL_ERROR: 'Service general error',
  SERVICE_NOT_FOUND: 'Service was not found or deleted',
  SERVICE_FOUND: 'Service was found',


};
