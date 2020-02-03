'use strict'
var objectql = require("@steedos/objectql");
objectql.getDataSource('mailcow').init();
var mailbox = objectql.getObject('mailbox');
var userData = require("../oausers.json");
module.exports.up = async function (next) {
  console.log(await mailbox.find());
};