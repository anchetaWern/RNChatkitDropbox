import React, { Component } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import stringHash from "string-hash";
import axios from "axios";
import Permissions from "react-native-permissions";

const CHAT_SERVER = "YOUR NGROK HTTPS URL/users";

class LoginScreen extends Component {
  static navigationOptions = {
    title: "Login"
  };

  state = {
    username: "yoh",
    friends_username: "ren",
    is_loading: false
  };

  componentDidMount() {
    Permissions.check('storage').then((response) => {
      console.log('storage permission: ', response);

      if(response == 'undetermined') {

        Permissions.request('storage').then(response => {
          console.log('requested storage permission: ', response);
        });

      }
    });
  }

  //

  render() {
    return (
      <View style={styles.wrapper}>
        <View style={styles.container}>

          <View style={styles.main}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Enter your username</Text>
              <TextInput
                style={styles.textInput}
                onChangeText={username => this.setState({ username })}
                value={this.state.username}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Enter friend's username</Text>
              <TextInput
                style={styles.textInput}
                onChangeText={friends_username =>
                  this.setState({ friends_username })
                }
                value={this.state.friends_username}
              />
            </View>

            {!this.state.is_loading && (
              <TouchableOpacity onPress={this.enterChat}>
                <View style={styles.button}>
                  <Text style={styles.buttonText}>Login</Text>
                </View>
              </TouchableOpacity>
            )}

            {this.state.is_loading && (
              <Text style={styles.loadingText}>Loading...</Text>
            )}
          </View>
        </View>
      </View>
    );
  }



  enterChat = async () => {

    const username = this.state.username;
    const friends_username = this.state.friends_username;
    const user_id = stringHash(username).toString();

    this.setState({
      is_loading: true
    });

    if (username && friends_username) {

      try {
        const response = await axios.post(
          CHAT_SERVER,
          {
            user_id: user_id,
            username: username
          }
        );

        const system_token = response.data;

        this.props.navigation.navigate("Chat", {
          user_id,
          username,
          friends_username,
          system_token
        });

      } catch (e) {
        console.log(`error logging in: ${e}`);
      }

      await this.setState({
        is_loading: false,
        username: "",
        friends_username: ""
      });

    }

  };
}

export default LoginScreen;

const styles = {
  wrapper: {
    flex: 1
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFF"
  },
  fieldContainer: {
    marginTop: 20
  },
  label: {
    fontSize: 16
  },
  textInput: {
    height: 40,
    marginTop: 5,
    marginBottom: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    backgroundColor: "#eaeaea",
    padding: 5
  },
  button: {
    alignSelf: "center",
    marginTop: 10
  },
  buttonText: {
    fontSize: 18,
    color: "#05a5d1"
  },
  loadingText: {
    alignSelf: "center"
  }
};