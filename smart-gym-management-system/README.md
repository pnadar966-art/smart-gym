# Smart Gym & Fitness Management System

## 1. Project Overview

Smart Gym & Fitness Management System is a full-stack web application that
replaces manual gym record-keeping with a centralized digital platform. It
goes beyond basic record storage by supporting a **complete practical
workflow**: a member joins, gets assigned a trainer and a workout plan,
their fitness progress (weight, BMI, body measurements) is tracked over
time, their attendance and payments are recorded, and the gym owner gets a
real-time dashboard with charts, expiry alerts, and equipment maintenance
warnings.

## 2. Problem Statement

Small and medium gyms typically track members, payments, and attendance
using registers or spreadsheets. This causes:
- Difficulty tracking membership expiry dates, leading to lost renewals
- No visibility into member fitness progress or trainer workload
- No early warning when gym equipment needs maintenance
- Manual, error-prone report generation
- No centralized, searchable record of members, payments, or attendance

## 3. Objectives

- Digitize member, trainer, membership, attendance, payment, and equipment records
- Track member fitness progress (weight, BMI, body measurements) over time
- Let trainers assign structured workout plans to members
- Automatically flag memberships expiring soon and equipment needing maintenance
- Provide a visual, chart-driven admin dashboard backed by live MongoDB data
- Generate printable receipts and reports without any manual paperwork

## 4. Features

- Secure admin login (bcrypt password hashing + server-side sessions)
- Dashboard with 4 Chart.js visualizations (membership growth, revenue,
  attendance trend, plan distribution) plus expiry/maintenance alert cards
- Member management with profile photos, BMI auto-calculation, fitness
  goals, and a dedicated Member Profile page (progress chart, workout
  plans, attendance %)
- Trainer management with assigned-members and active-workout-plan view
- Membership plans displayed as attractive feature cards
- Attendance check-in/check-out with per-member attendance percentage
- Payment recording (Cash/UPI/Card/Bank Transfer — no online gateway) with
  automatic transaction ID + receipt number generation
- Printable, professional payment receipts
- Workout plan builder with exercises (sets, reps, rest, images by target muscle)
- Fitness progress logging with a weight-trend line chart per member
- Equipment management with images, condition, and maintenance scheduling
- 9 report types (Members, Trainers, Membership, Attendance, Payments,
  Revenue, Equipment, Maintenance, Fitness Progress) with filters, print,
  and CSV export

## 5. Technologies

**Frontend:** HTML5, CSS3, Bootstrap 5, Vanilla JavaScript, Bootstrap
Icons, Chart.js
**Backend:** Node.js, Express.js
**Database:** MongoDB with Mongoose (MongoDB Atlas for production)
**Auth:** express-session + bcryptjs password hashing
**Deployment:** Render (app) + MongoDB Atlas (database)

## 6. Folder Structure

```
smart-gym-management-system/
├── config/db.js                 MongoDB connection (Atlas-ready)
├── controllers/                 Business logic for every module
├── middleware/authMiddleware.js Session-based admin-only guard
├── models/                      9 Mongoose schemas
├── routes/                      REST API route definitions
├── seed/seed.js                 Realistic demo data generator
├── public/                      Frontend (static, served by Express)
│   ├── index.html, dashboard.html, members.html, member-profile.html,
│   │   trainers.html, plans.html, attendance.html, payments.html,
│   │   receipt.html, workouts.html, progress.html, equipment.html, reports.html
│   ├── images/README.md         Explains the image strategy used
│   ├── css/style.css
│   └── js/                      One file per page + shared api.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## 7. Installation

```bash
npm install
```

## 8. MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a new **free (M0) cluster**.
3. Under **Database Access**, create a database user with a username and password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) — required for Render to connect.
5. Click **Connect > Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add your database name before the `?`, e.g. `.../smart_gym?retryWrites=true...`

## 9. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in:

```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smart_gym?retryWrites=true&w=majority
PORT=3000
SESSION_SECRET=some_long_random_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
NODE_ENV=development
```

**Never commit `.env` to GitHub** — it's already in `.gitignore`.

## 10. Seed Demo Data

```bash
npm run seed
```

This creates: 1 admin, 5 membership plans, 5 trainers, 10 members, 20+
attendance records, 10 payments (with receipts), 10 equipment items, 5
workout plans, and 20+ fitness progress records — enough for the
dashboard to look populated immediately.

## 11. Running Locally

```bash
npm start
```

Open **http://localhost:3000** — it shows the login page.

Login with:
```
Username: admin
Password: admin123
```
(or whatever you set in `.env`)

## 12. GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit - Smart Gym Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Because `.env` is git-ignored, your real MongoDB credentials never reach GitHub.

## 13. Render Deployment

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New > Web Service** and select your repository.
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Runtime:** Node
4. Add the environment variables from step 9 under **Environment** (Render's dashboard, not a file):
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`
   - (Leave `PORT` unset — Render provides it automatically via `process.env.PORT`, which `server.js` already uses.)
5. Click **Create Web Service**. Render will build and deploy automatically.

## 14. Production Environment Variables (Render Dashboard)

| Key | Value |
|---|---|
| MONGODB_URI | Your Atlas connection string |
| SESSION_SECRET | A long random string |
| ADMIN_USERNAME | admin (or your choice) |
| ADMIN_PASSWORD | A secure password |
| NODE_ENV | production |

## 15. How to Obtain the Public URL

After deployment finishes, Render shows a URL like:

```
https://smart-gym-management-system.onrender.com
```

This is your **public website link** — share it with your teacher instead
of `localhost:3000`. Before demonstrating, run the seed script once against
your Atlas database (locally, pointed at the same `MONGODB_URI` you gave
Render) so the live site has demo data:

```bash
npm run seed
```

## 16. Default Admin Login

```
Username: admin
Password: admin123
```

## 17. How to Demonstrate the Project

Suggested walkthrough for your teacher:

1. **Login** with the admin credentials.
2. **Dashboard** — point out the live charts (membership growth, revenue,
   attendance trend, plan distribution) and the expiry/maintenance alert cards.
3. **Members** — open a member's profile to show photo, BMI calculator,
   fitness goal, and membership status.
4. **Member Profile** — show the weight-trend chart and assigned workout plans.
5. **Trainers** — open a trainer profile to show their assigned members.
6. **Workout Plans** — open a plan to show exercises with images, sets/reps.
7. **Fitness Progress** — log a new weight entry and watch the chart update.
8. **Attendance** — check a member in, then check them out.
9. **Membership Plans** — show the plan cards with features.
10. **Payments** — record a payment (Cash/UPI/Card/Bank Transfer).
11. **Receipt** — show the auto-generated receipt and click Print.
12. **Equipment** — show equipment cards with images and maintenance dates.
13. **Reports** — run a couple of reports, filter by date, export CSV, print.
14. Open **MongoDB Atlas** (or Compass connected to Atlas) to show the data
    is really stored in the cloud database, not just in the browser.
