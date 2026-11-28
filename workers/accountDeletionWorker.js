const User = require("../models/User");
const Post = require("../models/Post");
const ShortVideo = require("../models/ShortVideo");
const Status = require("../models/Status");
const Message = require("../models/Message");
const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const Notification = require("../models/Notification");
const FriendRequest = require("../models/FriendRequest");
const Call = require("../models/Call");
const Report = require("../models/Report");

let workerRunning = false;

async function deleteAccountData(user) {
    const userId = user._id;
    const username = user.username;

    // Remove user-generated public content and private communications.
    await Promise.all([
        Post.deleteMany({ userId }),
        ShortVideo.deleteMany({
            $or: [{ userId }, { username }]
        }),
        Status.deleteMany({ username }),
        Message.deleteMany({
            $or: [{ sender: username }, { receiver: username }]
        }),
        GroupMessage.deleteMany({ sender: username }),
        Notification.deleteMany({
            $or: [{ sender: username }, { receiver: username }]
        }),
        FriendRequest.deleteMany({
            $or: [{ sender: username }, { receiver: username }]
        }),
        Call.deleteMany({
            $or: [{ caller: username }, { receiver: username }]
        })
    ]);

    // Transfer groups owned by the deleted account where possible.
    const ownedGroups = await Group.find({ owner: username });
    for (const group of ownedGroups) {
        const nextOwner = (group.members || []).find(
            member => String(member).toLowerCase() !== username.toLowerCase()
        );

        if (nextOwner) {
            group.owner = nextOwner;
            group.members = (group.members || []).filter(
                member => String(member).toLowerCase() !== username.toLowerCase()
            );
            group.admins = (group.admins || []).filter(
                member => String(member).toLowerCase() !== username.toLowerCase()
            );
            group.memberCount = group.members.length;
            await group.save();
        } else {
            await GroupMessage.deleteMany({ groupId: group._id });
            await Group.deleteOne({ _id: group._id });
        }
    }

    await Group.updateMany(
        { owner: { $ne: username } },
        {
            $pull: {
                members: username,
                admins: username
            },
            $inc: { memberCount: -1 }
        }
    );

    // Correct member counts after removal (including legacy records).
    await Group.updateMany(
        { memberCount: { $lt: 0 } },
        [{ $set: { memberCount: { $size: { $ifNull: ["$members", []] } } } }]
    );

    await User.updateMany(
        { _id: { $ne: userId } },
        {
            $pull: {
                friends: username,
                followers: username,
                following: username,
                blockedUsers: userId
            }
        }
    );

    // Keep moderation reports as safety/audit records; the deleted User ID
    // is no longer resolvable to a profile after the user document is removed.
    await Report.updateMany(
        { reportedUser: userId },
        { $set: { reportedUser: null } }
    );

    // Financial ledger documents (wallet, purchases, gifts and withdrawals)
    // are intentionally retained for accounting, fraud prevention and legal
    // recordkeeping. Requests with unsettled creator cash balances are blocked.

    await User.deleteOne({ _id: userId });
}

async function processDueAccountDeletions() {
    if (workerRunning) return;
    workerRunning = true;

    try {
        const dueUsers = await User.find({
            deletionScheduledFor: { $lte: new Date() }
        }).limit(10);

        for (const user of dueUsers) {
            try {
                await deleteAccountData(user);
                console.log("ACCOUNT DELETION COMPLETED:", String(user._id));
            } catch (error) {
                console.error(
                    "ACCOUNT DELETION FAILED:",
                    String(user._id),
                    error.message
                );
            }
        }
    } catch (error) {
        console.error("ACCOUNT DELETION WORKER ERROR:", error);
    } finally {
        workerRunning = false;
    }
}

function startAccountDeletionWorker() {
    // Run once at startup, then every 6 hours. No external cron dependency.
    processDueAccountDeletions();
    setInterval(processDueAccountDeletions, 6 * 60 * 60 * 1000);
}

module.exports = {
    startAccountDeletionWorker,
    processDueAccountDeletions
};
