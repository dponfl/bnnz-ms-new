"use strict";

const _ = require('lodash');

module.exports = {
  t: function (l, useToken) {
    let useLang = (_.has(token, l) ? l : 'en');
    return (!_.isNil(token[useLang][useToken]) ? token[useLang][useToken] : useToken);
  }, // t

};

const token = {
  ru: {
    MSG_OPTIN_HELLO: 'Приветствую, $firstName$',
    MSG_OPTIN_GENERAL_INFO: 'Ты знаешь, что со мной ты не только получишь продвижение твоего аккаунта в Инстаграме, но еще сможешь получать деньги, приглашая своих друзей?',
    MSG_OPTIN_GENERAL_INFO_01: 'Тебе это интересно?',
    MSG_OPTIN_GENERAL_INFO_BTN_YES: '>>> ДА <<<',
    MSG_OPTIN_GENERAL_INFO_BTN_NO: 'нет',
    MSG_OPTIN_NO_RESPONSE_01: 'Жалко, но уважаю твое решение.',
    MSG_OPTIN_NO_RESPONSE_02: 'Ты знаешь как меня найти :) Заходи, когда надумаешь и набирай /start - буду рад общению.',
    MSG_OPTIN_YES_RESPONSE_01: 'Отлично, тогда давай продолжим общение :)',
    MSG_OPTIN_GET_LOGIN_01: 'Какой твой профиль в Инстаграме?',
    MSG_OPTIN_GET_LOGIN_02: 'Напиши в поле ниже:',
    MSG_OPTIN_WRONG_INST_LOGIN: 'Это не профиль в Инстаграме. Давай попробуем снова.',
    MSG_OPTIN_PROFILE_CONFIRM_01: 'Я правильно понимаю, что это твой профиль в Инстаграме: $instagramProfile$',
    MSG_OPTIN_PROFILE_CONFIRM_02: 'Ответь с помощью кнопок ниже',
    MSG_OPTIN_PROFILE_CONFIRM_BTN_YES: 'ДА',
    MSG_OPTIN_PROFILE_CONFIRM_BTN_NO: 'НЕТ',
    MSG_OPTIN_PROFILE_CONFIRMED_PROCEED: 'Отлично. У меня для тебя есть несколько планов обслуживания.',
    MSG_OPTIN_WRONG_PROFILE_RESPONSE: 'Хорошо, давай попробуем снова :)',
    MSG_OPTIN_SELECT_SERVICE_LEVEL: 'Выбери уровень сервиса, который ты хочешь получить с помощью кнопок ниже:',
    MSG_OPTIN_SERVICE_LEVEL_BTN_PLATINUM: 'Платиновый: 5 000 руб/мес',
    MSG_OPTIN_SERVICE_LEVEL_BTN_GOLD: 'Золотой: 3 500 руб/мес',
    MSG_OPTIN_SERVICE_LEVEL_BTN_BRONZE: 'Бронзовый: 2 000 руб/мес',
    MSG_OPTIN_SERVICE_LEVEL_BTN_DESC: 'Описание уровней сервиса',
    MSG_OPTIN_CHANGE_SERVICE_LEVEL: 'Хочешь выбрать другой тариф? Не проблема :)',
    MSG_OPTIN_PAYMENT_PLATINUM: 'Поздравляю! План "Платиновый" - это прекрасный выбор!',
    MSG_OPTIN_PAYMENT_GOLD: 'Поздравляю! План "Золотой" - это отличный выбор!',
    MSG_OPTIN_PAYMENT_BRONZE: 'Поздравляю! План "Бронзовый" - это хороший выбор!',
    MSG_OPTIN_PAYMENT_SHOW_SLA: 'Нажми кнопку ОПЛАТИТЬ ниже. Этим ты соглашаешься с "Условиями предоставления услуг" и будешь перенаправлен в платежную систему.',
    MSG_OPTIN_PAYMENT_CHANGE_SERVICE: 'Если ты хочешь выбрать другой план обслуживания, нажми кнопку "Выбрать другой тариф"',
    MSG_OPTIN_PAYMENT_BTN_PAY: '>>> ОПЛАТИТЬ <<<',
    MSG_OPTIN_PAYMENT_BTN_SHOW_SERVICE_AGREEMENT: 'Условия предоставления услуг',
    MSG_OPTIN_PAYMENT_BTN_CHANGE_SERVICE: 'Выбрать другой тариф',
    MSG_OPTIN_PAYMENT_PLATINUM_RECEIVED: 'Оплата плана "Платиновый" получена.',
    MSG_OPTIN_PAYMENT_SIGN_PROFILES: 'Остался последний шаг - подпишись на эти профили в Инстаграме и после этого нажми кнопку ниже:',
    MSG_OPTIN_MANDATORY_PROFILES: '$mandatoryProfiles$',
    MSG_OPTIN_BTN_SUBS_CONFIRM: '>>> ПОДТВЕРЖДАЮ ПОДПИСКУ <<<',
  },
};
