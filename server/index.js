const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Chatkit = require("@pusher/chatkit-server");

require("dotenv").config();

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

let rooms = [];

app.get("/", (req, res) => {
  res.send("all green!");
});

app.post("/users", async (req, res) => {
  const { user_id, username } = req.body;
  try {
    let user = await chatkit.createUser({
      id: user_id,
      name: username
    });

    res.sendStatus(200);
  } catch (err) {
    if (err.error === "services/chatkit/user_already_exists") {

      res.sendStatus(201);
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