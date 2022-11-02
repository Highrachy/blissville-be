"use strict";

const utils = require("@strapi/utils");
const { add, parseISO, subDays } = require("date-fns");
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
      console.log("assignedProperty: ", assignedProperty);
      const referrals = await strapi.entityService.count(
        "api::referral.referral",
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
      };

      return { data };
    } catch (err) {
      return err;
    }
  },
  getNextPayment: async () => {
    try {
      let output;
      // get last assigned property
      const assignedProperty = {
        id: 6,
        price: 4_000_000,
        paymentPlan: 4,
        initialPayment: 2_000_000,
        paymentStartDate: "2021-03-01T00:00:00.000Z",
        package: "Shell Package",
        status: "0",
        createdAt: "2022-10-31T06:27:52.140Z",
        updatedAt: "2022-10-31T06:27:52.140Z",
      };

      const paymentSchedules = generatePaymentSchedules(assignedProperty);
      const amountPaid = 0;
      const expectedTotal = calculateExpectedTotal(
        amountPaid,
        paymentSchedules
      );

      const interestInfo = await strapi.entityService.findMany(
        "api::assigned-property.assigned-property",
        {
          populate: {
            project: {
              fields: ["id", "name"],
            },
          },
          fields: ["id"],
        }
      );

      return { expectedTotal, interestInfo };
    } catch (err) {
      return err;
    }
  },
});

const generatePaymentSchedules = (assignedProperty) => {
  const {
    price: propertyPrice,
    paymentStartDate: initialPaymentDate,
    initialPayment,
    paymentPlan: noOfPaymentsAfterInitial,
  } = assignedProperty;

  const monthlyPayment =
    (propertyPrice - initialPayment) / noOfPaymentsAfterInitial;
  console.log("monthlyPayment: ", monthlyPayment);

  const paymentDates = [
    { date: parseISO(initialPaymentDate), amount: initialPayment },
  ];

  for (let i = 1; i <= noOfPaymentsAfterInitial; i += 1) {
    const paymentDate = add(parseISO(initialPaymentDate), { days: 30 * i });
    paymentDates.push({
      date: paymentDate,
      amount: monthlyPayment,
    });
  }

  return paymentDates;
};

const calculateExpectedTotal = (amountPaid, paymentSchedules) => {
  const todaysDate = parseISO("2021-03-08");
  const frequency = 30;

  return paymentSchedules.reduce(
    (result, schedule) => {
      const scheduleHasExpired =
        subDays(schedule.date, frequency) <= todaysDate;
      const userHasPaidForPastSchedule = amountPaid >= result.expectedTotal;

      if (scheduleHasExpired || userHasPaidForPastSchedule) {
        const expectedTotal = result.expectedTotal + schedule.amount;
        return {
          expectedTotal, // for internal use to get the total amount expected
          expectedNextPayment: expectedTotal - amountPaid, // shown in ui
          expiryDate: schedule.date, // used by cron job
          dueDate:
            userHasPaidForPastSchedule || result.dueDate === null
              ? schedule.date
              : result.dueDate, // shown in the UI
        };
      }

      return result;
    },
    {
      expectedTotal: 0,
      expectedNextPayment: 0,
      expiryDate: null,
      dueDate: null,
    }
  );
};
// 35,0000
// initialPayment
