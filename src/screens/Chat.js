import React, { Component } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { GiftedChat, Send, Message } from "react-native-gifted-chat";
import { ChatManager, TokenProvider } from "@pusher/chatkit-client";
import axios from "axios";
import Config from "react-native-config";
import Icon from "react-native-vector-icons/FontAwesome";

const CHATKIT_INSTANCE_LOCATOR_ID = `v1:us1:${Config.CHATKIT_INSTANCE_LOCATOR_ID}`;
const CHATKIT_SECRET_KEY = Config.CHATKIT_SECRET_KEY;
const CHATKIT_TOKEN_PROVIDER_ENDPOINT = `https://us1.pusherplatform.io/services/chatkit_token_provider/v1/${Config.CHATKIT_INSTANCE_LOCATOR_ID}/token`;

const CHAT_SERVER = "YOUR NGROK HTTPS URL/rooms";

class Chat extends Component {

  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      headerTitle: `Chat with ${params.friends_username}`
    };
  };

  //

  state = {
    messages: [],
    is_initialized: false
  };

  //

  constructor(props) {
    super(props);
    const { navigation } = this.props;
    const user_id = navigation.getParam("user_id");
    const username = navigation.getParam("username");
    const friends_username = navigation.getParam("friends_username");

    const members = [username, friends_username];
    members.sort();

    this.user_id = user_id;
    this.username = username;
    this.room_name = members.join("-");
  }

  //

  async componentDidMount() {

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

    try {
      await this.currentUser.sendMultipartMessage({
        roomId: this.room_id,
        parts: message_parts
      });

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


  getMessage = async ({ id, senderId, text, createdAt }) => {

    let msg_data = {
      _id: id,
      text: text,
      createdAt: new Date(createdAt),
      user: {
        _id: senderId,
        name: senderId,
        avatar: "https://png.pngtree.com/svg/20170602/0db185fb9c.png"
      }
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
            renderSend={this.renderSend}
          />
        )}
      </View>
    );
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