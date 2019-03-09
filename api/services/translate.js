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
  },
};
