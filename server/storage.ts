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
}

export const storage = new DatabaseStorage();
