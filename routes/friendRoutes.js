const router = require("express").Router();

const {

sendRequest,
acceptRequest,
rejectRequest,
getRequests,
getFriends

} = require("../controllers/friendController");

// Send Friend Request
router.post(
"/send",
sendRequest
);

// Accept Friend Request
router.post(
"/accept",
acceptRequest
);

// Reject Friend Request
router.post(
"/reject",
rejectRequest
);

// Get Pending Requests
router.get(
"/requests/:username",
getRequests
);

// Get Friends List
router.get(
"/list/:username",
getFriends
);

module.exports = router;
