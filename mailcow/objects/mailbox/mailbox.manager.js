const objectql = require('@steedos/objectql');
const crypto = require('crypto');

exports.hash_password = function hash_password(password) {
  let salt_str = crypto.randomBytes(8).toString('hex');
  let saltBuf = Buffer.from(salt_str);
  let ps = password + salt_str;
  let hash = crypto.createHash('sha256');
  hash.update(ps);
  let digest = hash.digest();
  let hashedPassword = '{SSHA256}' + Buffer.concat([digest, saltBuf]).toString('base64');
  return hashedPassword;
};

exports.update_sogo_static_view = async function update_sogo_static_view(c_uid) {
  let steedosSchema = objectql.getSteedosSchema();
  let _sogo_static_viewObj = steedosSchema.getObject('_sogo_static_view');
  let sogo_viewObj = steedosSchema.getObject('sogo_view');
  let sogoRecord = await sogo_viewObj.findOne(c_uid);
  let sogoStaticRecord = await _sogo_static_viewObj.findOne(c_uid);
  if (sogoRecord) {
    if (sogoStaticRecord) { // update
      delete sogoRecord.c_uid;
      delete sogoRecord._id;
      await _sogo_static_viewObj.update(c_uid, sogoRecord);
    } else { // insert
      await _sogo_static_viewObj.insert(sogoRecord);
    }
  } else { // remove
    await _sogo_static_viewObj.delete(c_uid);
  }
};

exports.deleteRelatedRecords = async function deleteRelatedRecords(tableName, filters) {
  let steedosSchema = objectql.getSteedosSchema();
  let obj = steedosSchema.getObject(tableName);
  let records = await obj.find({ filters: filters });
  for (const r of records) {
    await obj.delete(r._id);
  }
};