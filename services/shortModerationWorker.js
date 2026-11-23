const ShortVideo = require("../models/ShortVideo");

const POLL_INTERVAL_MS = 5000;
const LOCK_DURATION_MS = 2 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 45000;
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 60 * 1000;

const FRAME_PERCENTAGES = [0, 25, 50, 75, 95];

let workerStarted = false;
let polling = false;

/**
 * Build a Cloudinary JPG URL for a frame
 * at a percentage of the original video.
 */
function buildCloudinaryFrameUrl(videoUrl, percentage) {
    if (!videoUrl || typeof videoUrl !== "string") {
        throw new Error("Video URL is missing.");
    }

    const url = new URL(videoUrl);

    if (!url.hostname.endsWith("cloudinary.com")) {
        throw new Error("Video URL is not a Cloudinary URL.");
    }

    if (!url.pathname.includes("/video/upload/")) {
        throw new Error("Invalid Cloudinary video URL.");
    }

    const extensionPattern = /\.(mp4|mov|webm|m4v|avi|mkv)$/i;

    if (!extensionPattern.test(url.pathname)) {
        throw new Error("Unsupported video file extension.");
    }

    url.pathname = url.pathname.replace(
        "/video/upload/",
        `/video/upload/so_${percentage}p,w_512/`
    );

    url.pathname = url.pathname.replace(
        extensionPattern,
        ".jpg"
    );

    return url.toString();
}

/**
 * Call OpenAI Moderation API.
 * Uses text + sampled Cloudinary frames.
 */
async function scanWithOpenAI(video) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured.");
    }

    const input = [];

    const caption = [
        video.caption || "",
        Array.isArray(video.hashtags)
            ? video.hashtags.join(" ")
            : "",
        video.category || ""
    ]
        .join(" ")
        .trim();

    if (caption) {
        input.push({
            type: "text",
            text: caption.slice(0, 10000)
        });
    }

    const frameUrls = FRAME_PERCENTAGES.map((percentage) =>
        buildCloudinaryFrameUrl(video.video, percentage)
    );

    for (const frameUrl of frameUrls) {
        input.push({
            type: "image_url",
            image_url: {
                url: frameUrl
            }
        });
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(
            "https://api.openai.com/v1/moderations",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
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
                `OpenAI API returned status ${response.status}`
            );
        }

        if (
            !data ||
            !Array.isArray(data.results) ||
            !data.results[0]
        ) {
            throw new Error("Invalid moderation response.");
        }

        return {
            result: data.results[0],
            frameCount: frameUrls.length
        };

    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Atomically claim one pending moderation job.
 * Multiple worker instances should not claim the same job.
 */
async function claimNextJob() {
    const now = new Date();
    const lockUntil = new Date(
        now.getTime() + LOCK_DURATION_MS
    );

    return ShortVideo.findOneAndUpdate(
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
}

/**
 * Save the result only if this worker still owns
 * the processing lock and the video is still pending.
 *
 * This prevents overwriting an admin's decision.
 */
async function saveScanResult(video, lockUntil, result, frameCount) {
    const flagged = result.flagged === true;

    const categories = result.categories || {};
    const scores = result.category_scores || {};

    const flaggedCategories = Object.keys(categories).filter(
        (category) => categories[category] === true
    );

    const newStatus = flagged ? "pending" : "approved";

    const reason = flagged
        ? "AI detected potentially harmful content. Admin review required."
        : "AI screening found no flagged content in the sampled frames and text.";

    const update = {
        $set: {
            moderationStatus: newStatus,
            moderationScanStatus: "completed",
            moderationReason: reason,
            moderationCategories: flaggedCategories,
            moderationDetails: {
                flagged,
                categories,
                categoryScores: scores,
                framesScanned: frameCount,
                framePercentages: FRAME_PERCENTAGES,
                model: "omni-moderation-latest"
            },
            moderationProvider: "openai-omni-moderation-latest",
            moderationScannedAt: new Date(),
            moderationLockUntil: null
        }
    };

    if (!flagged) {
        update.$set.reviewedAt = new Date();
        update.$set.reviewedBy = null;
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
            `[ShortModerationWorker] ${video._id}: ` +
            "Result ignored because the video status or lock changed."
        );
        return;
    }

    if (flagged) {
        console.log(
            `[ShortModerationWorker] ${video._id}: ` +
            "Flagged. Waiting for admin review."
        );
    } else {
        console.log(
            `[ShortModerationWorker] ${video._id}: ` +
            "AI screening passed."
        );
    }
}

/**
 * Handle a failed scan.
 * Never reject a video because the scan failed.
 */
async function handleScanError(video, lockUntil, error) {
    const attempts = Number(video.moderationAttempts || 1);
    const permanentlyFailed = attempts >= MAX_ATTEMPTS;

    const nextAttempt = permanentlyFailed
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : new Date(Date.now() + RETRY_DELAY_MS);

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
                moderationReason: permanentlyFailed
                    ? "AI scan failed after maximum attempts. Admin review required."
                    : "AI scan failed. Waiting for retry."
            }
        },
        { new: true }
    );

    if (!saved) {
        console.log(
            `[ShortModerationWorker] ${video._id}: ` +
            "Failure update ignored because the lock or status changed."
        );
        return;
    }

    console.error(
        `[ShortModerationWorker] Scan failed for ${video._id}:`,
        error.message
    );
}

/**
 * Process one queue job.
 */
async function processNextJob() {
    const video = await claimNextJob();

    if (!video) {
        return;
    }

    const lockUntil = video.moderationLockUntil;

    console.log(
        `[ShortModerationWorker] Scanning video ${video._id}`
    );

    try {
        const scan = await scanWithOpenAI(video);

        await saveScanResult(
            video,
            lockUntil,
            scan.result,
            scan.frameCount
        );

    } catch (error) {
        await handleScanError(
            video,
            lockUntil,
            error
        );
    }
}

/**
 * Start the background worker.
 * Call this only after MongoDB has connected.
 */
function startShortModerationWorker() {
    if (workerStarted) {
        console.log(
            "[ShortModerationWorker] Worker already started."
        );
        return;
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error(
            "[ShortModerationWorker] OPENAI_API_KEY is missing. Worker not started."
        );
        return;
    }

    if (typeof fetch !== "function") {
        console.error(
            "[ShortModerationWorker] Node.js fetch is unavailable. Use Node.js 18 or newer."
        );
        return;
    }

    workerStarted = true;

    console.log(
        "[ShortModerationWorker] Worker started."
    );

    const poll = async () => {
        if (polling) return;

        polling = true;

        try {
            await processNextJob();
        } catch (error) {
            console.error(
                "[ShortModerationWorker] Worker error:",
                error.message
            );
        } finally {
            polling = false;
        }
    };

    poll();

    setInterval(poll, POLL_INTERVAL_MS);
}

module.exports = {
    startShortModerationWorker
};

