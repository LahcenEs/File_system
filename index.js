const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8000;
// Middleware to parse JSON bodies
app.use(express.json());

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb('Error: Only JPEG and PNG files are allowed!');
    }
  }
});
// Route to upload files
  app.get('/api/files', upload.single('file'), (req, res) => {
  res.send('File uploaded successfully');
});

// Route to fetch users
app.get('/api/users', async (req, res) => {
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/users');
    res.json(response.data.slice(0, 10)); // Return the first 10 users
  } catch (error) {
    res.status(500).send('Error fetching users');
  }
});

// Route to fetch posts of a specific user
app.get('/api/users/:id/posts', async (req, res) => {
  const userId = req.params.id;
  try {
    const userResponse = await axios.get(`https://jsonplaceholder.typicode.com/users/${userId}`);
    const postsResponse = await axios.get(`https://jsonplaceholder.typicode.com/posts?userId=${userId}`);
    res.json({
      user: userResponse.data,
      posts: postsResponse.data
    });
  } catch (error) {
    res.status(500).send('Error fetching user or posts');
  }
});

// Route to fetch and save posts to a file
app.post('/api/posts', async (req, res) => {
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
    const posts = response.data.slice(0, 10); // Get the first 10 posts
    fs.writeFile('inde.json', JSON.stringify(posts, null, 2), (err) => {
      if (err) throw err;
      res.send('Posts saved to data.json');
    });
  } catch (error) {
    res.status(500).send('Error fetching posts');
  }
});

// Route to read posts from the saved file
app.post('/api/posts', (req, res) => {
  fs.readFile('inde.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading data.json');
      return;
    }
    res.json(JSON.parse(data));
  });
});

// Route to get a specific post by ID
app.post('/api/posts/:postId', (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading data.json');
      return;
    }
    const posts = JSON.parse(data);
    const post = posts.find(p => p.id === postId);
    if (post) {
      res.json(post);
    } else {
      res.status(404).send('Post not found');
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
})