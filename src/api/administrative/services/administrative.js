"use strict";

const utils = require("@strapi/utils");
const { ForbiddenError, NotFoundError } = utils.errors;

/**
 * administrative service
 */

const getEntries = (array) => {
  return arr.map((item) => {
    return {
      id: item.id,
      attributes: { ...item },
    };
  });
};

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
        if (!userInfo.resetPasswordToken) {
          throw new ForbiddenError(
            "It looks like the token has already been used"
          );
        }
        throw new ForbiddenError("Invalid token");
      }
    } catch (err) {
      return err;
    }
  },
  getUserDashboard: async (user) => {
    try {
      if (!user) {
        throw new ForbiddenError("User information not found");
      }
      const assignedProperty = await strapi.entityService.findMany(
        "api::assigned-property.assigned-property",
        {
          filters: {
            $and: [
              {
                user: user.id,
              },
              {
                status: { $lt: 3 },
              },
            ],
          },
        }
      );
      const assignedPropertyCount = await strapi.entityService.count(
        "api::assigned-property.assigned-property",
        {
          filters: {
            user: user.id,
          },
        }
      );

      const referralsCount = await strapi.entityService.count(
        "api::referral.referral",
        {
          filters: {
            user: user.id,
          },
        }
      );

      const transactions = await strapi.entityService.findMany(
        "api::transaction.transaction",
        {
          filters: {
            user: user.id,
          },
          sort: { createdAt: "desc" },
          limit: 3,
        }
      );

      const transactionCount = await strapi.entityService.findMany(
        "api::transaction.transaction",
        {
          filters: {
            user: user.id,
          },
          sort: { createdAt: "desc" },
          limit: 3,
        }
      );
      const data = {
        assignedProperty: {
          total: assignedPropertyCount,
          data: getEntries(assignedProperty),
        },
        referrals: {
          total: referralsCount,
        },
        transactions: {
          total: transactionCount,
          data: getEntries(transactions),
        },
      };

      return { data };
    } catch (err) {
      return err;
    }
  },
});
