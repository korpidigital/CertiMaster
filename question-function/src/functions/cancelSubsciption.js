import { app } from '@azure/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

app.http('cancelSubscription', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request to cancel subscription.');

        try {
            const { email } = await request.json();

            // Find the customer in Stripe
            const customers = await stripe.customers.list({ email: email, limit: 1 });
            if (customers.data.length === 0) {
                return { status: 404, body: 'Customer not found' };
            }
            const customer = customers.data[0];

            // Find the customer's subscription
            const subscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'active',
                limit: 1
            });

            if (subscriptions.data.length === 0) {
                return { status: 404, body: 'No active subscription found' };
            }

            const subscription = subscriptions.data[0];

            // Cancel the subscription
            const canceledSubscription = await stripe.subscriptions.cancel(subscription.id);

            // Update your database or perform any other necessary actions here

            return { status: 200, body: JSON.stringify({ message: 'Subscription cancelled successfully', subscription: canceledSubscription }) };
        } catch (error) {
            context.log('Error cancelling subscription:', error);
            return { status: 500, body: JSON.stringify({ error: 'Failed to cancel subscription' }) };
        }
    }
});