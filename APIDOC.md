# E-commerce Store API Documentation
This API provides functionality for an e-commerce platform allowing users to search products, create accounts, manage purchases, and leave reviews.

## Get Products
**Request Format:** `/getProducts?name=value&type=value&maxPrice=value`
**Request Type:** GET
**Returned Data Format**: JSON
**Description:** Search products with filters for name, type, and maximum price. At least one query parameter must be provided. Parameters must be added to URL directly - cannot use POST or JSON body.

**Example Requests:**
```
/getProducts?name=protein
/getProducts?type=supplement&maxPrice=50
/getProducts?name=pro&type=supplement&maxPrice=100
```

**Successful Response:**
```json
[
    {
        "name": "Protein Powder",
        "description": "High-quality whey protein",
        "price": 49.99,
        "stock": 100,
        "image": "protein.jpg",
        "product_id": "123",
        "type": "supplement",
        "average_rating": 4.5,
        "total_ratings": 25,
        "review_usernames": "user1,user2,user3"
    }
]
```

**Error Handling:**
- Status Code: 400 { error: "Must Have At Least One Filter" }
  - Occurs when no query parameters are provided
- Status Code: 500 { error: "An error occurred on the server. Try again later." }
  - Occurs when database connection fails or query errors

**Notes:**
- Requires at least one query parameter using ?parameter=value format
- Multiple parameters connected with &
- Cannot send data via POST or JSON body
- Valid parameters: name, type, maxPrice
- All parameters are optional but at least one must be provided

## Get All Products
**Request Format:** `/getAllProducts`
**Request Type:** GET
**Returned Data Format**: JSON
**Description:** Retrieves all products with their ratings and details. No parameters required.

**Successful Response:**
```json
[
    {
        "product_id": "123",
        "name": "Protein Powder",
        "description": "High-quality whey protein",
        "price": 49.99,
        "stock": 100,
        "image": "protein.jpg",
        "type": "supplement",
        "average_rating": 4.5,
        "num_ratings": 25
    }
]
```

**Error Handling:**
- Status Code: 500 { error: "An error occurred on the server. Try again later." }
  - Occurs when database connection fails or query errors

**Notes:**
- No parameters required
- Simple GET request
- Cannot send data via POST or JSON body
- Returns all products in database with their ratings

## User Registration
**Request Format:** `/newUser`
**Request Type:** POST
**Returned Data Format**: JSON
**Description:** Creates a new user account. Accepts either form data or JSON body.

**Example Request - JSON Body:**
```json
{
    "username": "newuser",
    "password": "securepass123",
    "email": "user@example.com"
}
```

**Example Request - Form Data:**
```
username=newuser
password=securepass123
email=user@example.com
```

**Successful Response:**
```json
{
    "message": "User created"
}
```

**Error Handling:**
- Status Code: 400 { error: "Email is already taken" }
  - Occurs when attempting to register with an existing email
- Status Code: 400 { error: "Username is already taken" }
  - Occurs when attempting to register with an existing username
- Status Code: 400 { error: "Must add all parameters" }
  - Occurs when any required field is missing
- Status Code: 500 { error: "An error occurred on the server. Try again later." }
  - Occurs when database connection fails or query errors

**Notes:**
- Requires username, password, and email parameters
- Can send data via either POST form data (FormData) or JSON body
- All parameters are required
- Email and username must be unique in the system

## User Login
**Request Format:** `/login`
**Request Type:** POST
**Returned Data Format**: JSON
**Description:** Authenticates a user. Accepts either form data or JSON body.

**Example Request - JSON Body:**
```json
{
    "username": "existinguser",
    "password": "userpass123"
}
```

**Example Request - Form Data:**
```
username=existinguser
password=userpass123
```

**Successful Response:**
```json
{
    "message": "Login successful",
    "valid": true
}
```

**Failed Response Examples:**
```json
{
    "message": "Password did not match the username",
    "valid": false
}
```
```json
{
    "message": "User does not exist",
    "valid": false
}
```

**Error Handling:**
- Status Code: 400 { error: "Missing username or password" }
  - Occurs when required fields are not provided
- Status Code: 400 { error: "User does not exist" }
  - Occurs when username is not found in database
- Status Code: 400 { error: "Password did not match the username" }
  - Occurs when password is incorrect for given username
- Status Code: 500 { error: "An error occurred on the server. Try again later." }
  - Occurs when database connection fails or query errors

**Notes:**
- Requires username and password parameters
- Can send data via either POST form data (FormData) or JSON body
- All parameters are required
- Returns valid: true/false to indicate login success

## Purchase Product
**Request Format:** `/purchase`
**Request Type:** POST
**Returned Data Format**: JSON
**Description:** Processes a product purchase. Accepts either form data or JSON body.

**Example Request - JSON Body:**
```json
{
    "username": "buyer",
    "product_id": "123",
    "cost": 49.99
}
```

