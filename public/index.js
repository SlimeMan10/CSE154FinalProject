"use strict";
(function() {
 let user = null;

 window.addEventListener('load', init);

 function init() {
    displayAllProducts();
    loginEvents();
    passwordEvents();
    if(id('submit-review-btn')) {
      id('submit-review-btn').addEventListener('click', handleReviewSubmission);
    }
  }

  async function showProduct(productName) {
    try {
      const response = await fetch('/getProducts?name=' + productName);
      if (!response.ok) {
        throw new Error("Could not find product");
      }
      const data = await response.json();
      displayProducts(data);
    } catch(err) {
      console.error(err);
    }
  }

  async function purchase(productId, cost) {
    if (productId && cost && user) {
      const form = new dataForm();
      form.append("username", user);
      form.append("product_id", productId);
      form.append("cost", cost);
      try {
        const response = await fetch("/purchase", {
          method: "POST",
          body: form,
        });
        if (!response.ok) {
          throw new Error("Error Error Error")
        }
        const data = await response.json();
        const confirmationNumber = data.confirmationCode;
        //whatever you want to make it show the confirmation number
      } catch(err) {

      }
    }
  }

  function displayProducts(item) {
    const data = item[0];
    id("product-area").classList.add('hidden');
    id("all-products").classList.add('hidden');
    const productName = data.name;
    const productId = data.product_id;
    const img = createImage(productName);
    const price = data.price;
    const description = data.description;
    const stock = data.stock;
    const type = data.type;
    const avgRating = data.average_rating;
    const totalRating = data.total_rating;
    //with the purchase button make sure to pass in product_id and cost
    console.log(data);
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
            let averageReview = card.average_rating;
            renderProduct(name, price, averageReview);
        });
    } catch (err) {
        console.log("p");
    }
  }

  /**
   * This renders a product in the product-area div.
   * @param {string} productName - Name of the product from the database
   * @param {number} price - Price of the product from database
   * @param {number} averageReviews - Average reviews
   */
  function renderProduct(productName, price, averageReviews) {
    const productArea = id('product-area');
    // Create main product card div
    const productCard = gen('div');
    productCard.className = 'product-card';
    let img = createImage(productName);
    let nameDiv = createNameDiv(productName);
    let starsDiv = createStarDiv(averageReviews);
    let priceDiv = createPriceDiv(price);
    // Add click event listener to the card
    productCard.addEventListener('click', function() {
      showProduct(productName);
    });
    // Append all elements to the card
    productCard.appendChild(img);
    productCard.appendChild(nameDiv);
    productCard.appendChild(starsDiv);
    productCard.appendChild(priceDiv);
    productArea.appendChild(productCard);
  }

  function createPriceDiv(price) {
    const priceDiv = gen('div');
    priceDiv.className = 'price';
    priceDiv.textContent = `From $${price} USD`;
    return priceDiv;
  }

  function createStarDiv(averageReviews) {
    const starsDiv = gen('div');
    starsDiv.className = 'stars';
    const starCount = Math.floor(averageReviews);
    const starEmoji = '⭐';
    const starsText = (averageReviews - starCount >= 0.5) ?
        starEmoji.repeat(starCount) + "✨" : starEmoji.repeat(starCount);
    starsDiv.textContent = starsText;
    return starsDiv;
  }

  function createNameDiv(productName) {
    const nameDiv = gen('div');
      nameDiv.className = 'product-name';
      const formattedName = productName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      nameDiv.textContent = formattedName;
      return nameDiv;
  }

  function createImage(productName) {
    // Create and setup image
    const imgName = productName.toLowerCase().replace(/\s+/g, '-');
    const img = gen('img');
    img.src = `./imgs/${imgName}.jpg`;
    img.alt = productName;
    img.className = 'product-image';
    return img;
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
  let username = id('username').value;
  let password = id('password').value;
  try {
    const dataForm = new formData();
    dataForm.append("username", username);
    dataForm.append("password", password);
    const response = await fetch("/login", {
      method: "POST",
      body: dataForm,
    });
    if (!response.ok) {
      throw new Error("Could Not Log In");
    }
    const data = response.json();
    if (data.valid) {
      user = username;
      console.log("login successful")
    } else {
      //password or username was incorrect
      console.log("failed");
    }
  } catch (err) {
    console.error(err);
  }
   //if everything is true then
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

 function gen(item) {
   return document.createElement(item);
 }

})();