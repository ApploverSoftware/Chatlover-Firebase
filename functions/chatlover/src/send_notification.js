module.exports = (db, admin) => {
    var module = {}

    module.run = (event) => {
    	return Promise.all([
            db.ref(`/chatlover/channels/${event.params.channelId}`).once('value'),
            db.ref(`/chatlover/chat_users/${event.data.val().sender}`).once('value')
        ]).then(snaps => {
            const channel = snaps[0].val();
            const sender = snaps[1].val()
            const message = event.data.val();
            var notification = {}
            switch (message.type) {
                case 'txt':
                    notification = {
                        title: `${sender.name} wrote...`,
                        body: message.body
                    }
                break;
                case 'loc':
                    notification = {
                        title: `${sender.name} sent their location`,
                        body: "Click to see it"
                    }
                break;
                case 'img':
                    notification = {
                        title: `${sender.name} sent a photo`,
                        body: "Click to see it"
                    }
                break;
                case 'vid':
                    notification = {
                        title: `${sender.name} sent a video`,
                        body: "Click to see it"
                    }
                break;
                case 'mic':
                    notification = {
                        title: `${sender.name} sent a voice message`,
                        body: "Click to see it"
                    }
                break;
            }
            const lite_channel = {}
            Object.keys(channel).forEach(k => {
                if (k != "messages")
                    lite_channel[k] = channel[k]
            })
            const payload = {
                notification: notification,
                data: {
                    chatlover: "true",
                    channel: JSON.stringify(lite_channel),
                    message: JSON.stringify(message),
                    sender: JSON.stringify(sender)
                }
            };
            const tokens = Object.keys(channel.users)
                .map(key => channel.users[key])
                .filter(u => u.uid != message.sender)
                .map(u => u.fcmToken)
            if (tokens){
                admin.messaging().sendToDevice(tokens, payload).then(_ => console.log(`notification sent to ${tokens}`));
            }
        });
    }

    return module
}