HustleHub+ - Part 1: Secure Foundations

1. Project overview

HustleHub+ is a secure freelance marketplace platform. Its purpose is to allow freelancers to advertise services and clients to browse and book those services.

Part 1 focuses on the secure backend foundation of the platform. The backend was developed using Node.js and Express and currently supports:

User registration

Secure password hashing

User login

JWT generation

JWT-protected profile access

Input validation

HTTPS communication

Security headers

CORS restrictions

Controlled error responses

Postman API testing

Part 1 uses temporary in-memory storage. This means that registered users are removed whenever the backend server restarts. Persistent database storage will be introduced during a later part of the project.

2. Intended users

The complete HustleHub+ system will support the following users:

Clients

Clients will browse available freelance services and make bookings.

Freelancers

Freelancers will create and manage services, receive bookings and view their income and estimated tax information.

Administrators

Administrators will manage the platform and monitor important system activities. Public registration does not allow a user to select the administrator role because this would create a security risk. Administrator accounts should be created through a controlled administrative process.

Part 1 currently allows public registration for the client and freelancer roles only.

3. System architecture


flowchart TD

    A["Client or Postman"] -->|"HTTPS request"| B["Express API"]

    B --> C["Security Middleware"]

    C --> D["Authentication Routes"]

    D --> E["Authentication Controller"]

    E --> F["In-Memory User Store"]

    C --> C1["Helmet security headers"]

    C --> C2["CORS restrictions"]

    C --> C3["JSON body limit"]

    D --> D1["Registration validation"]

    D --> D2["Login validation"]

    D --> D3["JWT authentication"]

    E --> E1["bcrypt password hashing"]

    E --> E2["JWT generation"]

    E --> E3["Safe response objects"]

    B --> G["Controlled 404 and 500 errors"]


4. Architecture explanation

The client communicates with the HustleHub+ backend through HTTPS. Express receives each request and applies security controls before allowing it to reach the authentication routes.

Helmet adds security-related HTTP headers, CORS restricts the frontend origins that may communicate with the API, and the JSON body limit reduces the risk of oversized request payloads.

Registration and login information is validated before reaching the authentication controller. During registration, bcrypt hashes the password before the user is stored. During login, the submitted password is compared with the stored password hash.

A successful login generates a signed JSON Web Token. Protected routes require this token in the Authorization header. Missing, invalid or expired tokens are rejected.

Controlled error responses prevent stack traces, local file paths, configuration values and other internal system details from being returned to the client.

5. Backend structure


backend/

├── certs/

│   ├── localhost-cert.pem

│   └── localhost-key.pem

├── controllers/

│   └── authController.js

├── data/

│   └── users.js

├── middleware/

│   ├── authenticateToken.js

│   ├── validateLogin.js

│   └── validateRegistration.js

├── routes/

│   └── authRoutes.js

├── .env

├── .env.example

├── .gitignore

├── index.js

├── package-lock.json

└── package.json


Main files

index.js configures Express, HTTPS, Helmet, CORS, routes and controlled error handling.

authController.js handles user registration, login, password hashing and JWT generation.

users.js provides temporary in-memory user storage.

validateRegistration.js validates and sanitises registration input.

validateLogin.js validates login input.

authenticateToken.js verifies JWTs before protected routes are accessed.

authRoutes.js connects API endpoints to middleware and controller functions.

.env stores local configuration and secrets and must not be committed to GitHub.

.env.example shows the required environment variables without exposing real secret values.

6. Security decisions

6.1 Password hashing

Passwords are never stored or returned as plain text. During registration, the password is processed using bcrypt and only the resulting password hash is stored.

Hashing is a one-way process. This reduces the risk of exposing users’ original passwords if stored information is accessed by an unauthorised person. OWASP recommends using an appropriate password-hashing algorithm rather than storing passwords using plain text or reversible encryption [1].

During login, bcrypt compares the submitted password with the stored password hash. The API never returns the password or password hash in its responses.

