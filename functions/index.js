const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')();
admin.initializeApp(functions.config().firebase);
const db = admin.database();

// chatlover

const config = require('./config');
const makeChannel = require('./src/make_channel')(db);
const sendChatNotification = require('./src/send_notification')(db, admin);
const indexUserChannels = require('./src/index_user_channels')(db);
const syncUser = require('./src/sync_user')(db, config);
const updateUserInChannel = require('./src/update_user_in_channel')(db);

//Sends push notification to user upon message creation.
exports.sendChatNotification = functions.database.ref('/channels/{channelId}/messages/{messageId}').onCreate(event => {
    sendChatNotification.run(event);
});

//Denormalizes channel<->user relation data for quicker lookups
exports.indexUserChannels = functions.database.ref('/channels/{channelId}').onWrite(event => {
    indexUserChannels.run(event)
});

// Updates user's data in channels and index upon modification in chat_users
exports.updateUserInChannel = functions.database.ref(`/chat_users/{user_id}`).onWrite(event => {
    updateUserInChannel.run(event)
})

//HTTPS trigger for channel creation
exports.makeChannel = functions.https.onRequest((request, response) => {
    makeChannel.run(
        request.body.name, 
        request.body.users,
        c => response.status(200).send(c),
        e => response.status(500).send(e));
});

//MakeChannel upon Accept Notification
exports.makeChannelUponAccept = functions.database.ref('/notifications/{receiverId}/{notificationId}').onCreate(event => {
    const notification = event.data.val()
    const receiverId = event.params.receiverId
    if (notification.type == "dateAccept") {
      makeChannel.run(
        "",
        [receiverId, notification.sender],
        c => {},
        e => {}
      );
    }
});

//Automatically updates user between client DB and chatlover's chat_user model
// !! REMEMBER TO UPDATE config.js BEFORE USE !!
exports.syncUser = functions.database.ref(config.USER_REF).onWrite(event => {
    syncUser.run(event)
});