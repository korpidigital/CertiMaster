import { app } from '@azure/functions';
import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
import 'dotenv/config';

const tableName = 'QuestionsTable';
const account = process.env.STORAGE_ACCOUNT;
const accountKey = process.env.STORAGE_ACCOUNT_KEY;
const tableClient = new TableClient(`https://${account}.table.core.windows.net`, tableName, new AzureNamedKeyCredential(account, accountKey));

app.http('GetQuestions', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`HTTP function processed request for URL "${request.url}"`);

        const url = new URL(request.url);
        const certification = url.searchParams.get('certification');

        console.log('Request URL:', request.url);
        console.log('Certification:', certification);

        if (!certification) {
            return { status: 400, body: 'Certification parameter is required' };
        }

        try {
            let questions = [];

            // Fetch data from Azure Table Storage
            const entities = tableClient.listEntities({
                queryOptions: {
                    filter: `PartitionKey eq '${certification}'`
                }
            });

            for await (const entity of entities) {

                // Since options and correctAnswer are strings, do not parse them
                const options = entity.options; // Assuming the string is a valid JSON array
                const correctAnswer = entity.correctAnswer; // Assuming the string is a valid JSON array

                const question = {
                    id: entity.rowKey,
                    certification: entity.certification,
                    topic: entity.topic,
                    subtopic: entity.subtopic,
                    detail: entity.detail,
                    type: entity.type,
                    question: entity.question,
                    options: options,
                    correctAnswer: correctAnswer,
                    explanation: entity.explanation,
                    order: entity.order,
                    approved: entity.approved
                };

                questions.push(question);
            }

            if (questions.length === 0) {
                return { status: 404, body: 'No questions found for the specified certification' };
            }

            // Check if each question in the array is a valid JSON object
            let allValid = true;
            for (const question of questions) {
                try {
                    JSON.stringify(question); // Attempt to convert the object to a JSON string
                } catch (error) {
                    allValid = false;
                    context.log('Invalid JSON object detected:', question);
                    break; // No need to continue if one is invalid
                }
            }

            if (!allValid) {
                return { status: 500, body: 'One or more questions contain invalid JSON.' };
            }

            console.log('All questions are valid JSON.');
            return {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(questions)
            };
        } catch (error) {
            context.log('Error retrieving questions from Table Storage', error);
            return { status: 500, body: 'Error retrieving questions from Table Storage' };
        }
    }
});