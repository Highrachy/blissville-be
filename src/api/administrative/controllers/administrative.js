"use strict";

/**
 * A set of functions called "actions" for `administrative`
 */

module.exports = {
  async setPassword(ctx, next) {
    try {
      const data = await strapi
        .service("api::administrative.administrative")
        .setPassword(ctx.request.body);

      ctx.body = { ...data };
    } catch (err) {
      ctx.badRequest("Post report controller error", { moreDetails: err });
    }
  },
  async userDashboard(ctx, next) {
    try {
      const data = await strapi
        .service("api::administrative.administrative")
        .getUserDashboard(ctx.state.user);

      ctx.body = { ...data };
    } catch (err) {
      ctx.badRequest("Post report controller error", { moreDetails: err });
    }
  },
};
