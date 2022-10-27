"use strict";

/**
 * interest controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::interest.interest",
  ({ strapi }) => ({
    // Method 1: Creating an entirely custom action
    async hello(ctx) {
      try {
        ctx.body = "ok";
      } catch (err) {
        ctx.body = err;
      }
    },

    // // Method 2: Wrapping a core action (leaves core logic in place)
    // async find(ctx) {
    //   // some custom logic here
    //   ctx.query = { ...ctx.query, local: 'en' };

    //   // Calling the default core action
    //   const { data, meta } = await super.find(ctx);

    //   // some more custom logic
    //   meta.date = Date.now();

    //   return { data, meta };
    // },

    // // Method 3: Replacing a core action
    // async findOne(ctx) {
    //   const { id } = ctx.params;
    //   const { query } = ctx;

    //   const entity = await strapi.service('api::restaurant.restaurant').findOne(id, query);
    //   const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    //   return this.transformResponse(sanitizedEntity);
    // },
  })
);
