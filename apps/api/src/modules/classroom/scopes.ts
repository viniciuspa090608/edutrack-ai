const prefix = 'https://www.googleapis.com/auth/';
export const classroomScopes = {
  courses: `${prefix}classroom.courses.readonly`,
  coursework: `${prefix}classroom.coursework.me.readonly`,
  teacherCoursework: `${prefix}classroom.coursework.students.readonly`,
} as const;
export function permissions(scopes: string[]) {
  return Object.fromEntries(
    Object.entries(classroomScopes).map(([key, scope]) => [
      key,
      hasClassroomScope(scopes, scope),
    ]),
  ) as Record<keyof typeof classroomScopes, boolean>;
}
// Google canonicalizes legacy coursework read-only names in token responses.
// Retain the actual grants and recognize only these specific read-only aliases.
export function hasClassroomScope(scopes: string[], required: string) {
  if (scopes.includes(required)) return true;
  const alias =
    required === classroomScopes.coursework
      ? `${prefix}classroom.student-submissions.me.readonly`
      : required === classroomScopes.teacherCoursework
        ? `${prefix}classroom.student-submissions.students.readonly`
        : undefined;
  return alias !== undefined && scopes.includes(alias);
}
