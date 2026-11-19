
const express = require("express");
const path = require("path");
const productUploadRoutes = require("./modules/marketplace/product-upload.routes");
const productRoutes = require("./modules/marketplace/product.routes");
const cartRoutes = require("./modules/cart/cart.routes");
const orderRoutes = require("./modules/orders/order.routes");

const app = express();

app.use(express.json());

app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "uploads"))
);

app.use("/api/uploads", productUploadRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        message: "CLIVA API is running",
        modules: [
            "Marketplace Products",
            "Product Image Uploads",
            "Shopping Cart",
            "Order Management"
        ]
    });
});

app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.use((req, res) => {
    res.status(404).json({
        message: "API endpoint not found."
    });
});

app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        message: "Internal server error."
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`CLIVA API running on port ${PORT}`);
});
