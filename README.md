# Manyatta Grill — Authentication and Dashboard System

This document covers everything you need to understand, run, and extend the authentication system added to the Manyatta Grill website.



##Project Structure

    index.html            Homepage
    about.html            About page
    menu.html             Menu page
    reservations.html     Reservations / Events page
    reviews.html          Reviews page
    contact.html          Contact page
    login.html            Login, Register, and Password Reset flows
    dashboard.html        Role-based dashboard for all user types
    unauthorized.html     Shown when a user accesses a restricted area
    auth.js               The entire authentication and API security layer
    script.js             Existing site-wide scripts
    style.css             Global styles


## Getting Started

No build tools, no npm, no server required. Open any HTML file directly in a browser or serve the folder with any static file server.

    npx serve .
  or simply open index.html in your browser

Everything runs in the browser. User data is stored in localStorage for demonstration purposes.



## Demo Accounts

Three accounts are seeded automatically on first load. All use the same password.

    Role        Email                          Password
    Admin       admin@manyattagrill.com        Password1!
    Staff       staff@manyattagrill.com        Password1!
    Customer    customer@example.com           Password1!

On the login page, use the Fill buttons beside each account to populate the form instantly.



## Authentication Features

Registration validates the full name, email format, and password strength before creating an account. New accounts are assigned the Customer role by default.

Loginchecks credentials against hashed passwords, tracks failed attempts per email, and locks the account for 15 minutes after five consecutive failures. Error messages are deliberately generic to prevent user enumeration.

Remember Me extends the session from one hour to seven days when checked.

Password Reset is a two-step flow. The user submits their email to receive a six-character code, then submits that code alongside their new password. The code expires after 15 minutes. In this demo, the code is shown directly on screen and also printed to the browser console.

Token Management uses a JWT-style three-part token stored in localStorage. Tokens carry the user ID, role, and expiry timestamp. A background interval checks every 60 seconds and logs the user out automatically if the token has expired.



Role-Based Access

There are three roles, each with a different level of access.

Admin is the highest level. Admins see the full dashboard including an overview with live stats, a user management table where roles can be changed and accounts deleted, reservations, the menu manager, reviews moderation, reports, an API tester, and their own profile.

Staff sees the overview, reports, reservations, reviews, the API tester, and their profile. They cannot access user management or the menu editor.

Customer sees their own reservations, the API tester, and their profile. They have no access to any management area.

If a user navigates directly to a protected page without being logged in, they are redirected to the login page. If they are logged in but lack the required role level, they are sent to the unauthorized page.

The permission system is defined in auth.js as follows.

    Admin     view_dashboard, manage_users, manage_menu, manage_reservations,
              view_reports, edit_content, manage_reviews

    Staff     view_dashboard, manage_reservations, view_reports, manage_reviews

    Customer  view_reservations, make_reservation, view_profile, write_review

You can check permissions anywhere in the site like this.

    if (ManyattaAuth.hasPermission('manage_menu')) {
      // show edit controls
    }




 The Auth API (auth.js)

The entire system is exposed through a single global object called ManyattaAuth. You can call its methods from any page that loads auth.js.

ManyattaAuth.init() seeds the demo users and starts the token expiry watcher. It runs automatically when auth.js loads.

ManyattaAuth.register({ name, email, password, phone }) creates a new Customer account. Returns an object with ok: true on success or ok: false with an error message on failure.

ManyattaAuth.login({ email, password, remember }) authenticates a user and stores the session. Returns the user object and JWT token on success.

ManyattaAuth.logout() clears the session and fires an mg:logout event on the window.

ManyattaAuth.getCurrentUser() returns the currently logged-in user object, or null if no valid session exists. The returned object never includes the password hash.

ManyattaAuth.isAuthenticated() returns true or false.

ManyattaAuth.hasRole(role) checks whether the current user holds an exact role, for example hasRole('ADMIN').

ManyattaAuth.hasPermission(permission) checks a specific permission string against the current user's role.

ManyattaAuth.requireAuth(role) is a page-level guard. Call it at the top of any protected page. It redirects unauthenticated users to login.html and users with insufficient role level to unauthorized.html. If the user passes, it returns their user object.

    const user = ManyattaAuth.requireAuth('STAFF');
    // page continues only if user is Staff or Admin

ManyattaAuth.requestPasswordReset(email) generates a reset code and stores it with a 15-minute expiry.

ManyattaAuth.resetPassword(email, code, newPassword) validates the code and updates the password hash if it is correct and unexpired.

ManyattaAuth.getUsers() returns all users without password hashes. Admin permission required.

ManyattaAuth.updateUserRole(userId, newRole) changes a user's role. Admin permission required.

ManyattaAuth.deleteUser(userId) removes a user. Admin permission required. An admin cannot delete their own account.

ManyattaAuth.apiRequest(endpoint, options)** simulates an authenticated HTTP request. It attaches a Bearer token, role header, and unique request ID to every call. Useful for wiring up to a real backend.




## Security Measures

Passwords are never stored in plain text. Each password is hashed using SHA-256 via the browser's native SubtleCrypto API with a randomly generated 16-byte salt. The hash is stored as saltHex:hashHex.

Tokens follow the JWT structure of header.payload.signature and include an expiry timestamp. The verification step checks that timestamp before accepting any token.

Failed login attempts are tracked per email address in sessionStorage. After five failures the account is locked for 15 minutes. The lockout timer is visible in the error message.

Input is sanitised on registration to strip HTML characters and prevent injection through the name and phone fields.

The password field on the public user object is stripped before any user data is returned from API methods, so raw hashes never reach the UI layer.



## Connecting a Real Backend

The project is structured to make backend integration straightforward. When you are ready to replace localStorage with a real server, the key changes are in auth.js.

In the login function, replace the localStorage lookup with a POST request to your authentication endpoint. Receive the JWT from your server rather than generating it client-side.

In the register function, replace the localStorage write with a POST to your registration endpoint.

In apiRequest, the headers object is already structured correctly for real HTTP calls. Swap the simulated Promise for a real fetch call using those headers.

The rest of the site, including all role checks, permission guards, and dashboard rendering, requires no changes because they all read from ManyattaAuth.getCurrentUser() which already strips implementation details away.




## Browser Support

The system requires a browser that supports SubtleCrypto, async/await, localStorage, and the CustomEvent API. This covers all modern browsers. Internet Explorer is not supported.


---
## License

This project is part of the Manyatta Grill website. All rights reserved.
