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

      const makeStep01 = false;

      if (makeStep01) {

        const client00UuidApiKey = uuid.create();

        const client00 = await Client.create({
          guid: client00UuidApiKey.uuid,
          first_name: 'Test-name-00',
          last_name: 'Test-surname-00',
          chat_id: 100,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          login: 'test00',
        }).fetch();

        const account00_00UuidApiKey = uuid.create();

        const account00_00 = await Account.create({
          guid: account00_00UuidApiKey.uuid,
          ref_key: account00_00UuidApiKey.apiKey,
          service: 40,
          inst_profile: 'test00_00_inst',
          client: client00.id,
        }).fetch();

        const linkAccount00_00Res = await sails.helpers.ref.linkAccountToRef.with({
          account: account00_00,
        });

        sails.log('linkAccount00_00Res: \n', linkAccount00_00Res);

      }


      /**
       * Шаг 2: Запись аккаунта 01_01 по реферальной ссылке аккаунта 00_00
       */

      const makeStep02 = false;

      if (makeStep02) {

        const step02RefAccount = await Account.findOne({
          inst_profile: 'test00_00_inst',
        });

        const client01UuidApiKey = uuid.create();

        const client01 = await Client.create({
          guid: client01UuidApiKey.uuid,
          ref_key: step02RefAccount.ref_key,
          first_name: 'Test-name-01',
          last_name: 'Test-surname-01',
          chat_id: 101,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          login: 'test01',
        }).fetch();

        const account01_01UuidApiKey = uuid.create();

        const account01_01 = await Account.create({
          guid: account01_01UuidApiKey.uuid,
          ref_key: account01_01UuidApiKey.apiKey,
          service: 40,
          inst_profile: 'test01_01_inst',
          client: client01.id,
        }).fetch();

        const linkAccount01_01Res = await sails.helpers.ref.linkAccountToRef.with({
          account: account01_01,
        });

        sails.log('linkAccount01_01Res: \n', linkAccount01_01Res);

      }


      /**
       * Шаг 3: Запись аккаунта 01_02 по реферальной ссылке аккаунта 00_00
       */

      const makeStep03 = false;

      if (makeStep03) {

        const step03RefAccount = await Account.findOne({
          inst_profile: 'test00_00_inst',
        });

        const client02UuidApiKey = uuid.create();

        const client02 = await Client.create({
          guid: client02UuidApiKey.uuid,
          ref_key: step03RefAccount.ref_key,
          first_name: 'Test-name-02',
          last_name: 'Test-surname-02',
          chat_id: 102,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          login: 'test02',
        }).fetch();

        const account01_02UuidApiKey = uuid.create();

        const account01_02 = await Account.create({
          guid: account01_02UuidApiKey.uuid,
          ref_key: account01_02UuidApiKey.apiKey,
          service: 40,
          inst_profile: 'test01_02_inst',
          client: client02.id,
        }).fetch();

        const linkAccount01_02Res = await sails.helpers.ref.linkAccountToRef.with({
          account: account01_02,
        });

        sails.log('linkAccount01_02Res: \n', linkAccount01_02Res);

      }



      /**
       * Шаг 4: Запись нового аккаунта 01_03 без реферальной ссылки
       */

      const makeStep04 = false;

      if (makeStep04) {

        const client03UuidApiKey = uuid.create();

        const client03 = await Client.create({
          guid: client03UuidApiKey.uuid,
          first_name: 'Test-name-03',
          last_name: 'Test-surname-03',
          chat_id: 103,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          login: 'test03',
        }).fetch();

        const account01_03UuidApiKey = uuid.create();

        const account01_03 = await Account.create({
          guid: account01_03UuidApiKey.uuid,
          ref_key: account01_03UuidApiKey.apiKey,
          service: 40,
          inst_profile: 'test01_03_inst',
          client: client03.id,
        }).fetch();

        const linkAccount01_03Res = await sails.helpers.ref.linkAccountToRef.with({
          account: account01_03,
        });

        sails.log('linkAccount01_03Res: \n', linkAccount01_03Res);

      }


      /**
       * Шаг 5: Запись аккаунта 02_01 по реферальной ссылке аккаунта 00_00 с переливом
       */

      const makeStep05 = false;

      if (makeStep05) {

        const step05RefAccount = await Account.findOne({
          inst_profile: 'test00_00_inst',
        });

        const client04UuidApiKey = uuid.create();

        const client04 = await Client.create({
          guid: client04UuidApiKey.uuid,
          ref_key: step05RefAccount.ref_key,
          first_name: 'Test-name-04',
          last_name: 'Test-surname-04',
          chat_id: 104,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          login: 'test04',
        }).fetch();

        const account02_01UuidApiKey = uuid.create();

        const account02_01 = await Account.create({
          guid: account02_01UuidApiKey.uuid,
          ref_key: account02_01UuidApiKey.apiKey,
          service: 40,
          inst_profile: 'test02_01_inst',
          client: client04.id,
        }).fetch();

        const linkAccount02_01Res = await sails.helpers.ref.linkAccountToRef.with({
          account: account02_01,
        });

        sails.log('linkAccount02_01Res: \n', linkAccount02_01Res);

      }



      /**
       * Шаг 6: Запись аккаунта 02_02 по реферальной ссылке аккаунта 01_01
       */

      const makeStep06 = false;

      if (makeStep06) {

        const step06RefAccount = await Account.findOne({
          inst_profile: 'test01_01_inst',
        });

        const client05UuidApiKey = uuid.create();

        const client05 = await Client.create({
          guid: client05UuidApiKey.uuid,
          ref_key: step06RefAccount.ref_key,
          first_name: 'Test-name-05',
          last_name: 'Test-surname-05',
          chat_id: 105,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          login: 'test05',
        }).fetch();

        const account02_02UuidApiKey = uuid.create();

        const account02_02 = await Account.create({
          guid: account02_02UuidApiKey.uuid,
          ref_key: account02_02UuidApiKey.apiKey,
          service: 40,
          inst_profile: 'test02_02_inst',
          client: client05.id,
        }).fetch();

        const linkAccount02_02Res = await sails.helpers.ref.linkAccountToRef.with({
          account: account02_02,
        });

        sails.log('linkAccount02_02Res: \n', linkAccount02_02Res);

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


