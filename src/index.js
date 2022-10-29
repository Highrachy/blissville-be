"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {
    strapi.db.lifecycles.subscribe({
      models: ["plugin::users-permissions.user"],
      async beforeUpdate(event) {},
      async afterUpdate(event) {},
      async afterCreate(event) {},
      async beforeCreate(event) {
        const randomText = uuidv4();
        const { data } = event.params;
        const firstLetter = data.firstName[0] + data.lastName[0];
        const allUsers = await strapi.entityService.count(
          "plugin::users-permissions.user"
        );
        data.confirmationToken = randomText.slice(0, -6);
        data.confirmed = false;
        data.referralCode =
          firstLetter.toLowerCase() + (1000 + allUsers).toString();
      },
    });
  },
};
