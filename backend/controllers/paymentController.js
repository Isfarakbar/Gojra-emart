// @desc    Mock Payment Intent
// @route   POST /api/orders/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
    try {
        const { amount } = req.body;

        // SIMULATION: In a real app, you would use stripe.paymentIntents.create
        // const paymentIntent = await stripe.paymentIntents.create({
        //   amount: amount * 100, // cents
        //   currency: 'usd',
        // });

        // For Mock, we just return a fake ID and success status
        setTimeout(() => {
            res.json({
                clientSecret: 'mock_secret_' + Math.random().toString(36).substring(7),
                id: 'pi_mock_' + Math.random().toString(36).substring(7)
            });
        }, 1000); // Simulate network delay

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createPaymentIntent };
