// __tests__/unit/voucher-calculation.test.ts
// Unit tests for Voucher discount calculation logic

describe('Voucher Discount Calculation', () => {

    // Helper: replicate the calculation logic from /api/vouchers/validate
    function calculateDiscount(
        type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ITEM' | 'BUY_X_GET_Y',
        value: number,
        cartTotal: number,
        maxDiscount: number | null
    ): number {
        let discount = 0;

        switch (type) {
            case 'PERCENTAGE':
                discount = (cartTotal * value) / 100;
                if (maxDiscount && discount > maxDiscount) {
                    discount = maxDiscount;
                }
                break;
            case 'FIXED_AMOUNT':
                discount = value;
                if (discount > cartTotal) {
                    discount = cartTotal;
                }
                break;
            case 'FREE_ITEM':
                discount = value;
                break;
            case 'BUY_X_GET_Y':
                discount = value;
                break;
        }

        return Math.round(discount);
    }

    // ============= PERCENTAGE =============
    describe('PERCENTAGE type', () => {
        it('should calculate 20% of 100,000 = 20,000', () => {
            expect(calculateDiscount('PERCENTAGE', 20, 100000, null)).toBe(20000);
        });

        it('should calculate 50% of 80,000 = 40,000', () => {
            expect(calculateDiscount('PERCENTAGE', 50, 80000, null)).toBe(40000);
        });

        it('should calculate 10% of 250,000 = 25,000', () => {
            expect(calculateDiscount('PERCENTAGE', 10, 250000, null)).toBe(25000);
        });

        it('should cap discount at maxDiscount (50% of 500,000 = 250,000, cap 100,000)', () => {
            expect(calculateDiscount('PERCENTAGE', 50, 500000, 100000)).toBe(100000);
        });

        it('should not cap when discount < maxDiscount', () => {
            expect(calculateDiscount('PERCENTAGE', 10, 100000, 50000)).toBe(10000);
        });

        it('should return 0 when percentage is 0', () => {
            expect(calculateDiscount('PERCENTAGE', 0, 100000, null)).toBe(0);
        });

        it('should handle 100% discount (full discount)', () => {
            expect(calculateDiscount('PERCENTAGE', 100, 50000, null)).toBe(50000);
        });

        it('should handle 100% with maxDiscount cap', () => {
            expect(calculateDiscount('PERCENTAGE', 100, 50000, 30000)).toBe(30000);
        });
    });

    // ============= FIXED_AMOUNT =============
    describe('FIXED_AMOUNT type', () => {
        it('should apply exact fixed discount', () => {
            expect(calculateDiscount('FIXED_AMOUNT', 25000, 100000, null)).toBe(25000);
        });

        it('should cap discount to cartTotal when discount > cartTotal', () => {
            expect(calculateDiscount('FIXED_AMOUNT', 50000, 30000, null)).toBe(30000);
        });

        it('should return 0 for zero value', () => {
            expect(calculateDiscount('FIXED_AMOUNT', 0, 100000, null)).toBe(0);
        });

        it('should handle exact match (discount === cartTotal)', () => {
            expect(calculateDiscount('FIXED_AMOUNT', 50000, 50000, null)).toBe(50000);
        });
    });

    // ============= FREE_ITEM =============
    describe('FREE_ITEM type', () => {
        it('should return value as discount', () => {
            expect(calculateDiscount('FREE_ITEM', 25000, 100000, null)).toBe(25000);
        });
    });

    // ============= BUY_X_GET_Y =============
    describe('BUY_X_GET_Y type', () => {
        it('should return value as discount', () => {
            expect(calculateDiscount('BUY_X_GET_Y', 20000, 100000, null)).toBe(20000);
        });
    });

    // ============= EDGE CASES =============
    describe('Edge Cases', () => {
        it('should handle zero cart total', () => {
            expect(calculateDiscount('PERCENTAGE', 50, 0, null)).toBe(0);
        });

        it('should handle very large amounts', () => {
            expect(calculateDiscount('PERCENTAGE', 10, 999999999, null)).toBe(100000000);
        });

        it('should round fractional discounts', () => {
            // 15% of 33,333 = 4999.95, rounded to 5000
            expect(calculateDiscount('PERCENTAGE', 15, 33333, null)).toBe(5000);
        });
    });
});
