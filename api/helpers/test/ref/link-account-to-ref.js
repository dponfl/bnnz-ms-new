"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'test:ref:linkAccountToRef';


module.exports = {


  friendlyName: 'test:ref:linkAccountToRef',


  description: 'description',


  inputs: {
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

      /**
       * Шаг 1: Запись первого аккаунта 00_00
       */

      // const client00UuidApiKey = uuid.create();
      //
      // const client00 = await Client.create({
      //   guid: client00UuidApiKey.uuid,
      //   first_name: 'Test-name-00',
      //   last_name: 'Test-surname-00',
      //   chat_id: 100,
      //   messenger: 'telegram',
      //   login: 'test00',
      // }).fetch();
      //
      // const account00_00UuidApiKey = uuid.create();
      //
      // const account00_00 = await Account.create({
      //   guid: account00_00UuidApiKey.uuid,
      //   ref_key: account00_00UuidApiKey.apiKey,
      //   service: 40,
      //   inst_profile: 'test00_00_inst',
      //   client: client00.id,
      // }).fetch();
      //
      // const linkAccount00_00Res = await sails.helpers.ref.linkAccountToRef.with({
      //   account: account00_00,
      // });
      //
      // sails.log('linkAccount00_00Res: \n', linkAccount00_00Res);

      /**
       * Шаг 2: Запись второго аккаунта 01_01 по реферальной ссылке аккаунта 00_00
       */

      // const client01UuidApiKey = uuid.create();
      //
      // const client01 = await Client.create({
      //   guid: client01UuidApiKey.uuid,
      //   ref_key: 'PP8P9AJ-KY1MA71-NPFD1QQ-KJAN05Q',
      //   first_name: 'Test-name-01',
      //   last_name: 'Test-surname-01',
      //   chat_id: 101,
      //   messenger: 'telegram',
      //   login: 'test01',
      // }).fetch();
      //
      // const account01_01UuidApiKey = uuid.create();
      //
      // const account01_01 = await Account.create({
      //   guid: account01_01UuidApiKey.uuid,
      //   ref_key: account01_01UuidApiKey.apiKey,
      //   service: 40,
      //   inst_profile: 'test01_01_inst',
      //   client: client01.id,
      // }).fetch();
      //
      // const linkAccount01_01Res = await sails.helpers.ref.linkAccountToRef.with({
      //   account: account01_01,
      // });
      //
      // sails.log('linkAccount01_01Res: \n', linkAccount01_01Res);

      /**
       * Шаг 2: Запись нового аккаунта 01_02 по реферальной ссылке аккаунта 00_00
       */

      // const account01_02UuidApiKey = uuid.create();
      //
      // const account01_02 = await Account.create({
      //   guid: account01_02UuidApiKey.uuid,
      //   ref_key: account01_02UuidApiKey.apiKey,
      //   service: 40,
      //   inst_profile: 'test01_02_inst',
      //   client: 1051,
      // }).fetch();
      //
      // const linkAccount01_02Res = await sails.helpers.ref.linkAccountToRef.with({
      //   account: account01_02,
      // });
      //
      // sails.log('linkAccount01_02Res: \n', linkAccount01_02Res);

      /**
       * Шаг 3: Запись нового аккаунта 01_03 без реферальной ссылки
       */

      const client02UuidApiKey = uuid.create();

      const client02 = await Client.create({
        guid: client02UuidApiKey.uuid,
        first_name: 'Test-name-02',
        last_name: 'Test-surname-02',
        chat_id: 102,
        messenger: 'telegram',
        login: 'test02',
      }).fetch();

      const account01_03UuidApiKey = uuid.create();

      const account01_03 = await Account.create({
        guid: account01_03UuidApiKey.uuid,
        ref_key: account01_03UuidApiKey.apiKey,
        service: 40,
        inst_profile: 'test01_03_inst',
        client: client02.id,
      }).fetch();

      const linkAccount01_03Res = await sails.helpers.ref.linkAccountToRef.with({
        account: account01_03,
      });

      sails.log('linkAccount01_03Res: \n', linkAccount01_03Res);



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


