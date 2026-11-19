const express = require('express');
const store = require('../store');
const { id, now, isText, positiveNumber, nonNegativeInteger, sendError } = require('../utils');
const router = express.Router();

router.get('/products', (req, res) => {
  const { name, category, location, minPrice, maxPrice, sort } = req.query;
  const min = minPrice === undefined ? undefined : Number(minPrice);
  const max = maxPrice === undefined ? undefined : Number(maxPrice);
  if ((min !== undefined && (!Number.isFinite(min) || min < 0)) || (max !== undefined && (!Number.isFinite(max) || max < 0))) return sendError(res, 400, 'Price filters must be non-negative numbers.');
  if (min !== undefined && max !== undefined && min > max) return sendError(res, 400, 'minPrice cannot exceed maxPrice.');
  if (sort && sort !== 'newest' && sort !== 'price_asc' && sort !== 'price_desc') return sendError(res, 400, 'sort must be newest, price_asc or price_desc.');
  let rows = store.products.filter(p => !name || p.name.toLowerCase().includes(String(name).toLowerCase()))
    .filter(p => !category || p.category.toLowerCase() === String(category).toLowerCase())
    .filter(p => !location || p.location.toLowerCase().includes(String(location).toLowerCase()))
    .filter(p => min === undefined || p.price >= min).filter(p => max === undefined || p.price <= max);
  if (sort === 'newest') rows.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === 'price_asc') rows.sort((a,b) => a.price-b.price);
  if (sort === 'price_desc') rows.sort((a,b) => b.price-a.price);
  res.json({ count: rows.length, products: rows });
});
router.post('/products', (req, res) => {
  const { name, category, price, quantity, location, description, images = [], sellerRef = null } = req.body;
  if (![name, category, location, description].every(isText)) return sendError(res, 400, 'name, category, location and description are required.');
  if (!positiveNumber(price)) return sendError(res, 400, 'price must be a positive number.');
  if (!nonNegativeInteger(quantity)) return sendError(res, 400, 'quantity must be a non-negative integer.');
  if (!Array.isArray(images) || !images.every(x => typeof x === 'string')) return sendError(res, 400, 'images must be an array of URL strings.');
  const product = { id:id(), name:name.trim(), category:category.trim(), price, quantity, location:location.trim(), description:description.trim(), images, sellerRef, createdAt:now(), updatedAt:now() };
  store.products.push(product); res.status(201).json({ message:'Product listed successfully.', product });
});
router.get('/products/:productId', (req,res) => { const p=store.products.find(x=>x.id===req.params.productId); return p ? res.json({product:p}) : sendError(res,404,'Product not found.'); });
router.put('/products/:productId', (req,res) => {
  const p=store.products.find(x=>x.id===req.params.productId); if(!p) return sendError(res,404,'Product not found.');
  const allowed=['name','category','price','quantity','location','description','images'];
  const keys=Object.keys(req.body); if(!keys.length || keys.some(k=>!allowed.includes(k))) return sendError(res,400,'Provide valid product fields to update.');
  for(const k of ['name','category','location','description']) if(req.body[k]!==undefined && !isText(req.body[k])) return sendError(res,400,`${k} must be non-empty text.`);
  if(req.body.price!==undefined && !positiveNumber(req.body.price)) return sendError(res,400,'price must be positive.');
  if(req.body.quantity!==undefined && !nonNegativeInteger(req.body.quantity)) return sendError(res,400,'quantity must be a non-negative integer.');
  if(req.body.images!==undefined && (!Array.isArray(req.body.images)||!req.body.images.every(x=>typeof x==='string'))) return sendError(res,400,'images must be an array of strings.');
  for(const k of keys) p[k]=typeof req.body[k]==='string'?req.body[k].trim():req.body[k]; p.updatedAt=now(); res.json({message:'Product updated.',product:p});
});
router.delete('/products/:productId', (req,res) => { const i=store.products.findIndex(x=>x.id===req.params.productId); if(i<0)return sendError(res,404,'Product not found.'); const [product]=store.products.splice(i,1); res.json({message:'Product deleted.',product}); });

function getCart(cartId) { if(!store.carts.has(cartId)) store.carts.set(cartId,[]); return store.carts.get(cartId); }
function cartView(cartId) {
  const items=getCart(cartId).map(row=>{ const p=store.products.find(x=>x.id===row.productId); return p?{productId:p.id,name:p.name,unitPrice:p.price,quantity:row.quantity,availableStock:p.quantity,subtotal:p.price*row.quantity}:null; }).filter(Boolean);
  return {cartId,items,itemCount:items.reduce((n,x)=>n+x.quantity,0),total:items.reduce((n,x)=>n+x.subtotal,0)};
}
router.get('/cart/:cartId',(req,res)=>res.json(cartView(req.params.cartId)));
router.post('/cart/:cartId/items',(req,res)=>{
  const {productId,quantity}=req.body; if(!isText(productId)||!Number.isInteger(quantity)||quantity<=0)return sendError(res,400,'productId and positive integer quantity are required.');
  const p=store.products.find(x=>x.id===productId); if(!p)return sendError(res,404,'Product not found.');
  const cart=getCart(req.params.cartId), item=cart.find(x=>x.productId===productId), next=(item?.quantity||0)+quantity;
  if(next>p.quantity)return sendError(res,400,'Requested quantity exceeds available stock.');
  if(item)item.quantity=next;else cart.push({productId,quantity}); res.json({message:'Added to cart.',cart:cartView(req.params.cartId)});
});
router.patch('/cart/:cartId/items/:productId',(req,res)=>{
  const {quantity}=req.body; if(!Number.isInteger(quantity)||quantity<=0)return sendError(res,400,'quantity must be a positive integer.');
  const p=store.products.find(x=>x.id===req.params.productId); if(!p)return sendError(res,404,'Product not found.'); if(quantity>p.quantity)return sendError(res,400,'Requested quantity exceeds stock.');
  const item=getCart(req.params.cartId).find(x=>x.productId===p.id); if(!item)return sendError(res,404,'Item not in cart.'); item.quantity=quantity; res.json({cart:cartView(req.params.cartId)});
});
router.delete('/cart/:cartId/items/:productId',(req,res)=>{const c=getCart(req.params.cartId),i=c.findIndex(x=>x.productId===req.params.productId);if(i<0)return sendError(res,404,'Item not in cart.');c.splice(i,1);res.json({message:'Item removed.',cart:cartView(req.params.cartId)});});
router.delete('/cart/:cartId',(req,res)=>{store.carts.delete(req.params.cartId);res.json({message:'Cart cleared.'});});

