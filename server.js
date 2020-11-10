/**
 * TODO: ask sequence of questions (we can get an array of questions by group already)
 * 
 * TODO: check user if he/she is new or return one
 * 
 * TODO: store question group value when storing user data -> ask new group of questions if the user return
 */

let express = require("express");
let app = express();
let bodyParser = require('body-parser');
let path = require('path');
var cfenv = require('cfenv');

//var app = require('express')();
//let http = require('http').createServer(app);
//let io = require('socket.io')(http);
var appEnv = cfenv.getAppEnv();


const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://dbUser:dbUser@hyperledgercertificate.hgp6r.mongodb.net/firstdb?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const port = appEnv.port || 8080;

app.set('view engine','ejs');
app.set('views', path.join(__dirname, './views'));

app.use(bodyParser.json(), bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));

app.get('/test',(req,res)=>{
  res.send("All good")
})

recordInteraction=async(userId)=>{
  await client.connect();
  let interaction=client.db("chatbot").collection("users").insertOne()


}


createNewUser= async(userId)=>{
  let msg={
    "followupEventInput":{
      "name":''
    }
  }
 /* msg.fulfillmentMessages=[
    {
      "text": {
        "text": [
          "Let's give your answer to these statement. \
          NOTE: Type and answer NEVER or N if you never experienced the feeling"
        ]
      }
    },*/
  try {
    await client.connect();
    const userData = await client.db("chatbot").collection("users").find({userId}).toArray()
    console.log(userId)
    //console.log(userData)
    if(userData.length<1){
      console.log('User does not exist, will create now')
      const collection = await client.db("chatbot").collection("users").insertOne(
        {
            userId: userId,
            dateCreated: Date.now(),
            answers: [
            {group:1,answered:false,answers:[]},
            {group:2,answered:false,answers:[]},
            {group:3,answered:false,answers:[]},
            {group:4,answered:false,answers:[]},
            {group:5,answered:false,answers:[]},
            {group:6,answered:false,answers:[]},
            {group:7,answered:false,answers:[]}],
            allAnswers:[]
        }
    )
    console.log(collection.ops)
    console.log('user created')
    msg={
      "followupEventInput":{
        "name":"newUser"
      }
    }
    msg.followupEventInput.name="newUser"
    }else{
      console.log('User Exists')
      msg={
        "followupEventInput":{
          "name":"existingUser"
        }
      }
    }
    return msg
    //return userData;

  } catch (err) {
    console.log(err);
  }

}

recordUser = async (userData) => {
  try {
    await client.connect();
    const collection = await client.db("chatbot").collection("test").insertOne(
        {
            userId: userData.id,
            timestamp: userData.timestamp,
            answerNumber: userData.answerNumber,
            answerLetter: userData.answerLetter,
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

getQuestions = async (questionGroup) => {
  try {
    await client.connect();
    const questions = await client.db("chatbot").collection("questions").find({ group : questionGroup }).toArray()

    // questions.forEach(q => {
    //   console.log(q.value);
    // })

    return questions;

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
  console.log('Logic state',logicState)

  let msg = {}

  /* 
  logicState is defined as follow:
  1: The user choose to Record Data.
  2: The user answered the question -> server store data in db.
  3: The user asks for Result -> server replies with URL to simple webpage.
  */

  switch (logicState) {
    case 0:
      console.log('New Conversation started')
      let resultUser=await createNewUser(webhookRequest.originalDetectIntentRequest.payload.data.sender.id)
      console.log(resultUser)
      let finalResult={
        payload:resultUser
      }
      return finalResult
      break;
    case 1:
      console.log('here')
      let questions = await getQuestions(1);

      msg.payload = {};
      msg.payload.fulfillmentMessages=[
        {
          "text": {
            "text": [
              "Let's give your answer to these statement. \
              NOTE: Type and answer NEVER or N if you never experienced the feeling"
            ]
          }
        },
        {
          "card": {
            "title": `${questions[0].value}`,
            "subtitle": "Choose your best answer below OR type and answer NEVER or N if you never experienced the feeling",
            "imageUri": "",
            "buttons": [
              {
                "text": "Sometimes",
                "postback": "S"
              },
              {
                "text": "Often",
                "postback": "O"
              },
              {
                "text": "Almost Always",
                "postback": "AA"
              }
            ]
          }
        }
      ]
      break;

    case 2:
      let id = webhookRequest.originalDetectIntentRequest.payload.data.sender.id;
      let timestamp = webhookRequest.originalDetectIntentRequest.payload.data.timestamp;
      let answerNumber = webhookRequest.queryResult.parameters.answer;
      let answerLetter;

      let queryText = webhookRequest.queryResult.queryText.toString().toLowerCase();

      if ( queryText === "never" || queryText === 'n') {
        answerLetter = "N";
      } else {
        answerLetter = webhookRequest.queryResult.queryText;
      }

      let userData = {
        id,
        timestamp,
        answerNumber,
        answerLetter
      }

      let result = await recordUser(userData);
      // console.log(result)

      // if (result) {
      //   msg.payload = {};
      //   msg.payload.fulfillmentMessages=[
      //     {
      //       "text": {
      //         "text": [
      //           "Thank you for answering!"
      //         ]
      //       }
      //     }
      //   ]
      // }

      break;

      // Make sure you update the URL in the `fulfillmentMessages` when you have a new tunnel.
    case 3:
      let userId = webhookRequest.originalDetectIntentRequest.payload.data.sender.id;
      msg.payload = {};
      msg.payload.fulfillmentMessages=[
        {
          "text": {
            "text": [
              `https://68307f5d77b4.ngrok.io/bot/profile?userId=${userId}`
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

  let { body } = request;
  console.log(body)

  let responsePackage = await handleLogicState(body);
  console.log(responsePackage.payload)

  // msg.payload = userData;
  // msg.result = result;

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


app.listen(port,()=>{
  console.log("Listening on port ", port);
})

/*app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});*/



//this is only needed for Cloud foundry 
require("cf-deployment-tracker-client").track();
