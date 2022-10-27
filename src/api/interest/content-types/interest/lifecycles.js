const STATUS = {
  INTERESTED: 0,
  CANCELLED: 1,
  ASSIGNED: 2,
};

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async afterUpdate({ result }) {
    const randomText = uuidv4();
    const token = randomText.slice(0, -6);
    const password = randomText.slice(-8);
    if (result.status === STATUS.ASSIGNED) {
      const interestInfo = await strapi.entityService.findOne(
        "api::interest.interest",
        result.id,
        {
          populate: {
            property: {
              fields: ["id", "name"],
            },
          },
          fields: ["id"],
        }
      );

      const userExists = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          filters: {
            email: result.email,
          },
        }
      );

      let currentUser = userExists?.[0];
      console.log("currentUser", currentUser);

      if (userExists.length === 0) {
        const newUser = await strapi.entityService.create(
          "plugin::users-permissions.user",
          {
            data: {
              title: result.title,
              firstName: result.firstName,
              lastName: result.lastName,
              email: result.email,
              username: result.email,
              phone: result.phone,
              password,
              provider: "local",
              confirmed: false,
              role: 1,
              setPassword: true,
              token,
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
            users_permissions_user: currentUser.id,
          },
        }
      );

      if (propertyAlreadyAssigned.length === 0) {
        const newAssignedProperty = await strapi.entityService.create(
          "api::assigned-property.assigned-property",
          {
            data: {
              price: result.price,
              paymentPlan: result.paymentPlan,
              initialPayment: result.initialPayment,
              paymentStartDate: result.paymentStartDate,
              property: interestInfo.property.id,
              users_permissions_user: currentUser.id,
              package: result.package,
            },
          }
        );
      }

      await strapi.config.email.send(strapi, {
        to: result.email,
        subject: `A property has been assigned to you`,
        firstName: result.firstName,
        contentTop: `Thank you for applying showing interest in our property. <br><br>
    We are pleased to inform you that a property has been assigned to you. <br><br>
    Best Regards,<br>
    Operation's Team.`,
        buttonText: "Get Started",
        buttonLink: "http://localhost:3000/app/set-password",
      });
    }
  },
};
