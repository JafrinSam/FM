'use strict';

/**
 * rj service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::rj.rj');
