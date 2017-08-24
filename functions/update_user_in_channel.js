module.exports = db => {
    var module = {}

    module.run = (event) => {
    	const user = event.data.val()
    db.ref(`/channel_by_user/${user.uid}`).once('value').then(channelsDict => {
        Object.keys(channelsDict.val()).forEach(k => {
            db.ref(`/channels/${k}/users/${user.uid}`).set(user)
        })
    })
    }

    return module
}