"use strict";

const utils = require("@strapi/utils");
const { ForbiddenError, NotFoundError } = utils.errors;

/**
 * administrative service
 */
const sliceEntries = (array, number) => array.slice(0, number);
const getEntries = (array, number = 3, withAttributes = false) => {
  const arr = sliceEntries(array, number);

  if (!withAttributes) return arr;

  return arr.map((item) => {
    return {
      id: item.id,
      attributes: { ...item },
    };
  });
};

const getUserTransactions = async (user) => {
  const transactions = await strapi.entityService.findMany(
    "api::transaction.transaction",
    {
      filters: {
        user: user.id,
      },
      sort: { createdAt: "desc" },
      populate: {
        property: {
          fields: ["id", "name", "slug"],
          populate: {
            project: {
              fields: ["id", "name", "slug"],
            },
          },
        },
      },
    }
  );
  return transactions;
};

const getUserNextPayments = async (user) => {
  const nextPayments = await strapi.entityService.findMany(
    "api::assigned-property.assigned-property",
    {
      filters: {
        $and: [
          {
            user: user.id,
          },
          {
            status: { $lt: 3 }, // payment is not completed
          },
        ],
      },
      populate: {
        property: {
          fields: ["id", "name"],
        },
        project: {
          fields: ["id", "name"],
        },
      },
    }
  );

  return nextPayments;
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
      const assignedProperty = await getUserNextPayments(user);
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

      const transactions = await getUserTransactions(user);

      const transactionCount = await strapi.entityService.count(
        "api::transaction.transaction",
        {
          filters: {
            user: user.id,
          },
        }
      );

      const transactionsAmount = transactions.reduce((acc, cur) => {
        return acc + parseInt(cur.amount, 10);
      }, 0);

      const expectedNextPayment = assignedProperty.reduce((acc, cur) => {
        return acc + parseInt(cur.expectedNextPayment, 10);
      }, 0);

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
        paymentBreakdown: {
          amountPaid: transactionsAmount,
          expectedNextPayment,
          referral: 0,
        },
      };

      return { data };
    } catch (err) {
      return err;
    }
  },
  getUserTransactions: async (user) => {
    try {
      if (!user) {
        throw new ForbiddenError("User information not found");
      }

      const transactions = await getUserTransactions(user);

      const nextPayments = await getUserNextPayments(user);

      const offlinePayments = await strapi.entityService.findMany(
        "api::offline-payment.offline-payment",
        {
          filters: {
            $and: [
              {
                user: user.id,
              },
              {
                status: { $eq: 0 }, // payment is still pending
              },
            ],
          },
          populate: {
            assignedProperty: {
              populate: {
                property: {
                  populate: {
                    project: {
                      fields: ["id", "name", "slug"],
                    },
                  },
                },
              },
            },
          },
        }
      );

      const data = {
        transactions,
        nextPayments,
        offlinePayments,
      };

      return { data };
    } catch (err) {
      return err;
    }
  },
});
