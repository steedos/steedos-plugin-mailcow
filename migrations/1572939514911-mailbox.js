'use strict'
var objectql = require("@steedos/objectql");
objectql.getDataSource('mailcow').init();
var mailbox = objectql.getObject('mailbox');
var userData = require("../oausers.json");

let insertUsers = async function (userData) {
  console.log(userData);
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
        console.log("INSERTED accounts:", insertedDoc.name)
      }else{
        console.log("spaceUser exists: ",user.local_part);
      }
    }
  }
}
module.exports.up = async function (next) {
  await insertUsers(userData);
};

module.exports.down = async function (next) {
  await insertUsers(userData);
};