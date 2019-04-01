import React, { Component } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { GiftedChat, Send, Message } from "react-native-gifted-chat";
import { ChatManager, TokenProvider } from "@pusher/chatkit-client";
import axios from "axios";
import Config from "react-native-config";
import Icon from "react-native-vector-icons/FontAwesome";
import { DocumentPicker, DocumentPickerUtil } from "react-native-document-picker";
import * as mime from "react-native-mime-types";
import RNFS from "react-native-fs";
import { Buffer } from 'buffer/';

import DeviceInfo from "react-native-device-info";
import { Dropbox } from "dropbox";

import Auth0 from "react-native-auth0";
import SInfo from "react-native-sensitive-info";

import IconButton from "../components/IconButton";
import ChatBubble from "../components/ChatBubble";

const CHATKIT_INSTANCE_LOCATOR_ID = `v1:us1:${Config.CHATKIT_INSTANCE_LOCATOR_ID}`;
const CHATKIT_SECRET_KEY = Config.CHATKIT_SECRET_KEY;
const CHATKIT_TOKEN_PROVIDER_ENDPOINT = `https://us1.pusherplatform.io/services/chatkit_token_provider/v1/${Config.CHATKIT_INSTANCE_LOCATOR_ID}/token`;

const CHAT_SERVER = "YOUR NGROK HTTPS URL/rooms";

const auth0 = new Auth0({
  domain: Config.AUTH0_DOMAIN,
  clientId: Config.AUTH0_CLIENT_ID
});

