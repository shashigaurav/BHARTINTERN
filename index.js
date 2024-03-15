const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const User = require('./models/User');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware for error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Middleware for checking if user is logged in
const checkLoggedIn = (req, res, next) => {
  if (!req.cookies.user) {
    return res.render('expense', { message: 'Please login first' });
  }
  next();
};

// Middleware for validating required fields
const validateFields = (req, res, next) => {
  const { desc, amount } = req.body;
  if (!desc || !amount) {
    return res.render('expense', { message: 'Please fill all fields' });
  }
  next();
};

// Routes
app.get('/', (req, res) => res.render('index', { message: '', user: '' }));

app.get('/register', (req, res) => res.render('register', { message: 'Create your account', user: '' }));

app.get('/login', (req, res) => res.render('login', { message: 'Login with your account', user: '' }));

app.get('/expense', (req, res) => res.render('expense', { message: '', user: '' }));

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.render('register', { message: 'Please fill all fields' });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.render('register', { message: 'You are already registered.' });
    }

    await User.create({ name, email, password });

    return res.render('index', { message: 'Registered successfully', user: name });

  } catch (error) {
    console.error(error.message);
    return res.render('register', { message: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('login', { message: 'Please fill all fields' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.render('login', { message: 'You are not registered.' });
    }

    if (user.password !== password) {
      return res.render('login', { message: 'Incorrect password.' });
    }

    res.cookie('user', user._id, { maxAge: 24 * 60 * 60 * 1000 });
    return res.render('index', { message: 'Login successful', user: user.name });

  } catch (error) {
    console.error(error.message);
    return res.render('login', { message: error.message });
  }
});

app.post('/expense', checkLoggedIn, validateFields, async (req, res) => {
  try {
    const { desc, amount } = req.body;
    const user = await User.findById(req.cookies.user);

    if (!user) {
      res.cookie('user', '', { maxAge: 0 });
      return res.render('expense', { message: 'Session expired, please log in again' });
    }

    user.expenses.push({ desc, amount });
    await user.save();

    return res.render('expense', { message: 'Expense added successfully' });

  } catch (error) {
    console.error(error.message);
    return res.render('expense', { message: error.message });
  }
});

app.get('/expenses', checkLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.cookies.user);
    if (!user) {
      res.cookie('user', '', { maxAge: 0 });
      return res.render('expense', { message: 'Session expired, please log in again' });
    }
    res.json([...user.expenses]);
  } catch (error) {
    console.error(error.message);
    return res.render('expense', { message: error.message });
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('DB Connected Successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error(error.message);
    process.exit(1);
  });
