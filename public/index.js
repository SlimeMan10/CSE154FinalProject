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

    if(id('create-account-btn')) {
      id('create-account-btn').addEventListener('click', handleCreateAccountClick);
    }

    if (id('search-button')) {
      id('search-button').addEventListener('click', handleSearch);
    }
  }


  function handleCreateAccountClick() {
    console.log("Creating acc")
    id('product-area').classList.add('hidden');
    id('all-products').classList.add('hidden');
    id('main-item-section').classList.add('hidden');
    id('account-section').removeAttribute('hidden');
  }

  function handleSearch(event) {
    event.preventDefault();
    const searchInput = qs('#search-bar .search-input').value.trim();
    const maxPrice = id('max-price').value.trim();
    const category = id('category').value;

    // Remove the searchInput requirement - execute if any filter is used
    if (searchInput || maxPrice || category) {
      displayAllWithSearchTerms();
    }
  }

  async function displayAllWithSearchTerms() {
    const searchInput = qs('#search-bar .search-input').value.trim();
    const maxPrice = id('max-price').value.trim();
    const category = id('category').value;

    try {
      // Build query string
      let queryParams = [];
      if (searchInput) {
        queryParams.push('name=' + encodeURIComponent(searchInput));
      }
      if (maxPrice) {
        queryParams.push('maxPrice=' + encodeURIComponent(maxPrice));
      }
      if (category) {
        queryParams.push('type=' + encodeURIComponent(category));
      }

      const queryString = '/getProducts?' + queryParams.join('&');
      const response = await fetch(queryString);

      if (!response.ok) {
        throw new Error("Could not fetch products");
      }

      let result = await response.json();

      // Show relevant sections
      id('product-area').classList.remove('hidden');
      id('all-products').classList.remove('hidden');
      id('main-item-section').classList.remove('hidden');
      id('account-section').setAttribute('hidden', '');
      id('product-area').innerHTML = '';

      // Create search results title
      let searchTitle = 'Results';
      if (searchInput) searchTitle += ` for "${searchInput}"`;
      if (maxPrice) searchTitle += ` under $${maxPrice}`;
      if (category) searchTitle += ` in ${category}`;
      id('all-products').textContent = searchTitle;

      if (result.length === 0) {
        const noProductsDiv = gen('div');
        noProductsDiv.textContent = 'No products found.';
        noProductsDiv.classList.add('no-products-message');
        id('product-area').appendChild(noProductsDiv);
      } else {
        result.forEach(card => {
          let name = card.name;
          let price = card.price;
          let averageReview = card.average_rating || 0;
          renderProduct(name, price, averageReview);
        });
      }
    } catch (err) {
      console.log(err);
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
    console.log("Display products");
    const data = item[0];

    id("all-products").classList.add('hidden');

    const productArea = id("product-area");
    productArea.innerHTML = '';
    productArea.classList.remove('hidden');

    const productName = data.name;
    const productId = data.product_id;
    const img = createImage(productName);
    const price = data.price;
    const description = data.description;
    const stock = data.stock;
    const type = data.type;
    const avgRating = data.average_rating;

    const singleProductContainer = gen('div');
    singleProductContainer.className = 'single-product-container';

    singleProductContainer.appendChild(img);

    const nameDiv = createNameDiv(productName);
    singleProductContainer.appendChild(nameDiv);

    const descriptionDiv = gen('div');
    descriptionDiv.className = 'product-description';
    descriptionDiv.textContent = description;
    singleProductContainer.appendChild(descriptionDiv);

    const priceDiv = createPriceDiv(price);
    singleProductContainer.appendChild(priceDiv);

    const stockDiv = gen('div');
    stockDiv.className = 'product-stock';
    stockDiv.textContent = `In stock: ${stock}`;
    singleProductContainer.appendChild(stockDiv);

    const ratingDiv = createStarDiv(avgRating);
    singleProductContainer.appendChild(ratingDiv);

    const buyButton = gen('button');
    buyButton.textContent = 'Buy';
    buyButton.className = 'buy-button';
    buyButton.addEventListener('click', function() {
    purchase(productId, price);
  });
  singleProductContainer.appendChild(buyButton);

  productArea.appendChild(singleProductContainer);
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
    id('login-btn').addEventListener('click', handleLogin);
    id('logout-btn').addEventListener('click', logout);
  }

  function handleLogin() {
    handleLoginClick();
    id('submit-login-btn').addEventListener('click', async function() {
      let logged = await login();
      if (logged) {
        showLoggedIn();
      } else {
        logInFailed();
      }
    })
  }

  function showLoggedIn() {
    console.log(user)
    id('logout-btn').classList.remove('hidden');
    id('login-btn').classList.add('hidden');
    id('create-account-btn').classList.add('hidden');
  }

  function logInFailed() {
    console.log('no')
    console.log(user)
  }

  function handleLoginClick() {
    id('product-area').classList.add('hidden');
    id('all-products').classList.add('hidden');
    id('main-item-section').classList.add('hidden');
    id('login-section').classList.remove('hidden');

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
      showLoggedIn();
      console.log("User created successfully!");
    }
  }
 }

 async function login() {
  let username = id('login-username').value;
  let password = id('login-password').value;
  try {
    const dataForm = new FormData();
    dataForm.append("username", username);
    dataForm.append("password", password);
    const response = await fetch("/login", {
      method: "POST",
      body: dataForm,
    });
    if (!response.ok) {
      throw new Error("Could Not Log In");
    }
    const data = await response.json();
    if (data.valid) {
      user = username;
      return true;
    } else {
      //password or username was incorrect
      return false;
    }
  } catch (err) {
    console.error(err);
    return false;
  }
}

 function logout() {
   if (user !== null) {
     user = null;
     id('login-btn').classList.remove('hidden');
     id('logout-btn').classList.add('hidden');
     id('create-account-btn').classList.remove('hidden');
     console.log(user)
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