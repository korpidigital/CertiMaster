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

app.http('UpdateQuestionApproval', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`HTTP PUT function processed request for URL "${request.url}"`);

        const { id, certification, approved } = await request.json();

        if (!id || !certification) {
            return { status: 400, body: 'ID and Certification parameters are required' };
        }

        try {
            context.log(`Fetching entity with PartitionKey: ${certification}, RowKey: ${id}`);
            // Fetch the existing entity using the certification as the PartitionKey and id as the RowKey
            const entity = await tableClient.getEntity(certification, id);

            if (!entity) {
                context.log(`Entity not found for PartitionKey: ${certification}, RowKey: ${id}`);
                return { status: 404, body: 'Question not found' };
            }

            // Update the approved property
            context.log(`Current approved status: ${entity.approved}`);
            entity.approved = approved;
            context.log(`Updated approved status to: ${entity.approved}`);

            // Update the entity in the table storage
            await tableClient.updateEntity(entity, 'Merge');

            context.log('Entity updated successfully.');
            return { status: 200, body: 'Question approval status updated successfully' };
        } catch (error) {
            context.log('Error updating approval status in Table Storage', error);
            return { status: 500, body: 'Error updating approval status in Table Storage' };
        }
    }
});