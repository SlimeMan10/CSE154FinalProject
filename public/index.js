"use strict";
(function() {
 let user = null;

 window.addEventListener('load', init);

 function init() {
  if(id('login-btn')) {
    id('login-btn').addEventListener('click', login);
  }
  if(id('create-user-btn')) {
    id('create-user-btn').addEventListener('click', createNewUser);
  }
  if(id('logout-btn')) {
    id('logout-btn').addEventListener('click', logout);
  }
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

 async function showProduct(event) {
   const productName = event.currentTarget.getAttribute('data-name');
   const data = await getProductInfo(productName);
   if (data) {
     displayProduct(data);
   } else {
     // Handle error gracefully
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
   // ... other display logic ...
   id('review-section').setAttribute('data-current-product', productData[0].product_id);
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
       if (errorText === "Email is already taken" || errorText === "Username is already taken") {
         return { exists: errorText };
       }
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

 async function createNewUser() {
   let result = await createUser();
   if (result.success) {
     // Handle success
   } else if (result.error) {
     // Handle server errors
   } else if (result.exists) {
     // Handle duplicate email/username
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
     return { success: true, data: data };
   } catch (err) {
     return { error: 'Failed to submit review' };
   }
 }

 async function handleReviewSubmission() {
  if (user !== null) {
    let result = await addReview();
    if (result.success) {
      // Update UI to show new review
      // Maybe reload reviews section
    } else {
      // Show error message
    }
  } else {
    console.error("User must be logged in")
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