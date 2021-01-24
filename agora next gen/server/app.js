const express = require("express");
var cors = require("cors");
var bodyparser = require('body-parser')
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const userList = require("./fake-user")();

const PORT = process.env.PORT || 4000;
const APP_ID = "";
const APP_CERTIFICATE = "";

const app = express();

let ScreenSharing = {};


app.use(cors())
app.use(bodyparser.urlencoded({extended:false}))
app.use(bodyparser.json())

const nocache = (req, resp, next) => {
  resp.header("Cache-Control", "private, no-cache, no-store, must-revalidate");

  resp.header("Expires", "-1");
  resp.header("Pragma", "no-cache");
  next();
};

const generateAccessToken = (req, resp) => {
  const channelName = req.query.channelName;
  if (!channelName) {
    return resp.status(500).json({ error: "channel is required" });
  }

  // get uid
  let uid = req.query.uid;
  if (!uid || uid == "") {
    uid = 0;
  }
  // get role
  let role = RtcRole.SUBSCRIBER;
  if (req.query.role == "publisher") {
    role = RtcRole.PUBLISHER;
  }
  // get the expire time
  let expireTime = req.query.expireTime;
  if (!expireTime || expireTime == "") {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );
  return resp.json({ token: token });
};

app.get("/access_token",  generateAccessToken);

app.get("/userlist",  function (req, resp) {
  resp.json({
    userList,
  });
});

app.post("/screenShared",  function (req, resp) {
  const channelName = req.body.channelName;
  const isSharing = req.body.isSharing;
  const username = req.body.username;
  const uid = req.body.uid;
  if (channelName  && username && uid) {
    ScreenSharing[channelName] = {
      isScreenSharing: !!isSharing,
      username: username,
      uid: uid,
    };
    resp.json({});
  } else {
    resp.sendStatus(400);
  }
});

app.get("/screenShared",  function (req, resp) {
  console.log(req.query)
  console.log(ScreenSharing);
  const channelName = req.query.channelName;
  if (ScreenSharing[channelName]) {
    resp.json(ScreenSharing[channelName]);
  } else {
    resp.send({
      isScreenSharing: false,
      username: '',
      uid: '',
    });
  }
});

app.get("/clear",  function (req, resp) {
  ScreenSharing = {};
  resp.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
