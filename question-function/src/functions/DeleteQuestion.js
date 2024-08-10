import { app } from '@azure/functions';
import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
import 'dotenv/config';

const tableName = 'QuestionsTable';
const account = process.env.STORAGE_ACCOUNT;
const accountKey = process.env.STORAGE_ACCOUNT_KEY;
const tableClient = new TableClient(
    `https://${account}.table.core.windows.net`,
    tableName,
    new AzureNamedKeyCredential(account, accountKey)
);

app.http('DeleteQuestion', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`HTTP DELETE function processed request for URL "${request.url}"`);

        const { id, certification } = await request.json();

        if (!id || !certification) {
            return { status: 400, body: 'ID and PartitionKey parameters are required' };
        }

        try {
            // Fetch the entity with the provided PartitionKey and RowKey (ID)
            const entity = await tableClient.getEntity(certification, id);

            if (!entity) {
                return { status: 404, body: 'Question not found' };
            }

            // Delete the entity
            await tableClient.deleteEntity(certification, id);

            return { status: 200, body: 'Question deleted successfully' };
        } catch (error) {
            context.log('Error deleting the question from Table Storage', error);
            return { status: 500, body: 'Error deleting the question from Table Storage' };
        }
    }
});