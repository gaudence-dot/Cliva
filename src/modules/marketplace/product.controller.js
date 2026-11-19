
const productService = require("./product.service");

const validateProduct = (data, isUpdate = false) => {
    const errors = [];

    const requiredFields = [
        "name",
        "category",
        "location",
        "description",
        "sellerRef"
    ];

    if (!isUpdate) {
        for (const field of requiredFields) {
            if (
                typeof data[field] !== "string" ||
                data[field].trim() === ""
            ) {
                errors.push(`${field} is required.`);
            }
        }

        if (
            typeof data.price !== "number" ||
            !Number.isFinite(data.price) ||
            data.price <= 0
        ) {
            errors.push("Price must be a positive number.");
        }

        if (
            !Number.isInteger(data.quantity) ||
            data.quantity < 0
        ) {
            errors.push("Quantity must be a non-negative integer.");
        }
    } else {
        for (const field of requiredFields) {
            if (
                data[field] !== undefined &&
                (typeof data[field] !== "string" || data[field].trim() === "")
            ) {
                errors.push(`${field} must be a non-empty string.`);
            }
        }

        if (
            data.price !== undefined &&
            (typeof data.price !== "number" ||
                !Number.isFinite(data.price) ||
                data.price <= 0)
        ) {
            errors.push("Price must be a positive number.");
        }

        if (
            data.quantity !== undefined &&
            (!Number.isInteger(data.quantity) || data.quantity < 0)
        ) {
            errors.push("Quantity must be a non-negative integer.");
        }
    }

    if (
        data.images !== undefined &&
        (!Array.isArray(data.images) ||
            !data.images.every(image => typeof image === "string"))
    ) {
        errors.push("Images must be an array of image URLs.");
    }

    const allowedFields = [
        "name",
        "category",
        "price",
        "quantity",
        "location",
        "description",
        "images",
        "sellerRef"
    ];

    const invalidFields = Object.keys(data).filter(
        field => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
        errors.push(`Unsupported fields: ${invalidFields.join(", ")}`);
    }

    return errors;
};

// CREATE PRODUCT

const createProduct = (req, res) => {
    const productData = {
        ...req.body,

        price: Number(req.body.price),
        quantity: Number(req.body.quantity),

        images: [
            ...(Array.isArray(req.body.images)
                ? req.body.images
                : []),

            ...(req.file
                ? [`/uploads/products/${req.file.filename}`]
                : [])
        ]
    };

    const errors = validateProduct(productData);

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const product = productService.createProduct({
        name: productData.name.trim(),
        category: productData.category.trim(),
        price: productData.price,
        quantity: productData.quantity,
        location: productData.location.trim(),
        description: productData.description.trim(),
        images: productData.images,
        sellerRef: productData.sellerRef.trim()
    });

    return res.status(201).json({
        message: "Product listed successfully.",
        product
    });
};

// GET ALL, SEARCH, FILTER AND SORT PRODUCTS
const getAllProducts = (req, res) => {
    const { name, category, location, minPrice, maxPrice, sort } = req.query;

    const minimum = minPrice === undefined ? undefined : Number(minPrice);
    const maximum = maxPrice === undefined ? undefined : Number(maxPrice);

    if (
        (minPrice !== undefined && (!Number.isFinite(minimum) || minimum < 0)) ||
        (maxPrice !== undefined && (!Number.isFinite(maximum) || maximum < 0))
    ) {
        return res.status(400).json({
            message: "Price filters must be valid non-negative numbers."
        });
    }

    if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
        return res.status(400).json({
            message: "Minimum price cannot exceed maximum price."
        });
    }

    if (sort !== undefined && sort !== "newest") {
        return res.status(400).json({
            message: "Unsupported sorting option. Use sort=newest."
        });
    }

    const products = productService.getAllProducts({
        name,
        category,
        location,
        minPrice: minimum,
        maxPrice: maximum,
        sort
    });

    return res.status(200).json({
        count: products.length,
        products
    });
};

// GET ONE PRODUCT
const getProductById = (req, res) => {
    const product = productService.getProductById(req.params.id);

    if (!product) {
        return res.status(404).json({
            message: "Product not found."
        });
    }

    return res.status(200).json({ product });
};

// UPDATE PRODUCT
const updateProduct = (req, res) => {
    const errors = validateProduct(req.body, true);

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: "Provide at least one field to update."
        });
    }

    const updatedData = { ...req.body };

    for (const field of ["name", "category", "location", "description"]) {
        if (updatedData[field] !== undefined) {
            updatedData[field] = updatedData[field].trim();
        }
    }

    const product = productService.updateProduct(
        req.params.id,
        updatedData
    );

    if (!product) {
        return res.status(404).json({
            message: "Product not found."
        });
    }

    return res.status(200).json({
        message: "Product updated successfully.",
        product
    });
};

// DELETE PRODUCT
const deleteProduct = (req, res) => {
    const product = productService.deleteProduct(req.params.id);

    if (!product) {
        return res.status(404).json({
            message: "Product not found."
        });
    }

    return res.status(200).json({
        message: "Product deleted successfully.",
        product
    });
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
