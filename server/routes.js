const router = require('express').Router();
const authController = require('./controllers/authController');
const inventoryController = require('./controllers/inventoryController');
const { getItemsInViewport, addMapItem } = require('../controllers/mapController');

router.use('/users', authController);
router.use('/inventory', inventoryController)

router.get('/viewport', getItemsInViewport);
router.post('/', addMapItem);
    
module.exports = router;