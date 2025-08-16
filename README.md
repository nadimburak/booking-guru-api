# Project Setup Guide
1. Install Dependencies
First, install all required dependencies. The --legacy-peer-deps flag helps resolve potential peer dependency conflicts.

```bash
npm install --legacy-peer-deps
```

2. Configure Environment Variables
Copy the example environment file and update it with your actual configuration (if needed).

```bash
cp env.example .env
```

Open .env and modify any necessary values (e.g., database connection details, API keys).

3. Run the Development Server
Start the development server to launch the application.

```bash
npm run dev
```

The server should now be running at http://localhost:8001.

API Endpoints
1. Fetch and Store Cities Data
This endpoint fetches city data from an external source and stores it in the database.

```bash
GET http://localhost:8001/update-cities
```

Note: Run this once to populate the database with city data.

2. Retrieve All Cities
Get a list of all stored cities.

```bash
GET http://localhost:8001/cities
```

Response: Returns an array of city objects.

3. Filter Cities by Country
Filter cities based on the country code (e.g., FR for France).

```bash
GET http://localhost:8001/cities?country=FR
```
Parameters:

country (string, required): ISO country code (e.g., US, DE, FR).

4. Sort Cities by Pollution Level
Sort cities by pollution level in ascending or descending order.

```bash
GET http://localhost:8001/cities?country=FR&sortBy=pollution&order=desc
```

Parameters:

sortBy (string, optional): Field to sort by (e.g., pollution).

order (string, optional): Sort order (asc or desc).

Additional Notes
Database Setup: Ensure your database (e.g., MongoDB, PostgreSQL) is running and properly configured in .env.

Error Handling: If the API fails, check the server logs for errors (e.g., missing environment variables, database connection issues).

Testing: Use tools like Postman, curl, or Thunder Client (VS Code extension) to test the endpoints.