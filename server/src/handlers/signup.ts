import { eq } from 'drizzle-orm';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignupInput, type SignupResponse } from '../schema';

export async function signup(input: SignupInput): Promise<SignupResponse> {
  try {
    // Check if email already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUsers.length > 0) {
      return {
        success: false,
        message: 'Email already exists'
      };
    }

    // Hash password using Bun's built-in password hashing
    const passwordHash = await Bun.password.hash(input.password);

    // Create new user
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    const newUser = result[0];

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email
      }
    };
  } catch (error) {
    console.error('Signup failed:', error);
    throw error;
  }
}