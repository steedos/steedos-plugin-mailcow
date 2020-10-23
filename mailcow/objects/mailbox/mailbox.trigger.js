const objectql = require('@steedos/objectql');
const _ = require('underscore');
const manager = require('./mailbox.manager');

module.exports = {
  listenTo: 'mailbox',
  beforeInsert: async function () {
    let doc = this.doc;
    let username = `${doc.local_part}@${doc.domain}`;
    doc.username = username;
    doc.attributes = `{"force_pw_update": "0", "tls_enforce_in": "0", "tls_enforce_out": "0", "sogo_access": "1", "imap_access": "1", "pop3_access": "1", "smtp_access": "1", "mailbox_format": "maildir:", "quarantine_notification": "hourly"}`;
    doc.password = manager.hash_password(doc.password);
  },
  afterInsert: async function () {
    let doc = this.doc;
    let steedosSchema = objectql.getSteedosSchema();
    let quotoa2Obj = steedosSchema.getObject('quota2');
    let aliasObj = steedosSchema.getObject('alias');
    let user_aclObj = steedosSchema.getObject('user_acl');
    let username = `${doc.local_part}@${doc.domain}`;
    let domain = doc.domain;
    let active = doc.active;
    await quotoa2Obj.insert({ username: username });
    await aliasObj.insert({ address: username, goto: username, domain: domain, active: active });
    await user_aclObj.insert({ username: username });
    await manager.update_sogo_static_view(username);
  },
  beforeUpdate: async function () {
    let doc = this.doc;
    let id = this.id;
    delete doc.local_part;
    delete doc.domain;
    let steedosSchema = objectql.getSteedosSchema();
    let aliasObj = steedosSchema.getObject('alias');
    let mailboxObj = steedosSchema.getObject('mailbox');
    let mailbox = await mailboxObj.findOne(id);
    let username = mailbox.username;
    if (_.has(doc, 'password')) {
      if (doc.password.startsWith('{SSHA256}')) {
        delete doc.password;
        if (_.isEmpty(doc)) {
          throw new Error('不可直接修改加密后的密码');
        }
      } else {
        doc.password = manager.hash_password(doc.password);
      }
    }
    if (_.has(doc, 'active')) {
      let alias = await aliasObj.find({ filters: `(address eq '${username}')` });
      if (alias.length > 0) {
        await aliasObj.update(alias[0].id, { active: doc.active });
      }
    }
    if (_.isEmpty(doc)) {
      throw new Error('用户名和域名不能修改');
    }
  },
  afterUpdate: async function () {
    let id = this.id;
    let steedosSchema = objectql.getSteedosSchema();
    let mailboxObj = steedosSchema.getObject('mailbox');
    let mailbox = await mailboxObj.findOne(id);
    let username = mailbox.username;
    await manager.update_sogo_static_view(username);
  },
  afterDelete: async function () {
    let steedosSchema = objectql.getSteedosSchema();
    let previousDoc = this.previousDoc;
    let username = previousDoc.username;
    let sogo_folder_infoObj = steedosSchema.getObject('sogo_folder_info');
    await manager.deleteRelatedRecords('alias', `goto eq '${username}'`);
    await manager.deleteRelatedRecords('quarantine', `rcpt eq '${username}'`);
    await manager.deleteRelatedRecords('quota2', `username eq '${username}'`);
    await manager.deleteRelatedRecords('sender_acl', `logged_in_as eq '${username}'`);
    await manager.deleteRelatedRecords('user_acl', `username eq '${username}'`);
    await manager.deleteRelatedRecords('spamalias', `goto eq '${username}'`);
    await manager.deleteRelatedRecords('imapsync', `user2 eq '${username}'`);
    await manager.deleteRelatedRecords('filterconf', `object eq '${username}'`);
    await manager.deleteRelatedRecords('sogo_user_profile', `c_uid eq '${username}'`);
    await manager.deleteRelatedRecords('sogo_cache_folder', `c_uid eq '${username}'`);
    await manager.deleteRelatedRecords('sogo_acl', `c_uid eq '${username}'`);
    await manager.deleteRelatedRecords('sogo_view', `c_uid eq '${username}'`);

    let sfi = await sogo_folder_infoObj.find({ filters: `c_path2 eq '${username}'`, fields: ['c_folder_id'] });
    let c_folder_ids = _.pluck(sfi, 'c_folder_id');
    if (c_folder_ids.length > 0){
      await manager.deleteRelatedRecords('sogo_store', [['c_folder_id', '=', c_folder_ids]]);
      await manager.deleteRelatedRecords('sogo_quick_contact', [['c_folder_id', '=', c_folder_ids]]);
      await manager.deleteRelatedRecords('sogo_quick_appointment', [['c_folder_id', '=', c_folder_ids]]);
    }

    await manager.deleteRelatedRecords('sogo_folder_info', `c_path2 eq '${username}'`);
    await manager.deleteRelatedRecords('bcc_maps', `local_dest eq '${username}'`);
    // Prepare for oauth2
    // let mailboxObj = steedosSchema.getObject('oauth_access_tokens');
    // let mailboxObj = steedosSchema.getObject('oauth_refresh_tokens');
    // let mailboxObj = steedosSchema.getObject('oauth_authorization_codes');
    await manager.update_sogo_static_view(username);
  }
};