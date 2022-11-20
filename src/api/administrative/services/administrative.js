"use strict";

const utils = require("@strapi/utils");
const { ForbiddenError, NotFoundError } = utils.errors;
const { v4: uuidv4 } = require("uuid");

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

const getAdminTransactions = async (user) => {
  const transactions = await strapi.entityService.findMany(
    "api::transaction.transaction",
    {
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

const getAdminNextPayments = async (user) => {
  const nextPayments = await strapi.entityService.findMany(
    "api::assigned-property.assigned-property",
    {
      filters: {
        $and: [
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
  forgotPassword: async ({ email }) => {
    try {
      const randomText = uuidv4();
      const resetPasswordToken = randomText.slice(0, -6);
      if (!email) {
        throw new ForbiddenError("Missing parameters");
      }

      const userInfo = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          filters: {
            $and: [
              {
                email,
              },
            ],
          },
        }
      );

      if (userInfo?.length === 0) {
        throw new NotFoundError("Invalid user");
      }
      const user = userInfo[0];

      const entry = await strapi.entityService.update(
        "plugin::users-permissions.user",
        user.id,
        {
          data: {
            resetPasswordToken,
          },
        }
      );
      await strapi.config.email.send(strapi, {
        to: user.email,
        subject: `Password reset request`,
        firstName: user.firstName,
        contentTop: `There was a request to change your password! <br><br>
        If you did not make this request then please ignore this email. <br><br>
        Otherwise, please click this link to change your password: <br><br>`,
        contentBottom: `Best Regards,<br>
        Operation's Team.`,
        buttonText: "Reset Password",
        buttonLink: `${process.env.FRONT_END_URL}/app/reset-password?id=${user.id}&token=${resetPasswordToken}`,
      });
      return { success: true };
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
  getAdminDashboard: async () => {
    try {
      const projectCount = await strapi.entityService.count(
        "api::project.project"
      );
      const userCount = await strapi.entityService.count(
        "plugin::users-permissions.user"
      );
      const propertyCount = await strapi.entityService.count(
        "api::property.property"
      );
      const interestCount = await strapi.entityService.count(
        "api::interest.interest"
      );

      const contactCount = await strapi.entityService.count(
        "api::contact.contact"
      );
      const visitationCount = await strapi.entityService.count(
        "api::visitation.visitation"
      );

      const transactionCount = await strapi.entityService.count(
        "api::transaction.transaction"
      );

      const slideshowCount = await strapi.entityService.count(
        "api::project.project",
        {
          filters: {
            featured: true,
          },
        }
      );

      const data = {
        projects: {
          total: projectCount,
        },
        messages: {
          total: contactCount,
        },
        properties: {
          total: propertyCount,
        },
        interests: {
          total: interestCount,
        },
        users: {
          total: userCount,
        },
        visitations: {
          total: visitationCount,
        },
        transactions: {
          total: transactionCount,
        },
        slideshows: {
          total: slideshowCount,
        },
      };

      return { data };
    } catch (err) {
      return err;
    }
  },
  getAdminTransactions: async () => {
    try {
      const transactions = await getAdminTransactions();
      const nextPayments = await getAdminNextPayments();
      const offlinePayments = await strapi.entityService.findMany(
        "api::offline-payment.offline-payment",
        {
          filters: {
            $and: [
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
