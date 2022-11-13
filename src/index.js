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
      // async afterUpdate(event) {},
      async afterCreate(event) {
        const { result, params } = event;
        const referredBy = params?.data?.referredBy || null;

        if (referredBy) {
          const referralExists = await strapi.entityService.findMany(
            "api::referral.referral",
            {
              filters: {
                user: referredBy,
                email: result.email,
              },
            }
          );

          if (referralExists.length === 0) {
            await strapi.entityService.create("api::referral.referral", {
              data: {
                user: referredBy,
                referralName: result.firstName,
                email: result.email,
                referredUser: result.id,
                status: 1,
              },
            });
          } else {
            await strapi.entityService.update(
              "api::referral.referral",
              referralExists?.[0]?.id,
              {
                data: {
                  status: 1,
                  referredUser: result.id,
                },
              }
            );
          }
        }

        if (!result.resetPasswordToken) {
          await strapi.config.email.send(strapi, {
            to: result.email,
            subject: `Welcome to Blissville`,
            firstName: result.firstName,
            contentTop: `Thank you for applying registering on Blissville. <br><br>
            Your account has been successfully created. Complete your registration by clicking on the link below to verify your email.`,
            contentBottom: `Best Regards,<br>
            Operation's Team.`,
            buttonText: "Verify Email",
            buttonLink: `${process.env.FRONT_END_URL}/app/set-password?id=${result.confirmationToken}`,
          });
        }
      },
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
