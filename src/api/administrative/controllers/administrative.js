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
  async forgotPassword(ctx, next) {
    try {
      const data = await strapi
        .service("api::administrative.administrative")
        .forgotPassword(ctx.request.body);

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
      ctx.badRequest("User dashboard controller error", { moreDetails: err });
    }
  },
  async userTransactions(ctx, next) {
    try {
      const data = await strapi
        .service("api::administrative.administrative")
        .getUserTransactions(ctx.state.user);

      ctx.body = { ...data };
    } catch (err) {
      ctx.badRequest("User transaction controller error", { moreDetails: err });
    }
  },
  async adminDashboard(ctx, next) {
    try {
      const data = await strapi
        .service("api::administrative.administrative")
        .getAdminDashboard();

      ctx.body = { ...data };
    } catch (err) {
      ctx.badRequest("User dashboard controller error", { moreDetails: err });
    }
  },
  async adminTransactions(ctx, next) {
    try {
      const data = await strapi
        .service("api::administrative.administrative")
        .getAdminTransactions();

      ctx.body = { ...data };
    } catch (err) {
      ctx.badRequest("User transaction controller error", { moreDetails: err });
    }
  },
};
