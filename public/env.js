const testButtonFunction=()=>{
  alert('Thank you for clicking')
}

// connect to the socket

// let socket = io();


// socket.on('number', (msg) => {
//     console.log('Random number: ' + msg);
// })

// console.log('test')
$(document).ready(function(){
  console.log('Ready')
  
  //bind the button
  $('#testButton').click(testButtonFunction)

  $('#csvButton').click( () => {
    console.log("clicked")
    $("#answersTable").table2excel({ 
      filename: "Answers.xls" 
    }); 
  });

  // $.get('/bot', (result) => {
  //   $(".content").html(`${result.data}`)
  // })

  // $.post('/bot'), (data) => {
  //   console.log(`Bot test: ${data}`);
  // }


})
