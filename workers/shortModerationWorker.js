const ShortVideo = require("../models/ShortVideo");

const POLL_INTERVAL = 5000;
const LOCK_DURATION = 120000;
const REQUEST_TIMEOUT = 45000;
const MAX_ATTEMPTS = 5;

let workerStarted = false;
let isProcessing = false;

const FRAME_TIMES = [0, 1, 2, 3, 4];

/**
 * Create Cloudinary frame URL.
 */
function buildFrameUrl(videoUrl, seconds) {
    if (!videoUrl || typeof videoUrl !== "string") {
        throw new Error("Missing video URL.");
    }

    const url = new URL(videoUrl);

    if (!url.hostname.endsWith("cloudinary.com")) {
        throw new Error("Invalid Cloudinary URL.");
    }

    if (!url.pathname.includes("/video/upload/")) {
        throw new Error("Invalid Cloudinary video path.");
    }

    url.pathname = url.pathname.replace(
        "/video/upload/",
        `/video/upload/so_${seconds},w_512/`
    );

    url.pathname = url.pathname.replace(
        /\.(mp4|mov|webm|m4v|avi|mkv)$/i,
        ".jpg"
    );

    if (!url.pathname.endsWith(".jpg")) {
        throw new Error("Could not create frame URL.");
    }

    return url.toString();
}

/**
 * Send caption and frames to OpenAI.
 */
async function scanVideo(video) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is missing.");
    }

    const input = [];

    const caption = [
        video.caption || "",
        video.category || "",
        Array.isArray(video.hashtags)
            ? video.hashtags.join(" ")
            : ""
    ].join(" ").trim();

    if (caption) {
        input.push({
            type: "text",
            text: caption.slice(0, 10000)
        });
    }

    for (const seconds of FRAME_TIMES) {
        input.push({
            type: "image_url",
            image_url: {
                url: buildFrameUrl(video.video, seconds)
            }
        });
    }

    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT
    );

    try {
        const response = await fetch(
            "https://api.openai.com/v1/moderations",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "omni-moderation-latest",
                    input
                }),
                signal: controller.signal
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data?.error?.message ||
                `OpenAI API error: ${response.status}`
            );
        }

        if (!data.results || !data.results[0]) {
            throw new Error("Invalid moderation response.");
        }

        return data.results[0];

    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Claim one pending video.
 */
async function claimJob() {
    const now = new Date();

    const lockUntil = new Date(
        now.getTime() + LOCK_DURATION
    );

    const video = await ShortVideo.findOneAndUpdate(
        {
            moderationStatus: "pending",
            moderationNextAttemptAt: { $lte: now },

            $or: [
                {
                    moderationScanStatus: "queued"
                },
                {
                    moderationScanStatus: "failed",
                    moderationAttempts: { $lt: MAX_ATTEMPTS }
                },
                {
                    moderationScanStatus: "processing",
                    $or: [
                        { moderationLockUntil: { $lte: now } },
                        { moderationLockUntil: null }
                    ]
                }
            ]
        },
        {
            $set: {
                moderationScanStatus: "processing",
                moderationLockUntil: lockUntil
            },
            $inc: {
                moderationAttempts: 1
            }
        },
        {
            new: true,
            sort: { createdAt: 1 }
        }
    );

    return video;
}

/**
 * Save moderation result safely.
 */
async function saveResult(video, lockUntil, result) {
    const flagged = result.flagged === true;

    const categories = result.categories || {};
    const scores = result.category_scores || {};

    const flaggedCategories = Object.keys(categories).filter(
        key => categories[key] === true
    );

    const update = {
        $set: {
            moderationScanStatus: "completed",
            moderationReason: flagged
                ? "AI detected potentially harmful content. Admin review required."
                : "AI screening passed. Sampled frames and text were not flagged.",
            moderationCategories: flaggedCategories,
            moderationDetails: {
                flagged,
                categories,
                categoryScores: scores,
                framesScanned: FRAME_TIMES.length,
                frameTimes: FRAME_TIMES,
                model: "omni-moderation-latest"
            },
            moderationProvider: "openai-omni-moderation-latest",
            moderationScannedAt: new Date(),
            moderationLockUntil: null
        }
    };

    // AI may approve only if no category was flagged.
    // Flagged videos remain pending for admin review.
    if (!flagged) {
        update.$set.moderationStatus = "approved";
    }

    const saved = await ShortVideo.findOneAndUpdate(
        {
            _id: video._id,
            moderationStatus: "pending",
            moderationScanStatus: "processing",
            moderationLockUntil: lockUntil
        },
        update,
        { new: true }
    );

    if (!saved) {
        console.log(
            `[Moderation] ${video._id}: Result ignored. Status or lock changed.`
        );
        return;
    }

    console.log(
        flagged
            ? `[Moderation] ${video._id}: Flagged; admin review required.`
            : `[Moderation] ${video._id}: Approved by AI screening.`
    );
}

/**
 * Handle failed scan without rejecting the video.
 */
async function handleFailure(video, lockUntil, error) {
    const attempts = Number(video.moderationAttempts || 1);

    const nextAttempt = new Date(
        Date.now() + 60000
    );

    const saved = await ShortVideo.findOneAndUpdate(
        {
            _id: video._id,
            moderationStatus: "pending",
            moderationScanStatus: "processing",
            moderationLockUntil: lockUntil
        },
        {
            $set: {
                moderationScanStatus: "failed",
                moderationNextAttemptAt: nextAttempt,
                moderationLockUntil: null,
                moderationReason:
                    attempts >= MAX_ATTEMPTS
                        ? "AI scan failed repeatedly. Admin review required."
                        : "AI scan failed. Waiting for retry."
            }
        },
        { new: true }
    );

    if (!saved) {
        console.log(
            `[Moderation] ${video._id}: Failure update ignored.`
        );
        return;
    }

    console.error(
        `[Moderation] ${video._id}:`,
        error.message
    );
}

/**
 * Process one video.
 */
async function processNextJob() {
    const video = await claimJob();

    if (!video) return;

    const lockUntil = video.moderationLockUntil;

    console.log(
        `[Moderation] Scanning ${video._id}`
    );

    try {
        const result = await scanVideo(video);

        await saveResult(
            video,
            lockUntil,
            result
        );

    } catch (error) {
        await handleFailure(
            video,
            lockUntil,
            error
        );
    }
}

/**
 * Start worker after MongoDB connection.
 */
function startShortModerationWorker() {
    if (workerStarted) {
        console.log("[Moderation] Worker already started.");
        return;
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error(
            "[Moderation] OPENAI_API_KEY is missing. Worker not started."
        );
        return;
    }

    if (typeof fetch !== "function") {
        console.error(
            "[Moderation] Node.js 18 or newer is required."
        );
        return;
    }

    workerStarted = true;

    console.log("[Moderation] Worker started.");

    async function poll() {
        if (isProcessing) return;

        isProcessing = true;

        try {
            await processNextJob();
        } catch (error) {
            console.error(
                "[Moderation] Worker error:",
                error.message
            );
        } finally {
            isProcessing = false;
        }
    }

    poll();

    setInterval(poll, POLL_INTERVAL);
}

// Support both destructured and direct imports.
module.exports = {
    startShortModerationWorker
};

module.exports.startShortModerationWorker =
    startShortModerationWorker;
      
