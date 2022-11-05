const STATUS = {
  PENDING: 0,
  CONFIRMED: 1,
};

module.exports = {
  async afterUpdate({ result }) {
    if (result.status === STATUS.CONFIRMED) {
      const offlinePaymentInfo = await strapi.entityService.findOne(
        "api::offline-payment.offline-payment",
        result.id,
        {
          populate: {
            assignedProperty: {
              fields: ["id"],
              populate: {
                property: {
                  fields: ["id"],
                },
              },
            },
          },
          fields: ["id"],
        }
      );
      const transactionExists = await strapi.entityService.findMany(
        "api::transaction.transaction",
        {
          filters: {
            reference: `offline-${result.id}`,
          },
        }
      );

      if (transactionExists.length === 0) {
        await strapi.entityService.create("api::transaction.transaction", {
          data: {
            assignedProperty: offlinePaymentInfo.assignedProperty.id,
            amount: result.amount,
            reference: `offline-${result.id}`,
            offlinePayment: result.id,
            user: offlinePaymentInfo.user,
            property: offlinePaymentInfo.assignedProperty.property.id,
          },
        });
      }
    }
  },
};
