require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Question = require('./models/Question');
const User = require('./models/User');

const questions = [
  // General Knowledge
  {
    question: 'What is the capital city of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    correctIndex: 2,
    subject: 'General Knowledge'
  },
  {
    question: 'Which is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctIndex: 3,
    subject: 'General Knowledge'
  },
  {
    question: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Claude Monet'],
    correctIndex: 1,
    subject: 'General Knowledge'
  },
  {
    question: 'Which country is known as the "Land of the Rising Sun"?',
    options: ['China', 'South Korea', 'Japan', 'Thailand'],
    correctIndex: 2,
    subject: 'General Knowledge'
  },

  // Science
  {
    question: 'What is the chemical symbol for the element Gold?',
    options: ['Ag', 'Fe', 'Au', 'Pb'],
    correctIndex: 2,
    subject: 'Science'
  },
  {
    question: 'Which organ in the human body is primarily responsible for filtering waste from blood?',
    options: ['Heart', 'Kidneys', 'Liver', 'Lungs'],
    correctIndex: 1,
    subject: 'Science'
  },
  {
    question: 'What gas do plants absorb from the atmosphere during photosynthesis?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    correctIndex: 2,
    subject: 'Science'
  },
  {
    question: 'What is the approximate speed of light in a vacuum?',
    options: ['300,000 km/s', '150,000 km/s', '30,000 km/s', '3,000,000 km/s'],
    correctIndex: 0,
    subject: 'Science'
  },

  // Math
  {
    question: 'What is the value of 2 to the power of 8 (2⁸)?',
    options: ['128', '256', '512', '1024'],
    correctIndex: 1,
    subject: 'Math'
  },
  {
    question: 'What is the square root of 144?',
    options: ['11', '12', '13', '14'],
    correctIndex: 1,
    subject: 'Math'
  },
  {
    question: 'If a triangle has two angles measuring 60° and 70°, what is the third angle?',
    options: ['40°', '50°', '60°', '70°'],
    correctIndex: 1,
    subject: 'Math'
  },
  {
    question: 'What is 15% of 200?',
    options: ['25', '30', '35', '40'],
    correctIndex: 1,
    subject: 'Math'
  },

  // Programming
  {
    question: 'Which of the following is NOT a primitive data type in JavaScript?',
    options: ['Boolean', 'String', 'Object', 'Number'],
    correctIndex: 2,
    subject: 'Programming'
  },
  {
    question: 'In React, which built-in hook is used to handle side effects in functional components?',
    options: ['useState', 'useEffect', 'useContext', 'useReducer'],
    correctIndex: 1,
    subject: 'Programming'
  },
  {
    question: 'What does the HTTP status code 404 signify?',
    options: ['Unauthorized', 'Forbidden', 'Not Found', 'Internal Server Error'],
    correctIndex: 2,
    subject: 'Programming'
  }
];

const seedDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mini-online-test';

  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Clear existing questions
    console.log('Clearing existing questions collection...');
    await Question.deleteMany({});
    console.log('Cleared existing questions.');

    // Insert 15 sample questions
    console.log(`Inserting ${questions.length} sample questions...`);
    const inserted = await Question.insertMany(questions);
    console.log(`Successfully seeded ${inserted.length} questions across subjects.`);

    // Seed a default demo user for easy testing
    console.log('Seeding default demo test user...');
    await User.deleteMany({ email: 'test@example.com' });
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      name: 'Demo Student',
      email: 'test@example.com',
      password: hashedPassword
    });
    console.log('Created demo user: test@example.com / password123');

    await mongoose.disconnect();
    console.log('MongoDB connection closed. Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error.message);
    process.exit(1);
  }
};

seedDB();
