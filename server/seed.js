require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Question = require('./models/Question');
const User = require('./models/User');

const cbse10Questions = [
  // ==========================================
  // MATHEMATICS (Class 10 CBSE)
  // ==========================================
  {
    question: 'If two positive integers a and b are written as a = x³ y² and b = x y³, where x, y are prime numbers, then HCF(a, b) is:',
    options: ['xy', 'xy²', 'x³y³', 'x²y²'],
    correctIndex: 1,
    subject: 'Mathematics',
    chapter: 'Real Numbers'
  },
  {
    question: 'The zeroes of the quadratic polynomial x² + 7x + 10 are:',
    options: ['-2 and -5', '2 and 5', '-2 and 5', '2 and -5'],
    correctIndex: 0,
    subject: 'Mathematics',
    chapter: 'Polynomials'
  },
  {
    question: 'For what value of k do the linear equations 2x + 3y = 7 and (k-1)x + (k+2)y = 3k have infinitely many solutions?',
    options: ['k = 5', 'k = 7', 'k = 3', 'k = 9'],
    correctIndex: 1,
    subject: 'Mathematics',
    chapter: 'Linear Equations'
  },
  {
    question: 'The discriminant of the quadratic equation 2x² - 4x + 3 = 0 is:',
    options: ['-8', '8', '16', '-16'],
    correctIndex: 0,
    subject: 'Mathematics',
    chapter: 'Quadratic Equations'
  },
  {
    question: 'Which term of the Arithmetic Progression (AP): 21, 18, 15, ... is -81?',
    options: ['28th term', '35th term', '34th term', '30th term'],
    correctIndex: 1,
    subject: 'Mathematics',
    chapter: 'Arithmetic Progressions'
  },
  {
    question: 'The distance between the points P(2, 3) and Q(4, 1) is:',
    options: ['2√2 units', '4 units', '2 units', '8 units'],
    correctIndex: 0,
    subject: 'Mathematics',
    chapter: 'Coordinate Geometry'
  },
  {
    question: 'If sin θ + cos θ = √2 cos θ, then the value of (cos θ - sin θ) is:',
    options: ['√2 sin θ', '√2 cos θ', '2 sin θ', 'sin θ'],
    correctIndex: 0,
    subject: 'Mathematics',
    chapter: 'Introduction to Trigonometry'
  },
  {
    question: 'The empirical relationship between the three measures of central tendency is:',
    options: ['3 Median = Mode + 2 Mean', 'Mode = 3 Mean - 2 Median', 'Mean = 3 Median - 2 Mode', '3 Mode = Median + 2 Mean'],
    correctIndex: 0,
    subject: 'Mathematics',
    chapter: 'Statistics'
  },
  {
    question: 'A bag contains 3 red balls and 5 black balls. A ball is drawn at random. What is the probability of getting a red ball?',
    options: ['3/8', '5/8', '3/5', '1/2'],
    correctIndex: 0,
    subject: 'Mathematics',
    chapter: 'Probability'
  },
  {
    question: 'If the perimeter and area of a circle are numerically equal, then the radius of the circle is:',
    options: ['2 units', 'π units', '4 units', '7 units'],
    correctIndex: 0,
    subject: 'Mathematics',
    chapter: 'Areas Related to Circles'
  },

  // ==========================================
  // SCIENCE (Class 10 CBSE)
  // ==========================================
  {
    question: 'In the reaction CuO + H₂ → Cu + H₂O, which substance undergoes reduction?',
    options: ['CuO', 'H₂', 'Cu', 'H₂O'],
    correctIndex: 0,
    subject: 'Science',
    chapter: 'Chemical Reactions'
  },
  {
    question: 'What is the chemical formula of Plaster of Paris?',
    options: ['CaSO₄ · ½ H₂O', 'CaSO₄ · 2 H₂O', 'CaSO₄ · 5 H₂O', 'CaSO₄ · 10 H₂O'],
    correctIndex: 0,
    subject: 'Science',
    chapter: 'Acids, Bases and Salts'
  },
  {
    question: 'Which of the following metals exists as a liquid at room temperature?',
    options: ['Mercury (Hg)', 'Bromine (Br)', 'Gallium (Ga)', 'Cesium (Cs)'],
    correctIndex: 0,
    subject: 'Science',
    chapter: 'Metals and Non-metals'
  },
  {
    question: 'The functional unit of the human kidney responsible for filtration is called:',
    options: ['Nephron', 'Neuron', 'Alveoli', 'Glomerulus'],
    correctIndex: 0,
    subject: 'Science',
    chapter: 'Life Processes'
  },
  {
    question: 'The breakdown of pyruvate to give carbon dioxide, water, and energy takes place in:',
    options: ['Mitochondria', 'Cytoplasm', 'Chloroplast', 'Nucleus'],
    correctIndex: 0,
    subject: 'Science',
    chapter: 'Respiration & Energy'
  },
  {
    question: 'An object is placed at the center of curvature (C) of a concave mirror. The image formed will be:',
    options: ['At C, real and inverted, of same size', 'Between F and C, virtual', 'Behind mirror, magnified', 'At focus F, diminished'],
    correctIndex: 0,
    subject: 'Science',
    chapter: 'Light - Reflection & Refraction'
  },
  {
    question: 'The SI unit of electrical resistivity (ρ) is:',
    options: ['Ohm-meter (Ω·m)', 'Ohm (Ω)', 'Ohm/meter', 'Ampere-meter'],
    correctIndex: 0,
    subject: 'Science',
    chapter: 'Electricity'
  },
  {
    question: 'According to Ohm\'s Law, the graph between potential difference (V) and current (I) is:',
    options: ['A straight line passing through the origin', 'A parabola', 'A hyperbola', 'A horizontal line'],
    correctIndex: 0,
    subject: 'Science',
    chapter: 'Electricity'
  },
  {
    question: 'A cross between a tall pea plant (TT) and a short pea plant (tt) resulted in F1 progeny that were:',
    options: ['All tall plants', 'All short plants', 'Half tall, half short', 'Medium height plants'],
    correctIndex: 0,
    subject: 'Science',
    chapter: 'Heredity and Evolution'
  },
  {
    question: 'Which atmospheric layer gas protects the Earth from harmful ultraviolet (UV) radiation emitted by the Sun?',
    options: ['Ozone (O₃)', 'Oxygen (O₂)', 'Nitrogen (N₂)', 'Carbon Dioxide (CO₂)'],
    correctIndex: 0,
    subject: 'Science',
    chapter: 'Our Environment'
  },

  // ==========================================
  // SOCIAL SCIENCE (Class 10 CBSE)
  // ==========================================
  {
    question: 'Who was described by Duke Metternich as "the most dangerous enemy of our social order"?',
    options: ['Giuseppe Mazzini', 'Napoleon Bonaparte', 'Otto von Bismarck', 'Giuseppe Garibaldi'],
    correctIndex: 0,
    subject: 'Social Science',
    chapter: 'Nationalism in Europe'
  },
  {
    question: 'The infamous Jallianwala Bagh massacre in Amritsar took place on:',
    options: ['13 April 1919', '10 March 1919', '15 August 1920', '26 January 1930'],
    correctIndex: 0,
    subject: 'Social Science',
    chapter: 'Nationalism in India'
  },
  {
    question: 'In which year was the historic Dandi Salt March initiated by Mahatma Gandhi?',
    options: ['1930', '1920', '1928', '1942'],
    correctIndex: 0,
    subject: 'Social Science',
    chapter: 'Nationalism in India'
  },
  {
    question: 'Black soil, extensively ideal for cotton cultivation in the Deccan trap, is also known as:',
    options: ['Regur soil', 'Laterite soil', 'Alluvial soil', 'Red soil'],
    correctIndex: 0,
    subject: 'Social Science',
    chapter: 'Resources and Development'
  },
  {
    question: 'Which country adopted Majoritarianism in its constitution leading to civil alienation?',
    options: ['Sri Lanka', 'Belgium', 'Nepal', 'India'],
    correctIndex: 0,
    subject: 'Social Science',
    chapter: 'Power Sharing'
  },
  {
    question: 'In Indian federalism, subjects like Defense, Foreign Affairs, and Currency are under the:',
    options: ['Union List', 'State List', 'Concurrent List', 'Residuary Subjects'],
    correctIndex: 0,
    subject: 'Social Science',
    chapter: 'Federalism'
  },
  {
    question: 'Which sector contributes the largest share to India\'s Gross Domestic Product (GDP)?',
    options: ['Tertiary (Services) Sector', 'Primary (Agriculture) Sector', 'Secondary (Manufacturing) Sector', 'Quaternary Sector'],
    correctIndex: 0,
    subject: 'Social Science',
    chapter: 'Sectors of Indian Economy'
  },
  {
    question: 'The institution that issues currency notes in India on behalf of the Central Government is:',
    options: ['Reserve Bank of India (RBI)', 'State Bank of India (SBI)', 'Ministry of Finance', 'NITI Aayog'],
    correctIndex: 0,
    subject: 'Social Science',
    chapter: 'Money and Credit'
  },
  {
    question: 'When more people are working in an agricultural field than is strictly required, it is known as:',
    options: ['Disguised unemployment', 'Seasonal unemployment', 'Frictional unemployment', 'Structural unemployment'],
    correctIndex: 0,
    subject: 'Social Science',
    chapter: 'Sectors of Indian Economy'
  },
  {
    question: 'Removal of barriers or restrictions set by the government on foreign trade and investment is called:',
    options: ['Liberalization', 'Privatization', 'Nationalization', 'Socialization'],
    correctIndex: 0,
    subject: 'Social Science',
    chapter: 'Globalization'
  },

  // ==========================================
  // ENGLISH (Class 10 CBSE)
  // ==========================================
  {
    question: 'Identify the correct modal: "We _______ obey all traffic regulations to prevent accidents on roads."',
    options: ['must', 'might', 'can', 'may'],
    correctIndex: 0,
    subject: 'English',
    chapter: 'Modals'
  },
  {
    question: 'Fill in the blank with the correct verb form: "Neither of the two candidates _______ selected for the post."',
    options: ['was', 'were', 'have been', 'are'],
    correctIndex: 0,
    subject: 'English',
    chapter: 'Subject-Verb Concord'
  },
  {
    question: 'Convert to indirect speech: The student said, "I have completed my science project."',
    options: [
      'The student said that he had completed his science project.',
      'The student said that he completed his science project.',
      'The student told that he has completed his project.',
      'The student said he completes his science project.'
    ],
    correctIndex: 0,
    subject: 'English',
    chapter: 'Reported Speech'
  },
  {
    question: 'Complete the conditional sentence: "If it rains tomorrow, we _______ the outdoor sports festival."',
    options: ['will cancel', 'would cancel', 'cancelled', 'have cancelled'],
    correctIndex: 0,
    subject: 'English',
    chapter: 'Conditionals'
  },
  {
    question: 'Choose the correct determiner: "There is _______ drinking water left in the pitcher to fill two glasses."',
    options: ['enough', 'many', 'few', 'each'],
    correctIndex: 0,
    subject: 'English',
    chapter: 'Determiners'
  },
  {
    question: 'In the story "A Letter to God", the postmaster is described as an "amiable" person. What does "amiable" mean?',
    options: ['Friendly and pleasant', 'Aggressive and strict', 'Greedy and selfish', 'Timid and quiet'],
    correctIndex: 0,
    subject: 'English',
    chapter: 'A Letter to God'
  },
  {
    question: 'In Robert Frost\'s poem "Fire and Ice", what does "Ice" symbolize?',
    options: ['Hatred and cold indifference', 'Desire and boundless greed', 'Love and serenity', 'Knowledge and wisdom'],
    correctIndex: 0,
    subject: 'English',
    chapter: 'Poetry - Robert Frost'
  },
  {
    question: 'Identify the tense in: "By the end of next month, the class will have finished the entire syllabus."',
    options: ['Future Perfect Tense', 'Future Continuous Tense', 'Simple Future Tense', 'Present Perfect Tense'],
    correctIndex: 0,
    subject: 'English',
    chapter: 'Tenses'
  },
  {
    question: '"The old oak tree stood like a silent sentinel through the storm." Which poetic device is used?',
    options: ['Simile', 'Metaphor', 'Alliteration', 'Hyperbole'],
    correctIndex: 0,
    subject: 'English',
    chapter: 'Poetic Devices'
  },
  {
    question: 'Choose the grammatically correct sentence:',
    options: [
      'Each of the participants was given a certificate of appreciation.',
      'Each of the participants were given a certificate of appreciation.',
      'Each of the participant was given certificate of appreciation.',
      'Each of the participants have been given certificate.'
    ],
    correctIndex: 0,
    subject: 'English',
    chapter: 'Grammar & Concord'
  },

  // ==========================================
  // INFORMATION TECHNOLOGY (IT 402 - Class 10 CBSE)
  // ==========================================
  {
    question: 'In word processors (e.g., LibreOffice Writer), which feature is used to send customized letters to multiple recipients?',
    options: ['Mail Merge', 'Track Changes', 'Goal Seek', 'Macro Recorder'],
    correctIndex: 0,
    subject: 'Information Technology',
    chapter: 'Digital Documentation'
  },
  {
    question: 'Which spreadsheet feature is used to calculate the backward input value required to produce a specific target result?',
    options: ['Goal Seek', 'Subtotals', 'Consolidation', 'Conditional Formatting'],
    correctIndex: 0,
    subject: 'Information Technology',
    chapter: 'Electronic Spreadsheet'
  },
  {
    question: 'In a Relational Database Management System (RDBMS), a unique attribute that uniquely identifies each record is the:',
    options: ['Primary Key', 'Foreign Key', 'Composite Key', 'Candidate Key'],
    correctIndex: 0,
    subject: 'Information Technology',
    chapter: 'Database Management'
  },
  {
    question: 'Which SQL command is used to extract and display records from one or more database tables?',
    options: ['SELECT', 'EXTRACT', 'RETRIEVE', 'FIND'],
    correctIndex: 0,
    subject: 'Information Technology',
    chapter: 'SQL & Databases'
  },
  {
    question: 'Which type of computer network covers a localized geographical area such as a school building, office, or computer lab?',
    options: ['LAN (Local Area Network)', 'WAN (Wide Area Network)', 'MAN (Metropolitan Area Network)', 'PAN (Personal Area Network)'],
    correctIndex: 0,
    subject: 'Information Technology',
    chapter: 'Computer Networks'
  },
  {
    question: 'What does the abbreviation URL stand for in networking?',
    options: ['Uniform Resource Locator', 'Universal Resource Link', 'Uniform Reference Locator', 'United Resource Link'],
    correctIndex: 0,
    subject: 'Information Technology',
    chapter: 'Internet Fundamentals'
  },
  {
    question: 'A cyber threat where attackers mimic trustworthy entities to manipulate users into sharing sensitive passwords or cards is:',
    options: ['Phishing', 'Spamming', 'Spoofing', 'Adware'],
    correctIndex: 0,
    subject: 'Information Technology',
    chapter: 'Cyber Safety & Security'
  },
  {
    question: 'In relational database terminology, a single row in a table representing a complete entity record is called a:',
    options: ['Tuple or Record', 'Attribute or Field', 'Schema', 'Domain'],
    correctIndex: 0,
    subject: 'Information Technology',
    chapter: 'Database Management'
  },
  {
    question: 'The discipline of designing tools and workspaces to minimize physical strain, posture fatigue, and repetitive injury is:',
    options: ['Ergonomics', 'Economics', 'Cybernetics', 'Biomechanics'],
    correctIndex: 0,
    subject: 'Information Technology',
    chapter: 'Workplace Safety & Health'
  },
  {
    question: 'Which network protocol provides end-to-end encrypted and authenticated web communication indicated by a padlock in browsers?',
    options: ['HTTPS', 'HTTP', 'FTP', 'Telnet'],
    correctIndex: 0,
    subject: 'Information Technology',
    chapter: 'Network Security'
  }
];

const seedDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mini-online-test';

  try {
    console.log('Connecting to MongoDB for seeding Class 10 CBSE question bank...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Clear existing questions
    console.log('Clearing existing questions collection...');
    await Question.deleteMany({});
    console.log('Cleared existing questions.');

    // Insert 50 Class 10 CBSE sample questions
    console.log(`Inserting ${cbse10Questions.length} Class 10 CBSE questions...`);
    const inserted = await Question.insertMany(cbse10Questions);
    console.log(`Successfully seeded ${inserted.length} questions across 5 CBSE 10th subjects.`);

    // Seed default demo examinee user
    console.log('Seeding default demo examinee user...');
    await User.deleteMany({ email: 'test@example.com' });
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      name: 'Demo Student',
      email: 'test@example.com',
      phone: '9876543210',
      role: 'student',
      password: hashedPassword
    });
    console.log('Created demo user: test@example.com / password123 (role: student)');

    // Seed default admin user
    console.log('Seeding default administrator user...');
    await User.deleteMany({ email: 'admin@example.com' });
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '9999999999',
      role: 'admin',
      password: hashedAdminPassword
    });
    console.log('Created admin user: admin@example.com / admin123 (role: admin)');

    await mongoose.disconnect();
    console.log('MongoDB connection closed. Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error.message);
    process.exit(1);
  }
};

seedDB();
