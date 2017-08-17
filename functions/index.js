const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')();

admin.initializeApp(functions.config().firebase);

const db = admin.database();

exports.sendNotification = functions.database.ref('/channels/{channelId}/messages/{messageId}').onCreate(event => {
    return db.ref(`/channels/${event.params.channelId}`).once('value').then(channelSnap => {
        const channel = channelSnap.val();
        const message = event.data.val();
        const payload = {
            notification: {
                title: channel.name,
                body: message.body
            },
            data: {
                channelId: channel.id,
                messageId: message.id
            }
        };

        return Promise.all(
            Object.keys(channel.users)
            .map(key => channel.users[key])
            .filter(u => u.uid != message.sender)
            .map(u => db.ref(`/chat_users/${u.uid}`).once('value'))
        ).then(users => { 
            const tokens = users.map(u => u.val().fcmToken)
            admin.messaging().sendToDevice(tokens, payload).then(_ => console.log(`notification sent to ${tokens}`));
        });
    });
});

exports.makeChannel = functions.https.onRequest((request, response) => {
    const channelRef = db.ref("/channels").push();
    const channel = {
        id: channelRef.key,
        name: request.body.name,
        users: request.body.users
    };
    channelRef.set(channel, error => {
        if (error) { 
            console.log(`data save failed: ${error}`);
            response.status(500).send(error);
        } else {
            response.status(200).send(channel);
        }
    });
});