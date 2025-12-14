const router = require('express').Router();
const authController = require('./controllers/authController');
const inventoryController = require('./controllers/inventoryController');
const gardenController = require('./controllers/gardenController');
const sectionController = require('./controllers/sectionController')

router.use('/users', authController);
router.use('/inventory', inventoryController);
router.use('/garden', gardenController);
router.use('/section', sectionController)

module.exports = router;
