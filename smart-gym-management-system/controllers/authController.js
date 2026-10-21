const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username: username.trim() });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    req.session.isAdmin = true;
    req.session.username = admin.username;

    return res.status(200).json({ success: true, message: 'Login successful.', username: admin.username });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error logging out.' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  });
};

exports.checkSession = (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.status(200).json({ success: true, loggedIn: true, username: req.session.username });
  }
  return res.status(200).json({ success: true, loggedIn: false });
};
