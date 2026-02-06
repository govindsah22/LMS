import { db } from "./db";
import {
  users, courses, enrollments, lessons, assignments, submissions,
  type User, type InsertUser,
  type Course, type InsertCourse,
  type Lesson, type InsertLesson,
  type Assignment, type InsertAssignment,
  type Submission, type InsertSubmission,
  type Enrollment, type InsertEnrollment
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Courses
  getCourses(): Promise<(Course & { instructor: User })[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Enrollments
  enrollUser(userId: number, courseId: number): Promise<Enrollment>;
  getEnrollments(userId: number): Promise<(Enrollment & { course: Course })[]>;

  // Lessons
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  getLessons(courseId: number): Promise<Lesson[]>;

  // Assignments
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignments(courseId: number): Promise<Assignment[]>;

  // Submissions
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissions(assignmentId: number): Promise<(Submission & { student: User })[]>;
  updateSubmissionGrade(id: number, grade: number, feedback?: string): Promise<Submission>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User & Auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Courses
  async getCourses(): Promise<(Course & { instructor: User })[]> {
    const result = await db.select({
      course: courses,
      instructor: users,
    })
      .from(courses)
      .innerJoin(users, eq(courses.instructorId, users.id));

    return result.map(({ course, instructor }) => ({ ...course, instructor }));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  // Enrollments
  async enrollUser(userId: number, courseId: number): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values({
      studentId: userId,
      courseId: courseId
    }).returning();
    return enrollment;
  }

  async getEnrollments(userId: number): Promise<(Enrollment & { course: Course })[]> {
    const result = await db.select({
      enrollment: enrollments,
      course: courses,
    })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, userId));

    return result.map(({ enrollment, course }) => ({ ...enrollment, course }));
  }

  // Lessons
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async getLessons(courseId: number): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(lessons.order);
  }

  async updateLesson(lessonId: number, data: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updated] = await db.update(lessons)
      .set(data)
      .where(eq(lessons.id, lessonId))
      .returning();
    return updated;
  }

  async deleteLesson(lessonId: number): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, lessonId));
  }

  // Assignments
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async getAssignments(courseId: number): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.courseId, courseId));
  }

  // Submissions
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async hasSubmission(assignmentId: number, studentId: number): Promise<boolean> {
    const existing = await db.select()
      .from(submissions)
      .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, studentId)));
    return existing.length > 0;
  }

  async getSubmissions(assignmentId: number): Promise<(Submission & { student: User })[]> {
    const result = await db.select({
      submission: submissions,
      student: users,
    })
      .from(submissions)
      .innerJoin(users, eq(submissions.studentId, users.id))
      .where(eq(submissions.assignmentId, assignmentId));

    return result.map(({ submission, student }) => ({ ...submission, student }));
  }

  async updateSubmissionGrade(id: number, grade: number, feedback?: string): Promise<Submission> {
    const [updated] = await db.update(submissions)
      .set({ grade, feedback })
      .where(eq(submissions.id, id))
      .returning();
    return updated;
  }

  // Get enrollment count for a specific course
  async getEnrollmentCount(courseId: number): Promise<number> {
    const result = await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
    return result.length;
  }

  // Get all enrollments for a course (for instructor to see enrolled students)
  async getCourseEnrollments(courseId: number): Promise<(Enrollment & { student: User })[]> {
    const result = await db.select({
      enrollment: enrollments,
      student: users,
    })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.courseId, courseId));

    return result.map(({ enrollment, student }) => ({ ...enrollment, student }));
  }

  // Get all submissions for a student
  async getStudentSubmissions(studentId: number): Promise<(Submission & { assignment: Assignment })[]> {
    const result = await db.select({
      submission: submissions,
      assignment: assignments,
    })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(eq(submissions.studentId, studentId));

    return result.map(({ submission, assignment }) => ({ ...submission, assignment }));
  }

  // Get student stats (average grade, upcoming assignments count)
  async getStudentStats(studentId: number): Promise<{ averageGrade: number; upcomingAssignments: number }> {
    // Get all graded submissions for the student
    const studentSubmissions = await db.select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId));

    const gradedSubmissions = studentSubmissions.filter(s => s.grade !== null);
    const averageGrade = gradedSubmissions.length > 0
      ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length)
      : 0;

    // Get enrolled courses for the student
    const studentEnrollments = await db.select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));

    const courseIds = studentEnrollments.map(e => e.courseId);

    // Get all upcoming assignments (due date in future or no due date)
    let upcomingAssignments = 0;
    if (courseIds.length > 0) {
      const now = new Date();
      for (const courseId of courseIds) {
        const courseAssignments = await db.select()
          .from(assignments)
          .where(eq(assignments.courseId, courseId));

        // Count assignments that are either upcoming or have no due date
        // and haven't been submitted yet
        for (const assignment of courseAssignments) {
          const hasSubmission = studentSubmissions.some(s => s.assignmentId === assignment.id);
          if (!hasSubmission) {
            if (!assignment.dueDate || new Date(assignment.dueDate) >= now) {
              upcomingAssignments++;
            }
          }
        }
      }
    }

    return { averageGrade, upcomingAssignments };
  }

  // Get total enrolled students across all courses for an instructor
  async getInstructorTotalStudents(instructorId: number): Promise<number> {
    // Get all courses taught by this instructor
    const instructorCourses = await db.select()
      .from(courses)
      .where(eq(courses.instructorId, instructorId));

    const courseIds = instructorCourses.map(c => c.id);

    if (courseIds.length === 0) return 0;

    // Get unique students across all courses
    const allEnrollments = await db.select()
      .from(enrollments);

    const relevantEnrollments = allEnrollments.filter(e => courseIds.includes(e.courseId));
    const uniqueStudentIds = new Set(relevantEnrollments.map(e => e.studentId));

    return uniqueStudentIds.size;
  }

  // Get course analytics - enrolled students with details
  async getCourseAnalytics(courseId: number): Promise<{
    enrolledStudents: { id: number; name: string; username: string; enrolledAt: Date | null }[];
    totalEnrolled: number;
  }> {
    const result = await db.select({
      enrollment: enrollments,
      student: users,
    })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.courseId, courseId));

    const enrolledStudents = result.map(({ enrollment, student }) => ({
      id: student.id,
      name: student.name,
      username: student.username,
      enrolledAt: enrollment.enrolledAt,
    }));

    return {
      enrolledStudents,
      totalEnrolled: enrolledStudents.length,
    };
  }

  // Get assignment completion stats for a course
  async getCourseAssignmentStats(courseId: number): Promise<{
    assignments: {
      id: number;
      title: string;
      dueDate: Date | null;
      totalSubmissions: number;
      gradedSubmissions: number;
      averageGrade: number | null;
    }[];
  }> {
    const courseAssignments = await db.select()
      .from(assignments)
      .where(eq(assignments.courseId, courseId));

    const assignmentStats = await Promise.all(
      courseAssignments.map(async (assignment) => {
        const assignmentSubmissions = await db.select()
          .from(submissions)
          .where(eq(submissions.assignmentId, assignment.id));

        const gradedSubmissions = assignmentSubmissions.filter(s => s.grade !== null);
        const averageGrade = gradedSubmissions.length > 0
          ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length)
          : null;

        return {
          id: assignment.id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          totalSubmissions: assignmentSubmissions.length,
          gradedSubmissions: gradedSubmissions.length,
          averageGrade,
        };
      })
    );

    return { assignments: assignmentStats };
  }

  // Get full instructor dashboard data
  async getInstructorDashboard(instructorId: number): Promise<{
    courses: {
      id: number;
      title: string;
      enrolledCount: number;
      assignmentCount: number;
      completionRate: number;
    }[];
    totalStudents: number;
    totalCourses: number;
  }> {
    const instructorCourses = await db.select()
      .from(courses)
      .where(eq(courses.instructorId, instructorId));

    const coursesData = await Promise.all(
      instructorCourses.map(async (course) => {
        const analytics = await this.getCourseAnalytics(course.id);
        const courseAssignments = await db.select()
          .from(assignments)
          .where(eq(assignments.courseId, course.id));

        // Calculate completion rate - count unique student submissions per assignment
        let totalPossibleSubmissions = analytics.totalEnrolled * courseAssignments.length;
        let uniqueStudentSubmissions = 0;

        for (const assignment of courseAssignments) {
          const subs = await db.select()
            .from(submissions)
            .where(eq(submissions.assignmentId, assignment.id));
          // Count unique students who submitted (not total submissions)
          const uniqueStudents = new Set(subs.map(s => s.studentId));
          // Cap at enrolled count (a student can't submit more than once)
          uniqueStudentSubmissions += Math.min(uniqueStudents.size, analytics.totalEnrolled);
        }

        // Cap completion rate at 100%
        const completionRate = totalPossibleSubmissions > 0
          ? Math.min(100, Math.round((uniqueStudentSubmissions / totalPossibleSubmissions) * 100))
          : 0;

        return {
          id: course.id,
          title: course.title,
          enrolledCount: analytics.totalEnrolled,
          assignmentCount: courseAssignments.length,
          completionRate,
        };
      })
    );

    const totalStudents = await this.getInstructorTotalStudents(instructorId);

    return {
      courses: coursesData,
      totalStudents,
      totalCourses: instructorCourses.length,
    };
  }

  // Delete a course and all related data
  async deleteCourse(courseId: number): Promise<void> {
    // Delete submissions for course assignments
    const courseAssignments = await db.select()
      .from(assignments)
      .where(eq(assignments.courseId, courseId));

    for (const assignment of courseAssignments) {
      await db.delete(submissions).where(eq(submissions.assignmentId, assignment.id));
    }

    // Delete assignments
    await db.delete(assignments).where(eq(assignments.courseId, courseId));

    // Delete lessons
    await db.delete(lessons).where(eq(lessons.courseId, courseId));

    // Delete enrollments
    await db.delete(enrollments).where(eq(enrollments.courseId, courseId));

    // Delete course
    await db.delete(courses).where(eq(courses.id, courseId));
  }
}

export const storage = new DatabaseStorage();

