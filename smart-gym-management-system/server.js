require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const planRoutes = require('./routes/planRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const fitnessProgressRoutes = require('./routes/fitnessProgressRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();


// =====================================================
// SETTINGS
// =====================================================

app.set('trust proxy', 1);


// =====================================================
// CORE MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);


// =====================================================
// SESSION
// =====================================================

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      'smartgym_secret_key',

    resave: false,

    saveUninitialized: false,

    cookie: {
      maxAge: 1000 * 60 * 60 * 8,

      secure:
        process.env.NODE_ENV === 'production',

      sameSite: 'lax'
    }
  })
);


// =====================================================
// SERVE FRONTEND
// =====================================================

app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);


// =====================================================
// API ROUTES
// =====================================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/members',
  memberRoutes
);

app.use(
  '/api/trainers',
  trainerRoutes
);

app.use(
  '/api/plans',
  planRoutes
);

app.use(
  '/api/attendance',
  attendanceRoutes
);

app.use(
  '/api/payments',
  paymentRoutes
);

app.use(
  '/api/receipts',
  receiptRoutes
);

app.use(
  '/api/equipment',
  equipmentRoutes
);

app.use(
  '/api/workouts',
  workoutRoutes
);

app.use(
  '/api/fitness-progress',
  fitnessProgressRoutes
);

app.use(
  '/api/dashboard',
  dashboardRoutes
);

app.use(
  '/api/reports',
  reportRoutes
);


// =====================================================
// UNKNOWN API ROUTES
// =====================================================

app.use(
  '/api',
  (req, res) => {

    res.status(404).json({
      success: false,
      message: 'API route not found.'
    });

  }
);


// =====================================================
// FRONTEND FALLBACK
// =====================================================

app.get(
  '*',
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        'public',
        'index.html'
      )
    );

  }
);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {

    console.error(
      'Unhandled error:',
      err
    );

    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });

  }
);


// =====================================================
// START SERVER
// =====================================================

const PORT =
  process.env.PORT || 3000;


async function startServer() {

  try {

    // Connect to MongoDB first
    await connectDB();

    console.log(
      'MongoDB connection established.'
    );


    // Start Express
    const server = app.listen(
      PORT,
      () => {

        console.log(
          `Smart Gym & Fitness Management System running on port ${PORT}`
        );

        console.log(
          `Open http://localhost:${PORT}`
        );

      }
    );


    // Server error handling
    server.on(
      'error',
      (err) => {

        console.error(
          'SERVER ERROR:',
          err
        );

      }
    );


    // Detect unexpected server shutdown
    server.on(
      'close',
      () => {

        console.log(
          'SERVER CLOSED'
        );

      }
    );


    // Keep the Node process alive
    setInterval(
      () => {},
      60 * 60 * 1000
    );


  } catch (err) {

    console.error(
      'Failed to start server:',
      err
    );

    process.exit(1);

  }

}


// Start application
startServer();
