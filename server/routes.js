const router = require('express').Router();
const authController = require('./controllers/authController');
const inventoryController = require('./controllers/inventoryController');

router.use('/users', authController);
router.use('/inventory', inventoryController)
    
module.exports = router;