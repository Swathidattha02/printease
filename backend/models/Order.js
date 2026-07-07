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
    paymentMethod: {
        type: String,
        default: 'upi'
    },
    paymentScreenshotPath: {
        type: String,
        required: true // Now required as per user request
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
