const router = require('express').Router();
const authController = require('./controllers/authController');
const inventoryController = require('./controllers/inventoryController');
const gardenController = require('./controllers/gardenController');

router.use('/users', authController);
router.use('/inventory', inventoryController);
router.use('/gardens', gardenController);

module.exports = router;
