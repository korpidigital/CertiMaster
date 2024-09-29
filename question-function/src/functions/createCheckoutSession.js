import { app } from '@azure/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

app.http('createCheckoutSession', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Processing Stripe checkout session for request: "${request.url}"`);

    try {
      const { priceId, email } = await request.json();
      context.log(`Creating Stripe Checkout session for email: ${email}, priceId: ${priceId}`);

      if (!priceId || !email) {
        context.log(`Invalid request. Missing required fields: priceId and email are required.`);
        return {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Invalid request. priceId and email are required.' }),
        };
      }

      // Find or create a customer
      let customer = await stripe.customers.list({ email: email, limit: 1 });
      if (customer.data.length === 0) {
        customer = await stripe.customers.create({ email: email });
      } else {
        customer = customer.data[0];
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        customer: customer.id,
        success_url: 'http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:5173/',
      });

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: session.id }),
      };
    } catch (error) {
      context.log(`Error creating Stripe Checkout session: ${error.message}`);
      return {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: error.message }),
      };
    }
  },
});