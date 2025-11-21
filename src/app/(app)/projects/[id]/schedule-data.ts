
export type ScheduleItem = {
    id: string;
    task: string;
    assignee: string;
    status: 'To Do' | 'In Progress';
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string;
};

export const scheduleData: ScheduleItem[] = [
    {
        id: '1',
        task: 'Install steel decking',
        assignee: 'Unassigned',
        status: 'To Do',
        priority: 'High',
        dueDate: 'Nov 6, 2025',
    },
    {
        id: '2',
        task: 'Finalize Fuel System with Coastal and then OWNERS',
        assignee: 'Rahim Momin',
        status: 'In Progress',
        priority: 'High',
        dueDate: 'Nov 2, 2025',
    },
    {
        id: '3',
        task: 'Finalize the gas price sign with the sub',
        assignee: 'Rahim Momin',
        status: 'In Progress',
        priority: 'High',
        dueDate: 'Nov 2, 2025',
    },
    {
        id: '4',
        task: '1st draw request',
        assignee: 'Asif Momin',
        status: 'To Do',
        priority: 'Low',
        dueDate: 'Nov 2, 2025',
    },
];
