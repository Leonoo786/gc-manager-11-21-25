
export type ReimbursableExpense = {
    id: string;
    date: string;
    category: string;
    vendor: string;
    description: string;
    paymentMethod: string;
    reference: string;
    invoiceNumber: string;
    amount: number;
};

export const getReimbursedData: ReimbursableExpense[] = [
    {
        id: '1',
        date: 'Nov 4, 2025',
        category: 'Utilities',
        vendor: 'City Of Temple TX',
        description: 'Temporary fire hydrant water meter usage fee acct# 41333-0',
        paymentMethod: 'Company Credit Card',
        reference: '5663',
        invoiceNumber: '4228517',
        amount: 298.78,
    },
    {
        id: '2',
        date: 'Oct 3, 2025',
        category: 'Utilities',
        vendor: 'City Of Temple TX',
        description: 'Temporary fire hydrant water meter usage fee acct# 41333-0',
        paymentMethod: 'Credit Card',
        reference: '5663',
        invoiceNumber: '4015841',
        amount: 177.59,
    },
    {
        id: '3',
        date: 'Aug 18, 2025',
        category: 'Permits',
        vendor: 'TO BE PAID',
        description: 'Temporary fire hydrant water meter',
        paymentMethod: 'Company Credit Card',
        reference: '5663',
        invoiceNumber: '13',
        amount: 600.00,
    },
];
