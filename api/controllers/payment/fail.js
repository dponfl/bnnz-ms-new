"use strict";

/**
 * payment/fail.js
 *
 * Failed payment.
 */

const moduleName = 'api:controllers:payment:fail';


module.exports = async function success(req, res) {

  try {

    // TODO: Delete after QA
    await LogProcessor.info({
      message: 'Payment fail action',
      location: moduleName,
    });

    const allParams = req.allParams();

    /**
     * Проверка наличия необходимых параметров в запросе
     */

    const signature = _.get(allParams, 'signature', null);

    if (_.isNil(signature)) {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
        location: moduleName,
        message: `Missing "signature" parameter`,
        errorName: 'Wrong request content',
        payload: {
          allParams,
        },
      });
    }

    const amount = _.get(allParams, 'amount', null);

    if (_.isNil(amount)) {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
        location: moduleName,
        message: `Missing "amount" parameter`,
        errorName: 'Wrong request content',
        payload: {
          allParams,
        },
      });
    }

    const orderId = _.get(allParams, 'orderId', null);

    if (_.isNil(orderId)) {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
        location: moduleName,
        message: `Missing "orderId" parameter`,
        errorName: 'Wrong request content',
        payload: {
          allParams,
        },
      });
    }

    const cid = _.get(allParams, 'cid', null);

    if (_.isNil(cid)) {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
        location: moduleName,
        message: `Missing "cid" parameter`,
        errorName: 'Wrong request content',
        payload: {
          allParams,
        },
      });
    }

    const aid = _.get(allParams, 'aid', null);

    if (_.isNil(aid)) {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
        location: moduleName,
        message: `Missing "aid" parameter`,
        errorName: 'Wrong request content',
        payload: {
          allParams,
        },
      });
    }

    const gtid = _.get(allParams, 'gtid', null);

    if (_.isNil(gtid)) {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
        location: moduleName,
        message: `Missing "gtid" parameter`,
        errorName: 'Wrong request content',
        payload: {
          allParams,
        },
      });
    }

    /**
     * Проверяем корректность данных
     */

    const hashData = {
      amount,
      orderId,
      cid,
      aid,
      gtid,
    };

    const checkSignatureParams = {
      signature,
      data: hashData,
    };

    const signatureCheckRes = await sails.helpers.security.checkSignature(checkSignatureParams);

    if (!signatureCheckRes) {

      return res.json({
        status: 'fail',
      });

    }

    const paymentFailParams = {
      amount,
      orderId,
      clientGuid: cid,
      accountGuid: aid,
      paymentGroupGuid: gtid,
    };

    const paymentFailRaw = await sails.helpers.payments.onPaymentFail(paymentFailParams);

    if (
      _.isNil(paymentFailRaw.status)
      || paymentFailRaw.status !== 'success'
    ) {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.ERROR,
        location: moduleName,
        message: `Missing paymentFailRaw.status or it is not success`,
        errorName: 'Unexpected "onPaymentFail" helper response',
        payload: {
          paymentFailParams,
          paymentFailRaw,
        },
      });
    }

    return res.json({
      status: 'success',
    });


  } catch (e) {
    const throwError = false;
    if (throwError) {
      return await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError,
      });
    } else {
      await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError,
      });
      return res.json({
        status: 'error',
      });
    }
  }

};
