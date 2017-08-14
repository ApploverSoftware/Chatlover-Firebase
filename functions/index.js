const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')();

admin.initializeApp(functions.config().firebase);

exports.sendNotification = functions.database.ref('/channels/{channelId}/messages/{messageId}').onCreate(event => {
    const channelId = event.params.channelId;
    const messageId = event.params.messageId;
    const getChannelPromise = admin.database().ref(`/channels/${channelId}`).once('value');
    const getMessagePromise = admin.database().ref(`/channels/${channelId}/messages/${messageId}`).once('value');
    console.log(`channelId:${channelId}`)
    console.log(`messageId:${messageId}`)

    return Promise.all([getChannelPromise, getMessagePromise]).then(results => {
        const channel = results[0].val();
        const msg = results[1].val();
        console.log(`channel:${channel.name}`)
        channel.users.map(function(u) {console.log(`usr${u}`)})
        console.log(`msg:${msg.body}`)
        return Promise.all(channel.users.filter(function(u) {
                return u != msg.sender;
            }).map(function(u) {
            return admin.database().ref(`/chat_users/${u}`).once('value');
        })).then(results => {
            const payload = {
                notification: {
                    title: 'Firebase Chat',
                    body: `${channel.name}`,
                },
                data: {
                    type: ""
                }
            };
            const promises = results.map(function(snap) {
                admin.messaging().sendToDevice(snap.val().fcmToken, payload);
            });
            console.log(results.filter(function(u) {return u.val().uid != msg.sender}).map(function(snap){snap.val().fcmToken}).toString())

            return Promise.all(promises).then(response=>{});
            
        });
    });
});