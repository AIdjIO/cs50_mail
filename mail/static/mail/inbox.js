var table;

document.addEventListener('DOMContentLoaded', function() {

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
  // slashIndex = document.baseURI.indexOf('/');
  // document.baseURI = document.baseURI.substring(0,slashIndex);
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

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
  // Show the mailbox name i.e. inbox, sent or archived
  document.querySelector('#emails-view').firstChild.remove();
  let viewTitle = document.createElement('h3');
  viewTitle.innerText = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`
  document.querySelector('#emails-view').insertBefore(viewTitle, document.querySelector('#emails-view').firstChild);

  fetch(`/emails/${mailbox}`)
  .then( response => response.json() )
  .then(emails => {
    // console.log(emails);
    table = $('#email-table').DataTable();
    
    // Clear the email list  
    const tbody = document.querySelector("tbody");
    if(tbody.childNodes) tbody.childNodes.forEach(row => table.row(row).remove())
    tbody.innerHTML = ''

      // Print emails
      emails.forEach(email => {
        let newRow = table.row.add([
          email.sender,
          email.subject,
          email.timestamp
        ]).draw().node();

        if (email.read) $(newRow).addClass('read')

        $(newRow).on('click', () => view_email(email, mailbox));
    })
  });
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
  }).then(response => {
    response.json();
  }).then(result => {
    console.log(result);
    let alertElmnt = document.createElement('div');
    alertElmnt.setAttribute('id', 'alert');
    alertElmnt.className = 'alert-success'
    alertElmnt.innerHTML = `<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>${result.error}</strong>`
    body.appendChild(alertElmnt);
    load_mailbox('sent')
  })
}

// reply to email
function reply_email(email) {

  compose_email();
  // Get value in input fields of compose view
  document.getElementById('compose-recipients').value = email.sender;
  document.getElementById('compose-subject').value = (email.subject.substring(0,4) === 'Re: ') ? email.subject : 'Re: ' + email.subject;
  document.getElementById('compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n\"${email.body}\"`;

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
  
  document.getElementById('emailFrom').innerHTML = '<strong>From: </strong>'+ email.recipients;
  document.getElementById('emailTo').innerHTML = '<strong>To: </strong>'+ email.sender;
  document.getElementById('emailSubject').innerHTML = '<strong>Subject: </strong>'+ email.subject;
  document.getElementById('emailTimestamp').innerHTML = '<strong>Timestamp: </strong> '+ email.timestamp;
  document.getElementById('email-body').innerText = ' '+ email.body;

  // add click event to reply button
  const replyBtn = document.querySelector('input[type="button"]')
  replyBtn.addEventListener('click',()=>reply_email(email));

  archiveElmnt = document.getElementById("archive")
  if ( archiveElmnt != null) {
    archiveElmnt.removeEventListener('click',() => archive_email(email))
    archiveElmnt.remove();
  }

  // if archive button does not exists create it only for 'inbox' or 'archive'
  const archiveBtn = document.createElement('input');

  if (mailbox == 'inbox' || mailbox == 'archive'){

    replyBtn.parentNode.insertBefore(archiveBtn, replyBtn.nextSibling);

    archiveBtn.setAttribute("type", "button");
    archiveBtn.setAttribute("id", "archive");
    archiveBtn.className = "btn btn-sm btn-outline-primary"

    const archived = email.archived ? 'Unarchive' : 'Archive'
    archiveBtn.setAttribute('value', archived);

    archiveBtn.addEventListener('click', () => archive_email(email));
  }
}



// view email
function archive_email(email) {

  // on viewing an email mark as read
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: !email.archived
    })
  })


  archiveElmnt = document.getElementById("archive");
  if ( archiveElmnt != null) {
    archiveElmnt.removeEventListener('click', () => archive_email(email));
    archiveElmnt.remove();
  }
    load_mailbox('inbox');
}