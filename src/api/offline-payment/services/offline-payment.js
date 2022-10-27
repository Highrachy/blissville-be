'use strict';

/**
 * offline-payment service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::offline-payment.offline-payment');
