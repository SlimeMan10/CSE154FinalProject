"use strict";
(function() {
let user = null;

window.addEventListener('load', init);

function init() {
  displayAllProducts();
  loginEvents();
  passwordEvents();
  if(id('create-account-btn')) {
    id('create-account-btn').addEventListener('click', handleCreateAccountClick);
  }

  if (id('search-button')) {
    id('search-button').addEventListener('click', handleSearch);
  }

  if (id('previous-transactions')) {
    id('previous-transactions').addEventListener('click', function(event) {
      event.preventDefault();
      getTransactions();
    });
  }
}

 function showError(containerId, message, isSuccess) {
   const errorDiv = id(`${containerId}-error`);
   errorDiv.classList.remove('hidden');
   errorDiv.textContent = message;

   if (isSuccess) {
       errorDiv.classList.add('success-state');
   } else {
       errorDiv.classList.remove('success-state');
   }
 }

 function clearError(containerId) {
   const errorDiv = id(`${containerId}-error`);
   errorDiv.classList.add('hidden');
   errorDiv.textContent = '';
 }

  function handleCreateAccountClick() {
    // Clear login form inputs
    if (id('login-username')) id('login-username').value = '';
    if (id('login-password')) id('login-password').value = '';
    clearError('login');

    // Hide other sections
    id('product-area').classList.add('hidden');
    id('all-products').classList.add('hidden');
    id('main-item-section').classList.add('hidden');
    id('login-section').classList.add('hidden');
    id('account-section').classList.remove('hidden');
  }


 function handleSearch(event) {
   event.preventDefault();
   const searchInput = qs('#search-bar .search-input').value.trim();
   const maxPrice = id('max-price').value.trim();
   const category = id('category').value;

   if (searchInput || maxPrice || category) {
     displayAllWithSearchTerms();
   }
 }

 async function displayAllWithSearchTerms() {
   const searchInput = qs('#search-bar .search-input').value.trim();
   const maxPrice = id('max-price').value.trim();
   const category = id('category').value;

   try {
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

     id('product-area').classList.remove('hidden');
     id('all-products').classList.remove('hidden');
     id('main-item-section').classList.remove('hidden');
     id('account-section').setAttribute('hidden', '');
     id('product-area').innerHTML = '';

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
     showError('product', 'Failed to fetch products. Please try again later.', false);
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
     showError('product', 'Failed to load product details.', false);
   }
 }

 function displayProducts(item) {
   const data = item[0];
   setupProductDisplay();
   const singleProductContainer = createProductContainer(data);
   id("product-area").appendChild(singleProductContainer);
 }

 function setupProductDisplay() {
   id("all-products").classList.add('hidden');
   const productArea = id("product-area");
   productArea.innerHTML = '';
   productArea.classList.remove('hidden');
 }

 function createProductContainer(data) {
   const singleProductContainer = gen('div');
   singleProductContainer.className = 'single-product-container';

   appendBasicInfo(singleProductContainer, data);
   appendProductDetails(singleProductContainer, data);
   appendInteractionButtons(singleProductContainer, data);

   return singleProductContainer;
 }

 function appendBasicInfo(container, data) {
   const img = createImage(data.name);
   const nameDiv = createNameDiv(data.name);

   container.appendChild(img);
   container.appendChild(nameDiv);
 }

 function appendProductDetails(container, data) {
   const descriptionDiv = createDescriptionDiv(data.description);
   const priceDiv = createPriceDiv(data.price);
   const stockDiv = createStockDiv(data.stock);
   const ratingDiv = createStarDiv(data.average_rating);

   container.appendChild(descriptionDiv);
   container.appendChild(priceDiv);
   container.appendChild(stockDiv);
   container.appendChild(ratingDiv);
 }

 function createDescriptionDiv(description) {
   const descriptionDiv = gen('div');
   descriptionDiv.className = 'product-description';
   descriptionDiv.textContent = description;
   return descriptionDiv;
 }

 function createStockDiv(stock) {
   const stockDiv = gen('div');
   stockDiv.className = 'product-stock';
   stockDiv.textContent = `In stock: ${stock}`;
   return stockDiv;
 }

 function appendInteractionButtons(container, data) {
   const buyButton = createBuyButton(data.product_id, data.price);
   const reviewSection = createReviewSection(data.product_id);

   container.appendChild(buyButton);
   container.appendChild(reviewSection);
 }

 function createBuyButton(productId, price) {
   const buyButton = gen('button');
   buyButton.textContent = 'Buy';
   buyButton.className = 'buy-button';
   buyButton.addEventListener('click', function() {
       handlePurchase(productId, price);
   });
   return buyButton;
 }

 function createReviewSection(productId) {
   const reviewDiv = gen('div');
   reviewDiv.className = 'review-section';

   const select = createRatingSelect();
   const submitReview = createReviewButton(productId, select);
   const errorDiv = createErrorDiv();

   reviewDiv.appendChild(select);
   reviewDiv.appendChild(submitReview);
   reviewDiv.appendChild(errorDiv);

   return reviewDiv;
 }

 function createRatingSelect() {
   const select = gen('select');
   select.id = 'rating';

   const defaultOption = gen('option');
   defaultOption.value = '';
   defaultOption.textContent = 'Rate Product';
   select.appendChild(defaultOption);

   for(let i = 1; i <= 5; i++) {
       const option = gen('option');
       option.value = i;
       option.textContent = `${i} Star${i > 1 ? 's' : ''}`;
       select.appendChild(option);
   }

   return select;
 }

 function createReviewButton(productId, select) {
  const submitReview = gen('button');
  submitReview.textContent = 'Submit Review';
  submitReview.className = 'review-button';
  submitReview.addEventListener('click', function() {
      if (!user) {
          showError('review', 'Please login to submit a review', false);
      } else {
         const rating = select.value;
         if (!rating) {
             showError('review', 'Please select a rating', false);
         } else {
             handleReviewSubmission(productId, rating);
         }
      }
  });
  return submitReview;
}


 function createErrorDiv() {
   const errorDiv = gen('div');
   errorDiv.id = 'review-error';
   errorDiv.className = 'error-message hidden';
   return errorDiv;
 }

 async function handlePurchase(productId, price) {
   if (!user) {
       showError('product', 'Please login to make a purchase', false);
   } else {
       try {
           const form = new FormData();
           form.append("username", user);
           form.append("product_id", productId);
           form.append("price", price);

           const response = await fetch("/purchase", {
               method: "POST",
               body: form
           });

           if (!response.ok) {
               throw new Error("Purchase failed");
           }

           const data = await response.json();
           showSuccessMessage('product', 'Purchase successful! Order number: ' + data.confirmationCode);
       } catch(err) {
           showError('product', 'Purchase failed. Please try again.', false);
       }
   }
 }

 async function handleReviewSubmission(productId, rating) {
  try {
      const formData = new FormData();
      formData.append('product_id', productId);
      formData.append('rating', rating);
      formData.append('username', user);

      let response = await fetch('/review', {
          method: 'POST',
          body: formData
      });

      if (!response.ok) {
          showError('review', 'Failed to submit review', false);
      } else {
          showError('review', 'Review submitted successfully!', true);
          // Get the product details using the same endpoint we use elsewhere
          const productResponse = await fetch('/getProducts?product_id=' + productId);
          if (productResponse.ok) {
              const productData = await productResponse.json();
              if (productData && productData[0]) {
                  showProduct(productData[0].name);
              }
          }
      }
  } catch (err) {
      console.log('Error:', err);
      showError('review', 'Failed to submit review. Please try again.', false);
  }
}


 async function displayAllProducts() {
   try {
       const response = await fetch('/getAllProducts');
       if (!response.ok) {
           throw new Error('Failed to fetch products');
       }
       let result = await response.json();
       result.forEach(card => {
           let name = card.name;
           let price = card.price;
           let averageReview = card.average_rating;
           renderProduct(name, price, averageReview);
       });
   } catch (err) {
       showError('product', 'Failed to load products. Please try again later.', false);
   }
 }

 function renderProduct(productName, price, averageReviews) {
   const productArea = id('product-area');
   const productCard = gen('div');
   productCard.className = 'product-card';

   let img = createImage(productName);
   let nameDiv = createNameDiv(productName);
   let starsDiv = createStarDiv(averageReviews);
   let priceDiv = createPriceDiv(price);

   productCard.addEventListener('click', function() {
       showProduct(productName);
   });

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
   const imgName = productName.toLowerCase().replace(/\s+/g, '-');
   const img = gen('img');
   img.src = `./imgs/${imgName}.jpg`;
   img.alt = productName;
   img.className = 'product-image';
   return img;
 }

 function passwordEvents() {
   id('create-password-input-form').addEventListener('input', function(event) {
       let password = event.target.value;
       checkIfStrong(password);
   });

   id('create-user-btn').addEventListener('click', function() {
       let password = id('create-password-input-form').value;
       let strength = checkIfStrong(password);
       if (strength) {
           let isVerified = verifyPassword();
           if (isVerified) {
               createNewUser();
           }
       }
   });

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
   if (verify !== password) {
       showError('create-account', 'Passwords do not match', false);
   }
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
   });
 }

 function showLoggedIn() {
  id('logout-btn').classList.remove('hidden');
  id('login-btn').classList.add('hidden');
  id('create-account-btn').classList.add('hidden');
  id('login-section').classList.add('hidden');
  id('product-area').classList.remove('hidden');
  id('all-products').classList.remove('hidden');
  id('main-item-section').classList.remove('hidden');
  id('previous-transactions').classList.remove('hidden');
}

 function logInFailed() {
   showError('login', 'Invalid username or password', false);
 }

  function handleLoginClick() {
    // Clear create account form inputs
    if (id('username')) id('username').value = '';
    if (id('email')) id('email').value = '';
    if (id('create-password-input-form')) id('create-password-input-form').value = '';
    if (id('verify-password-input')) id('verify-password-input').value = '';
    clearError('create-account');

    // Hide other sections
    id('product-area').classList.add('hidden');
    id('all-products').classList.add('hidden');
    id('main-item-section').classList.add('hidden');
    id('account-section').classList.add('hidden');
    id('login-section').classList.remove('hidden');
  }



