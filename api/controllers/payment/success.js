"use strict";

/**
 * payment/success.js
 *
 * Success payment.
 */

const moduleName = 'api:controllers:payment:success';


module.exports = async function success(req, res) {

  try {

    const allParams = req.allParams();

    // TODO: Delete after QA
    await LogProcessor.info({
      message: 'Payment success action',
      location: moduleName,
      payload: {
        allParams,
      },
    });


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

    const paymentSuccessParams = {
      amount,
      orderId,
      clientGuid: cid,
      accountGuid: aid,
      paymentGroupGuid: gtid,
    };

    const paymentSuccessRaw = await sails.helpers.payments.onPaymentSuccess(paymentSuccessParams);

    if (
      _.isNil(paymentSuccessRaw.status)
      || paymentSuccessRaw.status !== 'success'
    ) {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.ERROR,
        location: moduleName,
        message: `Missing paymentSuccessRaw.status or it is not success`,
        errorName: 'Unexpected "onPaymentSuccess" helper response',
        payload: {
          paymentSuccessParams,
          paymentSuccessRaw,
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
