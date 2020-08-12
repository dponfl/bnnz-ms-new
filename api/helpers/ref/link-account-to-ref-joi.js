"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'ref:link-account-to-ref-joi';


module.exports = {


  friendlyName: 'ref:link-account-to-ref-joi',


  description: 'Link account into the ref structure',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
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

    const schema = Joi.object({
      account: Joi
        .any()
        .description('Account record')
        .required(),
    });

    let input;

    let accountGuid;


    let new_account_guid;
    let used_ref_up;

    const refUpRes = [];
    const refDownRes = [];

    try {

      input = await schema.validateAsync(inputs.params);

      accountGuid = input.account.guid;


      new_account_guid = input.account.guid;
      used_ref_up = [new_account_guid];

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

        if (firstRecRaw.status === 'ok') {
          refDownRes.push(firstRecRaw.payload);
        } else {
          // throw new Error(`${moduleName}, error, refDownCreate error:
          // firstRecRaw: ${JSON.stringify(firstRecRaw, null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'refDownCreate error',
            accountGuid,
            errorName: sails.config.custom.REF_ERROR.name,
            payload: {
              firstRecRaw,
            },
          });

        }

        return exits.success({
          status: 'ok',
          message: 'Initial record created',
          payload: {
            refDown: refDownRes,
            refUp: null,
          },
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
        id: input.account.client,
      });

      if (client == null) {
        // throw new Error(`${moduleName}, error: No client was found for:
        //  account:"${JSON.stringify(input.account, null, 3)}"`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No client record found for account',
          accountGuid,
          errorName: sails.config.custom.REF_ERROR.name,
          payload: {
            account: input.account,
          },
        });

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
          // throw new Error(`${moduleName}, error: No account was found for the ref_key="${refKey}"`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No account record was found for the ref_key',
            accountGuid,
            errorName: sails.config.custom.REF_ERROR.name,
            payload: {
              refKey,
            },
          });

        }

        /**
         * Определяем как подключать новый аккаунт к ref_account
         * (напрямую или с переливом)
         */

        const refRec = await Ref.findOne({
          account_guid: ref_account.guid,
        });

        if (refRec == null) {
          // throw new Error(`${moduleName}, error: No ref record was found for the ref_account.guid="${ref_account.guid}"`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No ref record was found for the ref_account.guid',
            accountGuid,
            errorName: sails.config.custom.REF_ERROR.name,
            payload: {
              refAccountGuid: ref_account.guid,
            },
          });

        }

        if (refRec.direct_linked_accounts_num < sails.config.custom.config.ref.general.max_direct_links) {

          /**
           * Прямое/непосредственное подключение
           */

          await linkAccount(refDownRes, refUpRes, new_account_guid, ref_account.guid, refRec, true);

        } else {

          /**
           * Подключение переливом
           */

          await linkAccount(refDownRes, refUpRes, new_account_guid, ref_account.guid, refRec, false);

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
          // throw new Error(`${moduleName}, error: Could not select Ref record for new_account_guid="${new_account_guid}" and omitArray=${omitArray}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No Ref record found for new_account_guid and omitArray',
            accountGuid,
            errorName: sails.config.custom.REF_ERROR.name,
            payload: {
              new_account_guid,
              omitArray,
            },
          });

        }

        await Ref.updateOne({
          guid: selectedRefRec.guid
        }).set({
          direct_linked_accounts_num: ++selectedRefRec.direct_linked_accounts_num,
          total_linked_accounts_num: ++selectedRefRec.total_linked_accounts_num,
        });

        const refDownCreateRawParams = {
          accountGuid: new_account_guid,
          refAccountGuid: selectedRefRec.account_guid,
          level: sails.config.custom.config.ref.general.noRefLevel,
          type: sails.config.custom.enums.ref.refDownType.NOREF,
        };

        const refDownCreateRaw = await sails.helpers.storage.refDownCreate.with(refDownCreateRawParams);

        if (refDownCreateRaw.status === 'ok') {
          refDownRes.push(refDownCreateRaw.payload);
        } else {
          // throw new Error(`${methodName}, error: refDownCreate error:
          // params: ${JSON.stringify(refDownCreateRawParams, null, 3)}
          // refDownCreateRaw: ${JSON.stringify(refDownCreateRaw, null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'refDownCreate error',
            accountGuid,
            errorName: sails.config.custom.REF_ERROR.name,
            payload: {
              refDownCreateRawParams,
              refDownCreateRaw,
            },
          });

        }

        const refUpCreateRawParams = {
          accountGuid: new_account_guid,
          refAccountGuid: selectedRefRec.account_guid,
          index: 1,
        };

        const refUpCreateRaw = await sails.helpers.storage.refUpCreate.with(refUpCreateRawParams);

        if (refUpCreateRaw.status === 'ok') {

          refUpRes.push(refUpCreateRaw.payload);
          used_ref_up.push(selectedRefRec.account_guid);

        } else {
          // throw new Error(`${methodName}, error: refUpCreate error:
          // params: ${JSON.stringify(refUpCreateRawParams, null, 3)}
          // refDownCreateRaw: ${JSON.stringify(refUpCreateRaw, null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'refUpCreate error',
            accountGuid,
            errorName: sails.config.custom.REF_ERROR.name,
            payload: {
              refUpCreateRawParams,
              refUpCreateRaw,
            },
          });

        }


        await finalizeRefUpRecords(refUpRes, new_account_guid, used_ref_up);

      }


      return exits.success({
        status: 'ok',
        message: 'Account linked to ref structure',
        payload: {
          accountGuid: new_account_guid,
          refDown: refDownRes,
          refUp: refUpRes,
        },
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};

async function linkAccount(refDownRes, refUpRes, newAccountGuid, refAccountGuid, refRec, useDirectLink) {

  const methodName = moduleName + ':linkAccount';

  const accountGuid = newAccountGuid;

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

  const refDownCreateRawParams = {
    accountGuid: newAccountGuid,
    refAccountGuid: refAccountGuid,
    level: 1,
    type: sails.config.custom.enums.ref.refDownType.NORMAL,
  };

  const refDownCreateRaw = await sails.helpers.storage.refDownCreate.with(refDownCreateRawParams);

  if (refDownCreateRaw.status === 'ok') {
    refDownRes.push(refDownCreateRaw.payload);
  } else {
    throw new Error(`${methodName}, error: refDownCreate error:
    params: ${JSON.stringify(refDownCreateRawParams, null, 3)}
    refDownCreateRaw: ${JSON.stringify(refDownCreateRaw, null, 3)}`);
  }

  /**
   * Создаём в ref_up запись с инфо о пригласившем аккаунте
   */

  const refUpCreateRawParams = {
    accountGuid: newAccountGuid,
    refAccountGuid: refAccountGuid,
    index: use_ref_up_index++,
  };

  const refUpCreateRaw = await sails.helpers.storage.refUpCreate.with(refUpCreateRawParams);

  if (refUpCreateRaw.status === 'ok') {

    refUpRes.push(refUpCreateRaw.payload);
    used_ref_up.push(refAccountGuid);

  } else {
    // throw new Error(`${methodName}, error: refUpCreate error:
    // params: ${JSON.stringify(refUpCreateRawParams, null, 3)}
    // refDownCreateRaw: ${JSON.stringify(refUpCreateRaw, null, 3)}`);

    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.ERROR,
      location: methodName,
      message: 'refUpCreate error',
      accountGuid,
      errorName: sails.config.custom.REF_ERROR.name,
      payload: {
        refUpCreateRawParams,
        refUpCreateRaw,
      },
    });

  }


  if (!useDirectLink) {

    /**
     * Создаём в refDown реферальную запись для аккаунта по переливу
     */

    const omitArray = [newAccountGuid];

    const selectedRefRec = await getRandomRefRecordLessSomeAccounts(omitArray);

    if (selectedRefRec == null) {
      // throw new Error(`${moduleName}, error: Could not select Ref record for:
      // newAccountGuid: "${newAccountGuid}"
      // omitArray: ${JSON.stringify(omitArray, null, 3)}`);
      // sails.log.error(`${moduleName}, error: Could not select Ref record for:
      // newAccountGuid: "${newAccountGuid}"
      // omitArray: ${JSON.stringify(omitArray, null, 3)}`);

      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.WARN,
        location: methodName,
        message: 'Could not select Ref record',
        accountGuid,
        errorName: sails.config.custom.REF_ERROR.name,
        payload: {
          newAccountGuid,
          omitArray,
        },
      });

    } else {

      await Ref.updateOne({
        guid: selectedRefRec.guid
      }).set({
        direct_linked_accounts_num: ++selectedRefRec.direct_linked_accounts_num,
        total_linked_accounts_num: ++selectedRefRec.total_linked_accounts_num,
      });

      const refDownCreateRawParams = {
        accountGuid: newAccountGuid,
        refAccountGuid: selectedRefRec.account_guid,
        level: sails.config.custom.config.ref.general.overFlowLevel,
        type: sails.config.custom.enums.ref.refDownType.OVERFLOW,
      };

      const refDownCreateRaw = await sails.helpers.storage.refDownCreate.with(refDownCreateRawParams);

      if (refDownCreateRaw.status === 'ok') {
        refDownRes.push(refDownCreateRaw.payload);
      } else {
    //     throw new Error(`${methodName}, error: refDownCreate error:
    // params: ${JSON.stringify(refDownCreateRawParams, null, 3)}
    // refDownCreateRaw: ${JSON.stringify(refDownCreateRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: methodName,
          message: 'refDownCreate error',
          accountGuid,
          errorName: sails.config.custom.REF_ERROR.name,
          payload: {
            refDownCreateRawParams,
            refDownCreateRaw,
          },
        });

      }

    }

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

      const refDownCreateRawParams = {
        accountGuid: newAccountGuid,
        refAccountGuid: use_account_guid,
        level: use_level,
        type: sails.config.custom.enums.ref.refDownType.NORMAL,
      };

      const refDownCreateRaw = await sails.helpers.storage.refDownCreate.with(refDownCreateRawParams);

      if (refDownCreateRaw.status === 'ok') {
        refDownRes.push(refDownCreateRaw.payload);
      } else {
      //   throw new Error(`${methodName}, error: refDownCreate error:
      // params: ${JSON.stringify(refDownCreateRawParams, null, 3)}
      // refDownCreateRaw: ${JSON.stringify(refDownCreateRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: methodName,
          message: 'refDownCreate error',
          accountGuid,
          errorName: sails.config.custom.REF_ERROR.name,
          payload: {
            refDownCreateRawParams,
            refDownCreateRaw,
          },
        });

      }

      use_ref_down_index++;

      if (use_ref_up_index <= sails.config.custom.config.ref.general.max_ref_up_links) {

        const refUpCreateParams = {
          accountGuid: newAccountGuid,
          refAccountGuid: use_account_guid,
          index: use_ref_up_index,
        };

        const refUpCreateRaw = await sails.helpers.storage.refUpCreate.with(refUpCreateParams);

        if (refUpCreateRaw.status === 'ok') {

          refUpRes.push(refUpCreateRaw.payload);
          used_ref_up.push(use_account_guid);

        } else {
        //   throw new Error(`${methodName}, error: refUpCreate error:
        // params: ${JSON.stringify(refUpCreateRawParams, null, 3)}
        // refDownCreateRaw: ${JSON.stringify(refUpCreateRaw, null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: methodName,
            message: 'refUpCreate error',
            accountGuid,
            errorName: sails.config.custom.REF_ERROR.name,
            payload: {
              refUpCreateRawParams,
              refUpCreateRaw,
            },
          });

        }

        use_ref_up_index++;

      }

    } else {

      /**
       * Такая запись не найдена
       */

      ref_down_perform = false;

    }

  }

  if (use_ref_up_index <= sails.config.custom.config.ref.general.max_ref_up_links) {

    await finalizeRefUpRecords(refUpRes, newAccountGuid, used_ref_up);

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
    /**
     * Таким образом мы в первую очередь линкуем аккаунты, которые пришли
     * в реферальную систему раньше в отличае от случайного выбора аккаунта
     */
    // return refRecs[_.random(refRecs.length - 1)];
    return refRecs[0];
  }

}

