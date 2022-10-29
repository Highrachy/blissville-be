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
          callback_url: `${WEBSITE_HOST}/payment`,
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
      return response.data.data;
    } catch (err) {
      return err;
    }
  },
});
