const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')();
admin.initializeApp(functions.config().firebase);
const db = admin.database();
const config = require('./config');

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
    const previous = event.data.previous

    if (!event.data.exists()) {
        Object.keys(previous.val().users).forEach(uid => {
            db.ref(`/channel_by_user/${uid}/${previous.val().id}`).remove()
        })
        return;
    }

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
    if (previous.exists()) {
        Object.keys(previous.val().users)
            .filter(uid => !Object.keys(channel.users).includes(uid))
            .forEach(uid => {
                db.ref(`/channel_by_user/${uid}/${channel.id}`).remove()
        })
    }
    Object.keys(channel.users)
        .forEach(uid => {
            db.ref(`/channel_by_user/${uid}/${channel.id}`).set(lite_channel)
        })
});

// Updates user's data in channels and index upon modification in chat_users
exports.updateUserInChannels = functions.database.ref(`/chat_users/{user_id}`).onWrite(event => {
    const user = event.data.val()
    db.ref(`/channel_by_user/${user.uid}`).once('value').then(channelsDict => {
        Object.keys(channelsDict.val()).forEach(k => {
            db.ref(`/channels/${k}/users/${user.uid}`).set(user)
        })
    })
})

//HTTPS trigger for channel creation
exports.makeChannel = functions.https.onRequest((request, response) => {
    _makeChannel(
        request.body.name, 
        request.body.users,
        c => response.status(200).send(c),
        e => response.status(500).send(e));
});

//Function to call in order to create a channel from any trigger you need
//name: String, users: [uid1, uid2, uid3], onSuccess,onError are callbacks
function _makeChannel(name, users, onSuccess, onError) {
    const channelRef = db.ref("/channels").push();
    Promise.all(
        users.map(u=>db.ref(`/chat_users/${u}`).once(`value`))
    ).then(users => {
        user_dict = {}
        users.map(u=>u.val()).forEach(u => {
            user_dict[u.uid] = u
        })
        const channel = {
            id: channelRef.key,
            name: name,
            users: user_dict
        };
        channelRef.set(channel, error => {
            if (error) { 
                onError(error)
            } else {
                onSuccess(channel)
            }
        });
    });
}

//Automatically updates user between client DB and chatlover's chat_user model
// !! REMEMBER TO UPDATE config.js BEFORE USE !!
exports.syncUser = functions.database.ref(config.USER_REF).onWrite(event => {
    const uid = event.params.uid
    if (event.data.exists()) {
        const user = event.data.val()
        db.ref(`/chat_users/${uid}`).set({
            uid: uid,
            fcmToken: user[config.FCM_TOKEN_KEY],
            avatar: user[config.AVATAR_KEY],
            name: user[config.NAME_KEY]
        })
    } else {
        db.ref(`/chat_users/${uid}`).remove()
    }
});