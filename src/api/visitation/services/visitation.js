'use strict';

/**
 * visitation service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::visitation.visitation');
