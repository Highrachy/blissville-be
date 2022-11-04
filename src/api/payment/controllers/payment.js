"use strict";

/**
 * A set of functions called "actions" for `payment`
 */

module.exports = {
  initialize: async (ctx, next) => {
    try {
      const data = await strapi
        .service("api::payment.payment")
        .initialize({ params: ctx.request.body, user: ctx.state.user });
      ctx.body = { data };
    } catch (err) {
      ctx.body = err;
    }
  },
  verifyPaystackPayment: async (ctx, next) => {
    try {
      const data = await strapi
        .service("api::payment.payment")
        .verifyPaystackPayment(ctx.request.params);
      if (data?.error) {
        ctx.badRequest(data.error);
      }
      ctx.body = { ...data };
    } catch (err) {
      ctx.body = err;
    }
  },
};
