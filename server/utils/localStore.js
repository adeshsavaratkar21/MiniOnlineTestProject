const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'local-db.json');

// 15 Sample Questions
const initialQuestions = [
  {
    _id: '64a000000000000000000001',
    question: 'What is the capital city of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    correctIndex: 2,
    subject: 'General Knowledge'
  },
  {
    _id: '64a000000000000000000002',
    question: 'Which is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctIndex: 3,
    subject: 'General Knowledge'
  },
  {
    _id: '64a000000000000000000003',
    question: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Claude Monet'],
    correctIndex: 1,
    subject: 'General Knowledge'
  },
  {
    _id: '64a000000000000000000004',
    question: 'Which country is known as the "Land of the Rising Sun"?',
    options: ['China', 'South Korea', 'Japan', 'Thailand'],
    correctIndex: 2,
    subject: 'General Knowledge'
  },
  {
    _id: '64a000000000000000000005',
    question: 'What is the chemical symbol for the element Gold?',
    options: ['Ag', 'Fe', 'Au', 'Pb'],
    correctIndex: 2,
    subject: 'Science'
  },
  {
    _id: '64a000000000000000000006',
    question: 'Which organ in the human body is primarily responsible for filtering waste from blood?',
    options: ['Heart', 'Kidneys', 'Liver', 'Lungs'],
    correctIndex: 1,
    subject: 'Science'
  },
  {
    _id: '64a000000000000000000007',
    question: 'What gas do plants absorb from the atmosphere during photosynthesis?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    correctIndex: 2,
    subject: 'Science'
  },
  {
    _id: '64a000000000000000000008',
    question: 'What is the approximate speed of light in a vacuum?',
    options: ['300,000 km/s', '150,000 km/s', '30,000 km/s', '3,000,000 km/s'],
    correctIndex: 0,
    subject: 'Science'
  },
  {
    _id: '64a000000000000000000009',
    question: 'What is the value of 2 to the power of 8 (2⁸)?',
    options: ['128', '256', '512', '1024'],
    correctIndex: 1,
    subject: 'Math'
  },
  {
    _id: '64a000000000000000000010',
    question: 'What is the square root of 144?',
    options: ['11', '12', '13', '14'],
    correctIndex: 1,
    subject: 'Math'
  },
  {
    _id: '64a000000000000000000011',
    question: 'If a triangle has two angles measuring 60° and 70°, what is the third angle?',
    options: ['40°', '50°', '60°', '70°'],
    correctIndex: 1,
    subject: 'Math'
  },
  {
    _id: '64a000000000000000000012',
    question: 'What is 15% of 200?',
    options: ['25', '30', '35', '40'],
    correctIndex: 1,
    subject: 'Math'
  },
  {
    _id: '64a000000000000000000013',
    question: 'Which of the following is NOT a primitive data type in JavaScript?',
    options: ['Boolean', 'String', 'Object', 'Number'],
    correctIndex: 2,
    subject: 'Programming'
  },
  {
    _id: '64a000000000000000000014',
    question: 'In React, which built-in hook is used to handle side effects in functional components?',
    options: ['useState', 'useEffect', 'useContext', 'useReducer'],
    correctIndex: 1,
    subject: 'Programming'
  },
  {
    _id: '64a000000000000000000015',
    question: 'What does the HTTP status code 404 signify?',
    options: ['Unauthorized', 'Forbidden', 'Not Found', 'Internal Server Error'],
    correctIndex: 2,
    subject: 'Programming'
  }
];

// Generate standard 24-character hex ID (similar to MongoDB ObjectId)
const generateId = () => crypto.randomBytes(12).toString('hex');

// Load or initialize local database file
const loadDB = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local db file:', err.message);
  }

  // Initial seed with demo user and 15 questions
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const initialData = {
    users: [
      {
        _id: '64a000000000000000000100',
        name: 'Demo Student',
        email: 'test@example.com',
        phone: '9876543210',
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    questions: initialQuestions,
    attempts: []
  };

  saveDB(initialData);
  return initialData;
};

const saveDB = (data) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local db file:', err.message);
  }
};

const localDB = {
  // Users
  findUserByEmail: (email) => {
    const db = loadDB();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserById: (id) => {
    const db = loadDB();
    const user = db.users.find((u) => u._id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  createUser: ({ name, email, phone = '', password }) => {
    const db = loadDB();
    const newUser = {
      _id: generateId(),
      name,
      email: email.toLowerCase(),
      phone: phone.trim(),
      password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDB(db);
    return newUser;
  },

  updateUser: (id, updates) => {
    const db = loadDB();
    const idx = db.users.findIndex((u) => u._id === id);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...updates, updatedAt: new Date().toISOString() };
      saveDB(db);
      return db.users[idx];
    }
    return null;
  },

  // Questions
  getQuestions: (limit = 10) => {
    const db = loadDB();
    const shuffled = [...db.questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(limit, shuffled.length));
    // Strip correctIndex so frontend cannot see answers
    return selected.map((q) => {
      const { correctIndex, ...safeQuestion } = q;
      return safeQuestion;
    });
  },

  getQuestionById: (id) => {
    const db = loadDB();
    return db.questions.find((q) => q._id === id) || null;
  },

  createQuestion: ({ question, options, correctIndex, subject }) => {
    const db = loadDB();
    const newQ = {
      _id: generateId(),
      question,
      options,
      correctIndex,
      subject
    };
    db.questions.push(newQ);
    saveDB(db);
    return newQ;
  },

  // Attempts
  createAttempt: ({ userId, answers, score, total, details }) => {
    const db = loadDB();
    const newAttempt = {
      _id: generateId(),
      user: userId,
      answers,
      score,
      total,
      date: new Date().toISOString(),
      details,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.attempts.push(newAttempt);
    saveDB(db);
    return newAttempt;
  },

  getAttemptsByUser: (userId) => {
    const db = loadDB();
    return db.attempts
      .filter((a) => a.user === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getAttemptById: (id, userId) => {
    const db = loadDB();
    return db.attempts.find((a) => a._id === id && a.user === userId) || null;
  }
};

module.exports = localDB;
