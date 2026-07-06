# Kalludevakunta FPO API Documentation

Welcome to the API Documentation for the Kalludevakunta FPO Website Backend. 
All endpoints are relative to the base URL: `http://localhost:5000/api` (or environment-configured port).

---

## 🔒 Security & Authorization

The backend supports two types of token-based authentication (JWT):
1. **Admin Authorization**: Requires token provided by `/api/admin/login` verifying admin credentials. Handled via `auth` middleware.
2. **Farmer Authorization**: Requires token provided by `/api/farmer/login` (via MSG91 OTP Widget widget). Handled via `farmerAuth` middleware.

Header Format:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 🌾 1. Farmer Auth & Profile (`/api/farmer`)

### POST /farmer/login
*   **Description**: Authenticates a farmer using a verified MSG91 widget token.
*   **Authentication**: None
*   **Request Body**:
    ```json
    {
      "phone": "9876543210",
      "otpToken": "msg91_widget_access_token"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Login successful.",
      "token": "eyJhbGciOi...",
      "farmer": { "id": "...", "farmerId": "FPO001", "name": "...", "phone": "..." }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: `{"success":false,"message":"phone missing"}`
    *   `404 Not Found`: `{"success":false,"message":"Farmer not found"}`

### POST /farmer/register
*   **Description**: Registers a new farmer.
*   **Authentication**: None
*   **Request Body**:
    ```json
    {
      "farmerName": "Kallu Devakunta",
      "phone": "9876543210",
      "state": "Andhra Pradesh",
      "district": "Anantapur",
      "mandal": "Tadipatri",
      "village": "Kalludevakunta",
      "landArea": "5.5",
      "primaryCrop": "Groundnuts"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Registration successful.",
      "token": "eyJhbGciOi...",
      "farmer": { ... }
    }
    ```

### GET /farmer/profile
*   **Description**: Retrieves the authenticated farmer's profile.
*   **Authentication**: Farmer Token
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "farmer": { ... }
    }
    ```

### PUT /farmer/profile
*   **Description**: Updates the authenticated farmer's profile.
*   **Authentication**: Farmer Token
*   **Request Body**: Any profile fields to update.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Profile updated successfully.",
      "farmer": { ... }
    }
    ```

---

## 🚜 2. Bookings (`/api/bookings`)

### POST /bookings
*   **Description**: Farmer books shared agricultural machinery.
*   **Authentication**: Farmer Token
*   **Request Body**:
    ```json
    {
      "equipmentName": "Tractor",
      "bookingDate": "2026-07-15",
      "duration": 3
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Booking saved"
    }
    ```

### GET /bookings
*   **Description**: Admin retrieves all machinery bookings.
*   **Authentication**: Admin Token
*   **Success Response (200 OK)**: Array of booking objects.

### PUT /bookings/:id/approve
*   **Description**: Admin approves a machinery booking.
*   **Authentication**: Admin Token
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Booking approved successfully",
      "data": { ... }
    }
    ```

### PUT /bookings/:id/reject
*   **Description**: Admin rejects a machinery booking.
*   **Authentication**: Admin Token
*   **Request Body**:
    ```json
    {
      "remarks": "Unavailable on this day"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Booking rejected successfully",
      "data": { ... }
    }
    ```

---

## 🌾 3. Crop Sales (`/api/crop-sales`)

### POST /crop-sales
*   **Description**: Farmer submits crop selling request to the FPO.
*   **Authentication**: Farmer Token
*   **Request Body**:
    ```json
    {
      "cropName": "Red Gram",
      "quantity": 10,
      "unit": "Bags",
      "expectedPrice": 6500,
      "description": "Premium quality red gram crop"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Crop sale request submitted successfully.",
      "data": { ... }
    }
    ```

### GET /crop-sales/my
*   **Description**: Farmer fetches their own crop sales list.
*   **Authentication**: Farmer Token
*   **Success Response (200 OK)**: Array of crop sale objects.

### GET /crop-sales
*   **Description**: Admin fetches all requests with optional pagination and status filters.
*   **Authentication**: Admin Token
*   **Query Params**: `status` (All/Pending/Approved/Rejected/Completed), `period` (all/today/week/month), `page`, `limit`
*   **Success Response (200 OK)**: Array of crop sale objects. (Pagination metadata attached to headers `X-Total-Count`, `X-Total-Pages`).

---

## 📦 4. Products (`/api/products`)

### GET /products
*   **Description**: Public product catalog lookup with search and pagination support.
*   **Authentication**: None
*   **Query Params**: `search`, `page`, `limit`
*   **Success Response (200 OK)**: Array of products.

### POST /products
*   **Description**: Admin creates a new product.
*   **Authentication**: Admin Token
*   **Request Body**:
    ```json
    {
      "name": "Organic Neem Oil",
      "category": "Fertilizer",
      "price": 450,
      "stock": 100,
      "description": "Eco-friendly pest control oil",
      "unit": "Litre",
      "imageUrl": "/uploads/product-123.png"
    }
    ```
*   **Success Response (201 Created)**: Product object.

### POST /products/upload-image
*   **Description**: Admin uploads a product thumbnail.
*   **Authentication**: Admin Token
*   **Request Body**: Multipart form data with file key `"image"`.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "imageUrl": "/uploads/17234567-image.png"
    }
    ```

---

## 📁 5. Documents (`/api/documents`)

### GET /documents
*   **Description**: Fetches all uploaded reports, schemes, and guidelines.
*   **Authentication**: None
*   **Success Response (200 OK)**: Array of documents.

### POST /documents/upload
*   **Description**: Admin uploads reports or scheme files.
*   **Authentication**: Admin Token
*   **Request Body**: Multipart form data with file key `"file"` and fields `title`, `description`, `category`.
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Document uploaded successfully",
      "document": { ... }
    }
    ```

---

## 🔔 6. Notifications (`/api/notifications`)

### GET /notifications
*   **Description**: Admin retrieves recent dashboard alerts.
*   **Authentication**: Admin Token
*   **Query Params**: `page`, `limit`
*   **Success Response (200 OK)**: Array of notifications.

---

## 📞 7. Contact Inquiry (`/api/contact`)

### POST /contact
*   **Description**: Public inquiry submission form.
*   **Authentication**: None
*   **Request Body**:
    ```json
    {
      "name": "Ramu",
      "phone": "9988776655",
      "message": "Interested in joining the FPO"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Contact saved successfully",
      "data": { ... }
    }
    ```
