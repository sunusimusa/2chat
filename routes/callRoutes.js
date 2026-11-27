const router = require("express").Router();
const protect = require("../middleware/auth");
const { getCallHistory } = require("../controllers/callController");

router.use(protect);
router.get("/history", getCallHistory);

module.exports = router;
