const objectql = require('@steedos/objectql');
const _ = require('underscore');
const crypto = require('crypto');

function hash_password(password) {
  let salt_str = crypto.randomBytes(8).toString('hex');
  let saltBuf = Buffer.from(salt_str);
  let ps = password + salt_str;
  let hash = crypto.createHash('sha256');
  hash.update(ps);
  let digest = hash.digest();
  let hashedPassword = '{SSHA256}' + Buffer.concat([digest, saltBuf]).toString('base64');
  return hashedPassword;
}

async function update_sogo_static_view(c_uid) {
  let steedosSchema = objectql.getSteedosSchema();
  let _sogo_static_viewObj = steedosSchema.getObject('_sogo_static_view');
  let sogo_viewObj = steedosSchema.getObject('sogo_view');
  let sogoRecord = await sogo_viewObj.findOne(c_uid);
  let sogoStaticRecord = await _sogo_static_viewObj.findOne(c_uid);
  if (sogoRecord) {
    if (sogoStaticRecord) { // update
      delete sogoRecord.c_uid;
      await _sogo_static_viewObj.update(c_uid, sogoRecord);
    } else { // insert
      await _sogo_static_viewObj.insert(sogoRecord);
    }
  } else { // remove
    await _sogo_static_viewObj.delete(c_uid);
  }
}

module.exports = {
  listenTo: 'mailbox',
  beforeInsert: async function () {
    let doc = this.doc;
    let username = `${doc.local_part}@${doc.domain}`;
    doc.username = username;
    doc.attributes = `{"force_pw_update": "0", "tls_enforce_in": "0", "tls_enforce_out": "0", "sogo_access": "1", "mailbox_format": "maildir:", "quarantine_notification": "hourly"}`;
    doc.password = hash_password(doc.password);
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
    await update_sogo_static_view(username);
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
      } else {
        doc.password = hash_password(doc.password);
      }
    }
    if (_.has(doc, 'active')) {
      let alias = await aliasObj.find({ filters: `(address eq '${username}')` });
      if (alias.length > 0) {
        await aliasObj.update(alias[0].id, { active: doc.active });
      }
    }
  },
  afterUpdate: async function () {
    let id = this.id;
    let steedosSchema = objectql.getSteedosSchema();
    let mailboxObj = steedosSchema.getObject('mailbox');
    let mailbox = await mailboxObj.findOne(id);
    let username = mailbox.username;
    await update_sogo_static_view(username);
  },
  afterDelete: async function () {
    let previousDoc = this.previousDoc;
    let username = previousDoc.username;
    await update_sogo_static_view(username);
  }
};