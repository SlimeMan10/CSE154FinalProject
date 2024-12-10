"use strict";
(function() {
  let user = null;
  let currentProductId = null;
  let currentProductPrice = null;

  window.addEventListener('load', init);

  /**
   * Initializes the application by setting up event listeners and displaying products.
   */
  function init() {
    const savedUser = localStorage.getItem('username');
    if (savedUser) {
      user = savedUser;
      showLoggedIn();
    }
    displayAllProducts();
    loginEvents();
    passwordEvents();
    paymentStuff();

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

    if (id('shop-all')) {
      id('shop-all').addEventListener('click', function(event) {
        event.preventDefault();
        hideTransactions();
        displayAllProducts();
      });
    }
  }

  /**
   * Validates a card number.
   * @param {string} cardNumber - The card number to validate.
   * @returns {boolean} - Returns true if the card number is valid, false otherwise.
   */
  function validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 16) {
      return false;
    }
    return /^\d+$/.test(cleanNumber);
  }

  /**
   * Checks if the expiry date is in the correct format (MM/YY).
   * @param {string} expiry - The expiry date to check.
   * @returns {boolean} - Returns true if the expiry date is in the correct format, false otherwise.
   */
  function checkExpiryFormat(expiry) {
    return /^\d{2}\/\d{2}$/.test(expiry);
  }

  /**
   * Validates a card expiry date.
   * @param {string} expiry - The expiry date to validate (in the format MM/YY).
   * @returns {boolean} - Returns true if the expiry date is valid, false otherwise.
   */
  function validateCardExpiry(expiry) {
    if (!checkExpiryFormat(expiry)) return false;
    const [month, year] = expiry.split('/');
    return checkExpiryDate(parseInt(month), parseInt(year));
  }

  /**
   * Validates a CVV (Card Verification Value).
   * @param {string} cvv - The CVV to validate.
   * @returns {boolean} - Returns true if the CVV is valid, false otherwise.
   */
  function validateCVV(cvv) {
    return /^\d{3}$/.test(cvv);
  }

  /**
   * Handles input events for the card number field.
   * @param {Event} event - The input event.
   */
  function handleCardNumberInput(event) {
    const value = event.target.value.replace(/\D/g, '');
    event.target.value = value.slice(0, 16);
  }


  /**
   * Checks if an expiry date is valid.
   * @param {number} month - The expiry month (1-12).
   * @param {number} year - The expiry year (four-digit year).
   * @returns {boolean} - Returns true if the expiry date is valid, false otherwise.
   */
  function checkExpiryDate(month, year) {
    const currentDate = new Date();
    const currentFullYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Convert to numbers and add 2000 to get full year
    const expiryMonth = parseInt(month);
    const expiryYear = 2000 + parseInt(year);
    // Basic validation
    if (expiryMonth < 1 || expiryMonth > 12) {
      return false;
    }
    const maxExpiry = 5;
    // Check if card is expired
    if (expiryYear < currentFullYear - maxExpiry) {
      return false;
    }
    if (expiryYear === currentFullYear && expiryMonth > currentMonth) {
      return false;
    }

    if (expiryYear > currentFullYear + 10) {
      return false;
    }
    return true;
  }

  /**
   * Handles input events for the expiry date field.
   * @param {Event} event - The input event.
   */
  function handleExpiryInput(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      let month = value.slice(0, 2);
      const monthNum = parseInt(month);
      if (monthNum > 12) {
        month = '12';
      } else if (monthNum < 1) {
        month = '01';
      } else if (monthNum < 10 && month.length === 2) {
        month = '0' + monthNum;
      }
      value = month + (value.length > 2 ? '/' + value.slice(2, 4) : '');
    }
    event.target.value = value.slice(0, 5);
  }

  /**
   * Handles input events for the CVV field.
   * @param {Event} event - The input event.
   */
  function handleCVVInput(event) {
    const value = event.target.value.replace(/\D/g, '');
    event.target.value = value.slice(0, 3);
  }

  /**
   * Sets up event listeners for payment input fields.
   */
  function setupPaymentInputListeners() {
    id('card-number').addEventListener('input', handleCardNumberInput);
    id('card-expiry').addEventListener('input', handleExpiryInput);
    id('card-cvv').addEventListener('input', handleCVVInput);
  }

  /**
   * Validates payment fields.
   * @param {Object} fields - The payment fields to validate.
   * @param {string} fields.cardHolder - The cardholder name.
   * @param {string} fields.cardNumber - The card number.
   * @param {string} fields.cardExpiry - The card expiry date (in the format MM/YY).
   * @param {string} fields.cardCVV - The card CVV.
   * @param {string} fields.billingAddress - The billing address.
   * @returns {boolean} - Returns true if all fields are valid, false otherwise.
   */
  function validatePaymentFields(fields) {
    const { cardHolder, cardNumber, cardExpiry, cardCVV, billingAddress } = fields;

    if (!cardHolder || !cardNumber || !cardExpiry || !cardCVV || !billingAddress) {
      showError('payment', 'Please fill out all payment fields.', false);
      return false;
    }

    if (!validateCardNumber(cardNumber)) {
      showError('payment', 'Please enter a valid 16-digit card number.', false);
      return false;
    }

    if (!validateCardExpiry(cardExpiry)) {
      showError('payment', 'Please enter a valid expiry date (MM/YY).', false);
      return false;
    }

    if (!validateCVV(cardCVV)) {
      showError('payment', 'Please enter a valid 3-digit CVV.', false);
      return false;
    }

    return true;
  }

  /**
   * Handles the submission of a payment.
   * @param {Object} fields - The payment fields.
   * @throws {Error} - Throws an error if the purchase fails.
   */
  async function handlePaymentSubmission(fields) {
    try {
      await handlePurchase(currentProductId, currentProductPrice);
      id('payment-section').classList.add('hidden');
      hideTransactions();
      clearPaymentForm();
    } catch (err) {
      showError('payment', 'Failed to complete purchase. Please try again.', false);
    }
  }

  /**
   * Sets up event listeners and functionality for payment-related elements.
   */
  function paymentStuff() {
    setupPaymentInputListeners();

    id('submit-payment-btn').addEventListener('click', async function() {
      const fields = {
        cardHolder: id('card-holder').value.trim(),
        cardNumber: id('card-number').value.trim(),
        cardExpiry: id('card-expiry').value.trim(),
        cardCVV: id('card-cvv').value.trim(),
        billingAddress: id('billing-address').value.trim()
      };

      if (validatePaymentFields(fields)) {
        await handlePaymentSubmission(fields);
      }
    });
  }

  /**
   * Hides the transaction area and displays the product area.
   */
  function hideTransactions() {
    id('transaction-area').classList.add('hidden');
    id('product-area').classList.remove('hidden');
    id('all-products').classList.remove('hidden');
    id('main-item-section').classList.remove('hidden');
  }

  /**
   * Shows an error message or success message.
   * @param {string} containerId - The ID of the container element.
   * @param {string} message - The error or success message.
   * @param {boolean} isSuccess - Indicates whether it is a success message (true) or an error message (false).
   */
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

  /**
   * Clears the error message for a specific container.
   * @param {string} containerId - The ID of the container element.
   */
  function clearError(containerId) {
    const errorDiv = id(`${containerId}-error`);
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
  }

  /**
   * Displays a success message.
   * @param {string} message - The success message to display.
   */
  function displaySuccessMessage(message) {
    const oldMessage = id('global-success-message');
    if (oldMessage) {
      oldMessage.remove();
    }

    const successDiv = gen('div');
    successDiv.id = 'global-success-message';
    successDiv.className = 'success-message';
    successDiv.textContent = message;

    const mainSection = id('main-item-section');
    mainSection.parentNode.insertBefore(successDiv, mainSection.nextSibling);
  }

  /**
   * Handles the click event for the "Create Account" button.
   */
  function handleCreateAccountClick() {
    if (id('login-username')) id('login-username').value = '';
    if (id('login-password')) id('login-password').value = '';
    clearError('login');

    id('product-area').classList.add('hidden');
    id('all-products').classList.add('hidden');
    id('main-item-section').classList.add('hidden');
    id('login-section').classList.add('hidden');
    id('account-section').classList.remove('hidden');
  }

  /**
   * Handles the search functionality.
   * @param {Event} event - The search button click event.
   */
  function handleSearch(event) {
    event.preventDefault();
    const searchInput = qs('#search-bar .search-input').value.trim();
    const maxPrice = id('max-price').value.trim();
    const category = id('category').value;

    if (searchInput || maxPrice || category) {
      hideTransactions();
      displayAllWithSearchTerms();
    }
  }

  /**
   * Displays all products based on the provided search terms.
   */
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

  /**
   * Shows the details of a specific product.
   * @param {string} productName - The name of the product to display.
   */
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

  /**
   * Displays a single product's details.
   * @param {Object} item - The product data.
   */
  function displayProducts(item) {
    const data = item[0];
    setupProductDisplay();
    const singleProductContainer = createProductContainer(data);
    id("product-area").appendChild(singleProductContainer);
  }

  /**
   * Sets up the product display area.
   */
  function setupProductDisplay() {
    id("all-products").classList.add('hidden');
    const productArea = id("product-area");
    productArea.innerHTML = '';
    productArea.classList.remove('hidden');
  }

