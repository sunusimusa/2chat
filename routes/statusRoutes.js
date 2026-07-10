const router = require("express").Router();

const {
  createStatus,
  getStatuses,
  getStatusById
} = require("../controllers/statusController");

// CREATE
router.post("/sunusi123", createStatus);
// ALL STATUS
router.get("/all", getStatuses);

// SINGLE STATUS
router.get("/:id", getStatusById);

module.exports = router;
