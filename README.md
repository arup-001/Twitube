# Twitube
Twitube is a backend service for a video application that combines features inspired by YouTube and social media.
Built with Node.js and Express, it offers a scalable solution for managing and streaming video content, secure user authentication, and cloud media storage.

## Features
- **User Authentication:** Secure login and registration using JWT and bcrypt.
- **Video Management:** Upload, stream, and manage video content.
- **Cloud Storage Integration:** Easily store media assets using Cloudinary.
- **Efficient Data Handling:** Fast and scalable data operations with MongoDB and Mongoose.
- **File Uploads:** Robust file handling powered by Multer.
- **Environment Configuration:** Seamless setup using dotenv for managing sensitive credentials.

## Technologies Used
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB & Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)
- [Cloudinary](https://cloudinary.com/)
- [Multer](https://github.com/expressjs/multer)
- [Bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- [Nodemon](https://nodemon.io/)
- [Prettier](https://prettier.io/)

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/arup-001/Twitube.git
   cd Twitube
   ```
   
2. Install the Dependencies:
   ```bash
   npm install
   ```
   
3. Set up environment variables:
  - **Create a `.env` file** in the root directory of your project.
  - **Add the following variables** to the `.env` file:
     ```env
     PORT=your_choice
     MONGODB_URI=your_mongodb_uri
     CORS_ORIGIN=your_choice
     ACCESS_TOKEN_SECRET=your_choice
     ACCESS_TOKEN_EXPIRY=your_choice
     REFRESH_TOKEN_SECRET=your_choice
     REFRESH_TOKEN_EXPIRY=your_choice
     CLOUDINARY_CLOUD_NAME=your_choice
     CLOUDINARY_API_KEY=your_choice
     CLOUDINARY_API_SECRET=your_choice
    ```

## Running the Application
  ```bash
    npm run dev
  ```

## Project Structure
```
Twitube/
├── public/
│   └── temp/           # Temporary public assets (if any)
├── src/                # Source code for the application
│   ├── index.js        # Main entry point of the application
│   └── ...             # Additional modules and route handlers
├── .gitignore          # Specifies intentionally untracked files to ignore
├── .prettierignore     # Files and directories to ignore for code formatting
├── .prettierrc         # Prettier configuration
├── package.json        # Project metadata and dependencies
└── README.md           # This file
```

## Author
[Arup Ganguly](https://github.com/arup-001)

Inspired by [Hitesh Choudhary](https://github.com/hiteshchoudhary/chai-backend)
