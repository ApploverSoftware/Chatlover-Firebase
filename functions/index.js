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

exports.indexUserChannels = functions.database.ref('/channels/{channelId}/users').onCreate(event => {
    const channelId = event.params.channelId
    db.ref(`/channels/${channelId}/users`).on("child_added", snap => {
        const uid = snap.val()
        db.ref(`/user_channel_index/${uid}/${channelId}`).set(channelId)
    })
    db.ref(`/channels/${channelId}/users`).on("child_removed", snap => {
        const uid = snap.val()
        db.ref(`/user_channel_index/${uid}/${channelId}`).remove()
    })
});

exports.makeChannel = functions.https.onRequest((request, response) => {
    _makeChannel(
        request.body.name, 
        request.body.users,
        c => response.status(200).send(c),
        e => response.status(500).send(e));
});

function _makeChannel(name, users, onSuccess, onError) {
    const channelRef = db.ref("/channels").push();
    const channel = {
        id: channelRef.key,
        name: name,
        users: users
    };
    channelRef.set(channel, error => {
        if (error) { 
            onError(error)
        } else {
            onSuccess(channel)
        }
    });
}