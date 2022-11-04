const { add, parseISO, subDays, format } = require("date-fns");

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

const generatePaymentSchedules = (assignedProperty) => {
  const {
    price: propertyPrice,
    paymentStartDate: initialPaymentDate,
    initialPayment,
    paymentPlan: noOfPaymentsAfterInitial,
  } = assignedProperty;

  const monthlyPayment =
    (propertyPrice - initialPayment) / noOfPaymentsAfterInitial;

  const paymentDates = [
    {
      date: parseISO(initialPaymentDate),
      amount: parseInt(initialPayment, 10),
    },
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
  const todaysDate = new Date();
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
          refreshCalculationDate: schedule.date, // used by cron job
          paymentDueDate:
            userHasPaidForPastSchedule || result.paymentDueDate === null
              ? schedule.date
              : result.paymentDueDate, // shown in the UI
        };
      }

      return result;
    },
    {
      expectedTotal: 0,
      expectedNextPayment: 0,
      refreshCalculationDate: null,
      paymentDueDate: null,
    }
  );
};

const generateExpectedNextPayment = (assignedProperty, totalTransactions) => {
  const paymentSchedules = generatePaymentSchedules(assignedProperty);
  return calculateExpectedTotal(totalTransactions, paymentSchedules);
};

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    const allTransactions = await strapi.entityService.count(
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

    data.receiptNo = generateReceipt(allTransactions + 1);
    data.user = assignedPropertyInfo.user.id;
    data.property = assignedPropertyInfo.property.id;
  },

  async afterCreate({ result }) {
    const transactionInfo = await strapi.entityService.findOne(
      "api::transaction.transaction",
      result.id,
      {
        populate: "*",
      }
    );

    const { assignedProperty, amount, property, user } = transactionInfo;

    const allTransactions = await strapi.entityService.findMany(
      "api::transaction.transaction",
      {
        filters: {
          user: user.id,
        },
      }
    );

    const sumOfAllTransactions =
      allTransactions?.reduce(
        (acc, transaction) => acc + parseInt(transaction.amount, 10),
        0
      ) || 0;

    const nextPayment = generateExpectedNextPayment(
      assignedProperty,
      sumOfAllTransactions
    );

    await strapi.entityService.update(
      "api::assigned-property.assigned-property",
      assignedProperty.id,
      {
        data: {
          expectedNextPayment: nextPayment.expectedNextPayment,
          refreshCalculationDate: format(
            nextPayment.refreshCalculationDate,
            "yyyy-MM-dd"
          ),
          paymentDueDate: format(nextPayment.paymentDueDate, "yyyy-MM-dd"),
          totalAmountPaid: sumOfAllTransactions,
        },
      }
    );

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
