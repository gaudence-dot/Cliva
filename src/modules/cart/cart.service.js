
const productService = require("../marketplace/product.service");

const store = require("../../store");
const carts = store.carts;

const getCart = (cartId) => {
    if (!carts.has(cartId)) {
        carts.set(cartId, []);
    }

    return carts.get(cartId);
};

const getCartDetails = (cartId) => {
    const cart = getCart(cartId);

    const items = cart.map(item => {
        const product = productService.getProductById(item.productId);

        if (!product) return null;

        return {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            availableStock: product.quantity,
            subtotal: product.price * item.quantity
        };
    }).filter(Boolean);

    const total = items.reduce(
        (sum, item) => sum + item.subtotal, 0
    );

    return {
        cartId,
        items,
        total,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
};

const addItem = (cartId, productId, quantity) => {
    const product = productService.getProductById(productId);

    if (!product) {
        return { error: "Product not found.", status: 404 };
    }

    const cart = getCart(cartId);
    const existing = cart.find(item => item.productId === productId);

    const newQuantity = existing
        ? existing.quantity + quantity
        : quantity;

    if (newQuantity > product.quantity) {
        return {
            error: "Requested quantity exceeds available stock.",
            status: 400
        };
    }

    if (existing) {
        existing.quantity = newQuantity;
    } else {
        cart.push({ productId, quantity });
    }

    return { cart: getCartDetails(cartId) };
};

const updateItem = (cartId, productId, quantity) => {
    const product = productService.getProductById(productId);

    if (!product) {
        return { error: "Product not found.", status: 404 };
    }

    const cart = getCart(cartId);
    const item = cart.find(item => item.productId === productId);

    if (!item) {
        return { error: "Product is not in this cart.", status: 404 };
    }

    if (quantity > product.quantity) {
        return {
            error: "Requested quantity exceeds available stock.",
            status: 400
        };
    }

    item.quantity = quantity;

    return { cart: getCartDetails(cartId) };
};

const removeItem = (cartId, productId) => {
    const cart = getCart(cartId);
    const index = cart.findIndex(item => item.productId === productId);

    if (index === -1) {
        return false;
    }

    cart.splice(index, 1);
    return true;
};

const clearCart = (cartId) => {
    carts.delete(cartId);
};

module.exports = {
    getCartDetails,
    addItem,
    updateItem,
    removeItem,
    clearCart
};
