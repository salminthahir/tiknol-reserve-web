// __tests__/unit/employee-id-generation.test.ts
// Unit tests for Employee sequential ID generation logic

/**
 * Extracted ID generation logic from /api/admin/employees POST handler
 */
function generateNextEmployeeId(lastEmployeeId: string | null): string {
    let newId = 'EMP-001';
    if (lastEmployeeId) {
        const lastNumber = parseInt(lastEmployeeId.replace('EMP-', ''));
        if (!isNaN(lastNumber)) {
            newId = `EMP-${String(lastNumber + 1).padStart(3, '0')}`;
        }
    }
    return newId;
}

describe('Employee ID Generation', () => {

    describe('First employee (no existing data)', () => {
        it('should return EMP-001 when no employees exist', () => {
            expect(generateNextEmployeeId(null)).toBe('EMP-001');
        });
    });

    describe('Sequential increment', () => {
        it('should return EMP-002 after EMP-001', () => {
            expect(generateNextEmployeeId('EMP-001')).toBe('EMP-002');
        });

        it('should return EMP-006 after EMP-005', () => {
            expect(generateNextEmployeeId('EMP-005')).toBe('EMP-006');
        });

        it('should return EMP-010 after EMP-009', () => {
            expect(generateNextEmployeeId('EMP-009')).toBe('EMP-010');
        });

        it('should return EMP-100 after EMP-099', () => {
            expect(generateNextEmployeeId('EMP-099')).toBe('EMP-100');
        });

        it('should return EMP-1000 after EMP-999 (rollover to 4 digits)', () => {
            expect(generateNextEmployeeId('EMP-999')).toBe('EMP-1000');
        });
    });

    describe('Zero padding', () => {
        it('should pad single digits (EMP-001)', () => {
            const id = generateNextEmployeeId(null);
            expect(id).toMatch(/^EMP-\d{3,}$/);
        });

        it('should pad double digits (EMP-010)', () => {
            const id = generateNextEmployeeId('EMP-009');
            expect(id).toBe('EMP-010');
        });

        it('should not pad 4+ digits (EMP-1000)', () => {
            const id = generateNextEmployeeId('EMP-999');
            expect(id.length).toBe(8); // "EMP-1000"
        });
    });

    describe('Edge cases', () => {
        it('should handle invalid lastId format gracefully', () => {
            // If parseInt fails (NaN), should fallback to EMP-001
            expect(generateNextEmployeeId('EMP-abc')).toBe('EMP-001');
        });

        it('should handle empty string', () => {
            // Empty string after replace -> NaN -> fallback
            expect(generateNextEmployeeId('EMP-')).toBe('EMP-001');
        });
    });
});
