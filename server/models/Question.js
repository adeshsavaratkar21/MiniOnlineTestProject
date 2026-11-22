const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length === 4 && val.every((opt) => typeof opt === 'string' && opt.trim().length > 0);
        },
        message: 'A question must have exactly 4 non-empty options'
      }
    },
    correctIndex: {
      type: Number,
      required: [true, 'Correct option index is required'],
      min: [0, 'Correct index must be between 0 and 3'],
      max: [3, 'Correct index must be between 0 and 3']
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Question', questionSchema);