const minPasswordLength = 8;

 function checkIfStrong(password) {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= minPasswordLength;

  clearError('create-account');

  if (!isLongEnough) showError('create-account', 'Password must be at least 8 characters', false);
  if (!hasUpperCase) showError('create-account', 'Password must contain an uppercase letter', false);
  if (!hasLowerCase) showError('create-account', 'Password must contain a lowercase letter', false);
  if (!hasNumbers) showError('create-account', 'Password must contain a number', false);
  if (!hasSpecialChar) showError('create-account', 'Password must contain a special character', false);

  const isValid = hasUpperCase && hasLowerCase && hasNumbers &&
                 hasSpecialChar && isLongEnough;

  if (isValid) {
      showError('create-account', 'Password is strong', true);
  }

  return isValid;
}

async function createUser() {
  try {
      let username = id('username').value;
      let password = id('create-password-input-form').value;
      let email = id('email').value;

      if (!username || !password || !email) {
          showError('create-account', 'All fields are required', false);
      }

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
          showError('create-account', 'Username or email already exists', false);
      }
  } catch (err) {
      showError('create-account', 'Failed to create account. Please try again.', false);
  }
}

async function createNewUser() {
  clearError('create-account');
  let password = id('create-password-input-form').value;
  let strength = checkIfStrong(password);
  if (strength) {
      let success = await createUser();
      if (success) {
          showLoggedIn();
      }
  }
}

