
export type TeamMember = {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatarUrl: string;
  fallback: string;
};

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Rahim Momin',
    role: 'President',
    email: 'rahimfancy1@gmail.com',
    phone: '2814554700',
    avatarUrl: 'https://picsum.photos/seed/rahim/128/128',
    fallback: 'RM',
  },
  {
    id: 2,
    name: 'Asif Momin',
    role: 'VP',
    email: 'asifmomin786@gmail.com',
    phone: '2814508657',
    avatarUrl: 'https://picsum.photos/seed/asif/128/128',
    fallback: 'AM',
  },
  {
    id: 3,
    name: 'Karim Noorani',
    role: 'Field Manager',
    email: 'fancybuilders786@gmail.com',
    phone: '2816911043',
    avatarUrl: 'https://picsum.photos/seed/karim/128/128',
    fallback: 'KN',
  },
];
