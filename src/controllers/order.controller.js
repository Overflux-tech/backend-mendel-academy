const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');
const { Cart, Product, Order } = require('../models');

const createOrder = {
    handler: async (req, res, next) => {
        try {
            const userId = req.user._id || req.user.id;
            const { email, mobileNumber, name, paymentMethod, paymentStatus } = req.body;

            // 1️⃣ Validate payment method
            const validMethods = ['Credit Card', 'Debit Card', 'UPI', 'NetBanking'];
            if (!validMethods.includes(paymentMethod)) {
                return res.status(400).json({ message: 'Invalid payment method' });
            }

            // 2️⃣ Get user’s cart
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            if (!cart || cart.items.length === 0) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Your cart is empty');
            }

            // 3️⃣ Calculate total
            const totalAmount = cart.items.reduce(
                (sum, item) => sum + item.productId.price * item.quantity,
                0
            );

            // 4️⃣ Create order
            const order = new Order({
                userId,
                items: cart.items.map(item => ({
                    productId: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    quantity: item.quantity,
                })),
                totalAmount,
                email,
                mobileNumber,
                name,
                paymentMethod,
                paymentStatus: paymentStatus || 'Pending',
                orderStatus: 'pending',
            });

            await order.save();

            // 5️⃣ Empty cart
            await Cart.findOneAndUpdate({ userId }, { items: [] });

            res.status(201).json({
                message: 'Order placed successfully',
                order,
            });
        } catch (error) {
            console.error('Create order error:', error);
            next(error);
        }
    },
};

/**
 * 🟡 Get All Orders (Admin) or User Orders
 */
const getOrders = {
    handler: async (req, res, next) => {
        try {
            const userId = req.user._id || req.user.id;

            // If admin, get all orders — else, user-specific
            const isAdmin = req.user.role === 'admin';
            const filter = isAdmin ? {} : { userId };

            const orders = await Order.find(filter).populate('items.productId').sort({ createdAt: -1 });

            res.status(200).json({
                status: 'success',
                count: orders.length,
                orders,
            });
        } catch (error) {
            console.error('Get orders error:', error);
            next(error);
        }
    },
};

/**
 * 🟣 Update Order Status or Payment Status
 */
const updateOrder = {
  handler: async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { orderStatus, paymentStatus, paymentMethod, name, mobileNumber, email } = req.body;

      const validStatuses = ['pending', 'in progress', 'approval', 'cancel', 'failed', 'success'];
      const validPaymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
      const validPaymentMethods = ['Credit Card', 'Debit Card', 'UPI', 'NetBanking'];

      const updateData = {};

      // ✅ Validate & update order status
      if (orderStatus) {
        if (!validStatuses.includes(orderStatus)) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid order status');
        }
        updateData.orderStatus = orderStatus;
      }

      // ✅ Validate & update payment status
      if (paymentStatus) {
        if (!validPaymentStatuses.includes(paymentStatus)) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payment status');
        }
        updateData.paymentStatus = paymentStatus;
      }

      // ✅ Validate & update payment method
      if (paymentMethod) {
        if (!validPaymentMethods.includes(paymentMethod)) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payment method');
        }
        updateData.paymentMethod = paymentMethod;
      }

      // ✅ Optional user info updates
      if (name) updateData.name = name;

      if (mobileNumber) {
        if (!/^[0-9]{10}$/.test(mobileNumber)) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid mobile number');
        }
        updateData.mobileNumber = mobileNumber;
      }

      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email address');
        }
        updateData.email = email;
      }

      // ✅ Update order
      const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
      if (!updatedOrder) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
      }

      res.status(200).json({
        status: 'success',
        message: 'Order updated successfully',
        order: updatedOrder,
      });
    } catch (error) {
      console.error('Update order error:', error);
      next(error);
    }
  },
};

/**
 * 🔴 Delete Order
 */
const deleteOrder = {
    handler: async (req, res, next) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findById(orderId);

            if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');

            await order.deleteOne();

            res.status(200).json({
                message: 'Order deleted successfully',
            });
        } catch (error) {
            console.error('Delete order error:', error);
            next(error);
        }
    },
};

module.exports = {
    createOrder,
    getOrders,
    updateOrder,
    deleteOrder,
};