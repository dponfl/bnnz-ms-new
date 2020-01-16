"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'ref:linkAccountToRef';


module.exports = {


  friendlyName: 'ref:linkAccountToRef',


  description: 'Link account into the ref structure',


  inputs: {

    account: {
      friendlyName: 'account',
      description: 'Account record',
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

    const new_account_guid = inputs.account.guid;
    let used_ref_up = [new_account_guid];

    try {

      /**
       * Проверяется, есть ли записи в таблице ref для new_account_guid
       */

      const refRecForNewAccountGuid = await Ref.findOne({
        account_guid: new_account_guid,
      });

      if (refRecForNewAccountGuid == null) {
        await sails.helpers.storage.refCreate.with({
          accountGuid: new_account_guid,
        });
      }

      /**
       * Проверяется, есть ли записи в таблице ref_down
       */

      const refDownRecsNum = await RefDown.count();

      /**
       * Если таблица пустая, то создаётся инициализирующая запись
       */

      if (!refDownRecsNum) {
        const firstRecRaw = await sails.helpers.storage.refDownCreate.with({
          accountGuid: new_account_guid,
          refAccountGuid: new_account_guid,
          level: sails.config.custom.config.ref.general.initialRecLevel,
          type: sails.config.custom.enums.ref.refDownType.FIRST,
        });

        return exits.success({
          status: 'ok',
          message: 'Initial record created',
          payload: firstRecRaw.payload,
        })

      }

      /**
       * Если таблица уже была инициализирована, то выполняем провязку аккаунта
       * в реферальную систему
       */

      /**
       * Проверяем какому клиенту принадлежит аккаунт (реферальному или нет)
       */

      const client = await Client.findOne({
        id: inputs.account.client,
      });

      if (client == null) {
        throw new Error(`${moduleName}, error: No client was found for the account="${inputs.account}"`);
      }

      const refKey = client.ref_key;

      if (refKey != null) {

        /**
         * Клиент пришёл по реферальной ссылке и его аккаунты нужно привязывать
         * с использованием этой ссылки
         */

        /**
         * Достаём аккаунт, соответствующий этой реферальной ссылке
         */

        const ref_account = await Account.findOne({
          ref_key: refKey,
        });

        if (ref_account == null) {
          throw new Error(`${moduleName}, error: No account was found for the ref_key="${refKey}"`);
        }

        /**
         * Определяем как подключать новый аккаунт к ref_account
         * (напрямую или с переливом)
         */

        const refRec = await Ref.findOne({
          account_guid: ref_account.guid,
        });

        if (refRec == null) {
          throw new Error(`${moduleName}, error: No ref record was found for the ref_account.guid="${ref_account.guid}"`);
        }

        if (refRec.direct_linked_accounts_num < sails.config.custom.config.ref.general.max_direct_links) {

          /**
           * Прямое/непосредственное подключение
           */

          await linkAccount(new_account_guid, ref_account.guid, refRec, true);

        } else {

          /**
           * Подключение переливом
           */

          await linkAccount(new_account_guid, ref_account.guid, refRec, false);

        }

      } else {

        /**
         * Аккаунт принадлежит клиенту, который пришёл без реферальной ссылки
         */

        /**
         * Выбираем аккаунт для подключения к нему
         */

        const omitArray = [new_account_guid];

        const selectedRefRec = await getRandomRefRecordLessSomeAccounts(omitArray);

        if (selectedRefRec == null) {
          throw new Error(`${moduleName}, error: Could not select Ref record for new_account_guid="${new_account_guid}" and omitArray=${omitArray}`);
        }

        await Ref.updateOne({
          guid: selectedRefRec.guid
        }).set({
          direct_linked_accounts_num: ++selectedRefRec.direct_linked_accounts_num,
          total_linked_accounts_num: ++selectedRefRec.total_linked_accounts_num,
        });

        await sails.helpers.storage.refDownCreate.with({
          accountGuid: new_account_guid,
          refAccountGuid: selectedRefRec.account_guid,
          level: sails.config.custom.config.ref.general.noRefLevel,
          type: sails.config.custom.enums.ref.refDownType.NOREF,
        });

        await sails.helpers.storage.refUpCreate.with({
          accountGuid: new_account_guid,
          refAccountGuid: selectedRefRec.account_guid,
          index: 1,
        });

        used_ref_up.push(selectedRefRec.account_guid);

        await finalizeRefUpRecords(new_account_guid, used_ref_up);

      }


      return exits.success({
        status: 'ok',
        message: 'Account linked to ref structure',
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

async function linkAccount(newAccountGuid, refAccountGuid, refRec, useDirectLink) {

  /**
   * Провязка аккаунта в структуру
   */

  let use_ref_up_index = 1;
  let used_ref_up = [newAccountGuid];
  let use_ref_down_index = 1;
  let ref_down_perform = true;
  let use_account_guid = refAccountGuid;
  let use_level = 1;

  if (useDirectLink) {

    await Ref.updateOne({
      guid: refRec.guid
    }).set({
      direct_linked_accounts_num: ++refRec.direct_linked_accounts_num,
      total_linked_accounts_num: ++refRec.total_linked_accounts_num,
    });

  } else {

    await Ref.updateOne({
      guid: refRec.guid
    }).set({
      total_linked_accounts_num: ++refRec.total_linked_accounts_num,
    });

  }


  await sails.helpers.storage.refDownCreate.with({
    accountGuid: newAccountGuid,
    refAccountGuid: refAccountGuid,
    level: 1,
    type: sails.config.custom.enums.ref.refDownType.NORMAL,
  });

  /**
   * Создаём в ref_up запись с инфо о пригласившем аккаунте
   */

  await sails.helpers.storage.refUpCreate.with({
    accountGuid: newAccountGuid,
    refAccountGuid: refAccountGuid,
    index: use_ref_up_index++,
  });

  used_ref_up.push(refAccountGuid);

  if (!useDirectLink) {

    /**
     * Создаём в refDown реферальную запись для аккаунта по переливу
     */

    const omitArray = [newAccountGuid];

    const selectedRefRec = await getRandomRefRecordLessSomeAccounts(omitArray);

    if (selectedRefRec == null) {
      throw new Error(`${moduleName}, error: Could not select Ref record for new_account_guid="${new_account_guid}" and omitArray=${omitArray}`);
    }

    await Ref.updateOne({
      guid: selectedRefRec.guid
    }).set({
      direct_linked_accounts_num: ++selectedRefRec.direct_linked_accounts_num,
      total_linked_accounts_num: ++selectedRefRec.total_linked_accounts_num,
    });

    await sails.helpers.storage.refDownCreate.with({
      accountGuid: newAccountGuid,
      refAccountGuid: selectedRefRec.account_guid,
      level: sails.config.custom.config.ref.general.overFlowLevel,
      type: sails.config.custom.enums.ref.refDownType.OVERFLOW,
    });

  }

  while (use_ref_down_index < sails.config.custom.config.ref.general.max_ref_down_links - 1
  && ref_down_perform) {

    let use_ref_down_rec = await RefDown.findOne({
      account_guid: use_account_guid,
      type: sails.config.custom.enums.ref.refDownType.NORMAL,
      level: 1,
    });

    if (use_ref_down_rec != null) {

      /**
       * Такая запись найдена
       */

      use_account_guid = use_ref_down_rec.ref_account_guid;
      use_level++;

      /**
       * Создаём в RefDown новую запись
       */

      await sails.helpers.storage.refDownCreate.with({
        accountGuid: newAccountGuid,
        refAccountGuid: use_account_guid,
        level: use_level,
        type: sails.config.custom.enums.ref.refDownType.NORMAL,
      });

      use_ref_down_index++;

      if (use_ref_up_index <= sails.config.custom.config.ref.general.max_ref_up_links) {

        await sails.helpers.storage.refUpCreate.with({
          accountGuid: newAccountGuid,
          refAccountGuid: use_account_guid,
          index: use_ref_up_index,
        });

        use_ref_up_index++;
        used_ref_up.push(use_account_guid);

      }

    } else {

      /**
       * Такая запись не найдена
       */

      ref_down_perform = false;

    }

  }

  if (use_ref_up_index <= sails.config.custom.config.ref.general.max_ref_up_links) {

    await finalizeRefUpRecords(newAccountGuid, used_ref_up);

  }

  return true;
}

async function getRandomRefRecordLessSomeAccounts(omitAccountsArray) {

  const refRecs = await Ref.find({
    where: {
      direct_linked_accounts_num: {'<': sails.config.custom.config.ref.general.max_direct_links},
    },
  });

  _.remove(refRecs, (elem) => {
    return _.indexOf(omitAccountsArray, elem.account_guid) !== -1;
  });

  if (refRecs.length === 1) {
    return refRecs[0];
  } else if (refRecs.length === 0) {
    return null;
  } else {
    // return refRecs[_.random(refRecs.length - 1)];
    return refRecs[0];
  }

}

async function finalizeRefUpRecords(newAccountGuid, omitAccountsArray) {

  /**
   * Завершаем формирование записей в таблице ref_up (это актуально для случая,
   * когда длина нативной цепочки связей меньше config.ref.general.max_ref_up_links)
   */

  let ref_up_perform = true;
  let use_ref_up_index = omitAccountsArray.length;
  let selectedRefRec = null;

  while (use_ref_up_index <= sails.config.custom.config.ref.general.max_ref_up_links && ref_up_perform) {

    selectedRefRec = await getRandomRefRecordLessSomeAccounts(omitAccountsArray);

    if (selectedRefRec != null) {

      await sails.helpers.storage.refUpCreate.with({
        accountGuid: newAccountGuid,
        refAccountGuid: selectedRefRec.account_guid,
        index: use_ref_up_index,
      });

      use_ref_up_index++;
      omitAccountsArray.push(selectedRefRec.account_guid);

    } else {

      ref_up_perform = false;

    }

  }

  return true;
}