class Chat extends Component {

  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      headerTitle: `Chat with ${params.friends_username}`,
      headerRight: (
        <IconButton icon="dropbox" size={30} color="#0062ff" onPress={params.loginToDropbox} />
      ),
      headerStyle: {
        backgroundColor: "#333"
      },
      headerTitleStyle: {
        color: "#FFF"
      }
    };
  };

  //

  state = {
    messages: [],
    is_initialized: false,
    is_picking_file: false
  };

  //

  constructor(props) {
    super(props);
    const { navigation } = this.props;
    const user_id = navigation.getParam("user_id");
    const username = navigation.getParam("username");
    const friends_username = navigation.getParam("friends_username");
    const system_token = navigation.getParam("system_token");

    const members = [username, friends_username];
    members.sort();

    this.user_id = user_id;
    this.username = username;
    this.room_name = members.join("-");

    this.system_token = system_token;
    this.access_token = null;
  }

  //

  async componentDidMount() {

    this.props.navigation.setParams({
      loginToDropbox: this.loginToDropbox
    });

    try {
      const chatManager = new ChatManager({
        instanceLocator: CHATKIT_INSTANCE_LOCATOR_ID,
        userId: this.user_id,
        tokenProvider: new TokenProvider({ url: CHATKIT_TOKEN_PROVIDER_ENDPOINT })
      });

      let currentUser = await chatManager.connect();
      this.currentUser = currentUser;

      const response = await axios.post(
        CHAT_SERVER,
        {
          user_id: this.user_id,
          room_name: this.room_name
        }
      );

      const room = response.data;

      this.room_id = room.id;
      await this.currentUser.subscribeToRoom({
        roomId: this.room_id,
        hooks: {
          onMessage: this.onReceive
        }
      });

      this.access_token = await SInfo.getItem("access_token", {});

      if (this.access_token) {
        this.dbx = new Dropbox({
          accessToken: this.access_token,
          fetch: fetch
        });
      }


      this.setState({
        is_initialized: true
      });

    } catch (chat_manager_err) {
      console.log("error with chat manager: ", chat_manager_err);
    }
  }


  onReceive = async (data) => {
    const { message } = await this.getMessage(data);
    await this.setState((previousState) => ({
      messages: GiftedChat.append(previousState.messages, message)
    }));
  }


  onSend = async ([message]) => {
    let msg = {
      text: message.text,
      roomId: this.room_id
    };

    let message_parts = [
      { type: "text/plain", content: msg.text }
    ];

    if (this.attachment) {
      const { uri, file_type } = this.attachment;
      message_parts.push({
        type: file_type,
        url: uri,
      });
    }

    try {
      await this.currentUser.sendMultipartMessage({
        roomId: this.room_id,
        parts: message_parts
      });

      this.attachment = null;

      this.setState({
        is_sending: false
      });
    } catch (send_msg_err) {
      console.log('error sending message: ', send_msg_err);
    }
  }


  renderSend = props => {
    if (this.state.is_sending) {
      return (
        <ActivityIndicator
          size="small"
          color="#0064e1"
          style={[styles.loader, styles.sendLoader]}
        />
      );
    }

    return <Send {...props} />;
  }


  getMessage = async ({ id, senderId, text, attachment, createdAt }) => {

    let msg_data = {
      _id: id,
      text: text,
      createdAt: new Date(createdAt),
      user: {
        _id: senderId,
        name: senderId,
        avatar: "https://png.pngtree.com/svg/20170602/0db185fb9c.png"
      },
      attachment
    };

    return {
      message: msg_data
    };
  }

  //

  render() {
    const { is_initialized, messages } = this.state;

    return (
      <View style={styles.container}>
        {(!is_initialized) && (
          <ActivityIndicator
            size="small"
            color="#0064e1"
            style={styles.loader}
          />
        )}

        {is_initialized && (
          <GiftedChat
            messages={messages}
            onSend={messages => this.onSend(messages)}
            user={{
              _id: this.user_id
            }}
            renderActions={this.renderCustomActions}
            renderSend={this.renderSend}
            renderMessage={this.renderMessage}
          />
        )}
      </View>
    );
  }

  //

  renderCustomActions = () => {
    if (!this.state.is_picking_file) {
      const icon_color = this.attachment ? "#0064e1" : "#808080";

      return (
        <View style={styles.customActionsContainer}>
          <TouchableOpacity onPress={this.openFilePicker}>
            <View style={styles.buttonContainer}>
              <Icon name="paperclip" size={23} color={icon_color} />
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ActivityIndicator size="small" color="#0064e1" style={styles.loader} />
    );
  }

  //

  openFilePicker = async () => {
    await this.setState({
      is_picking_file: true
    });

    DocumentPicker.show({
      filetype: [DocumentPickerUtil.allFiles()],
    }, async (err, file) => {

      if (!err) {
        try {
          const base64 = await RNFS.readFile(file.uri, "base64");
          const buff = Buffer.from(base64, 'base64');

          this.dbx.filesUpload({ path: '/' + file.fileName, contents: buff })
            .then(({ path_display }) => {

              Alert.alert("Success", "File attached!");

              this.setState({
                is_picking_file: false
              });

              this.attachment = {
                uri: path_display,
                file_type: mime.contentType(file.fileName)
              };
            })
            .catch((file_upload_err) => {
              console.log('error occured while uploading file: ', file_upload_err);
            });

        } catch (read_file_err) {
          console.log("error reading file: ", read_file_err);
        }
      }

    });
  }


  loginToDropbox = async () => {
    try {
      const { accessToken } = await auth0.webAuth.authorize({
              scope: Config.AUTHO_SCOPE,
              audience: Config.AUTH0_AUDIENCE,
              device: DeviceInfo.getUniqueID(),
              prompt: "login"
            });

      auth0.auth
        .userInfo({ token: accessToken })
        .then(({ sub }) => {

          auth0
            .users(this.system_token)
            .getUser({ id: sub })
            .then(({ identities }) => {

              this.access_token = identities[0].access_token;
              SInfo.setItem("access_token", this.access_token, {});

              this.dbx = new Dropbox({
                accessToken: this.access_token,
                fetch: fetch
              });
            });

        })
        .catch((dropbox_user_details_err) => {
          console.log("error occurred while trying to get user details: ", dropbox_user_details_err);
        });

    } catch (auth0_dropbox_err) {
      console.log('error logging in Dropbox: ', auth0_dropbox_err);
    }

  }


  renderMessage = (msg) => {

    const { attachment } = msg.currentMessage;

    const renderBubble = (attachment) ? this.renderPreview.bind(this, attachment.link) : null;
    const modified_msg = {
      ...msg,
      renderBubble
    }

    return <Message {...modified_msg} />
  }

  //

  renderPreview = (uri, bubbleProps) => {

    const text_color = (bubbleProps.position == 'right') ? '#FFF' : '#000';
    const modified_bubbleProps = {
      ...bubbleProps
    };

    return (
      <ChatBubble {...modified_bubbleProps}>
        <TouchableOpacity onPress={() => {
          this.downloadFile(uri);
        }}>
          <View style={styles.downloadButton}>
            <Text style={[styles.link, { color: text_color }]}>download</Text>
          </View>
        </TouchableOpacity>
      </ChatBubble>
    );
  }

  //

  downloadFile = (link) => {

    RNFS.downloadFile({
      fromUrl: "https://content.dropboxapi.com/2/files/download",
      toFile: RNFS.ExternalDirectoryPath + link,
      headers: {
        "Authorization": `Bearer ${this.access_token}`,
        "Dropbox-API-Arg": JSON.stringify({ path: link })}
      })
      .promise
      .then((response) => {

          if (response.statusCode == 200) {
            Alert.alert('Operation Complete', 'Successfully downloaded file');
          } else {
            Alert.alert('Error', 'Something went wrong while trying to download file');
          }
        }
      )
      .catch((download_err) => {
        console.log('error downloading file: ', download_err);
      });
  }


}


const styles = {
  container: {
    flex: 1
  },
  loader: {
    paddingTop: 20
  },
  sendLoader: {
    marginRight: 10,
    marginBottom: 10
  },
  customActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  buttonContainer: {
    padding: 10
  },
  modal: {
    flex: 1
  },
  close: {
    alignSelf: 'flex-end',
    marginBottom: 10
  },
  link: {
    fontSize: 12
  },
  downloadButton: {
    padding: 5,
    backgroundColor: '#d89513',
    alignItems: 'center',
    margin: 10
  }
}

export default Chat;