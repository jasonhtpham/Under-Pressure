let express = require("express");
let app = express();
let bodyParser = require('body-parser');

//var app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);


const MongoClient = require('mongodb').MongoClient;


const port = process.env.PORT || 8080;

const uri = "mongodb+srv://dbUser:dbUser@hyperledgercertificate.hgp6r.mongodb.net/firstdb?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

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

getUserId = async (userId) => {
  try {
    await client.connect();
    const userData = await client.db("chatbot").collection("test").find({userId}).toArray()

    return userData[0].userId;

  } catch (err) {
    console.log(err);
  }
}

handleLogicState = async (body) => {
  const logicState = parseInt(body.queryResult.parameters.logicState);

  let msg = {}

  switch (logicState) {
    case 1:
      let id = body.originalDetectIntentRequest.payload.data.sender.id
      let data = body.originalDetectIntentRequest.payload.data.postback.payload
      let timestamp = body.originalDetectIntentRequest.payload.data.timestamp

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
      const userId = await getUserId(body.originalDetectIntentRequest.payload.data.sender.id);
      msg.payload = "";
      msg.payload.fulfillmentText=`https://45f9db9f503b.ngrok.io/bot/profile?${userId}`
      break;
    
    default:
      break;
  }

  return msg;
}

app.post("/bot", function (request, response, next) {

  const { body } = request;

  const responsePackage = handleLogicState(body);

  response.send(responsePackage);

});

app.get("/bot/profile", function (request, response) {
  const { userId } = request.query;

  console.log("API hit", userId)
  
  response.send(userId);
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
