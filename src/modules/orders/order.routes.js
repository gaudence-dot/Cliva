
const express = require("express");
const router = express.Router();

const orderController = require("./order.controller");

router.post("/", orderController.placeOrder);

router.get("/my-orders/:cartId", orderController.getBuyerOrders);

router.get("/seller/inbox", orderController.getSellerInbox);

router.get("/:orderId", orderController.getOrderById);

router.patch("/:orderId/decision", orderController.decideOrder);

router.patch("/:orderId/delivery", orderController.chooseDeliveryMethod);

router.patch("/:orderId/status", orderController.updateDeliveryStatus);

router.patch("/:orderId/cancel", orderController.cancelOrder);

module.exports = router;
