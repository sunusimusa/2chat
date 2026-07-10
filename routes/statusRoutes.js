const router = require("express").Router();

const {
    createStatus,
    getStatuses,
    getStatusById,
    viewStatus
} = require("../controllers/statusController");

// Upload Status
router.post("/create", createStatus);

// Get all Status
router.get("/all", getStatuses);

// Get one Status
router.get("/view/:id", getStatusById);

// Mark Status as viewed
router.put("/view/:id", viewStatus);

module.exports = router;
