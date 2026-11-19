const { randomUUID } = require('crypto');
const id = () => randomUUID();
const now = () => new Date().toISOString();
const isText = value => typeof value === 'string' && value.trim().length > 0;
const positiveNumber = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
const nonNegativeInteger = value => Number.isInteger(value) && value >= 0;
const sendError = (res, status, message) => res.status(status).json({ message });
module.exports = { id, now, isText, positiveNumber, nonNegativeInteger, sendError };
