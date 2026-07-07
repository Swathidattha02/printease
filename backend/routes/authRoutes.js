const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailHelper');
const User = require('../models/User');

const router = express.Router();
const auth = require('../middleware/authMiddleware');

const validatePassword = (password) => {
    if (!password || password.length < 7) {
        return 'Password must be at least 7 characters long';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must include at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must include at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must include at least one number';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return 'Password must include at least one special character';
    }
    return null;
};

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, phoneNumber } = req.body;

        const passwordErr = validatePassword(password);
        if (passwordErr) {
            return res.status(400).json({ msg: passwordErr });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        let userByName = await User.findOne({ username });
        if (userByName) {
            return res.status(400).json({ msg: 'Username already taken' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            username,
            email,
            phoneNumber,
            password: hashedPassword
        });

        await user.save();

        // Create JWT Payload
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Return JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/auth/users - admin only: list customers basic info
router.get('/users', auth, async (req, res) => {
    try {
        // only admin allowed
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const users = await User.find({ role: 'customer' }).select('username email phoneNumber');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/forgot-password
// @desc    Request password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ msg: 'Please provide an email address' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'No user found with that email' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set in DB
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

        await user.save();

        // Build reset link
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const clientUrl = process.env.CLIENT_URL || `${protocol}://${host.split(':')[0]}:3000`;
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        const message = `You are receiving this email because a password reset request was made for your XeroxFlow account. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you did not request this, please ignore this email.`;

        let emailSent = false;
        try {
            const mailInfo = await sendEmail({
                to: user.email,
                subject: 'XeroxFlow - Password Reset Request',
                text: message
            });
            if (mailInfo) {
                emailSent = true;
            }
        } catch (mailErr) {
            console.error('SMTP Mail send failed. Logging token to console:', mailErr.message);
        }

        // Always log the link to the console for local development
        console.log(`\n=== PASSWORD RESET LINK ===\n${resetUrl}\n===========================\n`);

        res.json({
            msg: emailSent ? 'Reset email sent successfully' : 'Reset link generated successfully (logged to server console)'
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            return res.status(400).json({ msg: 'Please provide all password fields' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ msg: 'Passwords do not match' });
        }

        const passwordErr = validatePassword(password);
        if (passwordErr) {
            return res.status(400).json({ msg: passwordErr });
        }

        // Hash token from request params to compare with DB
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired reset token' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear reset fields
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;

        await user.save();

        res.json({ msg: 'Password updated successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/change-password
// @desc    Change password from within profile (Admin only as required)
// @access  Private
router.post('/change-password', auth, async (req, res) => {
    try {
        // Verify user is an admin
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Admin only' });
        }

        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ msg: 'Please provide all password fields' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ msg: 'New passwords do not match' });
        }

        const passwordErr = validatePassword(newPassword);
        if (passwordErr) {
            return res.status(400).json({ msg: passwordErr });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Validate current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ msg: 'Password updated successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
