
const { randomUUID } = require("crypto");

const cartService = require("../cart/cart.service");
const productService = require("../marketplace/product.service");

const store = require("../../store");
const orders = store.orders;

const addHistory = (order, status) => {
    order.status = status;
    order.updatedAt = new Date();

    order.history.push({
        status,
        date: new Date()
    });
};

const restoreStock = (order) => {
    for (const item of order.items) {
        const product = productService.getProductById(item.productId);

        if (product) {
            productService.updateProduct(product.id, {
                quantity: product.quantity + item.quantity
            });
        }
    }
};

const placeOrder = (cartId, delivery) => {
    const cart = cartService.getCartDetails(cartId);

    if (!cart.items.length) {
        return { error: "Your shopping cart is empty.", status: 400 };
    }

    // Verify all products and quantities before changing stock.
    for (const item of cart.items) {
        const product = productService.getProductById(item.productId);

        if (!product) {
            return {
                error: `Product ${item.name} is no longer available.`,
                status: 400
            };
        }

        if (product.quantity < item.quantity) {
            return {
                error: `Insufficient stock for ${item.name}.`,
                status: 400
            };
        }
    }

    const orderItems = cart.items.map(item => ({
        productId: item.productId,
        name: item.name,
        unitPrice: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal
    }));

    // Reserve stock when the order is placed.
    for (const item of orderItems) {
        const product = productService.getProductById(item.productId);

        productService.updateProduct(product.id, {
            quantity: product.quantity - item.quantity
        });
    }

    const order = {
        id: randomUUID(),
        buyerRef: cartId,
        items: orderItems,
        total: cart.total,

        delivery: {
            recipientFullName: delivery.recipientFullName,
            phone: delivery.phone,
            district: delivery.district,
            sector: delivery.sector,
            detailedAddress: delivery.detailedAddress,
            deliveryInstructions: delivery.deliveryInstructions || ""
        },

        deliveryMethod: null,
        status: "pending_seller_confirmation",

        history: [{
            status: "pending_seller_confirmation",
            date: new Date()
        }],

        createdAt: new Date(),
        updatedAt: new Date()
    };

    orders.push(order);

    cartService.clearCart(cartId);

    return { order };
};

const getBuyerOrders = (cartId) => {
    return orders.filter(order => order.buyerRef === cartId);
};

const getSellerInbox = () => {
    // Temporary development inbox.
    // Seller-specific filtering will be added with authentication.
    return orders;
};

const getOrderById = (id) => {
    return orders.find(order => order.id === id);
};

const decideOrder = (id, decision) => {
    const order = getOrderById(id);

    if (!order) {
        return { error: "Order not found.", status: 404 };
    }

    if (order.status !== "pending_seller_confirmation") {
        return {
            error: "This order has already been processed.",
            status: 400
        };
    }

    if (decision === "confirm") {
        addHistory(order, "confirmed");
    } else if (decision === "reject") {
        restoreStock(order);
        addHistory(order, "rejected");
    } else {
        return {
            error: "Decision must be confirm or reject.",
            status: 400
        };
    }

    return { order };
};

const chooseDeliveryMethod = (id, method) => {
    const order = getOrderById(id);

    if (!order) {
        return { error: "Order not found.", status: 404 };
    }

    if (order.status !== "confirmed") {
        return {
            error: "Delivery can only be selected for confirmed orders.",
            status: 400
        };
    }

    if (!["cliva_delivery", "seller_delivery"].includes(method)) {
        return {
            error: "Choose cliva_delivery or seller_delivery.",
            status: 400
        };
    }

    order.deliveryMethod = method;

    addHistory(order, "ready_for_delivery");

    return { order };
};

const updateDeliveryStatus = (id, status) => {
    const order = getOrderById(id);

    if (!order) {
        return { error: "Order not found.", status: 404 };
    }

    const transitions = {
        ready_for_delivery: ["out_for_delivery"],
        out_for_delivery: ["delivered"]
    };

    if (!transitions[order.status]?.includes(status)) {
        return {
            error: "Invalid order status transition.",
            status: 400
        };
    }

    addHistory(order, status);

    return { order };
};

const cancelOrder = (id, cartId) => {
    const order = getOrderById(id);

    if (!order) {
        return { error: "Order not found.", status: 404 };
    }

    if (order.buyerRef !== cartId) {
        return {
            error: "You cannot cancel this order.",
            status: 403
        };
    }

    if (!["pending_seller_confirmation", "confirmed"].includes(order.status)) {
        return {
            error: "This order can no longer be cancelled.",
            status: 400
        };
    }

    restoreStock(order);
    addHistory(order, "cancelled");

    return { order };
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