6.2 JSON Web Tokens

HustleHub+ uses JSON Web Tokens to identify authenticated users. A JWT is generated after a user successfully logs in.

The token contains limited user identification information and is signed using the JWT_SECRET stored in the local .env file. The secret is not written directly into the source code.

JWT is a compact and URL-safe method of transferring claims between parties [2]. The token must be included in protected requests using this header format:


Authorization: Bearer <token>


The authentication middleware verifies the signature and expiry of the token before allowing access. Missing, invalid and expired tokens receive controlled 401 Unauthorized responses.

6.3 Input validation and sanitisation

All registration and login input is validated before processing. The API checks:

Whether required fields were supplied

Whether the name contains an acceptable number of characters

Whether the email has a valid format

Whether the password satisfies the required complexity rules

Whether the role is either client or freelancer

Whether supplied values use the expected data type

Invalid input receives a controlled 400 Bad Request response. Validation helps prevent malformed and potentially malicious information from being processed by the application.

6.4 HTTPS

The API is served through HTTPS using a locally generated SSL certificate. HTTPS uses TLS to protect information while it travels between the client and server. Node.js provides an HTTPS module for creating an HTTPS server [3].

Because the certificate is self-signed for local development, browsers and Postman may display a certificate warning. This is expected in the development environment. A production system must use a certificate issued by a trusted certificate authority.

6.5 Security headers

Helmet is used to add HTTP security headers. The Postman security-header tests confirm the presence of protections such as:

Content-Security-Policy

X-Content-Type-Options

X-Frame-Options

Strict-Transport-Security

6.6 CORS restrictions

CORS is configured to accept requests from the approved client origin. The accepted methods are limited to those required by the current API, and the allowed headers are limited to Content-Type and Authorization.

6.7 Request body limit

JSON request bodies are limited to 10kb. This reduces the possibility of excessively large requests consuming unnecessary application resources.

6.8 Controlled error handling

The API uses controlled JSON error responses. Responses do not expose:

Stack traces

Local file paths

Environment variables

JWT secrets

Passwords

Password hashes

Internal Node.js error messages

Unknown endpoints receive:


{

    "error": "Route not found"

}


Unexpected server errors receive a general message instead of internal debugging information.

7. API endpoints

| Method | Endpoint | Protection | Description |

|---|---|---|---|

| GET | / | Public | Confirms that the HustleHub+ API is running |

| GET | /health | Public | Returns the API health status and protocol |

| POST | /api/auth/register | Public | Registers a client or freelancer |

| POST | /api/auth/login | Public | Authenticates a user and returns a JWT |

| GET | /api/auth/profile | JWT required | Returns the authenticated user’s safe profile |

8. Expected response codes

| Status code | Meaning | Example |

|---|---|---|

| 200 OK | Request completed successfully | Login, health check or profile access |

| 201 Created | A user was successfully registered | Valid registration |

| 400 Bad Request | Input validation failed | Weak password or invalid role |

| 401 Unauthorized | Authentication failed | Invalid login or token |

| 404 Not Found | The endpoint does not exist | Invalid route |

| 409 Conflict | The email is already registered | Duplicate registration |

| 500 Internal Server Error | An unexpected server error occurred | Controlled server error |

9. Environment configuration

Create a .env file inside the backend folder. The file should follow this structure:


PORT=4000

APP_NAME=HustleHub+

CLIENT_ORIGIN=http://localhost:5173

JWT_SECRET=replace_with_a_long_random_secret

JWT_EXPIRES_IN=1h

USE_HTTPS=true


Important rules:

Never commit .env to GitHub.

Never include the real JWT secret in screenshots.

Use a long, randomly generated JWT secret.

Do not store production secrets directly in source code.

10. Installation instructions

Requirements

Install the following tools:

Node.js

npm

Visual Studio Code

Postman

Git

OpenSSL

Install and run the backend

Open the project in Visual Studio Code and enter:


