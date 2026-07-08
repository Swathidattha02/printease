const express = require('express');
const router = express.Router();
const fs = require('fs');
const pdf = require('pdf-parse');
const auth = require('../middleware/authMiddleware');
const pricing = require('../config/pricing');
const upload = require('../middleware/uploadMiddleware');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailHelper');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Helper to instantiate Razorpay safely
const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || 
        process.env.RAZORPAY_KEY_ID.includes('YOUR_KEY_ID') || 
        process.env.RAZORPAY_KEY_SECRET.includes('YOUR_KEY_SECRET')) {
        throw new Error('Razorpay API keys are not configured. Please add them to your .env file.');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};


// Helper to get PDF pages dynamically
async function parsePdfPages(filePath) {
    try {
        const buffer = await fs.promises.readFile(filePath);
        const data = await pdf(buffer);
        return data.numpages || 1;
    } catch (err) {
        console.error('PDF parsing error (using fallback 1 page):', err.message);
        return 1;
    }
}

// @route   POST api/orders
// @desc    Create a new order
// @access  Private
router.post('/', [auth, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'paymentScreenshot', maxCount: 1 }])], async (req, res) => {
    try {
        const { printType, copies, paperSize, pickupTime, paymentMethod } = req.body;

        if (!req.files || !req.files['file'] || !req.files['file'][0]) {
            return res.status(400).json({ msg: 'Document file is required' });
        }

        // Enforce screenshot for UPI (or generally as per request "he has to upload screenshot")
        if (!req.files['paymentScreenshot'] || !req.files['paymentScreenshot'][0]) {
            return res.status(400).json({ msg: 'Payment screenshot is required' });
        }

        const orderFile = req.files['file'][0];
        const screenshotFile = req.files['paymentScreenshot'][0];

        // Dynamic page counting
        const numPages = await parsePdfPages(orderFile.path);
        const pricePerPage = String(printType).toLowerCase() === 'color' ? pricing.PRICE_PER_PAGE_COLOR : pricing.PRICE_PER_PAGE_BW;
        const totalCost = pricePerPage * numPages * parseInt(copies, 10);

        const newOrder = new Order({
            userId: req.user.id,
            filePath: orderFile.path,
            printSettings: {
                printType: String(printType).toLowerCase(),
                copies: parseInt(copies, 10),
                paperSize,
                pickupTime
            },
            totalCost,
            paymentMethod: paymentMethod || 'upi',
            paymentScreenshotPath: screenshotFile.path,
            paymentId: 'manual_' + Date.now()
        });

        const order = await newOrder.save();

        // Email Notification to Admins
        try {
            const admins = await User.find({ role: 'admin' });
            const adminEmails = admins.map(admin => admin.email);
            if (adminEmails.length > 0) {
                const orderIdStr = order._id.toString();
                const shortId = orderIdStr.substring(orderIdStr.length - 6).toUpperCase();
                const customerUser = await User.findById(req.user.id);
                const customerName = customerUser ? customerUser.username : 'A customer';

                const subject = `New Print Order Placed: #${shortId}`;
                const text = `A new print order has been placed by ${customerName}.\n\n` +
                    `Order details:\n` +
                    `- Order ID: ${orderIdStr}\n` +
                    `- Print Type: ${order.printSettings.printType}\n` +
                    `- Copies: ${order.printSettings.copies}\n` +
                    `- Paper Size: ${order.printSettings.paperSize || 'A4'}\n` +
                    `- Total Cost: ₹${order.totalCost.toFixed(2)}\n` +
                    `- Pickup Scheduled: ${order.printSettings.pickupTime ? new Date(order.printSettings.pickupTime).toLocaleString() : 'Not specified'}\n\n` +
                    `Please log in to the Admin Dashboard to review the UPI screenshot and process this order.`;

                sendEmail({
                    to: adminEmails.join(','),
                    subject,
                    text
                }).catch(mailErr => console.error('Error sending order notification email:', mailErr.message));
            }
        } catch (adminErr) {
            console.error('Failed to notify admins of new order placement:', adminErr.message);
        }

        // Emit Socket.io Real-time Event
        try {
            const io = req.app.get('socketio');
            if (io) {
                io.emit('new-order', order);
            }
        } catch (socketErr) {
            console.error('Failed to emit socket event:', socketErr.message);
        }

        res.json(order);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/orders/draft
// @desc    Create a draft order without payment screenshot (for frontend flow)
// @access  Private
router.post('/draft', [auth, upload.single('file')], async (req, res) => {
    try {
        const { printType = 'bw', copies = 1, paperSize = 'A4', pickupTime = '' } = req.body;

        if (!req.file) {
            return res.status(400).json({ msg: 'Document file is required' });
        }

        const orderFile = req.file;

        // Dynamic page counting
        const numPages = await parsePdfPages(orderFile.path);
        const pricePerPage = String(printType).toLowerCase() === 'color' ? pricing.PRICE_PER_PAGE_COLOR : pricing.PRICE_PER_PAGE_BW;
        const totalCost = pricePerPage * numPages * parseInt(copies, 10);

        const newOrder = new Order({
            userId: req.user.id,
            filePath: orderFile.path,
            printSettings: {
                printType: String(printType).toLowerCase(),
                copies: parseInt(copies, 10),
                paperSize,
                pickupTime
            },
            totalCost,
            paymentMethod: 'pending',
            paymentScreenshotPath: ''
        });

        const order = await newOrder.save();
        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/orders
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const orders = await Order.find().populate('userId', ['username', 'email']).sort({ createdAt: 1 });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/orders/my-orders
// @desc    Get current user's orders
// @access  Private
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/:id/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { status } = req.body;
        let order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ msg: 'Order not found' });

        order.status = status;
        await order.save();

        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/orders/razorpay/create
// @desc    Create a new order & corresponding Razorpay order
// @access  Private
router.post('/razorpay/create', [auth, upload.single('file')], async (req, res) => {
    try {
        const { printType = 'bw', copies = 1, paperSize = 'A4', pickupTime = '' } = req.body;

        if (!req.file) {
            return res.status(400).json({ msg: 'Document file is required' });
        }

        const orderFile = req.file;

        // Dynamic page counting
        const numPages = await parsePdfPages(orderFile.path);
        const pricePerPage = String(printType).toLowerCase() === 'color' ? pricing.PRICE_PER_PAGE_COLOR : pricing.PRICE_PER_PAGE_BW;
        const totalCost = pricePerPage * numPages * parseInt(copies, 10);

        // 1. Create the pending order in our database
        const newOrder = new Order({
            userId: req.user.id,
            filePath: orderFile.path,
            printSettings: {
                printType: String(printType).toLowerCase(),
                copies: parseInt(copies, 10),
                paperSize,
                pickupTime
            },
            totalCost,
            paymentMethod: 'razorpay',
            paymentStatus: 'pending',
            paymentScreenshotPath: ''
        });

        const order = await newOrder.save();

        // 2. Initialize and call Razorpay to create order
        let rzpOrder;
        try {
            const rzp = getRazorpayInstance();
            const options = {
                amount: Math.round(totalCost * 100), // amount in the smallest currency unit (paisa)
                currency: 'INR',
                receipt: order._id.toString()
            };
            rzpOrder = await rzp.orders.create(options);
            
            // 3. Update database order with the razorpayOrderId
            order.razorpayOrderId = rzpOrder.id;
            await order.save();
        } catch (rzpErr) {
            // Rollback/delete the order if Razorpay creation fails so we don't end up with dead records
            await Order.findByIdAndDelete(order._id);
            console.error('Razorpay Order creation error:', rzpErr);
            return res.status(500).json({ msg: rzpErr.message || 'Razorpay order creation failed' });
        }

        res.json({ rzpOrder, order });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/orders/razorpay/verify
// @desc    Verify Razorpay payment signature
// @access  Private
router.post('/razorpay/verify', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ msg: 'Missing verification fields' });
        }

        // 1. Verify Signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            // Find order and mark as failed
            const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
            if (order) {
                order.paymentStatus = 'failed';
                await order.save();
            }
            return res.status(400).json({ msg: 'Payment verification failed: invalid signature' });
        }

        // 2. Update order to paid
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        if (!order) {
            return res.status(404).json({ msg: 'Order not found for this payment' });
        }

        order.paymentStatus = 'paid';
        order.paymentId = razorpay_payment_id;
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        await order.save();

        // 3. Email Notification to Admins
        try {
            const admins = await User.find({ role: 'admin' });
            const adminEmails = admins.map(admin => admin.email);
            if (adminEmails.length > 0) {
                const orderIdStr = order._id.toString();
                const shortId = orderIdStr.substring(orderIdStr.length - 6).toUpperCase();
                const customerUser = await User.findById(req.user.id);
                const customerName = customerUser ? customerUser.username : 'A customer';

                const subject = `New Print Order Placed (Paid Online): #${shortId}`;
                const text = `A new print order has been placed by ${customerName}.\n\n` +
                    `Order details:\n` +
                    `- Order ID: ${orderIdStr}\n` +
                    `- Print Type: ${order.printSettings.printType}\n` +
                    `- Copies: ${order.printSettings.copies}\n` +
                    `- Paper Size: ${order.printSettings.paperSize || 'A4'}\n` +
                    `- Total Cost: ₹${order.totalCost.toFixed(2)} (Paid via Razorpay)\n` +
                    `- Razorpay Payment ID: ${razorpay_payment_id}\n` +
                    `- Pickup Scheduled: ${order.printSettings.pickupTime ? new Date(order.printSettings.pickupTime).toLocaleString() : 'Not specified'}\n\n` +
                    `Payment has been verified automatically. You can start printing this job.`;

                sendEmail({
                    to: adminEmails.join(','),
                    subject,
                    text
                }).catch(mailErr => console.error('Error sending order notification email:', mailErr.message));
            }
        } catch (adminErr) {
            console.error('Failed to notify admins of new order placement:', adminErr.message);
        }

        // 4. Emit Socket.io Real-time Event
        try {
            const io = req.app.get('socketio');
            if (io) {
                io.emit('new-order', order);
            }
        } catch (socketErr) {
            console.error('Failed to emit socket event:', socketErr.message);
        }

        res.json({ success: true, order });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
