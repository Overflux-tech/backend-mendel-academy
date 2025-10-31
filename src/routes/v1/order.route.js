const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const catchAsync = require('../../utils/catchAsync');
const { orderController } = require('../../controllers');

const router = express.Router();

router.post('/create',auth(), validate(orderController.createOrder.validation), catchAsync(orderController.createOrder.handler));
router.get('/', auth(), catchAsync(orderController.getOrders.handler));
router.put('/:orderId', auth(), catchAsync(orderController.updateOrder.handler))
router.delete('/:orderId', auth(), catchAsync(orderController.deleteOrder.handler))

module.exports = router;