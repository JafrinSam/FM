'use strict';

/**
 * weekly-schedule service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::weekly-schedule.weekly-schedule');
