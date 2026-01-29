// types/voucher.ts

export type VoucherType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ITEM' | 'BUY_X_GET_Y';

export interface Voucher {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: VoucherType;
    value: number;
    minPurchase: number;
    maxDiscount: number | null;
    usageLimit: number | null;
    usageCount: number;
    perUserLimit: number | null;
    validFrom: string;
    validUntil: string;
    active: boolean;
    applicableItems: number[] | null;
    createdAt: string;
    updatedAt: string;
}

export interface VoucherValidationResult {
    valid: boolean;
    message?: string;
    discount?: number;
    voucher?: Voucher;
}

export interface CreateVoucherInput {
    code: string;
    name: string;
    description?: string;
    type: VoucherType;
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    validFrom: Date;
    validUntil: Date;
    active?: boolean;
    applicableItems?: number[];
}
