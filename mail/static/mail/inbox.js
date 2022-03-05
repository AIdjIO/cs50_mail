var table;

document.addEventListener('DOMContentLoaded', function() {

  table = $('#email-table').DataTable();
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('input[type = "submit"]').addEventListener('click', send_email);
  // By default, load the inbox  
  load_mailbox('inbox');

});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name i.e. inbox, sent or archived
  document.querySelector('#emails-view').firstChild.remove();
  let viewTitle = document.createElement('h3');
  viewTitle.innerText = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`
  document.querySelector('#emails-view').insertBefore(viewTitle, document.querySelector('#emails-view').firstChild);

  fetch(`/emails/${mailbox}`)
  .then( response => response.json() )
  .then( emails => {
    if (emails.error) {
      createAlert(emails,$);
    }
    else {
      // Clear the email list  
      // const tbody = document.querySelector("tbody");
      // tbody.innerHTML = ''
      // if(tbody.childNodes) [...tbody.childNodes].forEach(row => table.row(row).remove())
      table.clear();

        // Print emails
        emails.forEach( email => {
          let newRow = table.row.add([
            email.sender,
            email.subject,
            email.timestamp
          ]).draw().node();

          if (email.read) $(newRow).addClass('read')

          $(newRow).on('click', () => view_email(email, mailbox));
      })
      table.draw();
    }
  })
  .catch(error => console.log(error));

  // Apply different background color depending on 'inbox', 'sent' or 'archived'
  switch (mailbox) {
    case 'inbox':
      document.querySelector('#emails-view').className = 'bg-success';
      break;
    case 'sent':
      document.querySelector('#emails-view').className = 'bg-info';
      break;
    case 'archive':
      document.querySelector('#emails-view').className = 'bg-warning';
      break;
    default:
      document.querySelector('#emails-view').className = 'bg-light';
  }
  // table.clear().draw();
}

function send_email(e) {

  e.preventDefault()
  // Get value in input fields of compose view
  let recipients = document.getElementById('compose-recipients').value
  let subject    = document.getElementById('compose-subject').value
  let body       = document.getElementById('compose-body').value

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  }).then(response => response.json()
  ).then(result => {
    createAlert(result,$);
    load_mailbox('sent');
  })

}

// reply to email
function reply_email(email) {

  compose_email();
  // Get value in input fields of compose view
  document.getElementById('compose-recipients').value = email.sender;
  document.getElementById('compose-subject').value = (email.subject.substring(0,4) === 'Re: ') ? email.subject : 'Re: ' + email.subject;
  document.getElementById('compose-body').value = `\nOn ${email.timestamp} ${email.sender} wrote:\n\"${email.body}\"`;
}

// view email
function view_email(email, mailbox) {

  // on viewing an email mark as read
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  // Show the email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  document.getElementById('emailFrom').innerHTML = '<strong>From: </strong>'+ email.sender;
  document.getElementById('emailTo').innerHTML = '<strong>To: </strong>'+ email.recipients;
  document.getElementById('emailSubject').innerHTML = '<strong>Subject: </strong>'+ email.subject;
  document.getElementById('emailTimestamp').innerHTML = '<strong>Timestamp: </strong> '+ email.timestamp;
  document.getElementById('email-body').innerText = ' '+ email.body;

  // add click event to reply button
  const replyBtn = document.querySelector('input[type="button"]')
  replyBtn.addEventListener('click',()=>reply_email(email));

  // if archive button does not exists create it only for 'inbox' and 'archive'
  if (mailbox == 'inbox' || mailbox == 'archive'){
    let archiveBtn = createArchiveBtn(email, replyBtn);
    archiveBtn.addEventListener('click', () => archive_email(email));
  }
  table.draw();
}

// view email
function archive_email(email) {

  // on viewing an email mark as read
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: !email.archived
    })
  }).then(()=>{
    // if any previous archive button exists, delete it
    archiveElmnt = document.getElementById("archive");
    if ( archiveElmnt != null) {
      archiveElmnt.remove();
      }
      load_mailbox('inbox');
    })
}



function createAlert(message,$){

  // retreive message object key
  let key = Object.keys(message);
  alertType =  key == "error" ? "danger" : "success"
  
  // create alert message container
  let alertElmnt = document.createElement('div');

  alertElmnt.setAttribute('id', 'alert');
  alertElmnt.setAttribute('role','alert');
  // set class according to bootstrap alert message type
  alertElmnt.className = 'alert alert-' + alertType + ' alert-dismissable fade show';
  alertElmnt.innerHTML = `<strong>${ message[key] }</strong>
                          <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                          </button>`
  const body = document.querySelector('body');
  body.insertBefore(alertElmnt, body.firstChild);
  window.setTimeout( () => {
    $(".alert").fadeTo(350, 0).slideUp(500, function(){
        $(this).remove(); 
    });
}, 2000);
}

function createArchiveBtn(email, btn){

  let archiveElmnt = document.getElementById("archive")
  console.log(archiveElmnt);
  if ( archiveElmnt != null) {
    archiveElmnt.remove();
  }

  let archiveBtn = document.createElement('input');
  let archived = email.archived ? 'Unarchive': 'Archive';

  archiveBtn.setAttribute("type", "button");
  archiveBtn.setAttribute("id", "archive");
  archiveBtn.className = "btn btn-sm btn-outline-primary"
  
  archiveBtn.setAttribute('value', archived);
  btn.parentNode.insertBefore(archiveBtn, btn.nextSibling);
  return archiveBtn;
}