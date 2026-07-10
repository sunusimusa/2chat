const router = require("express").Router();

const {

createStatus,

getStatuses,

getStatusById

} = require("../controllers/statusController");

router.post("/create", createStatus);

router.get("/all", getStatuses);

router.get("/:id", getStatusById);

module.exports = router;
