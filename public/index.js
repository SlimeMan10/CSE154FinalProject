"use strict";
(function() {
  let user = null;

  window.addEventListener('load', init);

  function init() {
    id('login-btn').addEventListener('click', login);
    id('create-user-btn').addEventListener('click', createNewUser);
  }

  async function createNewUser() {
    let result = await createUser();
    if (result.success) {
      //do stuff
    } else if (result.error) {
      //server error handling stuff
    } else {
      //user already exists
    }
  }

  async function createUser() {
    try {
      let username = id('username').value;
      let password = id('password').value;
      let email = id('email').value;

      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("email", email);

      let response = await fetch('/newUser', {
        method: "POST",
        body: formData
      });
      if(!response.ok) {
        let errorText = await response.text();
        return { error: errorText };
      }
      let data = await response.json();
      if (data.message === "User created") {
        user = username;
        return { success: true };
      } else {
        return { success: false };
      }
    } catch (err) {
      return { error: "Failed to connect to server" };
    }
  }

  //do get request to see if the information was valud
  function login() {
    //request here
    if (data === null) {
      console.log("")
    } else {
      user = username;
    }
  }

  function logout() {
    if (user !== null) {
      user = null;
    }
  }

  function id(item) {
    return document.getElementById(item);
  }

  function qs(item) {
    return document.querySelector(item);
  }

  function qsa(item) {
    return document.querySelectorAll(item);
  }

})();

//I am just going to set up the feature 4