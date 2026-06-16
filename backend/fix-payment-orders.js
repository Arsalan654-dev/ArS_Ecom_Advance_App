// backend/fix-current-order.js
import './config/env.js';
import connectDb from './config/db.js';
import Order from './models/order.model.js';

async function fixCurrentOrder() {
    await connectDb();
    
    // Get the latest payment_pending order
    const order = await Order.find({ status: 'payment_pending' }).sort({ createdAt: -1 });
    
    if (order.length > 0) {
        console.log(`📝 Found order: ${order[0]._id}`);
        console.log(`   PaymentIntentId: ${order[0].paymentIntentId}`);
        
        order[0].status = 'pending';
        order[0].paymentStatus = 'paid';
        order[0].paidAt = new Date();
        await order[0].save();
        
        console.log(`✅ Order ${order[0]._id} fixed! Status: ${order[0].status}`);
    } else {
        console.log('No payment_pending orders found');
    }
    
    process.exit(0);
}

fixCurrentOrder();