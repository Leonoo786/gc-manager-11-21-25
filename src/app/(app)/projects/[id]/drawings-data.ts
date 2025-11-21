
export type Drawing = {
    id: string;
    sheetNumber: string;
    title: string;
    version: string;
    date: string;
    description: string;
};

export const drawingsData: Drawing[] = [
    {
        id: '1',
        sheetNumber: 'A-101',
        title: 'First Floor Plan',
        version: 'Ver. 3',
        date: '2024-06-15',
        description: 'Issued for Construction',
    },
    {
        id: '2',
        sheetNumber: 'A-102',
        title: 'Second Floor Plan',
        version: 'Ver. 2',
        date: '2024-05-20',
        description: 'Issued for Bid',
    },
    {
        id: '3',
        sheetNumber: 'S-201',
        title: 'Foundation Details',
        version: 'Ver. 1',
        date: '2024-04-01',
        description: 'Initial Release',
    },
];
