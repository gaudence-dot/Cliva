
const cartService = require("./cart.service");

const validateCartId = (cartId) => {
    return typeof cartId === "string" &&
        cartId.trim().length > 0 &&
        cartId.length <= 100;
};

const getCart = (req, res) => {
    if (!validateCartId(req.params.cartId)) {
        return res.status(400).json({ message: "Invalid cart ID." });
    }

    return res.status(200).json(
        cartService.getCartDetails(req.params.cartId)
    );
};

const addItem = (req, res) => {
    const { productId, quantity } = req.body;

    if (
        typeof productId !== "string" ||
        !productId.trim() ||
        !Number.isInteger(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json({
            message: "Provide a valid productId and positive quantity."
        });
    }

    const result = cartService.addItem(
        req.params.cartId,
        productId,
        quantity
    );

    if (result.error) {
        return res.status(result.status).json({
            message: result.error
        });
    }

    return res.status(200).json({
        message: "Product added to cart.",
        cart: result.cart
    });
};

const updateItem = (req, res) => {
    const { quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
            message: "Quantity must be a positive integer."
        });
    }

    const result = cartService.updateItem(
        req.params.cartId,
        req.params.productId,
        quantity
    );

    if (result.error) {
        return res.status(result.status).json({
            message: result.error
        });
    }

    return res.status(200).json({
        message: "Cart updated.",
        cart: result.cart
    });
};

const removeItem = (req, res) => {
    const removed = cartService.removeItem(
        req.params.cartId,
        req.params.productId
    );

    if (!removed) {
        return res.status(404).json({
            message: "Product not found in cart."
        });
    }

    return res.status(200).json({
        message: "Product removed from cart.",
        cart: cartService.getCartDetails(req.params.cartId)
    });
};

const clearCart = (req, res) => {
    cartService.clearCart(req.params.cartId);

    return res.status(200).json({
        message: "Cart cleared successfully."
    });
};

module.exports = {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearCart
};