async function finalizeRefUpRecords(refUpRes, newAccountGuid, omitAccountsArray) {

  /**
   * Завершаем формирование записей в таблице ref_up (это актуально для случая,
   * когда длина нативной цепочки связей меньше config.ref.general.max_ref_up_links)
   */

  const methodName = moduleName + ':finalizeRefUpRecords';

  const accountGuid = newAccountGuid;

  let ref_up_perform = true;
  let use_ref_up_index = omitAccountsArray.length;
  let selectedRefRec = null;

  while (use_ref_up_index <= sails.config.custom.config.ref.general.max_ref_up_links && ref_up_perform) {

    selectedRefRec = await getRandomRefRecordLessSomeAccounts(omitAccountsArray);

    if (selectedRefRec != null) {

      const refUpCreateParams = {
        accountGuid: newAccountGuid,
        refAccountGuid: selectedRefRec.account_guid,
        index: use_ref_up_index,
      };

      const refUpCreateRaw = await sails.helpers.storage.refUpCreate.with(refUpCreateParams);

      if (refUpCreateRaw.status === 'ok') {

        refUpRes.push(refUpCreateRaw.payload);
        omitAccountsArray.push(selectedRefRec.account_guid);

      } else {
        // throw new Error(`${methodName}, error: refUpCreate error:
        // params: ${JSON.stringify(refUpCreateRawParams, null, 3)}
        // refDownCreateRaw: ${JSON.stringify(refUpCreateRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: methodName,
          message: 'refUpCreate error',
          accountGuid,
          errorName: sails.config.custom.REF_ERROR.name,
          payload: {
            refUpCreateParams,
            refUpCreateRaw,
          },
        });

      }

      use_ref_up_index++;

    } else {

      ref_up_perform = false;

    }

  }

  return true;
}

