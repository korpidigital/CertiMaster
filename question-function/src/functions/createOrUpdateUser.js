import { app } from '@azure/functions';
import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
import Stripe from 'stripe';

const tableName = 'UsersTable';
const account = process.env.STORAGE_ACCOUNT;
const accountKey = process.env.STORAGE_ACCOUNT_KEY;
const credential = new AzureNamedKeyCredential(account, accountKey);
const tableClient = new TableClient(`https://${account}.table.core.windows.net`, tableName, credential);

const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

app.http('createOrUpdateUser', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('Processing createOrUpdateUser request');
    try {
      const { email, homeAccountId, displayName } = await request.json();

      if (!email || !homeAccountId) {
        context.log('Invalid request. Missing required fields.');
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid request. Email and homeAccountId are required.' })
        };
      }

      context.log(`Processing request for user: ${email}, Home Account ID: ${homeAccountId}`);

      let existingEntity = null;
      try {
        existingEntity = await tableClient.getEntity('Users', homeAccountId);
        context.log(`User ${email} found in the table with existing data: ${JSON.stringify(existingEntity)}`);
      } catch (error) {
        if (error.statusCode === 404) {
          context.log(`User ${email} not found in the table. Creating a new entry.`);
        } else {
          throw error;
        }
      }

      let stripeSubscriptionStatus = 'inactive';
      try {
        const customers = await stripe.customers.list({ email });
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
          });
          const activeSubscription = subscriptions.data.find(
            (sub) => sub.status === 'active' || sub.status === 'trialing'
          );
          if (activeSubscription) {
            stripeSubscriptionStatus = activeSubscription.status;
          }
        }
      } catch (error) {
        context.log(`Error retrieving subscription status from Stripe: ${error.message}`);
        // Continue with inactive status
      }

      const entity = {
        partitionKey: 'Users',
        rowKey: homeAccountId,
        email,
        displayName: displayName || '',
        subscriptionStatus: stripeSubscriptionStatus,
        lastUpdated: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await tableClient.upsertEntity(entity);
      context.log(`User ${email} has been added or updated in the UsersTable.`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `User ${email} has been successfully created or updated.`,
          subscriptionStatus: stripeSubscriptionStatus
        })
      };
    } catch (error) {
      context.log(`Error in createOrUpdateUser: ${error.message}`);
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Internal Server Error: ${error.message}` })
      };
    }
  },
});