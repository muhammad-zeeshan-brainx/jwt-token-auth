require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { response } = require('express');

const app = express();

app.use(express.json());

const users = [
  { username: 'zeeshan', password: 'password' },
  { username: 'usama', password: 'password' },
];

const posts = [
  { username: 'zeeshan', title: 'post1' },
  { username: 'usama', title: 'post2' },
  { username: 'zeeshan', title: 'post3' },
];

app.get('/posts', authenticateToken, (req, res) => {
  res
    .status(200)
    .send(posts.filter((post) => post.username === req.user.username));
});

app.post('/posts', authenticateToken, (req, res) => {
  const post = {
    username: req.user.username,
    title: req.body.title,
  };
  posts.push(post);
  res.status(200).send('posts created succesfully');
});

app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/signup', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = {
      username: req.body.username,
      password: hashedPassword,
    };

    users.push(user);
    res.status(201).send('successfully created user');
  } catch (error) {
    res.status(500).send('error occured');
  }
});

app.post('/login', async (req, res) => {
  const user = users.find((user) => user.username === req.body.username);
  if (user === null) {
    return res.status(400).send('incorrect username');
  }

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const authenticatedUser = { username: user.username };
      const accessToken = jwt.sign(
        authenticatedUser,
        process.env.ACCESS_TOKEN_SECRET
      );

      res.json({ accesstoken: accessToken });
    } else res.status(500).send('incorrect password');
  } catch (error) {
    res.status(500).send('error while loging in');
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).send('no auth header found');

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    console.log(user);
    if (err) return response.status(403).send('token is invalid or exipred');
    req.user = user;
    next();
  });
}

app.listen(3000);
