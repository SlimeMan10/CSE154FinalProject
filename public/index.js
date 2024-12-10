"use strict";
(function() {
 let user = null;

 window.addEventListener('load', init);

 function init() {
    displayAllProducts();
    console.log("Initiing")
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

  async function displayAllProducts() {
    try {
        const response = await fetch('/getAllProducts');
        if (!response.ok) {
            throw new Error();
        }
        let result = await response.json();
        result.forEach(card => {
            let name = card.name;
            let price = card.price;
            let averageReview;
            if (card.average_rating == null) {
              averageReview = 0;
            } else {
              averageReview = card.average_rating;
            }
            renderProduct(name, price, averageReview);
        });
    } catch (err) {
        console.log("p");
    }
}

  /**
   * This renders a product in the product-area div.
   * @param {string} productName - Name of the product from the database (Will
   * be converted to lowercase AND have dashes in the name replace with spaces.
   * Also coverts to spaces)
   * @param {number} price - Price of the product from database
   * @param {number} averageReviews - Average reviews, shows the rounded amount
   * in stars ()
   */
  function renderProduct(productName, price, averageReviews) {
    const productArea = document.getElementById('product-area');
    if (productArea) {
      const starCount = Math.floor(averageReviews);
      const starEmoji = '⭐';
      console.log(averageReviews - starCount)
      const starsText = (averageReviews - starCount >= 0.5) ?
          starEmoji.repeat(starCount) + "✨": starEmoji.repeat(starCount);

      const imgName = productName.toLowerCase().replace(/\s+/g, '-');
      const imgSrc = `./imgs/${imgName}.jpg`;

      const productDiv = document.createElement('div');
      productDiv.className = 'product-card';

      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = productName;
      img.className = "product-image"

      const nameDiv = document.createElement('div');
      nameDiv.className = 'product-name';
      productName = productName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      nameDiv.textContent = productName;

      const starsDiv = document.createElement('div');
      starsDiv.className = 'stars';
      starsDiv.textContent = starsText;

      const priceDiv = document.createElement('div');
      priceDiv.className = 'price';
      priceDiv.textContent = `From $${price} USD`;
      productDiv.addEventListener('click', onProductClick);
      productDiv.appendChild(img);
      productDiv.appendChild(nameDiv);
      productDiv.appendChild(starsDiv);
      productDiv.appendChild(priceDiv);
      productArea.appendChild(productDiv);
    }
  }

  /**
   * Handles  click event on a product card. Finds  closest product-card
   * element and, if found, shows it as the currently selected product by calling
   * showCurrProduct.
   * @param {Event} event - The DOM event triggered by clicking on the product card or its children.
   */
  function onProductClick(event) {
    const card = event.target.closest('.product-card');
    if (card) {
      showCurrProduct(card);
    }
  }

  /**
   * Displays a large product card and hides all other product cards.
   * Adds buy button also to the enlarged card if it doesn't already exist.
   * @param {HTMLElement} clickedCard -  product card element clicked and should be enlarged.
   */
  function showCurrProduct(clickedCard) {
    id("product-area").classList.add('hidden');
    id("all-products").classList.add('hidden');

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      if (card !== clickedCard) {
        card.classList.add('hidden');
      }
    });

    clickedCard.classList.add('enlarged');

    if (!clickedCard.querySelector('.buy-button')) {
      const buyBtn = document.createElement('a');
      buyBtn.href = "#"; // PUT CHECKOUT LINK HERE
      buyBtn.textContent = "Buy Now";
      buyBtn.classList.add('buy-button');
      clickedCard.appendChild(buyBtn);
    }
  }

  /*
  renderProduct("Creatine", 15.96, 4.7);
  renderProduct("protein-powder", 24.99, 3);
  renderProduct("protein-powder", 24.99, 3.6);
  renderProduct("protein-powder", 24.99, 3.4);
  renderProduct("protein-powder", 24.99, 3.7);
  renderProduct("protein-powder", 24.99, 3.9);
  */
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