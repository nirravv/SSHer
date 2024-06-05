# SSHer - Secure Shell Client

## Introduction

SSHer is a web-based Secure Shell (SSH) client that allows users to securely access remote servers directly from their web browser. It provides an intuitive interface for managing SSH connections and executing commands on remote servers.

## Features

- **User Registration:** Users can register an account to securely manage their SSH credentials.
- **SSH Server Management:** Users can add, edit, and delete SSH server credentials.
- **SSH Terminal:** Users can access the SSH terminal for each saved server and execute commands directly from the browser.
- **User Authentication:** User authentication is implemented using JSON Web Tokens (JWT) for secure login and session management.

## Technologies Used

- **Backend:** Express.js, MongoDB, JWT
- **Frontend:** HTML, CSS, JavaScript
- **Deployment:** Docker (optional)

## Installation and Setup

1. Clone the SSHer repository from [GitHub](https://github.com/nirravv/ssher).
    ```
    git clone https://github.com/nirravv/ssher
    ```
2. CD in to SSHer directory.
    ```
    cd SSHer
    ```
3. Install dependencies for node.
   ```
    npm install
   ```
3. Configure environment variables:
    - create .env file to main project folder
    - Set up MongoDB connection string inside that .env file.
    - Generate a random JWT secret key in .env file. To generate JWT Random String run following command in main project directory.
    ```
    node jwt-key-generate.js
    ```

4. Start the server and navigate to the application URL in your web browser.
    ```
    npm run dev
    ```

## Usage

1. Register a new account or log in with existing credentials.
2. Add SSH server credentials in the user dashboard.
3. Access the SSH terminal for each saved server and execute commands.
4. Manage SSH server credentials as needed.

## License

SSHer is open-source software released under the [MIT License](./LICENSE). Feel free to use, modify, and distribute it according to the terms of the license.

## Author

SSHer is developed and maintained by [Nirav Chaudhari](https://github.com/nirravv).

