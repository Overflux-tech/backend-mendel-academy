const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');
const { Product } = require('../models');

// =============================
// CREATE PRODUCT
// =============================
const createProduct = {
  validation: {
    body: Joi.object().keys({
      name: Joi.string().trim().required(),
      price: Joi.number().required(),
      description: Joi.string().optional(),
      category: Joi.string().optional(),
    }),
  },

  handler: async (req, res) => {
    try {
      const { name } = req.body;

      // Check if product already exists
      const productExist = await Product.findOne({ name });
      if (productExist) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ message: 'Product already exists' });
      }

      // Build image URL if file uploaded
      const baseUrl = req.protocol + '://' + req.get('host');
      const imageUrl = req.file?.filename
        ? `${baseUrl}/uploads/${req.file.filename}`
        : '';

      // Create product
      const product = await Product.create({
        ...req.body,
        image: imageUrl,
      });

      res.status(httpStatus.CREATED).json({
        message: 'Product created successfully',
        product,
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  },
};

// =============================
// GET ALL PRODUCTS
// =============================
const getAllProducts = {
  handler: async (req, res, next) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
      res.status(httpStatus.OK).json({
        message: 'Products fetched successfully',
        total: products.length,
        products,
      });
    } catch (error) {
      next(error);
    }
  },
};

// =============================
// GET PRODUCT BY ID
// =============================
const getProductById = {
  handler: async (req, res, next) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
      }

      res.status(httpStatus.OK).json({
        message: 'Product fetched successfully',
        product,
      });
    } catch (error) {
      next(error);
    }
  },
};

// =============================
// UPDATE PRODUCT
// =============================
const updateProduct = {
  validation: {
    body: Joi.object().keys({
      name: Joi.string().optional(),
      price: Joi.number().optional(),
      description: Joi.string().optional(),
      category: Joi.string().optional(),
    }),
  },

  handler: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Build image URL if updated file uploaded
      const baseUrl = req.protocol + '://' + req.get('host');
      const imageUrl = req.file?.filename
        ? `${baseUrl}/uploads/${req.file.filename}`
        : undefined;

      const updateData = { ...req.body };
      if (imageUrl) updateData.image = imageUrl;

      const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!updatedProduct) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
      }

      res.status(httpStatus.OK).json({
        message: 'Product updated successfully',
        product: updatedProduct,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      next(error);
    }
  },
};

// =============================
// DELETE PRODUCT
// =============================
const deleteProduct = {
  handler: async (req, res, next) => {
    try {
      const { id } = req.params;

      const deletedProduct = await Product.findByIdAndDelete(id);
      if (!deletedProduct) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
      }

      res.status(httpStatus.OK).json({
        message: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      next(error);
    }
  },
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
