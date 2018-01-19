# Usage
This is a set of functions to be deployed as a standalone firebase project or as an addition to your existing firebase functions in order for [Chatlover-Android](https://github.com/ApploverSoftware/Chatlover-Android) and [Chatlover-iOS](https://github.com/ApploverSoftware/Chatlover-iOS) to work properly.


# Installation

### 1. New project
1. Create your [Firebase project](https://console.firebase.google.com)
1. Install [Firebase CLI](https://github.com/firebase/firebase-tools)
1. Clone this repository
1. Navigate to the repository directory
1. Use `firebase login` to login with an account that created your project
1. Use `firebase use --add <your-project-id> --alias <your-alias>` for further actions to relate to your project. Substitute `<your-project-id> `with the project's firebase id and `<your-alias>` with whatever string you wish to call this project for ease of use later on.
1. Use `firebase deploy --only functions:chatlover` to deploy only the Chatlover function group
1. Verify that the functions appeared in [Firebase Console -> Functions -> Dashboard](https://console.firebase.google.com)

### 2. Existing project
1. Clone this repository
1. Copy [functions/chatlover directory](https://github.com/ApploverSoftware/Chatlover-Firebase/tree/master/functions/chatlover) to your functions directory. Your main index.js should be in the same folder as the chatlover directory
1. Add `require('./chatlover/init')(exports);` to your index.js
1. Note that you should still include the App initialization in your index.js file. For example it might look like so:
``` javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
```
5. Use `firebase deploy --only functions:chatlover` to deploy only the Chatlover function group
6. Verify that the functions appeared in [Firebase Console -> Functions -> Dashboard](https://console.firebase.google.com)


# Customization

### Config.js
In order to properly integrate your Applications with each other you might need to edit the paths in `functions/chatlover/config.js` file. The default values and uses are listed below:
``` javascript
exports.USER_REF = `/users/{uid}` //root-level reference to your application's user model used to properly sync up the following values between your user model and ChatUser model. Note that the {uid} in the path is mandatory for the script to work
exports.NAME_KEY = `nickname` //key of the field to be used in Chatlover's views showing ChatUser's name 
exports.AVATAR_KEY = `profile_pic` //key of the field to be used in Chatlover's views showing ChatUser's avatar 
exports.FCM_TOKEN_KEY = `fcmToken` //key of the field to be used in Chatlover's push notification system 
exports.initMsg = "Hello, meet each other!" //the message to be sent in newly-created channels. Use "" to disable init message.
```

### Functions
Chatlover delivers following Firebase functions in `functions/chatlover/src` directory. Edit them, only if you know what you are doing as it might break Chatlover's working:
- `sync_user` - Syncs every update of your application's user model to ChatUser model
- `index_user_channels` - Denormalizes the database by providing an index of ChannelByUsers. Useful as Firebase doesn't provide proper query engine.
- `update_user_in_channel` - Syncs up data between ChatUser and ChannelByUsers.
- `send_notification` - Sends a Firebase Push Notification to users upon a Message being created. Note that any changes to the values being sent should happen in this file
- `make_channel` - Creates a channel with given name and list of users. By default it exposes a HTTP trigger to create a new channel but in many cases it might be useful to create a RealtimeDatabase trigger to create a channel on an event.

# What next?
Go on and set up your [Android](https://github.com/ApploverSoftware/Chatlover-Android) and/or [iOS](https://github.com/ApploverSoftware/Chatlover-iOS) application. Remember to change `config.js` in accordance with your data structure.
