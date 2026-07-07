const Order = require('../models/Order');
const User = require('../models/User');
const { sendEmail } = require('./emailHelper');

const checkPendingOrders = async () => {
    try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        
        // Find orders pending for at least 15 minutes that haven't had a reminder sent
        const orders = await Order.find({
            status: 'pending',
            adminReminderSent: false,
            createdAt: { $lte: fifteenMinutesAgo }
        }).populate('userId', 'username email');

        if (orders.length === 0) return;

        console.log(`[Scheduler] Found ${orders.length} pending orders requiring reminders.`);

        // Find admins
        const admins = await User.find({ role: 'admin' });
        const adminEmails = admins.map(admin => admin.email);

        if (adminEmails.length === 0) {
            console.warn('[Scheduler] No admins found in database to email reminders.');
            return;
        }

        const adminEmailsString = adminEmails.join(',');

        for (const order of orders) {
            const customerName = order.userId ? order.userId.username : 'Unknown User';
            const orderIdStr = order._id.toString();
            const shortId = orderIdStr.substring(orderIdStr.length - 6).toUpperCase();
            
            const subject = `Urgent: Print Order #${shortId} is Still Pending`;
            const text = `Order #${orderIdStr} placed by ${customerName} has been pending for more than 15 minutes.\n\n` +
                `Order details:\n` +
                `- Print Type: ${order.printSettings.printType}\n` +
                `- Copies: ${order.printSettings.copies}\n` +
                `- Paper Size: ${order.printSettings.paperSize || 'A4'}\n` +
                `- Scheduled Pickup: ${order.printSettings.pickupTime ? new Date(order.printSettings.pickupTime).toLocaleString() : 'Not specified'}\n` +
                `- Total Cost: ₹${order.totalCost.toFixed(2)}\n\n` +
                `Please review the payment screenshot and process the print request.\n\n` +
                `Log in to the Admin Dashboard to update order status.`;

            try {
                // Send email to all admins
                await sendEmail({
                    to: adminEmailsString,
                    subject,
                    text
                });
                
                // Mark reminder as sent
                order.adminReminderSent = true;
                await order.save();
                console.log(`[Scheduler] Reminder email sent to admins for Order #${shortId}`);
            } catch (mailErr) {
                console.error(`[Scheduler] Failed to send reminder email for Order #${shortId}:`, mailErr.message);
            }
        }
    } catch (err) {
        console.error('[Scheduler] Error scanning pending orders:', err);
    }
};

const initReminderScheduler = () => {
    // Run check immediately on start
    checkPendingOrders();
    
    // Check every 5 minutes
    const interval = setInterval(checkPendingOrders, 5 * 60 * 1000);
    
    console.log('[Scheduler] Pending order reminder scheduler initialized (checking every 5 minutes)');
    
    return interval;
};

module.exports = { initReminderScheduler, checkPendingOrders };