/**
   * Creates a container element for a single product.
   * @param {Object} data - The product data.
   * @returns {HTMLElement} - The created product container element.
   */
  function createProductContainer(data) {
    const singleProductContainer = gen('div');
    singleProductContainer.className = 'single-product-container';
    singleProductContainer.setAttribute('data-product-id', data.product_id);

    appendBasicInfo(singleProductContainer, data);
    appendProductDetails(singleProductContainer, data);
    appendInteractionButtons(singleProductContainer, data);

    return singleProductContainer;
  }

  /**
   * Appends basic information (image and name) to a product container.
   * @param {HTMLElement} container - The product container element.
   * @param {Object} data - The product data.
   */
  function appendBasicInfo(container, data) {
    const img = createImage(data.name);
    const nameDiv = createNameDiv(data.name);

    container.appendChild(img);
    container.appendChild(nameDiv);
  }

  /**
   * Appends product details (description, price, stock, rating) to a product container.
   * @param {HTMLElement} container - The product container element.
   * @param {Object} data - The product data.
   */
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

  /**
   * Creates a description div element.
   * @param {string} description - The product description.
   * @returns {HTMLElement} - The created description div element.
   */
  function createDescriptionDiv(description) {
    const descriptionDiv = gen('div');
    descriptionDiv.className = 'product-description';
    descriptionDiv.textContent = description;
    return descriptionDiv;
  }

  /**
   * Creates a stock div element.
   * @param {number} stock - The product stock quantity.
   * @returns {HTMLElement} - The created stock div element.
   */
  function createStockDiv(stock) {
    const stockDiv = gen('div');
    stockDiv.className = 'product-stock';
    stockDiv.textContent = `In stock: ${stock}`;
    return stockDiv;
  }

  /**
   * Appends interaction buttons (buy button and review section) to a product container.
   * @param {HTMLElement} container - The product container element.
   * @param {Object} data - The product data.
   */
  function appendInteractionButtons(container, data) {
    const buyButton = createBuyButton(data.product_id, data.price);
    const reviewSection = createReviewSection(data.product_id);

    container.appendChild(buyButton);
    container.appendChild(reviewSection);
  }

  /**
   * Creates a buy button element.
   * @param {string} productId - The product ID.
   * @param {number} price - The product price.
   * @returns {HTMLElement} - The created buy button element.
   */
  function createBuyButton(productId, price) {
    const buyButton = gen('button');
    buyButton.textContent = 'Buy';
    buyButton.className = 'buy-button';

    buyButton.addEventListener('click', function() {
      if (!user) {
        showError('product', 'Please login to make a purchase', false);
      } else {
        currentProductId = productId;
        currentProductPrice = price;

        id('product-area').classList.add('hidden');
        id('all-products').classList.add('hidden');
        id('main-item-section').classList.add('hidden');

        id('payment-section').classList.remove('hidden');
      }
    });

    return buyButton;
  }

  /**
   * Creates a review section element.
   * @param {string} productId - The product ID.
   * @returns {HTMLElement} - The created review section element.
   */
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

  /**
   * Creates a rating select element.
   * @returns {HTMLElement} - The created rating select element.
   */
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

  /**
   * Creates a review button element.
   * @param {string} productId - The product ID.
   * @param {HTMLElement} select - The rating select element.
   * @returns {HTMLElement} - The created review button element.
   */
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

  /**
   * Handles the purchase of a product.
   * @param {string} productId - The product ID.
   * @param {number} price - The product price.
   * @throws {Error} - Throws an error if the purchase fails.
   */
  async function handlePurchase(productId, price) {
    try {
      const form = new FormData();
      form.append("username", user);
      form.append("product_id", productId);
      form.append("cost", price);

      const response = await fetch("/purchase", {
        method: "POST",
        body: form
      });

      if (!response.ok) {
        throw new Error("Purchase failed");
      }

      const data = await response.json();

      displaySuccessMessage(`Purchase successful! Order number: ${data.confirmationCode}`);

      updateStockDisplay(productId);

      id('account-section').classList.add('hidden');

    } catch (err) {
      console.error(err);
      showError('product', 'Purchase failed. Please try again.', false);
      throw err;
    }
  }

  /**
   * Clears the payment form fields.
   */
  function clearPaymentForm() {
    id('card-holder').value = '';
    id('card-number').value = '';
    id('card-expiry').value = '';
    id('card-cvv').value = '';
    id('billing-address').value = '';
    clearError('payment');
  }

  /**
   * Creates an error div element.
   * @returns {HTMLElement} - The created error div element.
   */
  function createErrorDiv() {
    const errorDiv = gen('div');
    errorDiv.id = 'review-error';
    errorDiv.className = 'error-message hidden';
    return errorDiv;
  }

  /**
   * Handles the submission of a product review.
   * @param {string} productId - The product ID.
   * @param {string} rating - The selected rating value.
   */
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
        const productResponse = await fetch('/getProducts?product_id=' + productId);
        if (productResponse.ok) {
          const productData = await productResponse.json();
          if (productData && productData[0]) {
            showProduct(productData[0].name);
          }
        }
      }
    } catch (err) {
      showError('review', 'Failed to submit review. Please try again.', false);
    }
  }

  /**
   * Displays a message indicating no previous orders.
   */
  function displayNoOrders() {
    const transactionContent = id('transaction-content');
    transactionContent.innerHTML = '';

    const heading = createPurchaseHeading();
    transactionContent.appendChild(heading);

    const noOrdersDiv = gen('div');
    noOrdersDiv.textContent = 'No previous orders found.';
    noOrdersDiv.classList.add('no-products-message');
    transactionContent.appendChild(noOrdersDiv);

    // Show the transaction area
    id('transaction-area').classList.remove('hidden');
  }

  /**
   * Retrieves the user's transaction history.
   */
  async function getTransactions() {
    try {
      const response = await fetch("/transactions?username=" + user);
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data = await response.json();
      id('product-area').classList.add('hidden');
      id('all-products').classList.add('hidden');
      const list = gen('div');
      list.classList.add('transaction-list');
      displayPreviousTransactions(data, list);
    } catch (err) {
      showError('transactions', 'Failed to load transaction history. Please try again later.', false);
    }
  }

  /**
   * Displays the user's previous transactions.
   * @param {Array} data - The transaction data.
   * @param {HTMLElement} list - The transaction list element.
   */
  function displayPreviousTransactions(data, list) {
    // Get the transaction content container
    const transactionContent = id('transaction-content');
    transactionContent.innerHTML = ''; // Clear existing content

    // Create and append heading
    const heading = createPurchaseHeading();
    transactionContent.appendChild(heading);

    // Add transaction list
    list.classList.add('transaction-list');

    // Show the transaction area first - moved outside of blocks
    id('transaction-area').classList.remove('hidden');

    if (data.length === 0) {
      displayNoOrders();
    } else {
      for (let i = 0; i < data.length; i++) {
        let order = data[i];
        const orderDiv = createOrderDiv(order);

        // Create order ID div and append it to orderDiv
        const orderId = gen('div');
        orderId.className = 'transaction-id';
        orderId.textContent = `Order ID: ${order.order_id}`;
        orderDiv.appendChild(orderId);
        orderDiv.appendChild(createImage(order.name));

        // Append other elements to orderDiv
        orderDiv.appendChild(createProductName(order));
        orderDiv.appendChild(createProductDescription(order));
        orderDiv.appendChild(createProductPrice(order));

        // Append completed orderDiv to list
        list.appendChild(orderDiv);
      }
      // Append the list to transaction content
      id('transaction-content').appendChild(list);
    }
  }

  /**
   * Creates a product price div element for a transaction.
   * @param {Object} order - The order data.
   * @returns {HTMLElement} - The created product price div element.
   */
  function createProductPrice(order) {
    const price = gen('div');
    price.className = 'transaction-price';
    price.textContent = `Price: $${order.price}`;
    return price;
  }

  /**
   * Creates a product description div element for a transaction.
   * @param {Object} order - The order data.
   * @returns {HTMLElement} - The created product description div element.
   */
  function createProductDescription(order) {
    const description = gen('div');
    description.className = 'transaction-description';
    description.textContent = `Description: ${order.description}`;
    return description;
  }

  /**
   * Creates a product name div element for a transaction.
   * @param {Object} order - The order data.
   * @returns {HTMLElement} - The created product name div element.
   */
  function createProductName(order) {
    const productName = gen('div');
    productName.className = 'transaction-name';
    productName.textContent = `Product: ${order.name}`;
    return productName;
  }

  /**
   * Creates an order div element for a transaction.
   * @param {Object} order - The order data.
   * @returns {HTMLElement} - The created order div element.
   */
  function createOrderDiv(order) {
    const orderDiv = gen('div');
    orderDiv.className = 'transaction-item';
    orderDiv.setAttribute('data-order-id', order.order_id);
    return orderDiv;
  }

  /**
   * Creates a purchase heading element.
   * @returns {HTMLElement} - The created purchase heading element.
   */
  function createPurchaseHeading() {
    const heading = gen('h3');
    heading.textContent = 'Purchase History';
    return heading;
  }

  /**
   * Displays all products.
   */
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

  /**
   * Renders a product card.
   * @param {string} productName - The product name.
   * @param {number} price - The product price.
   * @param {number} averageReviews - The average review rating.
   */
  function renderProduct(productName, price, averageReviews) {
    const productArea = id('product-area');
    const productCard = gen('div');
    productCard.className = 'product-card';

    let image = createImage(productName);
    let nameDiv = createNameDiv(productName);
    let starsDiv = createStarDiv(averageReviews);
    let priceDiv = createPriceDiv(price);

    productCard.addEventListener('click', function() {
      showProduct(productName);
    });

    productCard.appendChild(image);
    productCard.appendChild(nameDiv);
    productCard.appendChild(starsDiv);
    productCard.appendChild(priceDiv);
    productArea.appendChild(productCard);
  }

  /**
   * Creates a price div element for a product card.
   * @param {number} price - The product price.
   * @returns {HTMLElement} - The created price div element.
   */
  function createPriceDiv(price) {
    const priceDiv = gen('div');
    priceDiv.className = 'price';
    priceDiv.textContent = `From $${price} USD`;
    return priceDiv;
  }

  /**
   * Creates a star rating div element for a product card.
   * @param {number} averageReviews - The average review rating.
   * @returns {HTMLElement} - The created star rating div element.
   */
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

  /**
   * Creates a name div element for a product card.
   * @param {string} productName - The product name.
   * @returns {HTMLElement} - The created name div element.
   */
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

  /**
   * Creates an image element for a product card.
   * @param {string} productName - The product name.
   * @returns {HTMLElement} - The created image element.
   */
  function createImage(productName) {
    const imgName = productName.toLowerCase().replace(/\s+/g, '-');
    const img = gen('img');
    img.src = `./imgs/${imgName}.jpg`;
    img.alt = productName;
    img.className = 'product-image';
    return img;
  }

  /**
   * Sets up event listeners for password-related elements.
   */
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

  /**
   * Verifies that the password matches the confirm password input.
   * @returns {boolean} - Returns true if the passwords match, false otherwise.
   */
  function verifyPassword() {
    const verify = id('verify-password-input').value;
    const password = id('create-password-input-form').value;
    if (verify !== password) {
      showError('create-account', 'Passwords do not match', false);
    }
    return verify === password;
  }

  /**
   * Sets up event listeners for login-related elements.
   */
  function loginEvents() {
    id('login-btn').addEventListener('click', handleLogin);
    id('logout-btn').addEventListener('click', logout);
  }

  /**
   * Handles the login process.
   */
  function handleLogin() {
    handleLoginClick();
    id('submit-login-btn').addEventListener('click', async function() {
      let logged = await login();
      if (logged) {
        localStorage.setItem('username', user);
        showLoggedIn();
      } else {
        logInFailed();
      }
    });
  }

  /**
   * Shows the logged-in state and displays the appropriate elements.
   */
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

  /**
   * Updates the stock display for a product after a purchase.
   * @param {string} productId - The product ID.
   */
  function updateStockDisplay(productId) {
    const productContainer = document.querySelector(`.single-product-container[data-product-id="${productId}"]`);
    if (productContainer) {
      const stockDiv = productContainer.querySelector(".product-stock");
      if (stockDiv) {
        const currentStock = parseInt(stockDiv.textContent.match(/\d+/)[0]);
        if (currentStock > 0) {
          stockDiv.textContent = `In stock: ${currentStock - 1}`;
        }
      }
    }
  }

  /**
   * Displays an error message for a failed login attempt.
   */
  function logInFailed() {
    showError('login', 'Invalid username or password', false);
  }

  /**
   * Handles the login click event.
   */
  function handleLoginClick() {
    if (id('username')) id('username').value = '';
    if (id('email')) id('email').value = '';
    if (id('create-password-input-form')) id('create-password-input-form').value = '';
    if (id('verify-password-input')) id('verify-password-input').value = '';
    clearError('create-account');

    id('product-area').classList.add('hidden');
    id('all-products').classList.add('hidden');
    id('main-item-section').classList.add('hidden');
    id('account-section').classList.add('hidden');
    id('login-section').classList.remove('hidden');
  }

  const minPasswordLength = 8;

  /**
   * Checks if a password is strong and displays appropriate error messages.
   * @param {string} password - The password to check.
   * @returns {boolean} - Returns true if the password is strong, false otherwise.
   */
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

  /**
   * Creates a new user account.
   * @returns {Promise<boolean>} - Returns a promise that resolves to true if the user was created successfully, false otherwise.
   */
  async function createUser() {
    try {
      let username = id('username').value;
      let password = id('create-password-input-form').value;
      let email = id('email').value;

      if (!username || !password || !email) {
        showError('create-account', 'All fields are required', false);
        return;
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
        localStorage.setItem('username', user);
        return true;
      } else {
        showError('create-account', 'Username or email already exists', false);
      }
    } catch (err) {
      showError('create-account', 'Failed to create account. Please try again.', false);
    }
  }

  /**
   * Creates a new user account if the password is strong enough and matches the confirmation.
   */
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

  /**
   * Logs in the user with the provided credentials.
   * @returns {Promise<boolean>} - Returns a promise that resolves to true if the login was successful, false otherwise.
   */
  async function login() {
    clearError('login');
    let username = id('login-username').value;
    let password = id('login-password').value;

    if (!username || !password) {
      showError('login', 'Please enter both username and password', false);
      return false;
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
        return false;
      }
      const data = await response.json();
      if (data.valid) {
        user = username;
        localStorage.setItem('username', user);
        return true;
      } else {
        showError('login', 'Invalid username or password', false);
        return false;
      }
    } catch (err) {
      showError('login', 'Server error. Please try again later.', false);
      return false;
    }
  }

  /**
   * Logs out the user and updates the UI accordingly.
   */
  function logout() {
    if (user !== null) {
      user = null;
      localStorage.removeItem('username');
      id('login-btn').classList.remove('hidden');
      id('logout-btn').classList.add('hidden');
      id('create-account-btn').classList.remove('hidden');
      id('previous-transactions').classList.add('hidden');
    }
  }

  /**
   * Retrieves an element by its ID.
   * @param {string} item - The ID of the element.
   * @returns {HTMLElement} - The element with the specified ID.
   */
  function id(item) {
    return document.getElementById(item);
  }

  /**
   * Retrieves the first element that matches the specified CSS selector.
   * @param {string} item - The CSS selector.
   * @returns {HTMLElement} - The first element that matches the selector.
   */
  function qs(item) {
    return document.querySelector(item);
  }

  /**
   * Creates a new element with the specified tag name.
   * @param {string} item - The tag name of the element to create.
   * @returns {HTMLElement} - The newly created element.
   */
  function gen(item) {
    return document.createElement(item);
  }

})();