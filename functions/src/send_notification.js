module.exports = (db, admin) => {
    var module = {}

    module.run = (event) => {
    	return Promise.all([
            db.ref(`/channels/${event.params.channelId}`).once('value'),
            db.ref(`/chat_users/${event.data.val().sender}`).once('value')
        ]).then(snaps => {
            const channel = snaps[0].val();
            const sender = snaps[1].val()
            const message = event.data.val();
            var notification = {}
            switch (message.type) {
                case 'txt':
                    notification = {
                        title: `${sender.name} pisze...`,
                        body: message.body
                    }
                break;
                case 'loc':
                    notification = {
                        title: `${sender.name} wysyła swoją lokalizację`,
                        body: "Kliknij, aby ją zobaczyć"
                    }
                break;
                case 'img':
                    notification = {
                        title: `${sender.name} wysyła zdjęcie`,
                        body: "Kliknij, aby je zobaczyć"
                    }
                break;
                case 'vid':
                    notification = {
                        title: `${sender.name} wysyła wideo`,
                        body: "Kliknij, aby je obejrzeć"
                    }
                break;
                case 'mic':
                    notification = {
                        title: `${sender.name} wysyła wiadomość głosową`,
                        body: "Kliknij, aby ją odsłuchać"
                    }
                break;
            }
            const payload = {
                notification: notification,
                data: {
                    channel: JSON.stringify(channel),
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