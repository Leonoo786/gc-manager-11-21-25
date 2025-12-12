// src/app/(app)/team/team-data.ts

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatarUrl: string;
  fallback: string;
};

/**
 * TEMP fallback so other pages (like Dashboard) that still import `teamMembers`
 * don't break while we finish wiring everything dynamically.
 *
 * Once Dashboard is switched to fetch from Supabase too, we can delete this.
 */
export const teamMembers: TeamMember[] = [];