router.post('/orders',(req,res)=>{
  const {cartId,delivery}=req.body;
  if(!isText(cartId)||!delivery||!['recipientFullName','phone','district','sector','detailedAddress'].every(k=>isText(delivery[k]))) return sendError(res,400,'cartId and complete delivery details are required.');
  const cart=cartView(cartId); if(!cart.items.length)return sendError(res,400,'Cart is empty.');
  for(const item of cart.items){const p=store.products.find(x=>x.id===item.productId);if(!p||p.quantity<item.quantity)return sendError(res,409,`Insufficient stock for ${item.name}.`);}
  // Single-process prototype only. Production must use a database transaction.
  for(const item of cart.items){const p=store.products.find(x=>x.id===item.productId);p.quantity-=item.quantity;p.updatedAt=now();}
  const order={id:id(),buyerRef:cartId,items:cart.items.map(({productId,name,unitPrice,quantity,subtotal})=>({productId,name,unitPrice,quantity,subtotal})),total:cart.total,delivery:{...delivery},deliveryMethod:null,status:'pending_seller_confirmation',history:[{status:'pending_seller_confirmation',at:now()}],createdAt:now(),updatedAt:now()};
  store.orders.push(order);store.carts.delete(cartId);res.status(201).json({message:'Order placed.',order});
});
router.get('/orders/my-orders/:buyerRef',(req,res)=>{const rows=store.orders.filter(o=>o.buyerRef===req.params.buyerRef);res.json({count:rows.length,orders:rows});});
router.get('/orders/seller/inbox',(req,res)=>res.json({count:store.orders.length,orders:store.orders}));
router.get('/orders/:orderId',(req,res)=>{const o=store.orders.find(x=>x.id===req.params.orderId);return o?res.json({order:o}):sendError(res,404,'Order not found.');});
router.patch('/orders/:orderId/decision',(req,res)=>{
  const o=store.orders.find(x=>x.id===req.params.orderId);if(!o)return sendError(res,404,'Order not found.');if(o.status!=='pending_seller_confirmation')return sendError(res,409,'Order already processed.');
  const {decision}=req.body;if(!['confirm','reject'].includes(decision))return sendError(res,400,'decision must be confirm or reject.');
  if(decision==='reject'){for(const item of o.items){const p=store.products.find(x=>x.id===item.productId);if(p)p.quantity+=item.quantity;}o.status='rejected';}else o.status='confirmed';
  o.updatedAt=now();o.history.push({status:o.status,at:now()});res.json({message:`Order ${o.status}.`,order:o});
});
router.patch('/orders/:orderId/delivery',(req,res)=>{
  const o=store.orders.find(x=>x.id===req.params.orderId);if(!o)return sendError(res,404,'Order not found.');if(o.status!=='confirmed')return sendError(res,409,'Only confirmed orders can select delivery.');
  const {method}=req.body;if(!['cliva_delivery','seller_delivery'].includes(method))return sendError(res,400,'method must be cliva_delivery or seller_delivery.');
  o.deliveryMethod=method;o.status='ready_for_delivery';o.updatedAt=now();o.history.push({status:o.status,at:now()});res.json({message:'Delivery method selected.',order:o});
});
router.patch('/orders/:orderId/status',(req,res)=>{
  const o=store.orders.find(x=>x.id===req.params.orderId);if(!o)return sendError(res,404,'Order not found.');
  const allowed={ready_for_delivery:['out_for_delivery'],out_for_delivery:['delivered']};const {status}=req.body;if(!allowed[o.status]?.includes(status))return sendError(res,409,'Invalid order status transition.');
  o.status=status;o.updatedAt=now();o.history.push({status,at:now()});res.json({message:'Order status updated.',order:o});
});
router.patch('/orders/:orderId/cancel',(req,res)=>{
  const o=store.orders.find(x=>x.id===req.params.orderId);if(!o)return sendError(res,404,'Order not found.');if(req.body.buyerRef!==o.buyerRef)return sendError(res,403,'Buyer reference does not match.');if(!['pending_seller_confirmation','confirmed'].includes(o.status))return sendError(res,409,'Order can no longer be cancelled.');
  for(const item of o.items){const p=store.products.find(x=>x.id===item.productId);if(p)p.quantity+=item.quantity;}o.status='cancelled';o.updatedAt=now();o.history.push({status:'cancelled',at:now()});res.json({message:'Order cancelled.',order:o});
});
module.exports=router;
