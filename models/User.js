const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter your Name."],
  },
  email: {
    type: String,
    required: [true, "Please Enter your email."],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please Enter your Password."],
  },
  expenses: [
    {
      desc: {
        type: String,
        required: [true, "Please Enter Description."],
      },
      amount: {
        type: String,
        required: [true, "Please Enter Amount."],
      },
    }
  ]
});

const User = mongoose.models.user || mongoose.model("user", Schema);

module.exports = User;
