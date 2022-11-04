"use strict";
const axios = require("axios");
const utils = require("@strapi/utils");
const { ForbiddenError } = utils.errors;

const PAYSTACK_URL = {
  INITIALIZE: "https://api.paystack.co/transaction/initialize",
  VERIFY_TRANSACTION: "https://api.paystack.co/transaction/verify",
  ALL_TRANSACTIONS: "https://api.paystack.co/transaction",
  ALL_CUSTOMERS: "https://api.paystack.co/customer",
};

/**
 * payment service
 */

module.exports = () => ({
  initialize: async ({ params: { amount, info }, user }) => {
    const WEBSITE_HOST = process.env.FRONT_END_URL || "http://localhost:3000";
    try {
      if (!amount || !user) {
        throw new ForbiddenError("Missing parameters");
      }
      const response = await axios.post(
        PAYSTACK_URL.INITIALIZE,
        {
          amount: amount * 100,
          callback_url: `${WEBSITE_HOST}/verify-payment`,
          email: user.email,
          metadata: {
            custom_fields: [
              {
                display_name: "User Id",
                variable_name: "userId",
                value: JSON.stringify(user.id),
              },
              {
                display_name: "Info",
                variable_name: "info",
                value: JSON.stringify(info),
              },
            ],
          },
        },
        {
          headers: {
            authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "content-type": "application/json",
          },
        }
      );
      return response.data.data;
    } catch (err) {
      return err;
    }
  },
  verifyPaystackPayment: async ({ reference }) => {
    try {
      if (!reference) {
        throw new ForbiddenError("Missing parameters");
      }
      const response = await axios.get(
        `${PAYSTACK_URL.VERIFY_TRANSACTION}/${reference}`,
        {
          headers: {
            authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "content-type": "application/json",
          },
        }
      );

      const {
        data: { data: payment },
      } = response;
      if (payment?.status !== "success") {
        return {
          error: "Payment was not successful",
          payment,
        };
      }

      const { value } =
        payment.metadata.custom_fields[
          payment.metadata.custom_fields.length - 1
        ];

      const assignedPropertyId = JSON.parse(value)?.assignedPropertyId;
      if (!assignedPropertyId) {
        return {
          error: "Assigned Property not found",
          payment,
        };
      }

      // get assigned property via assigned property id
      const assignedProperty = await strapi.entityService.findOne(
        "api::assigned-property.assigned-property",
        assignedPropertyId,
        {
          populate: ["property", "user"],
        }
      );

      if (!assignedProperty.property) {
        return {
          error: "Property Information not found",
          payment,
        };
      }

      const payload = {
        assignedProperty: assignedProperty.id,
        amount: payment.amount / 100,
        reference: payment.reference,
        paymentSource: 1, //  PAYMENT_SOURCE.PAYSTACK,
      };

      // check if transaction already exists via payload.reference
      const transactions = await strapi.entityService.findMany(
        "api::transaction.transaction",
        {
          filters: {
            reference: payload.reference,
          },
        }
      );

      let transaction = null;
      if (transactions.length > 0) {
        transaction = transactions[0];
      } else {
        // create transaction with payload
        transaction = await strapi.entityService.create(
          "api::transaction.transaction",
          {
            data: payload,
          }
        );
      }
      return {
        transaction,
        payment,
        property: assignedProperty.property,
        user: assignedProperty.user,
      };
    } catch (err) {
      return err;
    }
  },
});
