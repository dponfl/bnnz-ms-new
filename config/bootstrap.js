/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

const TelegramBot = require('node-telegram-bot-api');


module.exports.bootstrap = async function() {

  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up fake development data (or if we already have some, avast)
  // if (await User.count() > 0) {
  //   return;
  // }
  //
  // await User.createEach([
  //   { emailAddress: 'ry@example.com', fullName: 'Ryan Dahl', },
  //   { emailAddress: 'rachael@example.com', fullName: 'Rachael Shaw', },
  //   // etc.
  // ]);
  // ```

  sails.config.custom.telegramBot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
    polling: {
      interval: 300,
      autoStart: true,
      params: {
        timeout: 10
      }
    }
  });

  await sails.helpers.general.getConfig();

  // await sails.helpers.general.activateSchedule();

  // await sails.helpers.chatListeners.telegram.test();

  await sails.helpers.chatListeners.telegram.onText();
  await sails.helpers.chatListeners.telegram.onCallbackQuery();
  await sails.helpers.chatListeners.telegram.onPreCheckoutQuery();
  await sails.helpers.chatListeners.telegram.onSuccessfulPayment();

  await sails.helpers.general.pushPendingOnboarding();

  // await sails.helpers.general.schedule.analyticsHourly();
  // await sails.helpers.general.schedule.analyticsDaily();
  // await sails.helpers.general.schedule.analyticsWeekly();
  // await sails.helpers.general.schedule.analyticsMonthly();

  // await sails.helpers.test.ref.linkAccountToRef();

  // await sails.helpers.test.general.allocateRooms();
  // await sails.helpers.test.general.test();
};
