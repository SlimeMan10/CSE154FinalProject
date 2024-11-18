**# Fitness Supplement API Documentation**
This API was created for a fitness supplement e-commerce platform that allows users to search,
add to cart, remove cart, view cart, and purchase

**## Product Search**
**Request Format:** "/supplements/search"
**Request Type:** GET
**Returned Data Format**: JSON
**Description:** Search supplements with filters for categories and ingredients.

**Example Request:**
```
/supplements/search?query=protein&category=protein-powder&goal=muscle-gain&flavor=chocolate
```

**Example Response:**
```json
{
    "products": [
        {
            "id": "whey123",
            "name": "Gold Standard Whey",
            "brand": "Optimum Nutrition",
            "category": "protein-powder",
            "price": 59.99,
            "size": "5 lbs",
            "servings": 73,
            "flavor": "Double Rich Chocolate",
            "nutritionFacts": {
                "servingSize": "30.4g",
                "protein": "24g",
                "calories": 120,
                "sugar": "1g",
                "bcaa": "5.5g"
            },
            "inStock": true
        }
    ],
    "totalResults": 25,
    "currentPage": 1
}
```

**Error Handling:**
Status Code: 400 {
    "error": "Invalid product category specified"
}
Status Code: 500 {
    "error": "Search service unavailable"
}

**## Add to Cart**
**Request Format:** "/cart/add"
**Request Type:** POST
**Returned Data Format**: JSON
**Description:** Adds supplement items to cart with flavor and size options.

**Example Request:**
```json
{
    "userId": "user123",
    "productId": "whey123",
    "quantity": 2,
    "flavor": "Double Rich Chocolate",
    "size": "5 lbs",
}
```

**Example Response:**
```json
{
    "cartId": "cart789",
    "addedItem": {
        "productId": "whey123",
        "name": "Gold Standard Whey",
        "quantity": 2,
        "price": 59.99,
    },
    "cartSummary": {
        "subtotal": 119.98,
        "tax": 13.19,
        "total": 133.18
    }
}
```

**Error Handling:**
Status Code: 400 {
    "error": "Selected flavor not available for this product"
}
Status Code: 500 {
    "error": "Error updating cart"
}

**## View Cart**
**Request Format:** "/cart"
**Request Type:** GET
**Returned Data Format**: JSON
**Description:** View all items in cart with subscription details and savings.

**Example Request:**
```
/cart?userId=user123
```

**Example Response:**
```json
{
    "cartId": "cart789",
    "items": [
        {
            "productId": "whey123",
            "name": "Gold Standard Whey",
            "quantity": 2,
            "flavor": "Double Rich Chocolate",
            "size": "5 lbs",
            "price": 59.99,
        }
    ],
    "summary": {
        "subtotal": 119.98,
        "tax": 13.19,
        "total": 133.18
    }
}
```

**Error Handling:**
Status Code: 500 {
    "error": "Error retrieving cart"
}

**## Fitness Profile**
**Request Format:** "/fitness-profile"
**Request Type:** POST
**Returned Data Format**: JSON
**Description:** Create or update user fitness profile that has a saved card and card information

**Example Request:**
```json
{
    "userId": "user123",
    "goals": {
        "primary": "muscle-gain",
        "secondary": ["strength", "recovery"]
    },
    "measurements": {
        "weight": 165,
        "bodyFat": 15,
        "muscleGroups": {
            "chest": 42,
            "biceps": 15
        }
    },
    "supplements": [
        {
            "productId": "whey123",
            "useCase": "post-workout",
            "startDate": "2024-01-15"
        }
    ]
}
```

**Example Response:**
```json
{
    "profileId": "prof789",
    "status": "created",
    "recommendations": {
        "essential": [
            {
                "productId": "creatine456",
                "name": "Creatine Monohydrate",
                "reason": "Essential for muscle growth"
            }
        ],
        "stacks": [
            {
                "name": "Muscle Gain Stack",
                "products": ["whey123", "creatine456"],
                "totalPrice": 79.98,
                "stackDiscount": 10
            }
        ]
    }
}
```

**Error Handling:**
Status Code: 400 {
    "error": "Invalid measurement values"
}
Status Code: 500 {
    "error": "Error creating fitness profile"
}

**## Stack Builder**
**Request Format:** "/stacks"
**Request Type:** POST
**Returned Data Format**: JSON
**Description:** Create and manage supplement stacks.

**Example Request:**
```json
{
    "userId": "user123",
    "name": "Muscle Gain Stack",
    "products": [
        {
            "productId": "whey123",
            "quantity": 1
        },
        {
            "productId": "creatine456",
            "quantity": 1
        }
    ],
    "subscription": true
}
```

**Example Response:**
```json
{
    "stackId": "stack789",
    "name": "Muscle Gain Stack",
    "products": [
        {
            "productId": "whey123",
            "name": "Gold Standard Whey",
            "quantity": 1,
            "price": 59.99
        },
        {
            "productId": "creatine456",
            "name": "Creatine Monohydrate",
            "quantity": 1,
            "price": 19.99
        }
    ],
    "pricing": {
        "subtotal": 79.98,
        "stackDiscount": -8.00,
        "subscriptionDiscount": -7.20,
        "total": 64.78
    }
}
```

**Error Handling:**
Status Code: 400 {
    "error": "Invalid stack combination"
}
Status Code: 500 {
    "error": "Error creating stack"
}