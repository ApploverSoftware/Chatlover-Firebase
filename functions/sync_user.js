module.exports = (db, config) => {
    var module = {}

    module.run = (event) => {
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
    }

    return module
}