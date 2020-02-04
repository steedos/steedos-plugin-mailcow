'use strict'
var objectql = require("@steedos/objectql");
objectql.getDataSource('mailcow').init();
var mailbox = objectql.getObject('mailbox');
var userData = require("../oausers.json");

let insertUsers = async function (userData) {
  for (let user of userData) {
    if (user){
      let spaceUser = await mailbox.find({
        filters: [["local_part", "=", user.local_part]]
      }).catch((ex) => {
        console.error(ex);
        return [];
      });
      if (spaceUser.length < 1){
        user.password = user.password.toString();
        user.quota = parseFloat(user.quota);
        let insertedDoc = await mailbox.insert(user).catch((ex) => {
          console.error(ex);
          return {};
        });
        console.log("INSERTED user:", insertedDoc.name)
      }else{
        console.log("spaceUser exists: ",user.local_part);
      }
    }
  }
}

let updateUsers = async function () {
  let upAttributes = `{"force_pw_update": "1", "tls_enforce_in": "0", "tls_enforce_out": "0", "sogo_access": "1", "mailbox_format": "maildir:", "quarantine_notification": "hourly"}`;
  let users = await mailbox.find({
    filters: [["domain", "=", "qdrq.com"]]
  }).catch((ex) => {
    console.error(ex);
    return [];
  });
  if (users.length > 0){
    for (let user of users) {
      let updatedDoc = await mailbox.directUpdate(user.username,{
        attributes: upAttributes
      }).catch((ex) => {
        console.error(ex);
        return {};
      });
      console.log("UPDATED user:", updatedDoc.name);
    }
  }
}

module.exports.up = async function (next) {
  // await insertUsers(userData);
  await updateUsers();
};

module.exports.down = async function (next) {
  // await insertUsers(userData);
  await updateUsers();
};