function ifChannelDoesntExists(db, users, run) {
    var exists = false
    const userList = users.sort().join(':|:')
    Promise.all(
        users.map(u => db.ref(`/chatlover/channel_by_user/${u}`).once(`value`))
    ).then(channelLists => {
        channelLists.forEach(channelList => {
            if (channelList.val()) {
                Object.keys(channelList.val()).forEach(k => {
                    if (Object.keys(channelList.val()[k].users).sort().join(':|:') == userList)
                        exists = true
                })
            }
        })
        if (!exists){
            run()
        }
    })
}

module.exports = (db, config) => {
    var module = {}
    //Function to call in order to create a channel from any trigger you need
    //name: String, users: [uid1, uid2, uid3], onSuccess,onError are callbacks
    module.run = (name, users, onSuccess, onError) => {
        ifChannelDoesntExists(db, users, () => {
            const channelRef = db.ref("/chatlover/channels").push();
            Promise.all(
                users.map(u => db.ref(`/chatlover/chat_users/${u}`).once(`value`))
            ).then(users => {
                user_dict = {}
                users.map(u => u.val()).forEach(u => {
                    user_dict[u.uid] = u
                })
                const channel = {
                    id: channelRef.key,
                    name: name,
                    users: user_dict
                };
                if (config.initMsg) {
                    const initMsg = {}
                    initMsg["---init"] = {
                        body: config.initMsg,
                        id: "---init",
                        sender: "init",
                        type: "txt",
                        time: Math.floor(Date.now())
                    }
                    channel.messages = initMsg
                }
                channelRef.set(channel, error => {
                    if (error) { 
                        onError(error)
                    } else {
                        onSuccess(channel)
                    }
                });
            });
        })
    }

    return module
}