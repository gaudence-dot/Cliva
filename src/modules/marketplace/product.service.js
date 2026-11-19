
const store = require("../../store");
const products = store.products;

const createProduct = (productData) => {
    const newProduct = {
        id: Date.now().toString(),
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    products.push(newProduct);
    return newProduct;
};

const getAllProducts = (filters = {}) => {
    let result = [...products];

    if (filters.name) {
        result = result.filter(product =>
            product.name.toLowerCase().includes(filters.name.toLowerCase())
        );
    }

    if (filters.category) {
        result = result.filter(product =>
            product.category.toLowerCase() === filters.category.toLowerCase()
        );
    }

    if (filters.location) {
        result = result.filter(product =>
            product.location.toLowerCase().includes(filters.location.toLowerCase())
        );
    }

    if (filters.minPrice !== undefined) {
        result = result.filter(product =>
            product.price >= filters.minPrice
        );
    }

    if (filters.maxPrice !== undefined) {
        result = result.filter(product =>
            product.price <= filters.maxPrice
        );
    }

    if (filters.sort === "newest") {
        result.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    return result;
};

const getProductById = (id) => {
    return products.find(product => product.id === id);
};

const updateProduct = (id, updatedData) => {
    const product = getProductById(id);

    if (!product) return null;

    Object.assign(product, updatedData, {
        updatedAt: new Date()
    });

    return product;
};

const deleteProduct = (id) => {
    const index = products.findIndex(product => product.id === id);

    if (index === -1) return null;

    return products.splice(index, 1)[0];
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
