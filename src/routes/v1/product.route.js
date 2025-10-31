const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const catchAsync = require('../../utils/catchAsync');
const { productController } = require('../../controllers');
const upload = require('../../middlewares/upload');

const router = express.Router();

router.post('/create-product', auth(), upload.single("image"), validate(productController.createProduct.validation), catchAsync(productController.createProduct.handler));

// Get all products
router.get('/', productController.getAllProducts.handler);

// Get product by ID
router.get('/:id', productController.getProductById.handler);

// Delete product
router.delete('/:id', productController.deleteProduct.handler);

// Update product
router.put(
    '/:id',
    upload.single('image'),
    validate(productController.updateProduct.validation),
    productController.updateProduct.handler
);

module.exports = router;