const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Chatkit = require("@pusher/chatkit-server");

require("dotenv").config();

const AuthenticationClient = require('auth0').AuthenticationClient;

const auth0 = new AuthenticationClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET
});

const app = express();
const INSTANCE_LOCATOR_ID = process.env.CHATKIT_INSTANCE_LOCATOR_ID;
const CHATKIT_SECRET = process.env.CHATKIT_SECRET_KEY;

const chatkit = new Chatkit.default({
  instanceLocator: `v1:us1:${INSTANCE_LOCATOR_ID}`,
  key: CHATKIT_SECRET
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

let rooms = [
  {
    id: '20018546',
    name: 'ren-yoh'
  }
];
let system_token = '';

app.get("/", (req, res) => {
  res.send("all green!");
});

app.get("/token/refresh", (req, res) => {
  auth0.clientCredentialsGrant(
    {
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      scope: 'read:users read:user_idp_tokens'
    },
    (err, response) => {
      if (err) {
        console.log('error occurred: ', err);
      } else {
        system_token = response.access_token;
        console.log('access token: ', system_token);

      }

      res.send('ok');
    }
  );
});

app.get("/system-token", (req, res) => {
  res.send(system_token); // note: for testing only. remove this
});

app.post("/users", async (req, res) => {
  const { user_id, username } = req.body;
  try {
    let user = await chatkit.createUser({
      id: user_id,
      name: username
    });

    res.send(system_token);
  } catch (err) {
    if (err.error === "services/chatkit/user_already_exists") {

      res.send(system_token);
    } else {

      let statusCode = err.error.status;
      if (statusCode >= 100 && statusCode < 600) {
        res.status(statusCode);
      } else {
        res.status(500);
      }
    }
  }
});

app.post("/rooms", async (req, res) => {
  const { user_id, room_name } = req.body;

  let room_data = rooms.find(room => {
    return room_name == room.name;
  });

  if (!room_data) {

    let room = await chatkit.createRoom({
      creatorId: user_id,
      name: room_name
    });

    rooms.push({
      id: room.id,
      name: room_name
    });

    res.send(room);
  } else {

    res.send(room_data);
  }
});

const PORT = 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Running on ports ${PORT}`);
  }
});