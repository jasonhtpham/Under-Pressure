let express = require("express");
let app = express();
let bodyParser = require('body-parser');
let path = require('path');

//var app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);


const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://dbUser:dbUser@hyperledgercertificate.hgp6r.mongodb.net/firstdb?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const port = process.env.PORT || 8080;

app.set('view engine','ejs');
app.set('views', path.join(__dirname, './views'));

app.use(bodyParser.json(), bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));

recordUser = async (userData) => {
  try {
    await client.connect();
    const collection = await client.db("chatbot").collection("test").insertOne(
        {
            userId: userData.id,
            data: userData.data,
            timestamp: userData.timestamp,             
        }
    )

    return JSON.stringify(collection.ops);

  } catch (err) {
    console.log(err);
  }
}

getUserData = async (userId) => {
  try {
    await client.connect();
    const userData = await client.db("chatbot").collection("test").find({userId}).toArray()

    return userData;

  } catch (err) {
    console.log(err);
  }
}

/**
 * @description A function to handle actions based on the logicState variable chosen by user.
 * 
 * @param {Object} webhookRequest sent from DialogFlow.
 * 
 * @returns {Object} an object in form of a WebhookResponse.
 */
handleLogicState = async (webhookRequest) => {
  const logicState = parseInt(webhookRequest.queryResult.parameters.logicState);

  let msg = {}

  switch (logicState) {
    case 1:
      let id = webhookRequest.originalDetectIntentRequest.payload.data.sender.id
      let data = webhookRequest.originalDetectIntentRequest.payload.data.postback.payload
      let timestamp = webhookRequest.originalDetectIntentRequest.payload.data.timestamp

      let userData = {
        id,
        data,
        timestamp
      }

      const result = await recordUser(userData);

      msg.payload = userData;
      msg.result = result;

      break;

    case 2:
      break;

    case 3:
      const userId = webhookRequest.originalDetectIntentRequest.payload.data.sender.id;
      msg.payload = {};
      msg.payload.fulfillmentMessages=[
        {
          "text": {
            "text": [
              `https://8a9e83abc5c2.ngrok.io/bot/profile?userId=${userId}`
            ]
          }
        }
      ]
      break;
    
    default:
      break;
  }

  return msg;
}

app.post("/bot", async (request, response) => {

  const { body } = request;

  const responsePackage = await handleLogicState(body);

  // console.log(responsePackage.payload)

  response.send(responsePackage.payload);

});

app.get("/bot/profile", async (request, response) => {
  const userId = request.query.userId;

  const userData = await getUserData(userId)

  response.render('index', { title : "Under Pressure" , userId : userId, userData : JSON.stringify(userData) });
});

//socket test
// io.on('connection', (socket) => {
//   console.log('a user connected');
//   socket.on('disconnect', () => {
//     console.log('user disconnected');
//   });
//   setInterval(()=>{
//     socket.emit('number', parseInt(Math.random()*10));
//   }, 1000);

// });


http.listen(port,()=>{
  console.log("Listening on port ", port);
});

//this is only needed for Cloud foundry 
require("cf-deployment-tracker-client").track();
