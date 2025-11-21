
export type Milestone = {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    status: 'Completed' | 'In Progress' | 'Overdue' | 'Upcoming';
};

export const milestonesData: Milestone[] = [
    {
        id: '1',
        title: 'Groundbreak',
        description: 'Groundbreak',
        dueDate: 'August 15th, 2025',
        status: 'Completed',
    },
    {
        id: '2',
        title: 'Foundation Footing Pour',
        description: 'foundation piers footing',
        dueDate: 'August 29th, 2025',
        status: 'Completed',
    },
    {
        id: '3',
        title: 'Plumbing Underground',
        description: 'Plumbing Underground',
        dueDate: 'September 18th, 2025',
        status: 'Completed',
    },
    {
        id: '4',
        title: 'Foundation (slab) pour',
        description: 'Main slab pour',
        dueDate: 'September 23rd, 2025',
        status: 'Completed',
    },
    {
        id: '5',
        title: 'Partial Parking lot Pour ~30k sf',
        description: 'Partial Parking lot Pour ~30k sf',
        dueDate: 'September 25th, 2025',
        status: 'Completed',
    },
    {
        id: '6',
        title: 'Carlos finished making barjoists',
        description: 'Carlos finished making barjoists',
        dueDate: 'September 30th, 2025',
        status: 'Completed',
    },
    {
        id: '7',
        title: 'Carlos started Erecting',
        description: 'Carlos started Erecting',
        dueDate: 'October 30th, 2025',
        status: 'Overdue',
    },
];
