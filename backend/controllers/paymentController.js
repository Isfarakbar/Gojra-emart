// Online payments are intentionally disabled for the COD-only launch.
const createPaymentIntent = async (req, res) => {
    res.status(410).json({ message: 'Online payments are disabled. Cash on Delivery is the only supported payment method.' });
};

module.exports = { createPaymentIntent };
