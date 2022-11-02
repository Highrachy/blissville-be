const pad = (num, size) => {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
};

const getCurrentYear = new Date().getFullYear().toString().slice(-2);

const generateReceipt = (receiptNumber) => {
  const receiptNumberString = pad(receiptNumber, 4);
  return `BL${getCurrentYear}${receiptNumberString}`;
};

module.exports = {
  async beforeUpdate(event) {
    const { data } = event.params;
    console.log("data", data);
    const allTransactions = await strapi.entityService.findMany(
      "api::transaction.transaction"
    );

    const assignedPropertyInfo = await strapi.entityService.findOne(
      "api::assigned-property.assigned-property",
      data.assignedProperty,
      {
        populate: {
          property: {
            fields: ["id", "name"],
          },
          user: {
            fields: ["id", "firstName"],
          },
        },
        fields: ["id"],
      }
    );

    data.receiptNo = generateReceipt(allTransactions.length + 1);
    data.user = assignedPropertyInfo.user.id;
    data.property = assignedPropertyInfo.property.id;
  },

  async afterUpdate({ result }) {
    const transactionInfo = await strapi.entityService.findOne(
      "api::transaction.transaction",
      result.id,
      {
        populate: "*",
      }
    );

    const { amount, property, user } = transactionInfo;
    await strapi.config.email.send(strapi, {
      to: user.email,
      subject: `Transaction Receipt`,
      firstName: user.firstName,
      contentTop: `A transaction of ${amount} naira has been made on your Blissville account for your  <strong>${property.name}</strong> property.`,
      contentBottom: `Best Regards,<br>
      Operation Team.`,
    });
  },
};
