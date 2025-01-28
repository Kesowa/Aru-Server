# Authentication on Aru

On the Aru platform, for authentication, a `session-based` approach is used on the backend and a `cookie-based` approach on the frontend.

## Table of Contents

- [Authentication on Aru](#authentication-on-aru)
  - [Table of Contents](#table-of-contents)
  - [Login functionality](#login-functionality)
  - [Session detection](#session-detection)
  - [Logout functionality](#logout-functionality)
  - [Changing password](#changing-password)
  - [Account creation](#account-creation)
  - [Security measures](#security-measures)

## Login functionality

The below diagram describes the flow of events that occur during login:

<img src="login.svg" alt="Login sequence diagram" style="display: block; margin: 10px auto;">

**Steps involved**
- **On frontend**
- Any frontend route is accessed with invalid or empty `connect.sid` cookie on browser (un-authorized access)
- User gets re-directed to `/login` page on fontend
- User fills `email` and `password` and submits the login form
- `POST` request with `email` and `password` in body gets sent to `/apis/v1/auth/login` route 
- **On backend**
- The controller associated with `/login` route verifies the following
  - Verifies whether a user with the given `email` exists in the database
  - Verifies whether the hash of given `password` matches with that stored in the database
  - Verifies whether the user is NOT `inactive`
  - Verifies whether the user is NOT of type `standalone-user`
  - Verifies whether the `expiryDate` of the user account has not yet passed
- If any of the above verifications fail, a `401` response with login failed message is sent to back
- If all verifications pass, then:
  - `req.session.user` is initialized with `id`, `tenantId` and `email` of logged in user, for creation of `express-session` based `session`
  - The `customPermissions` field in the user's data is populated and a `200` response is sent back with the user data
- **Back on frontend**
  - on successfull login:
    - `login` function of `AuthContext` gets called, which sets `Auth.isLoggedIn` to `true` and `Auth.userdetails` to the user data received
  - on failed login:
    - `logout` function of `AuthContext` gets called, which sets `Auth.isLoggedIn` to `false` and `Auth.userdetails` to `null`
    - The login form gets displayed again, with failure message

## Session detection

- session detection (make flow chart)
  - backend => `express-session` and `isAuthenticated` middleware
    - `express-session` used for handling sessions 
      - stores the session info (id, tenantId and email) in a MongoDB `sessions` collection
      - session id of session document stored in a cookie named `connect.sid` 
      - all requests come with that cookie preserved (thanks to `axios.defaults.withCredentials` set to `true`)
      - on all incoming request, `express-session`'s middleware finds the appropriate session using cookie and populates `req.session`
    - `isAuthenticated` middleware
      - parse id, tenantId and email from `req.session`
      - find user by id => return `401` on wrong id (meaning hashed cookie corrupted)
      - package expiry check => return `401` on package expired
      - populate `customPermissions`
    - on success, set `res.locals.user` to fetched user data with populated `customPermissions` and proceed to controller
  - frontend => `AuthContext`, `PrivateWrapper` and `axios`
    - `/userdetails` route on backend sends back currently logged in user detected on backend from request's `connect.sid` cookie (if any)
    - `axios` used to make requests from frontend, and it's instance has `withCredentials` sent to true for all requests, so if a valid cookie is present on browser, it will be sent with request
    - the root component `App.tsx` tries to fetch user details by hitting the `/userdetails` route using this `axios` instance
      - on success => call `login` from `AuthContext` to set `Auth.isLoggedIn` to `true` and `Auth.userdetails` to the user data with populated `customPermissions` received from backend
      - on error (means `401`) => call `logout` from `AuthContext` to set `Auth.isLoggedIn` to `false`
    - all frontend routes except public map redirect to `/dashboard`, wrapped by `PrivateWrapper` component
    - `PrivateWrapper` reads `Auth` from `AuthContext` 
      - redirects to `/login` and shows login form if `Auth.isLoggedIn` is `false`
      - renders `DashboardWrapper` if `Auth.isLoggedIn` is true
    - how does the axios `http` instance know to send headers? => `axios.defaults.withCredentials = true` makes it send the cookies properly 

## Logout functionality

The below diagram describes the flow of events that occur during logout:

<img src="logout.svg" alt="Logout sequence diagram" style="display: block; margin: 10px auto;">

**Steps involved**
- **On frontend**
  - `POST` request sent to `/apis/v1/auth/logout` on clicking `Logout` button
- **On backend**
- The controller associated with `/logout` route does the following
  - Destroys `express-session` session on `req.session`
  - Clears the `connect.sid` cookie on the response `res`
  - Sends a `200` response back to frontend
- **Back on frontend**
  - `logout` function of `AuthContext` gets called, which sets `Auth.isLoggedIn` to `false` and `Auth.userdetails` to `null` 
  - Since `Auth.isLoggedIn` is `false`, `PrivateWrapper` will redirect to `/login` on all further requests

## Changing password

The below diagram describes the flow of events that occur during logout:

<img src="" alt="Changing password flow diagram" style="display: block; margin: 10px auto;">

**Steps involved**
- frontend
  - `Forgot password` link on login form of `/login` page on frontend takes to `/forgot-password` page on frontend
  - `ForgotPassword` component asks for `email` and hits the `/forgot-password` backend route with the `email` on form submit
- backend
  - `/forgot-password` controller logic
    - check user existence
    - create a document in `password_reset` collection of MongoDB with a token
    - send an email to user containing a link to `/reset-password/:token`
  - when user clicks link in email, `GET` request sent to `/reset-password/:token` route on backend
- frontend
  - send back ejs template file containing password reset form asking for new password
  - on submission, sends `POST` request to `/reset-password/:token` on backend with `password` and `password2` (confirm password)
- backend
  - check both new password and confirm password present
  - check new password matches confirm password
  - find and validate token from `password_reset` collection on MongoDB
  - on success
    - update password in user document in `users` collection
    - delete the document containing the token from `password_reset` collection
    - remove any existing sessions and cookies from request (so that user needs to login again)
  - on fail
    - send back ejs template file containing password reset form, showing invalid token error

## Account creation

- account creation:
  - sign up => no current implementation
  - tenant-root users and tenant organizations added by super-admins and credentials mailed to them
  - tenant-staff and tenant-client user accounts created by tenant-root and email sent to them

## Security measures

- safety measures on user storage
  - password hashed with bcrypt
  - when returning clients or user list, password and sensitive credentials excluded from response (since clients can view other clients, staff can view other staff)
  - stored on cookie, not accessible from javascript XSS scripts (is accessible from dev tools by manual checking but any attack script won't do that)
  - `AxiosErrorHandler` => auto logout on `500` status error