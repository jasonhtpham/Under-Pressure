// console.log('test')
$(document).ready(function(){
  console.log('Ready')

  $('#answersTable').DataTable({
    "searching": false, "bLengthChange": false, "pageLength": 10, responsive: true
    });
    $('.dataTables_length').addClass('bs-select');

  $('#csvButton').click( () => {
    $("#answersTable").table2excel({ 
      filename: "Answers.xls" 
    }); 
  });

  $('#printButton').click( () => {
    console.log("Clicked")
    window.print();
  })

  // $.get('/bot', (result) => {
  //   $(".content").html(`${result.data}`)
  // })

  // $.post('/bot'), (data) => {
  //   console.log(`Bot test: ${data}`);
  // }


})
