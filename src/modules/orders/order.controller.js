
const orderService = require("./order.service");

const validateDelivery = (delivery) => {
    if (!delivery || typeof delivery !== "object" || Array.isArray(delivery)) {
        return "Delivery information is required.";
    }

    const required = [
        "recipientFullName",
        "phone",
        "district",
        "sector",
        "detailedAddress"
    ];

    for (const field of required) {
        if (
            typeof delivery[field] !== "string" ||
            !delivery[field].trim()
        ) {
            return `${field} is required.`;
        }
    }

    if (
        delivery.deliveryInstructions !== undefined &&
        typeof delivery.deliveryInstructions !== "string"
    ) {
        return "Delivery instructions must be text.";
    }

    return null;
};

// PLACE ORDER
const placeOrder = (req, res) => {
    const { cartId, delivery } = req.body;

    if (
        typeof cartId !== "string" ||
        !cartId.trim() ||
        cartId.length > 100
    ) {
        return res.status(400).json({
            message: "A valid cart ID is required."
        });
    }

    const deliveryError = validateDelivery(delivery);

    if (deliveryError) {
        return res.status(400).json({
            message: deliveryError
        });
    }

    const result = orderService.placeOrder(cartId, delivery);

    if (result.error) {
        return res.status(result.status).json({
            message: result.error
        });
    }

    return res.status(201).json({
        message: "Order placed successfully.",
        order: result.order
    });
};

// BUYER ORDER HISTORY
const getBuyerOrders = (req, res) => {
    const { cartId } = req.params;

    if (!cartId || cartId.length > 100) {
        return res.status(400).json({
            message: "Invalid buyer reference."
        });
    }

    const orders = orderService.getBuyerOrders(cartId);

    return res.status(200).json({
        count: orders.length,
        orders
    });
};

// SELLER INBOX
const getSellerInbox = (req, res) => {
    const orders = orderService.getSellerInbox();

    return res.status(200).json({
        count: orders.length,
        orders
    });
};

// VIEW INDIVIDUAL ORDER
const getOrderById = (req, res) => {
    const order = orderService.getOrderById(req.params.orderId);

    if (!order) {
        return res.status(404).json({
            message: "Order not found."
        });
    }

    return res.status(200).json({ order });
};

// CONFIRM OR REJECT
const decideOrder = (req, res) => {
    const { decision } = req.body;

    const result = orderService.decideOrder(
        req.params.orderId,
        decision
    );

    if (result.error) {
        return res.status(result.status).json({
            message: result.error
        });
    }

    return res.status(200).json({
        message: `Order ${decision === "confirm" ? "confirmed" : "rejected"}.`,
        order: result.order
    });
};

// CHOOSE DELIVERY METHOD
const chooseDeliveryMethod = (req, res) => {
    const { method } = req.body;

    const result = orderService.chooseDeliveryMethod(
        req.params.orderId,
        method
    );

    if (result.error) {
        return res.status(result.status).json({
            message: result.error
        });
    }

    return res.status(200).json({
        message: "Delivery method selected successfully.",
        order: result.order
    });
};

// UPDATE DELIVERY STATUS
const updateDeliveryStatus = (req, res) => {
    const { status } = req.body;

    const result = orderService.updateDeliveryStatus(
        req.params.orderId,
        status
    );

    if (result.error) {
        return res.status(result.status).json({
            message: result.error
        });
    }

    return res.status(200).json({
        message: "Order status updated successfully.",
        order: result.order
    });
};

// CANCEL ORDER
const cancelOrder = (req, res) => {
    const { cartId } = req.body;

    if (typeof cartId !== "string" || !cartId.trim()) {
        return res.status(400).json({
            message: "A valid cart ID is required."
        });
    }

    const result = orderService.cancelOrder(
        req.params.orderId,
        cartId
    );

    if (result.error) {
        return res.status(result.status).json({
            message: result.error
        });
    }

    return res.status(200).json({
        message: "Order cancelled successfully.",
        order: result.order
    });
};

module.exports = {
    placeOrder,
    getBuyerOrders,
    getSellerInbox,
    getOrderById,
    decideOrder,
    chooseDeliveryMethod,
    updateDeliveryStatus,
    cancelOrder
};
