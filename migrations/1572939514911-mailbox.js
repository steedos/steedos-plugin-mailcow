'use strict'
var objectql = require("@steedos/objectql");
objectql.getDataSource('mailcow').init();
var mailbox = objectql.getObject('mailbox');
var profile = objectql.getObject('sogo_user_profile');
// var userData = require("../oausers.json");

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

let updateUserProfile = async function(){
  let mails = await mailbox.find({
    filters: [["domain", "=", "sgpnc.cn"]]
  }).catch((ex) => {
    console.error(ex);
    return [];
  });

  if (mails.length > 0){
    for (let mail of mails) {
      let userProfile = await profile.find({
        filters: [["c_uid", "=", mail.username]]
      }).catch((ex) => {
        console.error(ex);
        return [];
      });
      console.log("userProfile.length: ",userProfile.length);
      if (userProfile.length > 0){
        let c_default = userProfile[0].c_defaults;
        console.log('c_default: ',userProfile[0].c_uid);
        c_default = JSON.parse(c_default);
        // 默认是文本模式
        c_default.SOGoMailComposeMessageType = "text";
        // 默认同意所有回执请求
        c_default.SOGoMailReceiptAllow = "1";
        c_default.SOGoMailReceiptOutsideDomainAction = "send";
        c_default.SOGoMailReceiptAnyAction = "send";
        c_default.SOGoMailReceiptNonRecipientAction = "send";

        let setting = JSON.stringify(c_default);

        let updatedDoc = await profile.directUpdate(mail.username,{
          c_defaults: setting
        }).catch((ex) => {
          console.error(ex);
          return {};
        });

        console.log("UPDATED userProfile:", updatedDoc.c_uid);
      }else{
        let new_default = {};
        let new_profile = {};
        // 默认是文本模式
        new_default.SOGoMailComposeMessageType = "text";
        // 默认同意所有回执请求
        new_default.SOGoMailReceiptAllow = "1";
        new_default.SOGoMailReceiptOutsideDomainAction = "send";
        new_default.SOGoMailReceiptAnyAction = "send";
        new_default.SOGoMailReceiptNonRecipientAction = "send";
        new_default.SOGoTimeZone = "Asia\/Shanghai";

        new_default = JSON.stringify(new_default);

        new_profile.c_uid = mail.username;
        new_profile.c_defaults = new_default;
        new_profile.c_settings = `{"Calendar": {}}`;

        // 插入新设置
        let insertedDoc = await profile.insert(new_profile).catch((ex) => {
          console.error(ex);
          return {};
        });
        console.log("INSERTED profile:", insertedDoc.c_uid);
      }
    }
  }
}

module.exports.up = async function (next) {
  // await insertUsers(userData);
  // await updateUsers();
  await updateUserProfile();
};

module.exports.down = async function (next) {
  // await insertUsers(userData);
  // await updateUsers();
  await updateUserProfile();
};