**Example Request - Form Data:**
```
username=buyer
product_id=123
cost=49.99
```

**Successful Response:**
```json
{
    "message": "Purchase successful",
    "confirmationCode": "ABC123"
}
```

**Failed Response Examples:**
```json
{
    "error": "Product is out of stock"
}
```
```json
{
    "error": "Username is required"
}
```

**Error Handling:**
- Status Code: 400 { error: "Username is required" }
  - Occurs when username is not provided
- Status Code: 400 { error: "Product is out of stock" }
  - Occurs when attempting to purchase an out-of-stock item
- Status Code: 500 { error: "An error occurred while processing the purchase" }
  - Occurs when database connection fails or query errors

**Notes:**
- Requires username, product_id, and cost parameters
- Can send data via either POST form data (FormData) or JSON body
- All parameters are required
- Automatically checks and updates stock levels
- Returns a unique confirmation code

## View Transactions
**Request Format:** `/transactions`
**Request Type:** GET
**Returned Data Format**: JSON
**Description:** Retrieves user's purchase history. Requires username in request body (note: this endpoint uses GET but requires body data due to security considerations - keeping username in URL would expose user data in server logs and browser history).

**Example Request - JSON Body:**
```json
{
    "username": "buyer"
}
```

**Example Request - Form Data:**
```
username=buyer
```

**Successful Response:**
```json
[
    {
        "order_id": "ABC123",
        "name": "Protein Powder",
        "description": "High-quality whey protein",
        "price": 49.99,
        "image": "protein.jpg",
        "product_id": "123"
    }
]
```

**Error Handling:**
- Status Code: 400 { error: "Username is required" }
  - Occurs when username is not provided
- Status Code: 500 { error: "An error occurred while retrieving transactions" }
  - Occurs when database connection fails or query errors

**Notes:**
- Requires username parameter
- Uses GET request but requires data in body (not URL parameters)
- Can send data via either form data (FormData) or JSON body
- Data sent in body to protect user privacy
- Returns all purchases for the specified user

## Add Review
**Request Format:** `/review`
**Request Type:** POST
**Returned Data Format**: JSON
**Description:** Adds a product review with rating and comment. Accepts either form data or JSON body.

**Example Request - JSON Body:**
```json
{
    "username": "reviewer",
    "product_id": "123",
    "rating": 5,
    "comment": "Great product!"
}
```

**Example Request - Form Data:**
```
username=reviewer
product_id=123
rating=5
comment=Great product!
```

**Successful Response:**
```json
{
    "message": "Review added successfully",
    "averageRating": 4.5,
    "numRatings": 26
}
```

**Error Handling:**
- Status Code: 500 { error: "An error occurred on the server. Try again later." }
  - Occurs when database connection fails or query errors
  - Occurs when there are issues calculating average rating
  - Occurs when transaction fails

**Notes:**
- Requires username, product_id, rating, and comment parameters
- Can send data via either POST form data (FormData) or JSON body
- All parameters are required
- Automatically calculates and updates average product rating
- Rating should be between 1-5

## Add Product (Admin)
**Request Format:** `/addProduct`
**Request Type:** POST
**Returned Data Format**: JSON
**Description:** Adds a new product to the store. This endpoint exists to simplify product management and testing, allowing easy addition of products without direct database queries. The image field should contain a URL or file path that can be used to display the product image.

**Example Request - JSON Body:**
```json
{
    "product_id": "123",
    "name": "New Product",
    "description": "Product description",
    "price": 49.99,
    "stock": 100,
    "image": "product.jpg",
    "type": "supplement"
}
```

**Example Request - Form Data:**
```
product_id=123
name=New Product
description=Product description
price=49.99
stock=100
image=product.jpg
type=supplement
```

**Successful Response:**
```json
{
    "message": "Product added successfully"
}
```

**Failed Response Example:**
```json
{
    "error": "Missing required product information"
}
```

**Error Handling:**
- Status Code: 400 { error: "Missing required product information" }
  - Occurs when any required field is missing (product_id, name, description, price, stock, image, type)
- Status Code: 500 { error: "An error occurred on the server. Try again later." }
  - Occurs when database connection fails or query errors

**Notes:**
- Requires product_id, name, description, price, stock, image, and type parameters
- Can send data via either POST form data (FormData) or JSON body
- All parameters are required
- Image parameter should be a URL or file path string
- Used for testing and easy product management

**General Notes:**
1. All POST endpoints accept both JSON and form data formats (using FormData in index.js)
2. All numeric values (price, stock, rating, etc.) can be sent as either numbers or strings
3. Error responses include appropriate HTTP status codes
4. Server errors (500) may occur with any endpoint due to database connection issues
5. All responses are in JSON format unless specified otherwise
6. Form data parameters must match the exact names shown in the examples