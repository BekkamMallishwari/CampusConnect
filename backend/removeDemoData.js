import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const userNames = ['QA User A', 'Smoke Test Runner'];
        const itemNames = ['Smoke Lost Item', 'Gold phone', 'Wireless Sony Headphones', 'Midnight Blue iPhone 15 Pro Max'];

        // Get users to delete
        const User = mongoose.model('User');
        const users = await User.find({ name: { $in: userNames } });
        const userIds = users.map(u => u._id);
        console.log("Found users to delete:", userIds.length);

        // Delete Lost Items
        const LostItem = mongoose.model('LostItem');
        const lRes = await LostItem.deleteMany({ $or: [{ itemName: { $in: itemNames } }, { postedBy: { $in: userIds } }] });
        console.log("Deleted Lost Items:", lRes.deletedCount);

        // Delete Found Items
        const FoundItem = mongoose.model('FoundItem');
        const fRes = await FoundItem.deleteMany({ $or: [{ itemName: { $in: itemNames } }, { postedBy: { $in: userIds } }] });
        console.log("Deleted Found Items:", fRes.deletedCount);

        // Delete Matches
        const Match = mongoose.model('Match');
        const mRes = await Match.deleteMany({ $or: [{ lostUserId: { $in: userIds } }, { foundUserId: { $in: userIds } }] });
        console.log("Deleted Matches:", mRes.deletedCount);

        // Delete Messages
        const Message = mongoose.model('Message');
        const msgRes = await Message.deleteMany({ senderId: { $in: userIds } });
        console.log("Deleted Messages:", msgRes.deletedCount);

        // Delete Chats
        const Chat = mongoose.model('Chat');
        const cRes = await Chat.deleteMany({ participants: { $in: userIds } });
        console.log("Deleted Chats:", cRes.deletedCount);

        // Delete Notifications
        const Notification = mongoose.model('Notification');
        const nRes = await Notification.deleteMany({ userId: { $in: userIds } });
        console.log("Deleted Notifications:", nRes.deletedCount);

        // Delete Payments
        const Payment = mongoose.model('Payment');
        const pRes = await Payment.deleteMany({ $or: [{ userId: { $in: userIds } }, { finderId: { $in: userIds } }] });
        console.log("Deleted Payments:", pRes.deletedCount);

        // Delete Users
        const uRes = await User.deleteMany({ _id: { $in: userIds } });
        console.log("Deleted Users:", uRes.deletedCount);

        console.log("Cleanup complete!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
