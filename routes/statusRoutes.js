const router = require("express").Router();

const {
createStatus,
getStatuses
} = require("../controllers/statusController");

router.post("/create", createStatus);

router.get("/all", getStatuses);

module.exports = router;
