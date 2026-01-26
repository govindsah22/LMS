import { z } from 'zod';
import { 
  insertUserSchema, 
  users, 
  courses, 
  insertCourseSchema, 
  lessons, 
  insertLessonSchema, 
  assignments, 
  insertAssignmentSchema,
  submissions,
  insertSubmissionSchema,
  enrollments,
  insertEnrollmentSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    user: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  courses: {
    list: {
      method: 'GET' as const,
      path: '/api/courses',
      responses: {
        200: z.array(z.custom<typeof courses.$inferSelect & { instructor: typeof users.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/courses/:id',
      responses: {
        200: z.custom<typeof courses.$inferSelect & { lessons: typeof lessons.$inferSelect[], assignments: typeof assignments.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/courses',
      input: insertCourseSchema.omit({ instructorId: true }), // instructorId set by session
      responses: {
        201: z.custom<typeof courses.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  lessons: {
    create: {
      method: 'POST' as const,
      path: '/api/courses/:courseId/lessons',
      input: insertLessonSchema.omit({ courseId: true }),
      responses: {
        201: z.custom<typeof lessons.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  assignments: {
    create: {
      method: 'POST' as const,
      path: '/api/courses/:courseId/assignments',
      input: insertAssignmentSchema.omit({ courseId: true }),
      responses: {
        201: z.custom<typeof assignments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  submissions: {
    create: {
      method: 'POST' as const,
      path: '/api/assignments/:assignmentId/submissions',
      input: insertSubmissionSchema.omit({ assignmentId: true, studentId: true, grade: true, feedback: true }),
      responses: {
        201: z.custom<typeof submissions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    grade: {
      method: 'PATCH' as const,
      path: '/api/submissions/:id/grade',
      input: z.object({ grade: z.number(), feedback: z.string().optional() }),
      responses: {
        200: z.custom<typeof submissions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/assignments/:assignmentId/submissions',
      responses: {
        200: z.array(z.custom<typeof submissions.$inferSelect & { student: typeof users.$inferSelect }>()),
      },
    },
  },
  enrollments: {
    enroll: {
      method: 'POST' as const,
      path: '/api/courses/:courseId/enroll',
      responses: {
        200: z.custom<typeof enrollments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/enrollments',
      responses: {
        200: z.array(z.custom<typeof enrollments.$inferSelect & { course: typeof courses.$inferSelect }>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
