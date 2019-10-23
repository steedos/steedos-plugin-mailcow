const express = require('express');
const simpleParser = require('mailparser').simpleParser;
const router = express.Router();
const _ = require('underscore');
import steedosAuth = require("@steedos/auth");

let unreadMails = {}

const resolveMail = async (mail: any)=>{
    var all = _.find(mail.parts, { "which": "" })
    var id = mail.attributes.uid;
    var idHeader = "Imap-Id: "+id+"\r\n";
    let parser = await simpleParser(idHeader+all.body);
    return {_id: id, uid: id, subject: parser.subject, date: parser.date, from: parser.from.html, to: parser.to.html, body: parser.html}
}

router.use('/api/odata/v4/:spaceId/unread_mails', steedosAuth.setRequestUser);
router.get('/api/odata/v4/:spaceId/unread_mails', (req, res)=>{
    let userId = req.headers['x-user-id']
    var imaps = require('imap-simple');
    var config = {
        imap: {
            user: 'xxxxx',
            password: 'xxxxxx',
            host: '192.168.0.33',
            port: 143,
            tls: false,
            autotls: 'required',
            tlsOptions: {
                "rejectUnauthorized": false
            },
            // debug: function(a){console.log(arguments)},
            authTimeout: 30000
        }
    };
    imaps.connect(config).then(function (connection) {
        return connection.openBox('INBOX').then(function () {
            var searchCriteria = [
                'UNSEEN'
            ];
     
            var fetchOptions = {
                bodies: ['HEADER', 'TEXT', ''],
                markSeen: false
            };
     
            return connection.search(searchCriteria, fetchOptions).then(async function (results) {
                let messages = [];
                for(let item of results ){
                    messages.push(await resolveMail(item))
                }

                unreadMails[userId] = messages

                res.send({
                    "@odata.count": results.length,
                    value: messages
                })
               
            });
        });
    });
})


router.get('/api/odata/v4/:spaceId/unread_mails/:_id', (req, res)=>{
    let userId = req.headers['x-user-id']
    let mail = _.find(unreadMails[userId], (_mail)=>{
        return _mail._id.toString() === req.params._id
    })
    res.send(mail);
})

export default router;