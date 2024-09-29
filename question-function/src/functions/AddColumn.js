import { app } from '@azure/functions';
import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
import 'dotenv/config';

const tableName = 'QuestionsTable';
const account = process.env.STORAGE_ACCOUNT;
const accountKey = process.env.STORAGE_ACCOUNT_KEY;
const tableClient = new TableClient(`https://${account}.table.core.windows.net`, tableName, new AzureNamedKeyCredential(account, accountKey));

app.http('AddApprovedColumn', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('HTTP function triggered to add "approved" column with default value "false" to all entities.');

        try {
            const entities = tableClient.listEntities();

            for await (const entity of entities) {
                entity.approved = false; // Add the "approved" column with default value "false"
                await tableClient.updateEntity(entity, "Merge");
                context.log(`Updated entity with PartitionKey: ${entity.partitionKey} and RowKey: ${entity.rowKey}`);
            }

            return { status: 200, body: 'All entities updated with "approved" column set to "false".' };
        } catch (error) {
            context.log('Error updating entities in Table Storage', error);
            return { status: 500, body: 'Error updating entities in Table Storage' };
        }
    }
});

app.http('AddSourceColumn', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('HTTP function triggered to add "source" column with default value "chatGPT" to all entities.');

        try {
            const entities = tableClient.listEntities();

            for await (const entity of entities) {
                entity.source = "chatGPT"; // Add the "source" column with default value "chatGPT"
                await tableClient.updateEntity(entity, "Merge");
                context.log(`Updated entity with PartitionKey: ${entity.partitionKey} and RowKey: ${entity.rowKey}`);
            }

            return { status: 200, body: 'All entities updated with "source" column set to "chatGPT".' };
        } catch (error) {
            context.log('Error updating entities in Table Storage', error);
            return { status: 500, body: 'Error updating entities in Table Storage' };
        }
    }
});

app.http('AddCloudProviderColumn', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('HTTP function triggered to add "cloudProvider" column with default value "Azure" to all entities.');

        try {
            const entities = tableClient.listEntities();

            for await (const entity of entities) {
                entity.cloudProvider = "Azure"; // Add the "cloudProvider" column with default value "Azure"
                await tableClient.updateEntity(entity, "Merge");
                context.log(`Updated entity with PartitionKey: ${entity.partitionKey} and RowKey: ${entity.rowKey}`);
            }

            return { status: 200, body: 'All entities updated with "cloudProvider" column set to "Azure".' };
        } catch (error) {
            context.log('Error updating entities in Table Storage', error);
            return { status: 500, body: 'Error updating entities in Table Storage' };
        }
    }
});