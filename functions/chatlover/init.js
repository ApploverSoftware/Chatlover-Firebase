const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.database();

const config = require('./config');

const makeChannel = require('./src/make_channel')(db, config);
const sendChatNotification = require('./src/send_notification')(db, admin);
const indexUserChannels = require('./src/index_user_channels')(db);
const syncUser = require('./src/sync_user')(db, config);
const updateUserInChannel = require('./src/update_user_in_channel')(db);

// chatlover
module.exports = (index) => {
	index.chatlover = {}

	//Sends push notification to user upon message creation.
	index.chatlover.sendChatNotification = functions.database.ref('/chatlover/channels/{channelId}/messages/{messageId}').onCreate(event => {
	    sendChatNotification.run(event);
	});

	//Denormalizes channel<->user relation data for quicker lookups
	index.chatlover.indexUserChannels = functions.database.ref('/chatlover/channels/{channelId}').onWrite(event => {
	    indexUserChannels.run(event)
	});

	// Updates user's data in channels and index upon modification in chat_users
	index.chatlover.updateUserInChannel = functions.database.ref(`/chatlover/chat_users/{user_id}`).onWrite(event => {
	    updateUserInChannel.run(event)
	})

	//HTTPS trigger for channel creation
	index.chatlover.makeChannel = functions.https.onRequest((request, response) => {
	    makeChannel.run(
	        request.body.name, 
	        request.body.users,
	        c => response.status(200).send(c),
	        e => response.status(500).send(e));
	});

	//Automatically updates user between client DB and chatlover's chat_user model
	// !! REMEMBER TO UPDATE config.js BEFORE USE !!
	index.chatlover.syncUser = functions.database.ref(config.USER_REF).onWrite(event => {
	    syncUser.run(event)
	});
	
}