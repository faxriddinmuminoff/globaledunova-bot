import { describe, it, expect } from 'vitest';
import {
  getOrCreateUser,
  updateUserPhone,
  updateUserLanguage,
} from '../../src/database/repositories/user.repository';
import { useFreshMemoryStorage } from '../helpers/test-storage';

describe('user repository', () => {
  useFreshMemoryStorage();

  it('creates and updates users', async () => {
    const user = await getOrCreateUser(12001, 'User Repo');
    expect(user.telegram_id).toBe(12001);

    const withPhone = await updateUserPhone(12001, '+998901112233', 'User Repo');
    expect(withPhone?.phone_number).toBe('+998901112233');

    const withLang = await updateUserLanguage(12001, 'uz');
    expect(withLang?.language).toBe('uz');
  });
});
