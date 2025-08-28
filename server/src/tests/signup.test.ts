import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignupInput } from '../schema';
import { signup } from '../handlers/signup';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: SignupInput = {
  email: 'test@example.com',
  password: 'password123',
  confirmPassword: 'password123'
};

describe('signup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully create a new user', async () => {
    const result = await signup(testInput);

    // Verify response structure
    expect(result.success).toBe(true);
    expect(result.message).toBe('User registered successfully');
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe('test@example.com');
    expect(result.user?.id).toBeDefined();
    expect(typeof result.user?.id).toBe('number');
  });

  it('should save user to database with hashed password', async () => {
    const result = await signup(testInput);

    // Query database to verify user was created
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user!.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.password_hash).toBeDefined();
    expect(savedUser.password_hash).not.toBe('password123'); // Password should be hashed
    expect(savedUser.password_hash.length).toBeGreaterThan(20); // Hashed passwords are longer
    expect(savedUser.created_at).toBeInstanceOf(Date);
  });

  it('should verify password is properly hashed', async () => {
    const result = await signup(testInput);

    // Get the saved user
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user!.id))
      .execute();

    const savedUser = users[0];
    
    // Verify password can be verified using Bun's password verification
    const isPasswordValid = await Bun.password.verify('password123', savedUser.password_hash);
    expect(isPasswordValid).toBe(true);

    // Verify wrong password fails
    const isWrongPasswordValid = await Bun.password.verify('wrongpassword', savedUser.password_hash);
    expect(isWrongPasswordValid).toBe(false);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await signup(testInput);

    // Attempt to create second user with same email
    const duplicateInput: SignupInput = {
      email: 'test@example.com',
      password: 'differentpassword',
      confirmPassword: 'differentpassword'
    };

    const result = await signup(duplicateInput);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Email already exists');
    expect(result.user).toBeUndefined();
  });

  it('should handle different email cases as separate users', async () => {
    // Create user with lowercase email
    await signup(testInput);

    // Create user with uppercase email (should be treated as different)
    const upperCaseInput: SignupInput = {
      email: 'TEST@EXAMPLE.COM',
      password: 'password456',
      confirmPassword: 'password456'
    };

    const result = await signup(upperCaseInput);

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('TEST@EXAMPLE.COM');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should handle various valid email formats', async () => {
    const emailTests = [
      'user.name@domain.com',
      'user+tag@domain.co.uk',
      'user123@subdomain.domain.org'
    ];

    for (let i = 0; i < emailTests.length; i++) {
      const email = emailTests[i];
      const input: SignupInput = {
        email,
        password: `password${i}`,
        confirmPassword: `password${i}`
      };

      const result = await signup(input);

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe(email);
    }

    // Verify all users were created
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(emailTests.length);
  });

  it('should generate unique IDs for multiple users', async () => {
    const user1Input: SignupInput = {
      email: 'user1@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };

    const user2Input: SignupInput = {
      email: 'user2@example.com',
      password: 'password456',
      confirmPassword: 'password456'
    };

    const result1 = await signup(user1Input);
    const result2 = await signup(user2Input);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.user?.id).not.toBe(result2.user?.id);
    expect(typeof result1.user?.id).toBe('number');
    expect(typeof result2.user?.id).toBe('number');
  });
});