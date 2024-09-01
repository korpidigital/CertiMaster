import { app } from '@azure/functions';
import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
import 'dotenv/config';

const tableName = 'QuestionsTable';
const account = process.env.STORAGE_ACCOUNT;
const accountKey = process.env.STORAGE_ACCOUNT_KEY;
const tableClient = new TableClient(`https://${account}.table.core.windows.net`, tableName, new AzureNamedKeyCredential(account, accountKey));

app.http('GetTotalCounts', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`HTTP function processed request for URL "${request.url}"`);

        try {
            let certificationSet = new Set();
            let totalQuestions = 0;

            // Fetch all entities from Azure Table Storage
            const entities = tableClient.listEntities();

            for await (const entity of entities) {
                certificationSet.add(entity.PartitionKey);
                totalQuestions++;
            }

            const counts = {
                certificationCount: certificationSet.size,
                questionCount: totalQuestions
            };

            return {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(counts)
            };
        } catch (error) {
            context.log('Error retrieving counts from Table Storage', error);
            return { status: 500, body: 'Error retrieving counts from Table Storage' };
        }
    }
});