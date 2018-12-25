"use strict";

module.exports = {


  friendlyName: 'Load translation tokens',


  description: 'Load translation tokens from the DB',


  inputs: {

  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Load translation tokens error',
    },

  },


  fn: async function (inputs, exits) {

    // Todo: change the bellow by load from DB

    sails.config.custom.tokens = {
      en: {

        // New registration, client was not signed up

        NEW_SUBS_WELCOME_01: 'Hi',
        NEW_SUBS_WELCOME_02: 'Welcome to BonanzaInst chat bot!',
        NEW_SUBS_WELCOME_03: 'By joining our program you will not only ' +
          'improve you Instagram account but also you can ' +
          'earn money inviting your friends!',
        NEW_SUBS_ERROR_COMMAND: 'You are not registered at our service yet. ' +
          'To proceed with registration please enter /start',
        NEW_SUBS_INST_01: 'Please enter your Instagram login:',
        NEW_SUBS_INST_02: 'Please confirm that this is your Instagram login:',
        NEW_SUBS_INST_03: 'Your Instagram login was confirmed',
        NEW_SUBS_INST_04: 'Your Instagram login was not confirmed',
        NEW_SUBS_INST_05: 'You are about to start promoting your account. ',
        NEW_SUBS_INST_06: 'Please select your payment plan and make payment',
        NEW_SUBS_INST_07: 'Pls select payment plan for the next period and make payment',
        NEW_SUBS_INST_08: 'Just one final step left - please subscribe to the ' +
          'following Instagram profiles:',
        NEW_SUBS_INST_09: 'and then press the below button',

        // New registration, the client was signed up already

        NEW_SUBS_EXISTS_01: 'You already have been registered at BonanzaInst',
        NEW_SUBS_EXISTS_02: 'Pls use keyboard to upload info about new Instagram post',

        // Existing client, subscription finished

        NEW_SUBS_EXISTS_03: 'Period of your subscription ended. ' +
          'Pls use the button below to pay off the next period.',

        EXISTING_DELETED: 'Your subscription is deleted. Please contact administrator.',
        EXISTING_BANNED: 'Your subscription is blocked. Please contact administrator.',

        // General actions

        ACT_NEW_POST: 'Upload Instagram post',
        ACT_SUBSCRIBE: 'Confirm subscription',
        ACT_PAY: 'Make monthly payment',
        ACT_FAQ: 'FAQ',
        ACT_WEB: 'Web site',
        ACT_YES: 'Yes',
        ACT_NO: 'No',

        // Command actions

        CMD_LANG: 'You have changed the bot language to: ',
        CMD_LANG_EN: 'English',
        CMD_LANG_RU: 'Russian',

        // Callback query

        CB_GEN: 'We received from you the following reply:',

        // Other messages

        MSG_GENERAL: 'Got message',
        MSG_FORCED_GENERAL: 'Got some reply:',
        MSG_FORCED_WRONG_INST: 'You provided the wrong Instagram post. Please try again using the below button.',


        // Payment plans

        PLAN_BRONZE: 'Bronze: 2000 RUB/month',
        PLAN_GOLD: 'Gold: 3500 RUB/month',
        PLAN_PLATINUM: 'Platinum: 5000 RUB/month',

        PLAN_BRONZE_THANKS_MSG: 'Congratulations! Plan "Bronze" is a really good decision!',
        PLAN_GOLD_THANKS_MSG: 'Congratulations! Plan "Gold" is a really perfect decision!',
        PLAN_PLATINUM_THANKS_MSG: 'Congratulations! Plan "Platinum" is a really awesome decision!',

        PLAN_BRONZE_THANKS_MSG_02: 'Congratulations! You just paid plan "Bronze"!',
        PLAN_GOLD_THANKS_MSG_02: 'Congratulations! You just paid plan "Gold"!',
        PLAN_PLATINUM_THANKS_MSG_02: 'Congratulations! You just paid plan "Platinum"!',

        PLAN_THANKS_MSG: 'By pressing "Make payment" button you accept ' +
          'Service Terms and Conditions and will be redirected to the payment system',

        PLAN_THANKS_MSG_02: 'As your subscription is confirmed I\'ll get message and will be able to upload your posts',
        PLAN_THANKS_MSG_03: 'Ready. Now you can upload your posts using the below button',


        PLAN_PAY_BUTTON: '>>> Make payment <<<',
        PLAN_TC_BUTTON: 'Terms & Conditions',

        POST_UPLOAD_BUTTON: 'Upload Instagram post',
        POST_UPLOAD: 'Place your Instagram post',
        POST_UPLOAD_MSG: 'Your friend placed new Instagram post. ' +
          'Follow this link and put like there.',

        MSG_KEYBOARD: 'Your post was sent successfully. To upload new Instagram posts pls use the below button',

        MSG_HELP: 'Pls use the below buttons',

      },
      ru: {

        // New registration, client was not signed up

        NEW_SUBS_WELCOME_01: 'Приветствуем',
        NEW_SUBS_WELCOME_02: 'Добро пожаловать в чат BonanzaInst',
        NEW_SUBS_WELCOME_03: 'Наша программа не только ' +
          'обеспечит продвижение твоего аккаунта Инстаграм, ' +
          'но также ты сможешь получать деньги приглашая своих друзей!',
        NEW_SUBS_ERROR_COMMAND: 'Ты не зарегистрирован в этом чате. ' +
          'Для того чтобы зарегистрироваться введи команду /start',
        NEW_SUBS_INST_01: 'Введи свой логин в Инстаграм:',
        NEW_SUBS_INST_02: 'Подтверди, что это твой профиль Инстаграм:',
        NEW_SUBS_INST_03: 'Твой профиль Инстаграм подтвержден',
        NEW_SUBS_INST_04: 'Твой профиль Инстаграм не подтвержден',
        NEW_SUBS_INST_05: 'Еще немного и ты сможешь получить продвижение твоего аккаунта. ',
        NEW_SUBS_INST_06: 'Выбери план обслуживания и внеси платеж',
        NEW_SUBS_INST_07: 'Выбери план продолжения обслуживания и внеси платеж',
        NEW_SUBS_INST_08: 'Остался всего один шаг - подпишись на эти профили ' +
          'Инстаграм:',
        NEW_SUBS_INST_09: 'и после этого нажми кнопку ниже',


        // New registration, the client was signed up already

        NEW_SUBS_EXISTS_01: 'Вы уже зарегистрированы в BonanzaInst',
        NEW_SUBS_EXISTS_02: 'Используй клавиатуру, чтобы загрузить информации о новом посте ' +
          'в Инстаграм',

        // Existing client, subscription finished

        NEW_SUBS_EXISTS_03: 'Срок действия твоей подписки закончился. ' +
          'Используй кнопку ниже, чтобы оплатить следующий период.',

        EXISTING_DELETED: 'Твоя подписка удалена. Обратись к администратору.',
        EXISTING_BANNED: 'Твоя подписка заблокирована. Обратись к администратору.',


        // General actions

        ACT_NEW_POST: 'Загрузить пост Инстаграм',
        ACT_SUBSCRIBE: 'Подтверждаю подписку',
        ACT_PAY: 'Внести платеж',
        ACT_FAQ: 'Помощь',
        ACT_WEB: 'Перейти на сайт',
        ACT_YES: 'Да',
        ACT_NO: 'Нет',

        // Command actions

        CMD_LANG: 'Язык бота был изменен на: ',
        CMD_LANG_EN: 'Английский',
        CMD_LANG_RU: 'Русский',

        // Callback query

        CB_GEN: 'От вас получен следующий ответ::',

        // Other messages

        MSG_GENERAL: 'Обычное сообщение',
        MSG_FORCED_GENERAL: 'Получено сообщение:',
        MSG_FORCED_WRONG_INST: 'Введен неверный Инстаграм пост. Попробуй снова использую кнопку ниже.',


        // Payment plans

        PLAN_BRONZE: 'Брозовый: 2000 руб/месяц',
        PLAN_GOLD: 'Золотой: 3500 руб/месяц',
        PLAN_PLATINUM: 'Платиновый: 5000 руб/месяц',

        PLAN_BRONZE_THANKS_MSG: 'Поздравляем! План "Бронзовый" - это хороший выбор!',
        PLAN_GOLD_THANKS_MSG: 'Поздравляем! План "Золотой" - это отличный выбор!',
        PLAN_PLATINUM_THANKS_MSG: 'Поздравляем! План "Платиновый" - это прекрасный выбор!',

        PLAN_BRONZE_THANKS_MSG_02: 'Поздравляем! Ты оплатил план "Бронзовый"!',
        PLAN_GOLD_THANKS_MSG_02: 'Поздравляем! Ты оплатил план "Золотой"!',
        PLAN_PLATINUM_THANKS_MSG_02: 'Поздравляем! Ты оплатил план "Платиновый"!',

        PLAN_THANKS_MSG: 'Нажимая кнопку "Оплатить" ты соглашаешся с ' +
          'Условиями оказания услуг и будешь перенаправлен на платежную систему',
        PLAN_THANKS_MSG_02: 'После проверки твоей подписки ты получишь сообщение и сможешь загружать свои посты',
        PLAN_THANKS_MSG_03: 'Все готово. Теперь ты можешь загрузить свои посты используя кнопку ниже',

        PLAN_PAY_BUTTON: '>>> Оплатить <<<',
        PLAN_TC_BUTTON: 'Условиями оказания услуг',

        POST_UPLOAD_BUTTON: 'Загрузить пост Инстаграм',
        POST_UPLOAD: 'Введи ссылку на свой пост в Инстаграм',
        POST_UPLOAD_MSG: 'Твой друг разместил новый пост в Инстаграм. ' +
          'Перейди по этой ссылке и поставь лайк.',

        MSG_KEYBOARD: 'Твой пост успешно отправлен. Для отправки новых постов используй кнопку ниже',

        MSG_HELP: 'Используй клавиатуру ниже',


      },
    };

    exits.success();

  }


};

