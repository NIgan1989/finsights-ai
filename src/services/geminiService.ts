import { GoogleGenerativeAI } from '@google/generative-ai';
import { Transaction, FinancialReport } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("REACT_APP_GEMINI_API_KEY is not set");
}
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const categorizeTransactions = async (transactions: Transaction[]): Promise<Transaction[]> => {
    const prompt = `Please categorize the following transactions based on their descriptions. The categories are: ${Object.keys(EXPENSE_CATEGORIES).join(', ')}. Return a JSON array of transactions with the "category" field populated. For example: [{"date":"2023-01-15","description":"Coffee Shop","amount":-5.5,"category":"Food"}]. Transactions: ${JSON.stringify(transactions.map(t => ({ ...t, category: undefined })))}`;

    try {
        const chat = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });

        // @ts-ignore
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        const categorized = JSON.parse(text);
        return categorized;
    } catch (error) {
        console.error('Error categorizing transactions:', error);
        return transactions;
    }
};

export const generateFinancialReport = async (transactions: Transaction[]): Promise<FinancialReport | null> => {
    const prompt = `Based on the following transactions, generate a financial report with income, expenses, savings, and a brief summary. Transactions: ${JSON.stringify(transactions)}. Return a JSON object like this: {"income": 1000, "expenses": 500, "savings": 500, "summary": "..."}`;

    try {
        const chat = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });
        // @ts-ignore
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();
        return JSON.parse(text);
    } catch (error) {
        console.error('Error generating financial report:', error);
        return null;
    }
};


export const getClarificationForTransaction = async (transaction: Transaction): Promise<string> => {
    const prompt = `The category for the transaction "${transaction.description}" with amount ${transaction.amount} is unclear. Ask a clarifying question to help categorize it better. For example: 'What kind of items were purchased at this store?'`;

    try {
        const chat = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });
        // @ts-ignore
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error('Error getting clarification:', error);
        return 'Could not get clarification.';
    }
};

export const getResponseToUserMessage = async (message: string, transactions: Transaction[]): Promise<string> => {
    const prompt = `You are a financial assistant. The user said: "${message}". Here are the recent transactions: ${JSON.stringify(transactions)}. Provide a helpful response.`;

    try {
        const chat = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });
        // @ts-ignore
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error('Error getting AI response:', error);
        return "I'm having trouble connecting to my brain right now. Please try again later.";
    }
};
