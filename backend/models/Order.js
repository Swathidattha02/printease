const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    printSettings: {
        printType: {
            type: String,
            enum: ['bw', 'color'],
            required: true
        },
        copies: {
            type: Number,
            required: true,
            min: 1
        },
        paperSize: {
            type: String,
            default: 'A4'
        },
        pickupTime: {
            type: Date
        }
    },
    totalCost: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'printed', 'delivered'],
        default: 'pending'
    },
    paymentId: {
        type: String, // Store Stripe/Razorpay payment intent ID
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        default: 'upi' // 'upi' or 'razorpay'
    },
    paymentScreenshotPath: {
        type: String,
        default: ''
    },
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    razorpaySignature: {
        type: String,
        default: null
    },
    adminReminderSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
