$(() => {

  let layout = `<div id='layout'>
                  <header>
                    <h1>Contact Manager</h1>
                    <h2> Using RequireJS, Handlebar, Localstorage...</h2>
                  </header>
                  <div id ='displayArea'> 
                    <div class='addContactHeader'> 
                        <button class='addContact'>Add Contact</button>
                        <form>
                          <input id ='search' type='search' name ='search' placeholder ='Search Contacts'>
                          <label for='tagSelect'>Select by Tag</label>
                          <select id ='tagSelect'>
                            <option id='noTags'>No Tag</option>
                            <optgroup id ='userTags' label="Contact Tags">
                            </optgroup>
                          </select>
                        </form>
                    </div>
                  </div>
                  <footer>
                    <span>Front-End Developed by Srdjan Malicevic for LaunchSchool. Based off of Devasaran & 239 Listing Real Estate Contact Manager.</span>  
                  </footer>
                </div>`;

  $('body').append(layout);

  (async () => {

    let displayArea = $('#displayArea');

    let tagOptions = `
                      {{#if tags}}
                      {{#each tags}}
                        <option class='tagged'>{{this}}</option>
                      {{/each}}
                      {{else}}
                      <option>No tags available.</option>
                      {{/if}}`;

    let createContact = `<div class='createContact'> 
                          <h2>Create Contact</h2>
                          <form method ='post' novalidate>
                            <fieldset>
                                <label for='fullName'> Full name:</label>
                                <input type='text' name='fullName' required/>
                                <label for='email'>Email Address:</label>
                                <input type='email' name ='email' required/>
                                <label for='phone'>Phone Number:</label>
                                <input type="tel" id="phone" name="phone" pattern='[0-9]{3}-[0-9]{3}-[0-9]{4}' required />
                                <label for='tag'>Tags (separate multiple tags with a space):</label>
                                <input type='text' name ='tags' required/>
                            </fieldset>
                            <div class='buttonGroup'>
                              <button id ='submit' type='button'>Submit</button>
                              <button id ='cancelCreate' type='button'>Cancel</button>
                            </div>
                          </form>
                        </div>`;

    let editContact = `<div class='editContact'> 
                          <h2 id='editID' data-contact='{{index}}'>Edit Contact - {{full_name}}</h2>
                          <form method ='post' novalidate>
                            <fieldset>
                                <label for='fullName'> Full name:</label>
                                <input type='text' name ='fullName' required/>
                                <label for='email'>Email Address:</label>
                                <input type='email' name ='email' required/>
                                <label for='phone'>Phone Number:</label>
                                <input type="tel" id="phone" name="phone" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" required />
                                <label for='tag'>Tags (separate multiple tags with a space):</label>
                                <input type='text' name ='tags' required/>
                            </fieldset>
                            <div class='buttonGroup'>
                              <button id ='editSubmit' type='button'>Submit</button>
                              <button id ='cancelCreate' type='button'>Cancel</button>
                            </div>
                          </form>
                      </div>`;

    let contactArea = ` <div id='contactArea'>
                        {{#if contacts}}
                        <ul id="contactList">
                          {{#each contacts}}
                          <div class='contactInfo' data-contact='{{assign @index this}}'>
                              <h3 class='name'>{{this.full_name}}</h3>
                              <p><b>Phone Number:</b></p>
                              <p>{{this.phone_number}}</p>
                              <p><b>Email:</b></p>
                              <p>{{this.email}}</p>
                              <p><b>Tags:</b></p>
                              <p>{{space this.tags}}</p>
                              <div class='buttonGroup'>
                                <button class='edit' type='button' data-contact='{{@index}}'>Edit</button>
                                <button class='delete' type='button' data-contact='{{@index}}'>Delete</button>
                              </div>
                          </div>
                          {{/each}}
                        </ul>
                        {{else}}
                        <div id='noContacts'>
                          <h2>There are no contacts.</h2>
                        </div>
                        {{/if}}
                        </div>`;

    ///////////// Handlebars

    // Template Edit Page (contact's name is compiled)
    let editTemplate = Handlebars.compile(editContact);

    // Template Contacts
    let contactsTemplate = Handlebars.compile(contactArea);

    // Template Tags
    let tagsTemplate = Handlebars.compile(tagOptions);

    Handlebars.registerHelper('assign', (idx, obj) => {
      // 'obj' is the contact list object
      obj[idx] = obj.id;  // Creates a reference to the real ID using the index as a property identifier

      obj['dataID'] = idx; // Creates a reference to the index using 'dataID'

      return idx;         // Obscures the user ID by making the index the data-contact attribute
    });


    Handlebars.registerHelper('space', (tags) => {
      // Joins tags
      let spaced = tags.join(' ');
      return spaced;
    });

    ///////////// Get contact data and display the default page

    let currentContacts = await getContacts();

    displayDefault();


    ///////////// Functions

    async function tryFetch(url, method, contentType = "application/json", body = null) {
      try {
        let response = await fetch(url, {method: method,
          headers: {"Content-Type": contentType}, body: body});
        let clonedResponse = response.clone();
        let textResponse = null;
        let objectResponse = null;

        if (method.toLowerCase() === 'get') {
          objectResponse = await clonedResponse.json();
        } else {
          textResponse = await response.text();
        }

        return {response, textResponse, objectResponse};

      } catch (error) {
        console.error(error);
      }
    }

    function checkDuplicate(submissionObject) {
      let name = submissionObject['full_name'];
      let phone = submissionObject['phone_number'];
      let email = submissionObject['email'];
      let check = false;

      currentContacts.contacts.forEach((contactObject) => {

        if (contactObject['full_name'] === name &&
            contactObject['phone_number'] === phone &&
            contactObject['email'] === email) {

          check = true;

        }

      });
      return check;
    }

    function formValidator(event = {target: {id: null}}) {

      let name = document.querySelector('[name="fullName"]');
      let phone = document.querySelector('[name="phone"]');
      let email = document.querySelector('[name="email"]');

      $(name).on('input', () => {
        name.reportValidity();
      });

      $(email).on('input', () => {
        email.reportValidity();
      });

      $(phone).on('input', () => {

        if (phone.validity.patternMismatch) {
          phone.setCustomValidity('Please use the following format (XXX-XXX-XXXX)');
        } else {
          phone.setCustomValidity('');
        }
        phone.reportValidity();
      });

      if (event.target.id === 'submit' || event.target.id === 'editSubmit') {
        if (phone.checkValidity() && name.checkValidity() && email.checkValidity()) {
          return true;
        } else {
          if (!phone.checkValidity()) { phone.reportValidity()}
          if (!email.checkValidity()) { email.reportValidity()}
          if (!name.checkValidity()) { name.reportValidity()}
        }
      }

    }

    function reportIfDuplicate(submissionObject) {
      if (checkDuplicate(submissionObject)) {
        flashMessage('This contact (name, email, phone number) already exists');
        return true;
      }
      return false
    }

    async function responseHandler(responseObject) {

      switch (responseObject.response.status) {

        case 201:  // New OR Edit Contact
          currentContacts = await getContacts();
          displayDefault();
          flashResponse(responseObject.response);
          break;

        case 204: // Delete Contact
          currentContacts = await getContacts();
          displayDefault();
          flashResponse(responseObject.response);
          break;

        case 400: // Something went wrong
          flashResponse(responseObject.response);

      }
    }


    function flashMessage(message) {

      // If a status message exists, refresh the message else create a new element
      if ($('#status').length) {

        $('#status').text(`${message}`);

      } else {

        let jMessage = $(`<span id='status'>${message} </span>`);

        jMessage.insertAfter('footer');
      }

      setTimeout(() => {

        $('#status').remove();

      }, 8000);

    }

    function flashResponse(responseObject) {

      let context = '';

      if (responseObject.status === 201) {
        context = 'Success';
      } else if (responseObject.status === 204) {
        context = 'Deletion Successful - that contact now has';
      } else if (responseObject.status === 400) {
        context = 'Error';
      }

      // If a status message exists, refresh the message else create a new element
      if ($('#status').length) {

        $('#status').text(`${context} - ${responseObject.statusText}`);

      } else {

        let jMessage = $(`<span id='status'>${context} - ${responseObject.statusText}</span>`);

        jMessage.insertAfter('footer');
      }

      setTimeout(() => {

        $('#status').remove();

      }, 8000);

    }


    function filterContactsBySearchTerm() {
      // Uses css display:none to hide and show elements

      let searchTerm = $('#search').val();
      $('.contactInfo').addClass('hide');

      if (searchTerm === '') {
        $('.contactInfo').removeClass('hide');
      }

      currentContacts.contacts.forEach((contactObject, idx) => {

        for (const property in contactObject) {

          if (property === 'full_name' || property === 'email' || property === 'tags') {

            if (contactObject[property].includes(searchTerm)) {

              $(`div [data-contact='${currentContacts.contacts[idx]['dataID']}']`).removeClass('hide');

            }
          }
        }
      });
    }


    function filterByTagValue(event) {

      let tag = event.target.value;

      currentContacts.contacts.forEach((contactObject, idx) => {

        if (contactObject.tags.includes(tag)) {

          $(`div [data-contact='${currentContacts.contacts[idx]['dataID']}']`).removeClass('hide');

        } else {

          $(`div [data-contact='${currentContacts.contacts[idx]['dataID']}']`).addClass('hide');
        }
      });
    }

    function getSubmissionObject() {
      // Collects form information into an object

      let contactSubmissionObject = {
        full_name: $('[name="fullName"]').val(),
        phone_number: $('[name="phone"]').val(),
        email: $('[name="email"]').val(),
        tags: $('[name="tags"]').val().split(' ')
      };

      return contactSubmissionObject;
    }

    function getAllTags() {
      let allTags = [];

      currentContacts.contacts.forEach((contactObject) => {
        allTags.push(contactObject.tags);
      });

      return allTags.flat();
    }

    async function getContacts() {
      // GET request for contact data

      let response = await tryFetch('/api/contacts', 'GET');
      let contactsData = response.objectResponse;

      return { contacts: contactsData };
    }

    function displayDefault() {
      $('#status').remove();
      $('.createContact').remove();
      $('.editContact').remove();
      $('header').after(displayArea);

      // Compile tags - if tags already exist replace current tags with the new compilation
      if (!$('#userTags').length) {

        $('#userTags').append(tagsTemplate({tags: getAllTags()}));

      } else {

        $('#userTags').children().remove();
        $('#userTags').append(tagsTemplate({tags: getAllTags()}));

      }

      // Update the existing contact list with a new compilation or insert it
      if ($('#contactArea').length) {

        $('#displayArea').children().eq(1).replaceWith(contactsTemplate({contacts: currentContacts.contacts}));

      } else {

        $('#displayArea').append(contactsTemplate({contacts: currentContacts.contacts}));

      }
    }


    ///////////// DOM Events

    // Display Create Contact page
    $('body').on('click','.addContact', () => {
      displayArea.replaceWith(createContact);
      formValidator();
    });

    // Submit a new contact
    $('body').on('click','#submit', async (event) => {

      if (formValidator(event) && !reportIfDuplicate(getSubmissionObject())) {

        let response = await tryFetch('/api/contacts', 'POST', undefined, JSON.stringify(getSubmissionObject()));
        responseHandler(response);

      }
    });

    // Cancel contact creation/edits
    $('body').on('click','#cancelCreate', () => {
      displayDefault();
    });

    // Display this contact's edit page
    $('body').on('click','.edit', (event) => {

      let index = event.target.getAttribute("data-contact");
      let contactName = $(`div[data-contact='${index}'] h3`).first().text();

      displayArea.replaceWith(editTemplate({ full_name: contactName, index: index }));

    });


    // Submit edits to this contact
    $('body').on('click', '#editSubmit', async (event) => {

      let index = $('#editID').attr("data-contact");
      let contactID = currentContacts.contacts[index][index];

      let editObject = getSubmissionObject();
      editObject['id'] = contactID;

      if (formValidator(event) && !reportIfDuplicate(getSubmissionObject())) {

        let response = await tryFetch(`/api/contacts/${contactID}`, 'put', "application/json", JSON.stringify(editObject));
        responseHandler(response);
      }
    });

    // Delete contact
    $('body').on('click', '.delete', async (event) => {

      let index = event.target.getAttribute("data-contact");
      let contactID = currentContacts.contacts[index][index];
      let contactName = $(`div[data-contact='${index}'] h3`).first().text();

      if (confirm(`Are you sure you want to delete ${contactName}'s info?`)) {
        let response = await tryFetch(`/api/contacts/${contactID}`, 'delete', null);
        responseHandler(response);
      }
    });

    // Filter when key is released
    $('body').on('keyup', '#search', () => {
      filterContactsBySearchTerm();
    });

    // Stop filtering if the search bar loses focus
    $('body').on('blur', '#search', () => {
      $('.contactInfo').removeClass('hide');
    });

    // Filter if search input gains focus
    $('body').on('focus', '#search', () => {
      filterContactsBySearchTerm();
    });

    // Filter by tag
    $('body').on('click', '.tagged', (event) => {
      filterByTagValue(event);
    });

    // Clear filters on tags
    $('body').on('click', '#noTags', () => {
      $('.contactInfo').removeClass('hide');
    });

  })();

});


