import { buyVoucherSchema } from '../modules/vouchers/vouchers.validator';

describe('buyVoucherSchema', () => {
  it('accepts a valid UUID', () => {
    const result = buyVoucherSchema.safeParse({ voucherId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
  });

  it('rejects missing voucherId', () => {
    const result = buyVoucherSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID string', () => {
    const result = buyVoucherSchema.safeParse({ voucherId: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/tidak valid/i);
    }
  });

  it('rejects null voucherId', () => {
    const result = buyVoucherSchema.safeParse({ voucherId: null });
    expect(result.success).toBe(false);
  });
});
