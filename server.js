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
const e = require("express");
const { CLIENT_RENEG_WINDOW } = require("tls");

const dbName='users-t1'
//var app = require('express')();
//let http = require('http').createServer(app);
//let io = require('socket.io')(http);
var appEnv = cfenv.getAppEnv();


const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://dbUser:dbUser@hyperledgercertificate.hgp6r.mongodb.net/firstdb?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const port = appEnv.port || 8080;


const keyQuestions = [1, 6, 8, 11, 12, 14, 18]

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

app.use(bodyParser.json(), bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.get('/test', (req, res) => {
  res.send("All good")
})

recordInteraction = async (userId) => {
  await client.connect();
  let interaction = client.db("chatbot").collection("users").insertOne()


}

handleQuestion = async () => {

  msg = {
    "followupEventInput": {
      "name": "program1"
    }
  }
  return msg

}


const getCurrentQuestion = async (userId) => {
  userData = await getUserData(userId)
  console.log(userData)
  let found = 0

  for (let a = 0; a < userData.answers.length; a++) {

    for (let i = 0; i < keyQuestions.length; i++) {
      if (!userData.answers[a].answer && userData.answers[a].id == keyQuestions[i]) {
        console.log('[GetCUrrentQuestion]:', keyQuestions[i])
        found = keyQuestions[i]
        break;
      }
      if (found != 0) {
        break;
      }
    }
  }

  return found

}


const getNextQuestion = async (userId) => {
  let msg = {
    "followupEventInput": {
      "name": ''
    }
  }

  try {

    let question = await getCurrentQuestion(userId);
    if (question == 0) {
      return msg = {
        "followupEventInput": {
          "name": "completed"
        }
      }
    }
    msg = {
      "followupEventInput": {
        "name": "program" + question
      }
    }
    console.log('Next Question', msg)

    return msg



  } catch (err) {
    console.log(err);
  }


}

const createNewUser = async (userId) => {
  let msg = {
    "followupEventInput": {
      "name": ''
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
    const userData = await client.db("chatbot").collection(dbName).find({ userId }).toArray()
    console.log(userId)
    //console.log(userData)
    if (userData.length < 1) {
      console.log('User does not exist, will create now')

      let answers = []
      _populateArray = () => {
        for (i = 0; i < 21; i++) {
          let template = { id: i + 1, answer: false, value: 0 }
          answers.push(template)
        }
        return answers
      }


      const collection = await client.db("chatbot").collection(dbName).insertOne(
        {
          userId: userId,
          dateCreated: Date.now(),
          answers: _populateArray(),
          allAnswers: []
        }
      )
      console.log(collection.ops)
      console.log(answers)
      console.log('user created')
      msg = {
        "followupEventInput": {
          "name": "newUser"
        }
      }
      msg.followupEventInput.name = "newUser"
    } else {

      msg = {
        "followupEventInput": {
          "name": "existingUser"
        }
      }
      /*console.log('User Exists')
      let question = await getCurrentQuestion(userId);
      if (question == 0) {
        return msg = {
          "followupEventInput": {
            "name": "completed"
          }
        }
      }
      msg = {
        "followupEventInput": {
          "name": "program" + question
        }
      }*/
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
    console.log('[recordUser]:', collection.ops)

    return JSON.stringify(collection.ops);

  } catch (err) {
    console.log(err);
  }
}

const getUserData = async (userId) => {
  try {
    await client.connect();
    const userData = await client.db("chatbot").collection(dbName).findOne({ userId })

    //console.log('[getUserData]:',userData)



    return userData;

  } catch (err) {
    console.log(err);
  }
}

getQuestions = async (questionGroup) => {
  try {
    await client.connect();
    const questions = await client.db("chatbot").collection("questions").find({ group: questionGroup }).toArray()

    // questions.forEach(q => {
    //   console.log(q.value);
    // })

    return questions;

  } catch (err) {
    console.log(err);
  }
}

const updateAnswer = async (userId, parameters) => {
  // answer , question , followup
  const userData = await getUserData(userId);
  console.log('[Update Answer]', userData)

  let answer = userData.answers[parameters.question - 1]
  // console.log(answer)
  answer.value = parseFloat(parameters.answer)
  answer.answer = true

  // console.log(answer)
  userData.answers[parameters.question - 1] = answer

  console.log('[Checking Answer]', answer)
  console.log('[Checking userId]', userId)

  // const test = await client.db("chatbot").collection("users-test").findOne(
  //   {userId: userId, 'answers.$': 1}
  // );
  // console.log("Test db",test)

  // await client.connect();
  let testAnswer = parseInt(parameters.question)
  console.log('test Answer', testAnswer)
  client.db("chatbot").collection(dbName).updateOne({ userId: userId, 'answers.id': testAnswer }, {
    $set: { "answers.$.answer": true, "answers.$.value": answer.value }
  }, (err, result) => {
    console.log('result', result)
  })

  /*client.db("chatbot").collection("users-test").updateMany(
    { 'userId' : `3284453798346989`  },
    { $set: { "answers.$[element].value": `${answer.value}` } },
    { arrayFilters: [{'element.id': `${parameters.question}` }]}, (result) => console.log("[Update Result]: ", result)
 )*/

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
  const parameters = webhookRequest.queryResult.parameters;
  let userId = webhookRequest.originalDetectIntentRequest.payload.data.sender.id;

  console.log('Logic state', logicState)

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
      let resultUser = await createNewUser(webhookRequest.originalDetectIntentRequest.payload.data.sender.id)
      console.log(resultUser)
      let finalResult = {
        payload: resultUser
      }
      return finalResult
      break;
    case 1:
      console.log('questions')
      let questions = await getQuestions(1);

      msg.payload = {};
      msg.payload.fulfillmentMessages = [
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

      if (queryText === "never" || queryText === 'n') {
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
      msg.payload = {};
      msg.payload.fulfillmentMessages = [
        {
          "text": {
            "text": [
              `https://b671157c6c88.ngrok.io/bot/profile?userId=${userId}`
            ]
          }
        }
      ]
      break;
    case 10:
      console.log('handling question')
      // let userId = webhookRequest.originalDetectIntentRequest.payload.data.sender.id;

      updateAnswer(userId, parameters)
      console.log('[Update Answer Complete]')
      msg = {
        "followupEventInput": {
          "name": parameters.followup != 0 ? "program" + parameters.followup : "end"
        }
      }
      let questionResult = {
        payload: msg
      }
      console.log('[Returning message]', msg)



      return questionResult

      break;

    case 11:
      console.log('Returning user going home')
      // let userId = webhookRequest.originalDetectIntentRequest.payload.data.sender.id;

      msg = {
        "followupEventInput": {
          "name": "home"
        }
      }
      let redirectHome = {
        payload: {
          "followupEventInput": {
            "name": "home"
          }
        }
      }
      console.log('[Returning message]', msg)

      return redirectHome

      break;

    case 12:
      console.log('Getting next Set of questions')
      let nextQuestion = {
        payload: await getNextQuestion(userId)
      }
      console.log('[Returning message]', nextQuestion.payload)
      return nextQuestion



      break;


    default:
      break;
  }

  return msg;
}

app.post("/bot", async (request, response) => {
  console.log('Hello')
  let { body } = request;
  //console.log('BODY',body)
  console.log('body', body.originalDetectIntentRequest.payload.data)

  let responsePackage = await handleLogicState(body);
  //console.log(responsePackage)

  // msg.payload = userData;
  // msg.result = result;

  // console.log(responsePackage.payload)
  console.log('payload', responsePackage.payload)

  response.send(responsePackage.payload);

});


const profileTracker = (userData) => {
  console.log(userData)

  /// ■ Depression symptoms related items: 3, 5, 10, 13, 16, 17, 21.

  /// ■ Anxiety disorder related items: 2, 4, 7, 9, 15, 19, 20.

  /// ■ Stress related items: 1, 6, 8, 11, 12, 14, 18.
  arrayMaker = (list, originalArray) => {
    let subArray = []
    list.forEach(element => {
      subArray.push(originalArray[element - 1])
    });
    return subArray

  }

  arrayValuesAdder = (originalArray) => {
    let value = 0
    originalArray.forEach(element => {
      value+=element.value
    })
    return value
  }

  let stressList = [1, 6, 8, 11, 12, 14, 18]
  let anxietyList = [2, 4, 7, 9, 15, 19, 20]
  let depressionList = [3, 5, 10, 13, 16, 17, 21]

  stressArray = arrayMaker(stressList, userData.answers)
  anxietyArray = arrayMaker(anxietyList, userData.answers)
  depressionArray = arrayMaker(depressionList, userData.answers)

  stressValue = arrayValuesAdder(stressArray)
  anxietyValue = arrayValuesAdder(anxietyArray)
  depressionValue = arrayValuesAdder(depressionArray)



  let mentalState = {
    stressValue, anxietyValue, depressionValue
  }
  return mentalState

}


app.get("/bot/profile", async (request, response) => {
  const userId = request.query.userId;


  const userData = await getUserData(userId)
  let mentalState=profileTracker(userData);

  console.log("[mentalState]: ")

  response.render('index', { title: "Under Pressure", userId: userId,mentalState, userData});
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


app.listen(port, () => {
  console.log("Listening on port ", port);
})

/*app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});*/



//this is only needed for Cloud foundry 
require("cf-deployment-tracker-client").track();