cd backend

npm.cmd install


Create the .env file by copying .env.example:


Copy-Item .env.example .env


Start the development server:


npm.cmd run dev


A successful startup displays:


HTTPS server running on port 4000


The health endpoint can then be accessed at:


https://localhost:4000/health


11. Local certificate generation

If the local certificate files are not available, create the certs folder inside backend and generate a self-signed certificate using OpenSSL:


mkdir -p certs

openssl req -x509 -newkey rsa:2048 -nodes \

-keyout certs/localhost-key.pem \

-out certs/localhost-cert.pem \

-days 365 \

-subj "/CN=localhost"


The generated files are:


backend/certs/localhost-key.pem

backend/certs/localhost-cert.pem


These certificates are intended only for local development.

12. Postman testing

The Postman folder contains:


Postman/

├── HustleHub Local.postman_environment.json

└── HustleHub+ Part 1.postman_collection.json




Import the files

Open Postman.

Select Import.

Import the collection JSON file.

Import the environment JSON file.

Select the HustleHub Local environment.

Turn off SSL certificate verification for the local self-signed certificate if required.

Restart the backend before running the collection.

Run the collection with one iteration.

Restarting is necessary because Part 1 uses in-memory storage and the registration test expects a new user.

13. Postman test scenarios

The collection includes the following tests:

HTTPS health check

Valid registration

Duplicate registration

Weak password rejection

Invalid role rejection

Successful login and JWT generation

Invalid login

Protected profile without a token

Protected profile with an invalid token

Protected profile with a valid JWT

Invalid route and controlled error handling

HTTP security headers

The final collection run completed successfully with:

40 passed tests

0 failed tests

0 errors

14. Running the protected profile request

First, run the valid login request. The Postman test script saves the returned token as the authToken environment variable.

The protected-profile request then sends:


Authorization: Bearer {{authToken}}


A valid token returns the user’s safe profile. The response does not expose the password or password hash.

15. Current limitations

Part 1 currently has the following limitations:

User data is stored in memory.

Data is removed when the server restarts.

The SSL certificate is self-signed and intended only for local development.

No frontend has been implemented yet.

Booking, gig, transaction, income and tax functions will be implemented in later parts.

Administrative account creation is not yet implemented.

Rate limiting and persistent audit logging can be added in later development stages.

16. Future improvements

Later parts of HustleHub+ will introduce:

Persistent database storage

Frontend integration

Freelancer gig management

Client booking functions

Role-based access control

Transaction records

Freelancer income tracking

Estimated tax calculations

Administrative functions

Audit logging

Automated testing

Docker containerisation

CI/CD integration

17. Testing evidence

The following screenshots provide evidence that the HustleHub+ security and authentication tests were completed successfully.

HTTPS health check



Valid registration tests



Duplicate registration protection



Invalid token rejection



Valid protected profile



Controlled invalid route



Security headers



Complete Postman collection



Local certificate generation



18. References

[1] OWASP Foundation, “Password Storage Cheat Sheet,” OWASP Cheat Sheet Series. [Online]. Available: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html. [Accessed: 23-Aug-2026].

[2] M. Jones, J. Bradley and N. Sakimura, “JSON Web Token (JWT),” RFC 7519, Internet Engineering Task Force, May 2015. [Online]. Available: https://www.rfc-editor.org/info/rfc7519/. [Accessed: 23-Aug-2026].

[3] OpenJS Foundation, “HTTPS,” Node.js Documentation. [Online]. Available: https://nodejs.org/api/https.html. [Accessed: 23-Aug-2026].

[4] OWASP Foundation, “Authentication Cheat Sheet,” OWASP Cheat Sheet Series. [Online]. Available: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html. [Accessed: 23-Aug-2026].

[5] OpenJS Foundation, “Express middleware,” Express.js Documentation. [Online]. Available: https://expressjs.com/en/guide/using-middleware.html. [Accessed: 23-Aug-2026].