const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const catchAsync = require('../../utils/catchAsync');
const { cartController } = require('../../controllers');
const upload = require('../../middlewares/upload');

const router = express.Router();

router.post('/add',auth(), validate(cartController.addToCart.validation), catchAsync(cartController.addToCart.handler));
router.get('/', auth(), catchAsync(cartController.getCart.handler));

// 🔁 Update quantity
router.put('/update', auth(), catchAsync(cartController.updateQuantity.handler));

// ❌ Remove product from cart
router.delete('/remove/:productId', auth(), catchAsync(cartController.removeFromCart.handler));

// 🧹 Clear all cart items
router.delete('/clear', auth(), catchAsync(cartController.clearCart.handler));



module.exports = router;