module.exports = db => {
    var module = {}

    module.run = (event) => {
        const user = event.data.val()
        if (!user) {
            db.ref(`/channel_by_user/${event.data.previous.val().uid}`).once('value').then(channelsDict => {
            if (channelsDict.val())
                Object.keys(channelsDict.val()).forEach(k => {
                    db.ref(`/channels/${k}`).remove()
                })
            })
            return
        }
        db.ref(`/channel_by_user/${user.uid}`).once('value').then(channelsDict => {
            if (channelsDict.val())
                Object.keys(channelsDict.val()).forEach(k => {
                    db.ref(`/channels/${k}/users/${user.uid}`).set(user)
                })
        })
    }

    return module
}