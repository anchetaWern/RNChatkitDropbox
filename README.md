# RNChatkitDropbox
A React Native chat app built with Chatkit with Dropbox file upload and download features.

You can read the full tutorial at: [https://pusher.com/tutorials/dropbox-react-native-chat](https://pusher.com/tutorials/dropbox-react-native-chat)

### Prerequisites

-   React Native development environment
-   [Node.js](https://nodejs.org/en/)
-   [Yarn](https://yarnpkg.com/en/)
-   [Chatkit app instance](https://pusher.com/chatkit)
-   [Dropbox account](https://www.dropbox.com) - create a Dropbox app instance (Dropbox API)
-   [Auth0 account](https://auth0.com) - create a native and machine to machine app instance
-   [ngrok account](https://ngrok.com/)

> Note: You can find more information on how to set up the app instances for Dropbox and Auth0 on the tutorial.

## Getting Started

1.  Clone the repo:

```
git clone https://github.com/anchetaWern/RNChatkitDropbox.git
cd RNChatkitDropbox
```

2.  Install the app dependencies:

```
yarn
```

3.  Eject the project (re-creates the `ios` and `android` folders):

```
react-native eject
```

4.  Link the packages:

```
react-native link react-native-gesture-handler
react-native link react-native-permissions
react-native link react-native-document-picker
react-native link react-native-fs
react-native link react-native-device-info
react-native link react-native-config
react-native link react-native-auth0
react-native link react-native-vector-icons
react-native link react-native-sensitive-info
```

5.  Update `android/app/build.gradle` file:

```
apply from: "../../node_modules/react-native/react.gradle"

// add these:
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

6. Update `android/app/src/main/AndroidManifest.xml` file to add the following under `<manifest>`:

```
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  package="com.rnchatkitdropbox">
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
  ...
</manifest>
```

Also add the following `<intent>` (second one) under the main `<activity>`:

```
<application 
  ...
>
  <activity
    android:name=".MainActivity"
    android:label="@string/app_name"
    android:launchMode="singleTask" // add this
  >
    <intent-filter>...</intent-filter>

    <intent-filter>
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data
        android:host="YOUR AUTH0 DOMAIN"
        android:pathPrefix="/android/${applicationId}/callback"
        android:scheme="${applicationId}" />
    </intent-filter>
  </activity>
</application>
```

7.  Update `.env` file with your Chatkit credentials and Auth0 native app credentials.

8.  Set up the server:

```
cd server
yarn
```

9.  Update the `server/.env` file with your Chatkit credentials and Auth0 machine-machine app credentials.

10.  Run the server:

```
yarn start
```

11. Run ngrok:

```
./ngrok http 5000
```

12. Update the `src/screens/Login.js` and `src/screens/Chat.js` file with your ngrok https URL.

13. Run the app:

```
react-native run-android
react-native run-ios
```

14. Log in to the app on two separate devices (or emulator).

## Built With

-   [React Native](http://facebook.github.io/react-native/)
-   [Chatkit](https://pusher.com/chatkit)
