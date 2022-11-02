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
      const assignedProperty = await strapi.entityService.count(
        "api::assigned-property.assigned-property",
        {
          filters: {
            user: user.id,
          },
        }
      );

      const referrals = await strapi.entityService.count(
        "api::referral.referral",
        {
          filters: {
            user: user.id,
          },
        }
      );

      const transactions = await strapi.entityService.count(
        "api::transaction.transaction",
        {
          filters: {
            user: user.id,
          },
        }
      );

      // const jobs = await strapi.entityService.findMany("api::job.job", {
      //   sort: { createdAt: "desc" },
      // });
      // const apartments = await strapi.entityService.findMany(
      //   "api::apartment.apartment",
      //   {
      //     sort: { createdAt: "desc" },
      //   }
      // );
      // const tenants = await strapi.entityService.findMany(
      //   "api::tenant.tenant",
      //   {
      //     sort: { createdAt: "desc" },
      //   }
      // );

      // const applicantsCount = await strapi.entityService.count(
      //   "api::applicant.applicant",
      //   {
      //     filters: {
      //       status: "APPLIED",
      //     },
      //   }
      // );
      // const jobsCount = await strapi.entityService.count("api::job.job", {
      //   filters: {
      //     available: true,
      //   },
      // });

      // const apartmentsWithUnits = await strapi.entityService.findMany(
      //   "api::apartment.apartment",
      //   {
      //     filters: {
      //       availableUnits: { $ne: 0 },
      //     },
      //   }
      // );

      // const apartmentsCount = apartmentsWithUnits.reduce(
      //   (acc, apartment) => acc + apartment.availableUnits,
      //   0
      // );

      // const tenantsCount = await strapi.entityService.count(
      //   "api::tenant.tenant",
      //   {
      //     filters: {
      //       $or: [
      //         {
      //           status: "WAITING LIST",
      //         },
      //         {
      //           status: "APPLIED",
      //         },
      //       ],
      //     },
      //   }
      // );

      // const data = {
      //   applicants: {
      //     total: applicants.length,
      //     data: getEntries(applicants),
      //     text: `${applicantsCount} pending application${
      //       applicantsCount === 1 ? "" : "s"
      //     }`,
      //   },
      //   apartments: {
      //     total: apartments.length,
      //     data: getEntries(apartments),
      //     text: `${apartmentsCount} available unit${
      //       apartmentsCount === 1 ? "" : "s"
      //     }`,
      //   },
      //   tenants: {
      //     total: tenants.length,
      //     data: getEntries(tenants),
      //     text: `${tenantsCount} pending application${
      //       tenantsCount === 1 ? "" : "s"
      //     }`,
      //   },
      //   jobs: {
      //     total: jobs.length,
      //     data: getEntries(jobs),
      //     text: `${jobsCount} active job${jobsCount === 1 ? "" : "s"}`,
      //   },
      // };

      const data = {
        assignedProperty,
        referrals,
        transactions,
      };

      return { data };
    } catch (err) {
      return err;
    }
  },
});
