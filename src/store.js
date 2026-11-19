// Development-only in-memory store. Data is lost whenever the server restarts.
// Replace this adapter with Member 2's selected database before deployment.
const store = {
  products: [], carts: new Map(), orders: [],
  services: [], bookings: [], jobs: [], applications: [],
  conversations: [], messages: [], notifications: [], reports: [],
  users: []
};
module.exports = store;
