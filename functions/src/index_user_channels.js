module.exports = db => {
    var module = {}

    module.run = (event) => {
    const channel = event.data.val()
    const previous = event.data.previous

    if (!event.data.exists()) {
        Object.keys(previous.val().users).forEach(uid => {
            db.ref(`/chatlover/channel_by_user/${uid}/${previous.val().id}`).remove()
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
                db.ref(`/chatlover/channel_by_user/${uid}/${channel.id}`).remove()
        })
    }
    Object.keys(channel.users)
        .forEach(uid => {
            db.ref(`/chatlover/channel_by_user/${uid}/${channel.id}`).set(lite_channel)
        })
    }

    return module
}