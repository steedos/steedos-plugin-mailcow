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

module.exports = {
  listenTo: 'mailbox',
  beforeInsert: async function () {
    let doc = this.doc;
    console.log('=================================', doc);
    let username = `${doc.local_part}@${doc.domain}`;
    doc.username = username;
    doc.attributes = `{"force_pw_update":"0","tls_enforce_in":"0","tls_enforce_out":"0","sogo_access":"1","mailbox_format":"maildir:","quarantine_notification":"hourly"}`;
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
    quotoa2Obj.insert({ username: username });
    aliasObj.insert({ address: username, goto: username, domain: domain, active: active });
    user_aclObj.insert({ username: username });
  },
  beforeUpdate: async function () {
    var doc = this.doc;
    var id = this.id;
  }
};