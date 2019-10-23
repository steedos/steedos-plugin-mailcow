const express = require('express');
const simpleParser = require('mailparser').simpleParser;
const router = express.Router();
const _ = require('underscore');
import steedosAuth = require("@steedos/auth");
import { getSteedosConfig } from '@steedos/objectql'
var imaps = require('imap-simple');

let unreadMails = {}

const resolveMail = async (mail: any) => {
    var all = _.find(mail.parts, { "which": "" })
    var id = mail.attributes.uid;
    var idHeader = "Imap-Id: " + id + "\r\n";
    let parser = await simpleParser(idHeader + all.body);
    return { _id: id, uid: id, subject: parser.subject, date: parser.date, from: parser.from.html, to: parser.to.html, body: parser.html }
}

router.use('/unread_mails', steedosAuth.setRequestUser);

router.use('/unread_mails', function (req, res, next: () => void) {
    if (req.user) {
        next();
    }
    else {
        res.status(401).send({ status: 'error', message: 'You must be logged in to do this.' });
    }
})

router.get('/unread_mails', (req, res) => {

    let steedosConfig = getSteedosConfig()

    let { host, port, master_user, master_user_password } = steedosConfig.mailcow || { host: '', port: '', master_user: '', master_user_password: '' }

    if (!steedosConfig.mailcow || !host || !port || !master_user || !master_user_password) {
        return res.status(500).send({ status: 'error', message: 'please configure mailcow.host, mailcow.port, mailcow.master_user, mailcow.master_user_password in steedos-config.yml' });
    }

    let { userId, email } = req.user

    if(!email){
        return res.status(500).send({ status: 'error', message: '请设置邮箱' });
    }
    var config = {
        imap: {
            host,
            port,
            user: `${email}*${master_user}`,
            password: master_user_password,
            tls: false,
            autotls: 'required',
            tlsOptions: {
                "rejectUnauthorized": false
            },
            // debug: function(){console.log(arguments)},
            authTimeout: 3000
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
                for (let item of results) {
                    messages.push(await resolveMail(item))
                }

                unreadMails[userId] = messages

                res.send({
                    "@odata.count": results.length,
                    value: messages
                })
                connection.end()
            });
        });
    });
})

router.get('/unread_mails/:_id', (req, res) => {
    let { userId } = req.user
    let mail = _.find(unreadMails[userId], (_mail) => {
        return _mail._id.toString() === req.params._id
    })
    return res.send(mail);
})

export default router;