require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('../models/Admin');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const MembershipPlan = require('../models/MembershipPlan');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Equipment = require('../models/Equipment');
const WorkoutPlan = require('../models/WorkoutPlan');
const FitnessProgress = require('../models/FitnessProgress');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function avatarUrl(name, bg) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=256`;
}

async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('ERROR: MONGODB_URI is not defined in your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding.');

    console.log('Clearing existing data...');
    await Promise.all([
      Admin.deleteMany({}),
      Member.deleteMany({}),
      Trainer.deleteMany({}),
      MembershipPlan.deleteMany({}),
      Attendance.deleteMany({}),
      Payment.deleteMany({}),
      Equipment.deleteMany({}),
      WorkoutPlan.deleteMany({}),
      FitnessProgress.deleteMany({})
    ]);

    // 1. Admin
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await Admin.create({ username: adminUsername, password: hashedPassword });
    console.log(`Admin created -> username: ${adminUsername} / password: ${adminPassword}`);

    // 2. Membership Plans (5)
    const plans = await MembershipPlan.insertMany([
      { planName: 'Monthly', duration: '1 Month', price: 1500, description: 'Great for trying us out', features: ['Full gym access', 'Locker facility', 'Free fitness assessment'], status: 'Active' },
      { planName: 'Quarterly', duration: '3 Months', price: 4000, description: 'Best for building a routine', features: ['Full gym access', 'Group classes', 'Locker facility', 'Diet guidance'], status: 'Active' },
      { planName: 'Half-Yearly', duration: '6 Months', price: 7500, description: 'Popular choice for serious members', features: ['Full gym access', 'Group classes', '2 free personal training sessions', 'Diet guidance'], status: 'Active' },
      { planName: 'Yearly', duration: '12 Months', price: 14000, description: 'Best value - complete fitness journey', features: ['Full gym access', 'Personal training', 'Custom diet plan', 'Free merchandise', 'Priority booking'], status: 'Active' },
      { planName: 'Student Plan', duration: '1 Month', price: 999, description: 'Discounted plan for students (ID required)', features: ['Full gym access', 'Off-peak hours only'], status: 'Active' }
    ]);
    console.log(`${plans.length} membership plans created.`);

    // 3. Trainers (5)
    const trainers = await Trainer.insertMany([
      { name: 'Rajesh Kumar', photoUrl: avatarUrl('Rajesh Kumar', '1e3a5f'), email: 'rajesh.kumar@smartgym.com', phone: '9876543210', gender: 'Male', specialization: 'Strength Training', experience: 6, joiningDate: daysAgo(400), salary: 35000, status: 'Active' },
      { name: 'Priya Sharma', photoUrl: avatarUrl('Priya Sharma', 'c05621'), email: 'priya.sharma@smartgym.com', phone: '9876543211', gender: 'Female', specialization: 'Yoga & Flexibility', experience: 4, joiningDate: daysAgo(300), salary: 28000, status: 'Active' },
      { name: 'Amit Verma', photoUrl: avatarUrl('Amit Verma', '2f855a'), email: 'amit.verma@smartgym.com', phone: '9876543212', gender: 'Male', specialization: 'Cardio & Weight Loss', experience: 5, joiningDate: daysAgo(250), salary: 30000, status: 'Active' },
      { name: 'Sneha Reddy', photoUrl: avatarUrl('Sneha Reddy', '805ad5'), email: 'sneha.reddy@smartgym.com', phone: '9876543213', gender: 'Female', specialization: 'CrossFit & Functional Training', experience: 3, joiningDate: daysAgo(180), salary: 26000, status: 'Active' },
      { name: 'Vikas Nair', photoUrl: avatarUrl('Vikas Nair', 'c53030'), email: 'vikas.nair@smartgym.com', phone: '9876543214', gender: 'Male', specialization: 'Bodybuilding', experience: 8, joiningDate: daysAgo(500), salary: 40000, status: 'Active' }
    ]);
    console.log(`${trainers.length} trainers created.`);

    // 4. Members (10)
    const memberDefs = [
      { fullName: 'Rohit Sharma', gender: 'Male', dob: '1995-03-14', address: 'Andheri, Mumbai', plan: 3, trainer: 0, weight: 76, height: 178, goal: 'Muscle Gain', status: 'Active', join: 90, endOffset: 275 },
      { fullName: 'Ananya Iyer', gender: 'Female', dob: '1998-07-22', address: 'Bandra, Mumbai', plan: 1, trainer: 1, weight: 62, height: 162, goal: 'General Fitness', status: 'Active', join: 60, endOffset: 30 },
      { fullName: 'Karan Mehta', gender: 'Male', dob: '1992-11-05', address: 'Powai, Mumbai', plan: 0, trainer: 2, weight: 88, height: 174, goal: 'Weight Loss', status: 'Expired', join: 45, endOffset: -15 },
      { fullName: 'Divya Nambiar', gender: 'Female', dob: '2000-01-30', address: 'Dadar, Mumbai', plan: 2, trainer: 1, weight: 58, height: 160, goal: 'Weight Loss', status: 'Active', join: 30, endOffset: 150 },
      { fullName: 'Vikram Singh', gender: 'Male', dob: '1990-09-18', address: 'Thane, Mumbai', plan: 3, trainer: 4, weight: 92, height: 180, goal: 'Strength', status: 'Inactive', join: 15, endOffset: 350 },
      { fullName: 'Neha Kulkarni', gender: 'Female', dob: '1996-05-12', address: 'Kharghar, Navi Mumbai', plan: 1, trainer: 3, weight: 65, height: 165, goal: 'Endurance', status: 'Active', join: 100, endOffset: 5 },
      { fullName: 'Arjun Rao', gender: 'Male', dob: '1993-08-25', address: 'Vashi, Navi Mumbai', plan: 4, trainer: 2, weight: 80, height: 176, goal: 'General Fitness', status: 'Active', join: 20, endOffset: 10 },
      { fullName: 'Pooja Desai', gender: 'Female', dob: '1999-02-17', address: 'Chembur, Mumbai', plan: 0, trainer: 1, weight: 55, height: 158, goal: 'Muscle Gain', status: 'Active', join: 10, endOffset: 20 },
      { fullName: 'Suresh Pillai', gender: 'Male', dob: '1988-12-03', address: 'Malad, Mumbai', plan: 3, trainer: 4, weight: 95, height: 182, goal: 'Weight Loss', status: 'Active', join: 200, endOffset: 165 },
      { fullName: 'Kavita Joshi', gender: 'Female', dob: '1994-06-09', address: 'Goregaon, Mumbai', plan: 2, trainer: 3, weight: 60, height: 163, goal: 'Strength', status: 'Active', join: 50, endOffset: 130 }
    ];

    const members = [];
    for (const m of memberDefs) {
      const member = await Member.create({
        fullName: m.fullName,
        photoUrl: avatarUrl(m.fullName, m.gender === 'Male' ? '2b6cb0' : 'd53f8c'),
        email: `${m.fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
        gender: m.gender,
        dob: new Date(m.dob),
        address: m.address,
        emergencyContact: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
        joiningDate: daysAgo(m.join),
        membershipPlan: plans[m.plan]._id,
        membershipStartDate: daysAgo(m.join),
        membershipEndDate: m.endOffset >= 0 ? daysFromNow(m.endOffset) : daysAgo(Math.abs(m.endOffset)),
        trainer: trainers[m.trainer]._id,
        weight: m.weight,
        height: m.height,
        fitnessGoal: m.goal,
        status: m.status
      });
      members.push(member);
    }
    console.log(`${members.length} members created.`);

    // 5. Attendance records (20+)
    const attendanceRecords = [];
    for (let i = 0; i < 20; i++) {
      const member = members[i % members.length];
      const dayOffset = Math.floor(i / 2);
      const isPresent = i % 5 !== 0;
      const checkIn = new Date(daysAgo(dayOffset));
      checkIn.setHours(6 + (i % 4), 0, 0, 0);
      const checkOut = new Date(checkIn);
      checkOut.setMinutes(checkOut.getMinutes() + 75);

      attendanceRecords.push({
        member: member._id,
        date: daysAgo(dayOffset),
        checkInTime: isPresent ? checkIn : null,
        checkOutTime: isPresent && i % 3 !== 0 ? checkOut : null,
        status: isPresent ? 'Present' : 'Absent'
      });
    }
    await Attendance.insertMany(attendanceRecords);
    console.log(`${attendanceRecords.length} attendance records created.`);

    // 6. Payments (10, each with unique receipt/transaction)
    const paymentMethods = ['Cash', 'UPI', 'Card', 'Bank Transfer'];
    const paymentDocs = [];
    for (let i = 0; i < 10; i++) {
      const member = members[i];
      const plan = plans[memberDefs[i].plan];
      paymentDocs.push({
        member: member._id,
        membershipPlan: plan._id,
        amount: plan.price,
        paymentDate: daysAgo(memberDefs[i].join),
        paymentMethod: paymentMethods[i % paymentMethods.length],
        paymentStatus: 'Paid',
        transactionId: `TXN${String(10000000 + i).padStart(8, '0')}`,
        receiptNumber: `RCPT-${String(i + 1).padStart(5, '0')}`
      });
    }
    await Payment.insertMany(paymentDocs);
    console.log(`${paymentDocs.length} payment records created.`);

    // 7. Equipment (10) with categories, maintenance dates
    const equipmentDocs = [
      { equipmentName: 'Treadmill', category: 'Cardio', quantity: 4, purchaseDate: daysAgo(500), purchasePrice: 55000, condition: 'Good', status: 'Available', lastMaintenanceDate: daysAgo(30), nextMaintenanceDate: daysFromNow(60) },
      { equipmentName: 'Exercise Bike', category: 'Cardio', quantity: 5, purchaseDate: daysAgo(300), purchasePrice: 22000, condition: 'New', status: 'Available', lastMaintenanceDate: daysAgo(10), nextMaintenanceDate: daysFromNow(80) },
      { equipmentName: 'Rowing Machine', category: 'Cardio', quantity: 2, purchaseDate: daysAgo(220), purchasePrice: 30000, condition: 'Fair', status: 'Maintenance Required', lastMaintenanceDate: daysAgo(90), nextMaintenanceDate: daysAgo(2) },
      { equipmentName: 'Dumbbells Set (5-30kg)', category: 'Free Weights', quantity: 10, purchaseDate: daysAgo(450), purchasePrice: 25000, condition: 'Good', status: 'Available', lastMaintenanceDate: null, nextMaintenanceDate: null },
      { equipmentName: 'Barbell Set', category: 'Free Weights', quantity: 6, purchaseDate: daysAgo(400), purchasePrice: 18000, condition: 'Good', status: 'Available', lastMaintenanceDate: null, nextMaintenanceDate: null },
      { equipmentName: 'Bench Press', category: 'Strength', quantity: 3, purchaseDate: daysAgo(400), purchasePrice: 18000, condition: 'Good', status: 'In Use', lastMaintenanceDate: daysAgo(45), nextMaintenanceDate: daysFromNow(45) },
      { equipmentName: 'Cable Crossover Machine', category: 'Strength', quantity: 1, purchaseDate: daysAgo(200), purchasePrice: 65000, condition: 'Fair', status: 'Maintenance Required', lastMaintenanceDate: daysAgo(120), nextMaintenanceDate: daysAgo(5) },
      { equipmentName: 'Leg Press Machine', category: 'Strength', quantity: 2, purchaseDate: daysAgo(350), purchasePrice: 48000, condition: 'Good', status: 'Available', lastMaintenanceDate: daysAgo(20), nextMaintenanceDate: daysFromNow(70) },
      { equipmentName: 'Smith Machine', category: 'Strength', quantity: 1, purchaseDate: daysAgo(280), purchasePrice: 70000, condition: 'Needs Repair', status: 'Damaged', lastMaintenanceDate: daysAgo(150), nextMaintenanceDate: daysAgo(20) },
      { equipmentName: 'Yoga Mats (Set of 20)', category: 'Other', quantity: 20, purchaseDate: daysAgo(100), purchasePrice: 8000, condition: 'Good', status: 'Available', lastMaintenanceDate: null, nextMaintenanceDate: null }
    ];
    const equipmentImageMap = {
      'Cardio': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400',
      'Strength': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
      'Free Weights': 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=400',
      'Other': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'
    };
    const equipment = await Equipment.insertMany(equipmentDocs.map(e => ({ ...e, imageUrl: equipmentImageMap[e.category] })));
    console.log(`${equipment.length} equipment records created.`);

    // 8. Workout Plans (5)
    const workoutDefs = [
      {
        planName: 'Chest & Triceps Builder', memberIdx: 0, trainerIdx: 0, goal: 'Muscle Gain', difficulty: 'Intermediate',
        exercises: [
          { exerciseName: 'Bench Press', targetMuscle: 'Chest', sets: 3, reps: 10, restSeconds: 90, notes: 'Focus on controlled movement' },
          { exerciseName: 'Incline Dumbbell Press', targetMuscle: 'Chest', sets: 3, reps: 12, restSeconds: 60 },
          { exerciseName: 'Triceps Pushdown', targetMuscle: 'Arms', sets: 3, reps: 12, restSeconds: 45 }
        ]
      },
      {
        planName: 'Fat Burn Cardio Circuit', memberIdx: 2, trainerIdx: 2, goal: 'Weight Loss', difficulty: 'Beginner',
        exercises: [
          { exerciseName: 'Treadmill Run', targetMuscle: 'Cardio', sets: 1, reps: 1, durationMinutes: 20, restSeconds: 0 },
          { exerciseName: 'Jump Rope', targetMuscle: 'Cardio', sets: 3, reps: 50, restSeconds: 30 },
          { exerciseName: 'Mountain Climbers', targetMuscle: 'Core', sets: 3, reps: 20, restSeconds: 30 }
        ]
      },
      {
        planName: 'Full Body Strength', memberIdx: 4, trainerIdx: 4, goal: 'Strength', difficulty: 'Advanced',
        exercises: [
          { exerciseName: 'Deadlift', targetMuscle: 'Back', sets: 4, reps: 6, restSeconds: 120, notes: 'Maintain neutral spine' },
          { exerciseName: 'Squats', targetMuscle: 'Legs', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseName: 'Overhead Press', targetMuscle: 'Shoulders', sets: 3, reps: 8, restSeconds: 90 }
        ]
      },
      {
        planName: 'Beginner Flexibility & Wellness', memberIdx: 5, trainerIdx: 1, goal: 'General Fitness', difficulty: 'Beginner',
        exercises: [
          { exerciseName: 'Sun Salutations', targetMuscle: 'Core', sets: 3, reps: 5, restSeconds: 20 },
          { exerciseName: 'Standing Forward Bend', targetMuscle: 'Legs', sets: 2, reps: 1, durationMinutes: 2, restSeconds: 15 }
        ]
      },
      {
        planName: 'Endurance Booster', memberIdx: 6, trainerIdx: 3, goal: 'Endurance', difficulty: 'Intermediate',
        exercises: [
          { exerciseName: 'Rowing Machine', targetMuscle: 'Cardio', sets: 1, reps: 1, durationMinutes: 15, restSeconds: 60 },
          { exerciseName: 'Burpees', targetMuscle: 'Core', sets: 4, reps: 15, restSeconds: 45 }
        ]
      }
    ];

    const exerciseImageMap = {
      chest: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      back: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400',
      legs: 'https://images.unsplash.com/photo-1434682772747-f16d3ea162c3?w=400',
      shoulders: 'https://images.unsplash.com/photo-1522898467493-49726bf28798?w=400',
      arms: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400',
      core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      cardio: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400'
    };

    const workoutDocs = workoutDefs.map(w => ({
      planName: w.planName,
      member: members[w.memberIdx]._id,
      trainer: trainers[w.trainerIdx]._id,
      goal: w.goal,
      difficulty: w.difficulty,
      startDate: daysAgo(14),
      endDate: daysFromNow(30),
      exercises: w.exercises.map(ex => ({ ...ex, imageUrl: exerciseImageMap[ex.targetMuscle.toLowerCase()] || exerciseImageMap.cardio })),
      status: 'Active'
    }));
    const workoutPlans = await WorkoutPlan.insertMany(workoutDocs);
    console.log(`${workoutPlans.length} workout plans created.`);

    // 9. Fitness Progress (20+ records, ~2 per member showing a trend)
    const progressDocs = [];
    for (let i = 0; i < members.length; i++) {
      const m = memberDefs[i];
      const startWeight = m.weight + 6;
      const midWeight = m.weight + 3;
      const currentWeight = m.weight;

      progressDocs.push({ member: members[i]._id, date: daysAgo(60), weight: startWeight, height: m.height, notes: 'Initial assessment' });
      progressDocs.push({ member: members[i]._id, date: daysAgo(30), weight: midWeight, height: m.height, notes: 'One month check-in' });
      if (i % 2 === 0) {
        progressDocs.push({ member: members[i]._id, date: daysAgo(5), weight: currentWeight, height: m.height, notes: 'Latest measurement' });
      }
    }
    await FitnessProgress.insertMany(progressDocs);
    console.log(`${progressDocs.length} fitness progress records created.`);

    console.log('\n===========================================');
    console.log('SEED DATA CREATED SUCCESSFULLY');
    console.log('===========================================');
    console.log(`Login with -> Username: ${adminUsername}  Password: ${adminPassword}`);
    console.log('===========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
