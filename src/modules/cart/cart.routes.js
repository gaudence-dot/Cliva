
const express = require("express");
const router = express.Router();

const cartController = require("./cart.controller");

router.get("/:cartId", cartController.getCart);

router.post("/:cartId/items", cartController.addItem);

router.patch("/:cartId/items/:productId", cartController.updateItem);

router.delete("/:cartId/items/:productId", cartController.removeItem);

router.delete("/:cartId", cartController.clearCart);

module.exports = router;
