/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  // models: {
  //   connection: 'someMongodbServer'
  // }

  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || '',

  HOST: process.env.HOST || 'http://localhost:1337',

  hookTimeout: 120000,

  datastores: {

    /***************************************************************************
     *                                                                          *
     * Configure your default production database.                              *
     *                                                                          *
     * 1. Choose an adapter:                                                    *
     *    https://sailsjs.com/plugins/databases                                 *
     *                                                                          *
     * 2. Install it as a dependency of your Sails app.                         *
     *    (For example:  npm install sails-mysql --save)                        *
     *                                                                          *
     * 3. Then set it here (`adapter`), along with a connection URL (`url`)     *
     *    and any other, adapter-specific customizations.                       *
     *    (See https://sailsjs.com/config/datastores for help.)                 *
     *                                                                          *
     ***************************************************************************/
    default: {

      /***************************************************************************
       *                                                                          *
       * Want to use a different database during development?                     *
       *                                                                          *
       * 1. Choose an adapter:                                                    *
       *    https://sailsjs.com/plugins/databases                                 *
       *                                                                          *
       * 2. Install it as a dependency of your Sails app.                         *
       *    (For example:  npm install sails-mysql --save)                        *
       *                                                                          *
       * 3. Then pass it in, along with a connection URL.                         *
       *    (See https://sailsjs.com/config/datastores for help.)                 *
       *                                                                          *
       ***************************************************************************/
      adapter: 'sails-mysql',
      url: process.env.JAWSDB_MARIA_URL,

    },

    clientDb: {
      adapter: 'sails-mysql',
      url: process.env.JAWSDB_MARIA_URL,
    },

    paymentDb: {
      adapter: 'sails-mysql',
      url: process.env.JAWSDB_MARIA_NAVY_URL,
    },

    configDb: {
      adapter: 'sails-mysql',
      url: process.env.JAWSDB_MARIA_GRAY_URL,
    },

    performanceDb: {
      adapter: 'sails-mysql',
      url: process.env.JAWSDB_MARIA_BLACK_URL,
    },


  },


};
