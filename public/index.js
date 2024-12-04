"use strict";
(function() {
  let user = null;

  window.addEventListener('load', init);

  function init() {
    id('login-btn').addEventListener('click', login);
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