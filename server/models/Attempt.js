const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    subject: {
      type: String,
      trim: true,
      default: 'General'
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true
        },
        selectedIndex: {
          type: Number,
          default: null
        }
      }
    ],
    score: {
      type: Number,
      required: [true, 'Score is required']
    },
    total: {
      type: Number,
      required: [true, 'Total questions count is required']
    },
    date: {
      type: Date,
      default: Date.now
    },
    details: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question'
        },
        question: {
          type: String,
          required: true
        },
        options: {
          type: [String],
          required: true
        },
        selectedIndex: {
          type: Number,
          default: null
        },
        correctIndex: {
          type: Number,
          required: true
        },
        isCorrect: {
          type: Boolean,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Attempt', attemptSchema);
