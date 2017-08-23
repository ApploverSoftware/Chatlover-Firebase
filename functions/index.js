const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')();
admin.initializeApp(functions.config().firebase);
const db = admin.database();

/* YOUR CONSTANTS */
const NAME_REF = `/users/{uid}/nickname`
const AVATAR_REF = `/users/{uid}/profile_pic`
const FCM_TOKEN_REF = `/users/{uid}/fcmToken`
/* END OF YOUR CONSTANTS*/

/* FUNCTIONS */

//Sends push notification to user upon message creation.
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
        const tokens = Object.keys(channel.users)
            .map(key => channel.users[key])
            .filter(u => u.uid != message.sender)
            .map(u => u.fcmToken)
        admin.messaging().sendToDevice(tokens, payload).then(_ => console.log(`notification sent to ${tokens}`));
    });
});

//Denormalizes channel<->user relation data for quicker lookups
exports.indexUserChannels = functions.database.ref('/channels/{channelId}').onWrite(event => {
    const channel = event.data.val()
    const previous = event.data.previous.val()
    const lite_channel = {
        id: channel.id,
        users: channel.users,
        name: channel.name
    }
    if (channel.picture){
        lite_channel.picture = channel.picture
    }
    if (channel.messages != null && Object.keys(channel.messages).length) {
        const last_msg_key = Object.keys(channel.messages).sort().pop()
        lite_channel.messages = {}
        lite_channel.messages[last_msg_key] = channel.messages[last_msg_key]
    }
    Object.keys(previous.users)
        .filter(uid => !Object.keys(channel.users).includes(uid))
        .forEach(uid => {
            db.ref(`/channel_by_user/${uid}/${channel.id}`).remove()
        })
    Object.keys(channel.users)
        .forEach(uid => {
            db.ref(`/channel_by_user/${uid}/${channel.id}`).set(lite_channel)
        })
});

//HTTPS trigger for channel creation
exports.makeChannel = functions.https.onRequest((request, response) => {
    _makeChannel(
        request.body.name, 
        request.body.users,
        c => response.status(200).send(c),
        e => response.status(500).send(e));
});

//Function to call in order to create a channel from any trigger you need
//name: String, users: {uid:uid,uid2:uid2}, onSuccess,onError are callbacks
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

//Automatically updates fcmToken between client DB and chatlover's chat_user model
// !! REMEMBER TO UPDATE FCM_TOKEN_REF BEFORE USE !!
exports.syncFcmToken = functions.database.ref(FCM_TOKEN_REF).onWrite(event => {
    const uid = event.params.uid
    db.ref(`/chat_users/${uid}/fcmToken`).set(event.data.val())
    db.ref(`/chat_users/${uid}/uid`).set(uid)
});

//Automatically updates avatar between client DB and chatlover's chat_user model
// !! REMEMBER TO UPDATE AVATAR_REF BEFORE USE !!
exports.syncAvatar = functions.database.ref(AVATAR_REF).onWrite(event => {
    const uid = event.params.uid
    db.ref(`/chat_users/${uid}/avatar`).set(event.data.val())
    db.ref(`/chat_users/${uid}/uid`).set(uid)
});

//Automatically updates name between client DB and chatlover's chat_user model
// !! REMEMBER TO UPDATE NAME_REF BEFORE USE !!
exports.syncName = functions.database.ref(NAME_REF).onWrite(event => {
    const uid = event.params.uid
    db.ref(`/chat_users/${uid}/name`).set(event.data.val())
    db.ref(`/chat_users/${uid}/uid`).set(uid)
});

/* END OF FUNCTIONS */