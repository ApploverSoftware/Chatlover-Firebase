module.exports = (db, config) => {
    var module = {}

    module.run = (event) => {
    	const uid = event.params.uid
    if (event.data.exists()) {
        const user = event.data.val()
        var chatUser = {
            uid: uid,
            name: user[config.NAME_KEY]
        }
        if (user[config.AVATAR_KEY])
            chatUser.avatar = user[config.AVATAR_KEY]
        if (user[config.FCM_TOKEN_KEY])
            chatUser.fcmToken = user[config.FCM_TOKEN_KEY]
        db.ref(`/chatlover/chat_users/${uid}`).set(chatUser)
    } else {
        db.ref(`/chatlover/chat_users/${uid}`).remove()
    }
    }

    return module
}