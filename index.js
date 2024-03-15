const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const User = require('./models/User.js');
const cookieParser = require('cookie-parser');
const { default: mongoose } = require('mongoose');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())



app.get('/', (req, res) => {
  return res.render('index', { message: "", user: '' });
});

app.get('/register', (req, res) => {
  return res.render('register', { message: "Create your Account", user: '' });
});
app.get('/login', (req, res) => {
  return res.render('login', { message: "Login with your Account", user: '' });
});

app.get('/expense', (req, res) => {
  return res.render('expense', { message: '', user: '' });
});


app.post('/register', async (req, res) => {

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.render('register', {
        message: "Please Fill all Fields"
      })
    }
    const user = await User.findOne({ email });

    if (user)
      return res.render('register', {
        message: "You are Already registered."
      })

    await User.create({ name, email, password });

    let message = "Registred Successfully";

    return res.render('index', {
      message,
      user: name
    })

  } catch (error) {
    console.error(error.message);
    return res.render('register', {
      message: error.message
    })
  }
})


app.post('/login', async (req, res) => {

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('login', {
        message: "Please Fill all Fields"
      })
    }

    const user = await User.findOne({ email });

    if (!user)
      return res.render('login', {
        message: "You are Not registered."
      })

    if (user.password !== password)
      return res.render('login', {
        message: "Incorrect Password."
      })

    res.cookie('user', user._id, { maxAge: 24 * 60 * 60 * 1000 });
    return res.render('index', {
      message: "Login Successfully",
      user: user.name
    })


  } catch (error) {
    // return res.render('register', {
    //   message: error.message
    // })
    console.error(error.message);
  }
})

app.post('/expense', async (req, res) => {
  try {

    if (!req.cookies.user) {
      return res.render('expense', { message: "Please Login first" })
    }

    const { desc, amount } = req.body;
    if (!desc || !amount) {
      return res.render('expense', { message: "Please fill all feilds" });
    }
    const user = await User.findById(req.cookies.user);

    if (!user) {
      res.cookie('user', '', { maxAge: 0 });
      return res.render('expense', { message: "Session Expired, Please Login in again" });
    }
    console.log(user);
    user.expenses.push({ desc, amount });

    await user.save();
    res.render('expense', { message: "Expense Added Successfully" })
  } catch (error) {
    return res.render('expense', { message: error.message })
  }
})


app.get('/expenses', async (req, res) => {
  try {

    if (!req.cookies.user) {
      return res.render('expense', { message: "Please Login first" })
    }

    const user = await User.findById(req.cookies.user);

    if (!user) {
      res.cookie('user', '', { maxAge: 0 });
      return res.render('expense', { message: "Session Expired, Please Login in again" });
    }
    res.json([...user.expenses]);
  } catch (error) {
    return res.render('expense', { message: error.message })
  }
})




app.listen(PORT, async () => {

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB Connected Successfully');
  } catch (error) {
    console.log(error.message);
  }

  console.log(`Server is Running http://localhost:${PORT}`);
})