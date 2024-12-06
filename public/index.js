"use strict";
(function() {
 let user = null;

 window.addEventListener('load', init);

 function init() {
    loginEvents();
    passwordEvents();
    if(id('submit-review-btn')) {
      id('submit-review-btn').addEventListener('click', handleReviewSubmission);
    }
    let products = qsa('.products');
    if(products.length > 0) {
      for (let i = 0; i < products.length; i++) {
        products[i].addEventListener('click', showProduct);
      }
    }
  }

  function passwordEvents() {
    // Real-time password strength checking
    id('create-password-input-form').addEventListener('input', function(event) {
      let password = event.target.value;
      checkIfStrong(password);
    });

    // Create user button event
    id('create-user-btn').addEventListener('click', function() {
      let password = id('create-password-input-form').value;
      let strength = checkIfStrong(password);
      console.log("Password strength: " + strength);
      if (strength) {
        let isVerified = verifyPassword();
        console.log("Password verification: " + isVerified);
        if (isVerified) {
          createNewUser();
        }
      }
    });

    // Password toggle visibility
    const togglePassword = id('toggle-password');
    const passwordInput = id('create-password-input-form');
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });
  }

  function verifyPassword() {
    const verify = id('verify-password-input').value;
    const password = id('create-password-input-form').value;
    return verify === password;
  }

  function loginEvents() {
    if(id('login-btn')) {
      id('login-btn').addEventListener('click', login);
    }
    if(id('logout-btn')) {
      id('logout-btn').addEventListener('click', logout);
    }
  }

  function checkIfStrong(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const isValid = hasUpperCase && hasLowerCase && hasNumbers &&
                   hasSpecialChar && isLongEnough;
    return isValid;
  }

 async function showProduct(event) {
   const productName = event.currentTarget.getAttribute('data-name');
   const data = await getProductInfo(productName);
   if (data) {
     displayProduct(data);
   }
 }

 async function getProductInfo(name) {
   const getProduct = "/getProducts?name=";
   try {
     const response = await fetch(getProduct + name);
     if (!response.ok) {
       throw new Error("Failed getting information");
     }
     const data = await response.json();
     return data;
   } catch (err) {
     return null;
   }
 }

 function displayProduct(productData) {
   id('review-section').setAttribute('data-current-product', productData[0].product_id);
 }

 async function createUser() {
   try {
     let username = id('username').value;
     let password = id('create-password-input-form').value;
     let email = id('email').value;

     const formData = new FormData();
     formData.append("username", username);
     formData.append("password", password);
     formData.append("email", email);

     let response = await fetch('/newUser', {
       method: "POST",
       body: formData
     });

     let data = await response.json();
     if (data.message === "User created") {
       user = username;
       return true;
     } else {
       return false;
     }
   } catch (err) {
     console.error("Failed to connect to server");
     return false;
   }
 }

 async function createNewUser() {
  console.log("inside createNewUser");
  let password = id('create-password-input-form').value;
  let strength = checkIfStrong(password);
  if (strength) {
    let success = await createUser();
    if (success) {
      console.log("User created successfully!");
    }
  }
 }

 async function login() {
   // Implement login logic here
 }

 function logout() {
   if (user !== null) {
     user = null;
   }
 }

 async function addReview() {
   try {
     let product_id = id('review-section').getAttribute('data-current-product');
     let rating = id('rating').value;
     let comment = id('comment').value;

     const formData = new FormData();
     formData.append('product_id', product_id);
     formData.append('rating', rating);
     formData.append('comment', comment);
     formData.append('username', user);

     let response = await fetch('/review', {
       method: 'POST',
       body: formData
     });

     if (!response.ok) {
       throw new Error('Failed to submit review');
     }

     let data = await response.json();
     return true;
   } catch (err) {
     return false;
   }
 }

 async function handleReviewSubmission() {
  if (user !== null) {
    let success = await addReview();
    if (success) {
      // Update UI to show new review
    }
  } else {
    console.error("User must be logged in");
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