async function login() {
  clearError('login');
  let username = id('login-username').value;
  let password = id('login-password').value;

  if (!username || !password) {
      showError('login', 'Please enter both username and password', false);
  }

  try {
      const dataForm = new FormData();
      dataForm.append("username", username);
      dataForm.append("password", password);
      const response = await fetch("/login", {
          method: "POST",
          body: dataForm,
      });
      if (!response.ok) {
          showError('login', 'Login failed', false);
      }
      const data = await response.json();
      if (data.valid) {
          user = username;
          return true;
      } else {
          showError('login', 'Invalid username or password', false);
      }
  } catch (err) {
      showError('login', 'Server error. Please try again later.', false);
  }
}

function logout() {
  if (user !== null) {
      user = null;
      id('login-btn').classList.remove('hidden');
      id('logout-btn').classList.add('hidden');
      id('create-account-btn').classList.remove('hidden');
      id('previous-transactions').classList.add('hidden');
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
          showError('review', 'Failed to submit review', false);
      }
      return true;
  } catch (err) {
      showError('review', 'Server error. Please try again later.', false);
  }
}

async function getTransactions(user) {
  try {
      const jsonPayload = JSON.stringify({ username: user });
      const url = "/transactions?data=" + encodeURIComponent(jsonPayload);

      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
          throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      if (data.length === 0) {
          displayNoOrders();
      } else {
          displayPreviousTransactions(data);
      }
  } catch (err) {
      showError('transactions', 'Failed to load transaction history. Please try again later.', false);
  }
}

  function displayPreviousTransactions(order) {
    const orderId = data.order_id;
    const name = order.name;
    const description = order.description;
    const price = order.price
    const productId = order.product_id;
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