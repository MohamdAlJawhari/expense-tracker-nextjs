'use server';
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface TransactionData {
    text: string;
    amount: number;
}

interface TransactionResult {
    data?: TransactionData;
    error?: string;
}

async function addTransaction(formData: FormData): Promise<TransactionResult> {
    const textValue = formData.get('text'); // Ensure text is a string
    const amountValue = formData.get('amount'); // Parse amount as a number

    // Get logged in user
    const { userId } = await auth();

    // Check for user
    if (!userId) {
        return { error: 'User not found' }
    }

    // Check for input values
    if (!textValue || textValue === '' || !amountValue) {
        return { error: "Text or amount is missing!!!" };
    }
    const text: string = textValue.toString(); // Ensure text is a string
    const amount: number = parseFloat(amountValue.toString()) // Parse amount as number

    try {
        const transactionData: TransactionData = await db.transaction.create({
            data: {
                text,
                amount,
                userId
            }
        })

        revalidatePath('/')
        return { data: transactionData }

    } catch (error) {
        return { error: 'Transaction not added!!!' }
    }

}

export default addTransaction;