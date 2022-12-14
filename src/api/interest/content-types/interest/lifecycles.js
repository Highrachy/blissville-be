const STATUS = {
  INTERESTED: 0,
  CANCELLED: 1,
  ASSIGNED: 2,
};

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async afterUpdate({ result }) {
    const randomText = uuidv4();
    const resetPasswordToken = randomText.slice(0, -6);
    const password = randomText.slice(-8);
    if (result.status === STATUS.ASSIGNED) {
      const interestInfo = await strapi.entityService.findOne(
        "api::interest.interest",
        result.id,
        {
          populate: {
            property: {
              fields: ["id", "name"],
              populate: {
                project: {
                  fields: ["id", "name"],
                },
              },
            },
          },
          fields: ["id"],
        }
      );

      const userExists = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          populate: "*",
          filters: {
            email: result.email,
          },
        }
      );

      let currentUser = userExists?.[0];

      if (userExists.length === 0) {
        const newUser = await strapi.entityService.create(
          "plugin::users-permissions.user",
          {
            data: {
              firstName: result.firstName,
              lastName: result.lastName,
              email: result.email,
              username: result.email,
              phone: result.phone,
              password,
              provider: "local",
              role: 1,
              resetPasswordToken,
              referredBy: result.referredBy,
            },
          }
        );
        currentUser = newUser;
      }

      const propertyAlreadyAssigned = await strapi.entityService.findMany(
        "api::assigned-property.assigned-property",
        {
          filters: {
            property: interestInfo.property.id,
            user: currentUser.id,
            status: 0,
          },
        }
      );

      if (propertyAlreadyAssigned.length === 0) {
        const assignedProperty = await strapi.entityService.create(
          "api::assigned-property.assigned-property",
          {
            data: {
              price: result.price,
              paymentPlan: result.paymentPlan,
              initialPayment: result.initialPayment,
              paymentStartDate: result.paymentStartDate,
              property: interestInfo.property.id,
              user: currentUser.id,
              package: result.package,
              expectedNextPayment: result.initialPayment,
              refreshCalculationDate: result.paymentStartDate,
              paymentDueDate: result.paymentStartDate,
              project: interestInfo.property.project.id,
            },
          }
        );

        const referredBy =
          result?.referredBy ||
          currentUser?.referredBy?.id ||
          currentUser?.referredBy;

        if (referredBy) {
          const referredByUser = await strapi.entityService.findOne(
            "plugin::users-permissions.user",
            referredBy
          );

          const referralExists = await strapi.entityService.findMany(
            "api::referral.referral",
            {
              filters: {
                user: referredBy,
                email: currentUser.email,
              },
            }
          );

          if (referralExists.length > 0 && referralExists[0].status < 2) {
            const referralPercentage =
              referredByUser?.referralPercentage || 2.5;
            await strapi.entityService.update(
              "api::referral.referral",
              referralExists[0].id,
              {
                data: {
                  status: 2, // 2: pending reward since property has been assigned
                  totalReward: (referralPercentage / 100) * result.price,
                  referralPercentage,
                  assignedProperty: assignedProperty.id,
                },
              }
            );
          }
        }

        await strapi.config.email.send(strapi, {
          to: result.email,
          subject: `A property has been assigned to you`,
          firstName: result.firstName,
          contentTop: `Thank you for applying showing interest in our property. <br><br>
      We are pleased to inform you that a property has been assigned to you. <br><br>`,
          contentBottom: `Best Regards,<br>
          Operation's Team.`,
          buttonText: "Get Started",
          buttonLink: `${process.env.FRONT_END_URL}/app/reset-password?id=${currentUser.id}&token=${resetPasswordToken}`,
        });
      }
    }
  },
};
