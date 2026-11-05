const { Cashfree, CFEnvironment } = require('cashfree-pg');

/**
 * Cashfree Payment Gateway Service
 * Handles order creation, payment status polling, and webhook verification.
 */

function getCashfreeClient() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const isProduction = (process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION').toUpperCase() === 'PRODUCTION';
  const environment = isProduction ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

  if (!appId || !secretKey) {
    return null;
  }

  return new Cashfree(environment, appId, secretKey);
}

function isConfigured() {
  return !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}

/**
 * Create a new payment order with Cashfree PG
 * @param {Object} params
 * @param {string} params.orderId - Unique order identifier (e.g., SI_BOOK_...)
 * @param {number} params.orderAmount - Amount in INR
 * @param {string} params.customerId - Customer identifier
 * @param {string} params.customerName - Name of the customer
 * @param {string} params.customerEmail - Email of the customer
 * @param {string} params.customerPhone - Phone number (10 digits)
 * @param {string} params.returnUrl - URL to redirect after payment
 * @param {string} [params.notifyUrl] - Webhook URL
 */
async function createPaymentOrder({
  orderId,
  orderAmount,
  amount,
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  returnUrl,
  notifyUrl,
  orderNote
}) {
  const client = getCashfreeClient();
  if (!client) {
    throw new Error('Cashfree credentials are not configured in environment');
  }

  const resolvedAmount = Number(orderAmount ?? amount);

  // Format phone: remove any spaces, dashes, +91 if present
  let cleanPhone = (customerPhone || '9999999999').replace(/[^0-9]/g, '');
  if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
    cleanPhone = cleanPhone.slice(2);
  }
  if (cleanPhone.length !== 10) {
    cleanPhone = '9999999999'; // fallback safe 10 digits
  }

  const cleanEmail = (customerEmail && customerEmail.includes('@')) 
    ? customerEmail.trim() 
    : 'care@unfoldinn.com';

  const orderMeta = {
    return_url: returnUrl || `${process.env.FRONTEND_URL || 'https://www.unfoldinn.com'}/book/status?order_id={order_id}`,
    payment_methods: 'cc,dc,upi,nb,app'
  };

  // Cashfree in PRODUCTION strictly requires notify_url to be an HTTPS URL.
  // Only include notify_url if it is a valid https URL.
  let resolvedNotify = notifyUrl;
  if (!resolvedNotify && process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith('https://')) {
    resolvedNotify = `${process.env.BACKEND_URL}/api/payment/webhook`;
  } else if (!resolvedNotify) {
    resolvedNotify = 'https://second-innings-eight.vercel.app/api/payment/webhook';
  }

  if (resolvedNotify && resolvedNotify.startsWith('https://')) {
    orderMeta.notify_url = resolvedNotify;
  }

  const orderRequest = {
    order_id: String(orderId),
    order_amount: resolvedAmount,
    order_currency: 'INR',
    customer_details: {
      customer_id: String(customerId || `CUST_${Date.now()}`),
      customer_name: (customerName || 'Unfoldinn Guest').trim(),
      customer_email: cleanEmail,
      customer_phone: cleanPhone
    },
    order_meta: orderMeta,
    order_note: orderNote || 'Unfoldinn Mentoring Session'
  };

  try {
    const response = await client.PGCreateOrder(orderRequest);
    return response.data;
  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message;
    console.error('Cashfree PGCreateOrder Error:', errorDetails);
    throw new Error(errorDetails?.message || error.message || 'Failed to create Cashfree order');
  }
}

/**
 * Fetch status of an order from Cashfree
 * @param {string} orderId
 */
async function getOrderDetails(orderId) {
  const client = getCashfreeClient();
  if (!client) throw new Error('Cashfree not configured');

  try {
    const response = await client.PGFetchOrder(orderId);
    return response.data;
  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message;
    console.error('Cashfree PGFetchOrder Error:', errorDetails);
    throw new Error(errorDetails?.message || 'Failed to fetch order details');
  }
}

/**
 * Fetch payments for an order from Cashfree
 * @param {string} orderId
 */
async function getOrderPayments(orderId) {
  const client = getCashfreeClient();
  if (!client) throw new Error('Cashfree not configured');

  try {
    const response = await client.PGOrderFetchPayments(orderId);
    return response.data;
  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message;
    console.error('Cashfree PGOrderFetchPayments Error:', errorDetails);
    throw new Error(errorDetails?.message || 'Failed to fetch order payments');
  }
}

/**
 * Verify Cashfree Webhook Signature
 */
function verifyWebhookSignature(signature, rawBody, timestamp) {
  const client = getCashfreeClient();
  if (!client) return false;

  try {
    return client.PGVerifyWebhookSignature(signature, rawBody, timestamp);
  } catch (error) {
    console.error('Cashfree webhook signature verification failed:', error.message);
    return false;
  }
}

module.exports = {
  isConfigured,
  createPaymentOrder,
  createCashfreeOrder: createPaymentOrder,
  getOrderDetails,
  fetchCashfreeOrder: getOrderDetails,
  getOrderPayments,
  fetchCashfreeOrderPayments: getOrderPayments,
  verifyWebhookSignature
};
