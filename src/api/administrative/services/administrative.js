"use strict";

const utils = require("@strapi/utils");
const { ForbiddenError, NotFoundError } = utils.errors;

/**
 * administrative service
 */

module.exports = () => ({
  setPassword: async ({ id, password, token }) => {
    try {
      if (!id || !password || !token) {
        throw new ForbiddenError("Missing parameters");
      }

      const userInfo = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        id
      );

      if (!userInfo) {
        throw new NotFoundError("Invalid user");
      }

      if (userInfo.resetPasswordToken === token) {
        const entry = await strapi.entityService.update(
          "plugin::users-permissions.user",
          id,
          {
            data: {
              confirmationToken: null,
              confirmed: true,
              password,
              resetPasswordToken: null,
            },
          }
        );
        return { userInfo: entry };
      } else {
        throw new ForbiddenError("Invalid entry");
      }
    } catch (err) {
      return err;
    }
  },
});
