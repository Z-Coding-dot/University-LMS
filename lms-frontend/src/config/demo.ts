import type { Role } from './constants';

// Development fixtures only; real accounts always receive server-generated secrets.
export const DEMO_ACCOUNTS = {
  admin: { identifier: 'admin@campus.test', password: 'Campus123!' },
  teacher: { identifier: 'teacher1@campus.test', password: 'Campus123!' },
  student: { identifier: 'student1@campus.test', password: 'Student001!Campus' },
} satisfies Record<Role, { identifier: string; password: string }>;
export const demoStudentPassword = (institutionalId: string) => `Student${institutionalId.replace('ST-', '')}!Campus`;
