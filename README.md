# ai_id_photo_backend_api

Getting Started

1. Clone the repository

```bash
git clone [repository-url]
cd ai_id_photo_backend_api
```

1. Install dependencies

```bash
npm install
```

1. Start the Server

To start the server, you can use either of the following commands:

```bash
node server.js
```

or

```bash
nodemon server.js
```

1. (Optional) Access the Server If you'd like to check that the server is running, open <http://localhost:4000> in your browser or use a tool like Postman to test specific endpoints.

1. Reinstall node-fetch if encounter Error like ("response.body.pipe is not a function")

- Downgrade node-fetch to version 2.x

```bash
npm uninstall node-fetch

```

```bash
npm install node-fetch@2
```

1. Setup for DB Testing

```bash
npm install --save-dev jest
```
