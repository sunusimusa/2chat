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
const cloudinary = require("../config/cloudinary");

let workerRunning = false;

function parseCloudinaryAsset(value, expectedType) {
    if (typeof value !== "string" || !value.startsWith("https://")) return null;
    try {
        const url = new URL(value);
        if (url.hostname !== "res.cloudinary.com") return null;
        const marker = "/upload/";
        const markerIndex = url.pathname.indexOf(marker);
        if (markerIndex < 0) return null;

        const pathParts = url.pathname.slice(markerIndex + marker.length).split("/");
        const versionIndex = pathParts.findIndex(part => /^v\d+$/.test(part));
        if (versionIndex < 0 || versionIndex === pathParts.length - 1) return null;

        const publicId = pathParts.slice(versionIndex + 1).join("/")
            .replace(/\.[^/.]+$/, "");
        if (!publicId) return null;

        return {
            publicId,
            resourceType: expectedType || (
                url.pathname.includes("/video/upload/") ? "video" : "image"
            )
        };
    } catch (_) {
        return null;
    }
}

async function removeCloudinaryAsset(value, expectedType) {
    const asset = parseCloudinaryAsset(value, expectedType);
    if (!asset) return;
    try {
        await cloudinary.uploader.destroy(asset.publicId, {
            resource_type: asset.resourceType,
            invalidate: true
        });
    } catch (error) {
        console.error("CLOUDINARY ACCOUNT CLEANUP ERROR:", error.message);
        throw error;
    }
}

async function deleteAccountData(user) {
    const userId = user._id;
    const username = user.username;

    // Remove profile, post and status media only when URLs identify assets
    // owned by this Cloudinary account.
    await removeCloudinaryAsset(user.avatar, "image");
    await removeCloudinaryAsset(user.cover, "image");

    const [ownedPosts, ownedStatuses, ownedMessages, ownedGroupMessages] = await Promise.all([
        Post.find({ userId }).select("image video").lean(),
        Status.find({ username }).select("media mediaType").lean(),
        Message.find({ sender: username }).select("image voice file type").lean(),
        GroupMessage.find({ sender: username }).select("image voice").lean()
    ]);
    for (const post of ownedPosts) {
        await removeCloudinaryAsset(post.image, "image");
        await removeCloudinaryAsset(post.video, "video");
    }
    for (const status of ownedStatuses) {
        await removeCloudinaryAsset(
            status.media,
            status.mediaType === "video" ? "video" : "image"
        );
    }
    for (const message of ownedMessages) {
        await removeCloudinaryAsset(message.image, "image");
        await removeCloudinaryAsset(message.voice, "video");
        await removeCloudinaryAsset(
            message.file,
            message.type === "video" ? "video" : "raw"
        );
    }
    for (const message of ownedGroupMessages) {
        await removeCloudinaryAsset(message.image, "image");
        await removeCloudinaryAsset(message.voice, "video");
    }

    // Remove the user's Shorts from Cloudinary where a stored public ID exists.
    const ownedShorts = await ShortVideo.find({
        $or: [{ userId }, { username }]
    }).select("videoPublicId").lean();

    for (const short of ownedShorts) {
        if (!short.videoPublicId) continue;
        try {
            await cloudinary.uploader.destroy(short.videoPublicId, {
                resource_type: "video",
                invalidate: true
            });
        } catch (mediaError) {
            console.error("SHORT MEDIA CLEANUP ERROR:", mediaError.message);
            throw mediaError;
        }
    }

    const ownedShortIds = ownedShorts.map(item => item._id);

    // Remove user-generated public content and private communications.
    await Promise.all([
        Post.deleteMany({ userId }),
        Post.updateMany({}, {
            $pull: {
                likes: username,
                comments: { username }
            }
        }),
        Post.updateMany(
            { "comments.replies.username": username },
            { $pull: { "comments.$[].replies": { username } } }
        ),
        ShortVideo.deleteMany({
            $or: [{ userId }, { username }]
        }),
        ShortVideo.updateMany({}, {
            $pull: {
                likes: username,
                comments: { username }
            }
        }),
        User.updateMany(
            { _id: { $ne: userId } },
            { $pull: { savedVideos: { $in: ownedShortIds } } }
        ),
        Status.deleteMany({ username }),
        Status.updateMany({}, {
            $pull: { views: { username } }
        }),
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
        { owner: { $ne: username }, members: username },
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

    await GroupMessage.updateMany({}, {
        $pull: {
            reactions: { username },
            seenBy: { username }
        }
    });
    await GroupMessage.updateMany(
        { replyUser: username },
        {
            $set: {
                replyTo: null,
                replyUser: "",
                replyText: "",
                replyImage: ""
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
        }).sort({ deletionAttempts: 1, deletionScheduledFor: 1 }).limit(10);

        for (const user of dueUsers) {
            try {
                await deleteAccountData(user);
                console.log("ACCOUNT DELETION COMPLETED:", String(user._id));
            } catch (error) {
                await User.updateOne(
                    { _id: user._id },
                    {
                        $inc: { deletionAttempts: 1 },
                        $set: { deletionLastAttemptAt: new Date() }
                    }
                );
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
