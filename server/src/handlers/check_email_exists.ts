import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // Query the database to check if a user with the given email exists
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1)
      .execute();

    // Return true if any user found, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Email existence check failed:', error);
    throw error;
  }
}