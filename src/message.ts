const express = require('express');

const router = express.Router();

router.get('/api/odata/v4/:spaceId/unread_mail', (req, res)=>{
    console.log(req.query.$count);
    var imaps = require('imap-simple');
    var config = {
        imap: {
            user: 'xxxxx',
            password: 'xxxxxxxxxx',
            host: '192.168.0.33',
            port: 143,
            tls: true,
            authTimeout: 30000
        }
    };
    imaps.connect(config).then(function (connection) {
        return connection.openBox('INBOX').then(function () {
            var searchCriteria = [
                'UNSEEN'
            ];
     
            var fetchOptions = {
                bodies: ['HEADER'],
                markSeen: false
            };
     
            return connection.search(searchCriteria, fetchOptions).then(function (results) {
                var messages = results.map(function (result) {
                    let subject = result.parts.filter(function (part) {
                        return part.which === 'HEADER';
                    })[0].body.subject[0];
                    return {_id: result.attributes.uid, uid: result.attributes.uid, subject, date: result.attributes.date}
                });
                console.log(messages);
                res.send({
                    "@odata.count": results.length,
                    value: messages
                })
               
            });
        });
    });
})


router.get('/api/odata/v4/:spaceId/unread_mail/:record_id', (req, res)=>{
    res.send({});
})

export default router;