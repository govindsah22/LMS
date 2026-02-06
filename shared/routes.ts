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
    delete: {
      method: 'DELETE' as const,
      path: '/api/courses/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
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
    count: {
      method: 'GET' as const,
      path: '/api/courses/:courseId/enrollments/count',
      responses: {
        200: z.object({ count: z.number() }),
      },
    },
  },
  stats: {
    student: {
      method: 'GET' as const,
      path: '/api/student/stats',
      responses: {
        200: z.object({ averageGrade: z.number(), upcomingAssignments: z.number() }),
        401: errorSchemas.unauthorized,
      },
    },
    instructor: {
      method: 'GET' as const,
      path: '/api/instructor/stats',
      responses: {
        200: z.object({ totalStudents: z.number() }),
        401: errorSchemas.unauthorized,
      },
    },
    studentSubmissions: {
      method: 'GET' as const,
      path: '/api/student/submissions',
      responses: {
        200: z.array(z.custom<typeof submissions.$inferSelect & { assignment: typeof assignments.$inferSelect }>()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  analytics: {
    courseAnalytics: {
      method: 'GET' as const,
      path: '/api/courses/:courseId/analytics',
      responses: {
        200: z.object({
          enrolledStudents: z.array(z.object({
            id: z.number(),
            name: z.string(),
            username: z.string(),
            enrolledAt: z.date().nullable(),
          })),
          totalEnrolled: z.number(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    assignmentStats: {
      method: 'GET' as const,
      path: '/api/courses/:courseId/assignment-stats',
      responses: {
        200: z.object({
          assignments: z.array(z.object({
            id: z.number(),
            title: z.string(),
            dueDate: z.date().nullable(),
            totalSubmissions: z.number(),
            gradedSubmissions: z.number(),
            averageGrade: z.number().nullable(),
          })),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    instructorDashboard: {
      method: 'GET' as const,
      path: '/api/instructor/dashboard',
      responses: {
        200: z.object({
          courses: z.array(z.object({
            id: z.number(),
            title: z.string(),
            enrolledCount: z.number(),
            assignmentCount: z.number(),
            completionRate: z.number(),
          })),
          totalStudents: z.number(),
          totalCourses: z.number(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  upload: {
    lessonFile: {
      method: 'POST' as const,
      path: '/api/lessons/:lessonId/upload',
      responses: {
        200: z.object({ fileUrl: z.string(), fileType: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    assignmentSubmission: {
      method: 'POST' as const,
      path: '/api/assignments/:assignmentId/submit-file',
      responses: {
        200: z.object({ fileUrl: z.string(), submissionId: z.number() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
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
