import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { checkEmailExists } from '../handlers/check_email_exists';

describe('checkEmailExists', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return false for non-existent email', async () => {
    const result = await checkEmailExists('nonexistent@example.com');
    expect(result).toBe(false);
  });

  it('should return true for existing email', async () => {
    // Create a test user first
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .execute();

    const result = await checkEmailExists('test@example.com');
    expect(result).toBe(true);
  });

  it('should be case sensitive', async () => {
    // Create a test user with lowercase email
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .execute();

    // Check with uppercase - should return false (case sensitive)
    const result = await checkEmailExists('TEST@EXAMPLE.COM');
    expect(result).toBe(false);

    // Check with exact case - should return true
    const exactResult = await checkEmailExists('test@example.com');
    expect(exactResult).toBe(true);
  });

  it('should handle multiple users correctly', async () => {
    // Create multiple test users
    await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hashed_password1'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hashed_password2'
        }
      ])
      .execute();

    // Check existing emails
    expect(await checkEmailExists('user1@example.com')).toBe(true);
    expect(await checkEmailExists('user2@example.com')).toBe(true);

    // Check non-existing email
    expect(await checkEmailExists('user3@example.com')).toBe(false);
  });

  it('should handle empty string email', async () => {
    const result = await checkEmailExists('');
    expect(result).toBe(false);
  });

  it('should handle email with special characters', async () => {
    const specialEmail = 'test+special.email-123@sub.example.co.uk';
    
    // Create user with special email
    await db.insert(usersTable)
      .values({
        email: specialEmail,
        password_hash: 'hashed_password'
      })
      .execute();

    const result = await checkEmailExists(specialEmail);
    expect(result).toBe(true);

    // Check similar but different email
    const similarEmail = 'test+special.email-124@sub.example.co.uk';
    const similarResult = await checkEmailExists(similarEmail);
    expect(similarResult).toBe(false);
  });
});