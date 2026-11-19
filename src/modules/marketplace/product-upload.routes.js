
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();

const uploadDirectory = path.join(
    __dirname,
    "../../../uploads/products"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif"
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = allowedTypes[file.mimetype];

        if (!extension) {
            return cb(new Error("Unsupported image format."));
        }

        cb(null, crypto.randomUUID() + extension);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    },

    fileFilter: (req, file, cb) => {
        if (!allowedTypes[file.mimetype]) {
            return cb(
                new Error("Only JPEG, PNG, WebP and GIF images are allowed.")
            );
        }

        cb(null, true);
    }
});

router.post("/products", (req, res, next) => {
    upload.array("images", 5)(req, res, (err) => {
        if (err) {
            return next(err);
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "Please upload at least one image."
            });
        }

        const images = req.files.map(file => ({
            filename: file.filename,
            url: `/uploads/products/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype
        }));

        res.status(201).json({
            message: "Product images uploaded successfully.",
            count: images.length,
            images
        });
    });
});

module.exports = router;

