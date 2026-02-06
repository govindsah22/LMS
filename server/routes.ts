import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertLessonSchema, insertAssignmentSchema } from "@shared/schema";
import { uploadLesson, uploadAssignment, getFileUrl } from "./upload";
import express from "express";
import path from "path";

import { hashPassword } from "./auth";

async function seed() {
  const existingUser = await storage.getUserByUsername("admin");
  if (!existingUser) {
    const adminPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: adminPassword,
      role: "admin",
      name: "System Admin"
    });

    const instructorPassword = await hashPassword("instructor123");
    await storage.createUser({
      username: "instructor",
      password: instructorPassword,
      role: "instructor",
      name: "Prof. Smith"
    });

    const studentPassword = await hashPassword("student123");
    await storage.createUser({
      username: "student",
      password: studentPassword,
      role: "student",
      name: "John Doe"
    });

    // Note: Removed default course seeding so instructors start with a clean slate
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup Authentication
  setupAuth(app);

  // Seed Data
  seed();

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // === COURSES ===
  app.get(api.courses.list.path, async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get(api.courses.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const course = await storage.getCourse(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const lessons = await storage.getLessons(id);
    const assignments = await storage.getAssignments(id);

    res.json({ ...course, lessons, assignments });
  });

  app.post(api.courses.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role === 'student') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const input = api.courses.create.input.parse(req.body);
      const course = await storage.createCourse({
        ...input,
        instructorId: req.user!.id,
      });
      res.status(201).json(course);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", field: e.errors[0].message });
      } else {
        throw e;
      }
    }
  });

  // === LESSONS ===
  app.post(api.lessons.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role === 'student') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const courseId = parseInt(req.params.courseId);
      const input = api.lessons.create.input.parse(req.body);
      const lesson = await storage.createLesson({
        ...input,
        courseId,
      });
      res.status(201).json(lesson);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", field: e.errors[0].message });
      } else {
        throw e;
      }
    }
  });

  // Delete Lesson
  app.delete('/api/lessons/:lessonId', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role === 'student') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const lessonId = parseInt(req.params.lessonId);
      await storage.deleteLesson(lessonId);
      res.json({ success: true });
    } catch (e) {
      console.error('Delete lesson error:', e);
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  // === ASSIGNMENTS ===
  app.post(api.assignments.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role === 'student') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const courseId = parseInt(req.params.courseId);
      const { dueDate, ...rest } = req.body;

      // Parse and validate input
      const input = api.assignments.create.input.parse({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      const assignment = await storage.createAssignment({
        ...input,
        courseId,
      });
      res.status(201).json(assignment);
    } catch (e) {
      console.error('Assignment creation error:', e);
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", field: e.errors[0].message });
      } else if (e instanceof Error) {
        res.status(500).json({ message: e.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === SUBMISSIONS ===
  app.post(api.submissions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const assignmentId = parseInt(req.params.assignmentId);

      // Check if student has already submitted
      const alreadySubmitted = await storage.hasSubmission(assignmentId, req.user!.id);
      if (alreadySubmitted) {
        return res.status(400).json({ message: "You have already submitted this assignment" });
      }

      const input = api.submissions.create.input.parse(req.body);
      const submission = await storage.createSubmission({
        ...input,
        assignmentId,
        studentId: req.user!.id,
      });
      res.status(201).json(submission);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", field: e.errors[0].message });
      } else {
        throw e;
      }
    }
  });

  app.get(api.submissions.list.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role === 'student') {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const assignmentId = parseInt(req.params.assignmentId);
    const submissions = await storage.getSubmissions(assignmentId);
    res.json(submissions);
  });

  app.patch(api.submissions.grade.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role === 'student') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const id = parseInt(req.params.id);
      const { grade, feedback } = api.submissions.grade.input.parse(req.body);
      const submission = await storage.updateSubmissionGrade(id, grade, feedback);
      res.json(submission);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", field: e.errors[0].message });
      } else {
        throw e;
      }
    }
  });

  // === ENROLLMENTS ===
  app.post(api.enrollments.enroll.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const courseId = parseInt(req.params.courseId);
    const enrollment = await storage.enrollUser(req.user!.id, courseId);
    res.json(enrollment);
  });

  app.get(api.enrollments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const enrollments = await storage.getEnrollments(req.user!.id);
    res.json(enrollments);
  });

  // === ENROLLMENT COUNT ===
  app.get(api.enrollments.count.path, async (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const count = await storage.getEnrollmentCount(courseId);
    res.json({ count });
  });

  // === STATS ===
  app.get(api.stats.student.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const stats = await storage.getStudentStats(req.user!.id);
    res.json(stats);
  });

  app.get(api.stats.instructor.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const totalStudents = await storage.getInstructorTotalStudents(req.user!.id);
    res.json({ totalStudents });
  });

  app.get(api.stats.studentSubmissions.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const submissions = await storage.getStudentSubmissions(req.user!.id);
    res.json(submissions);
  });

  // === COURSE DELETE ===
  app.delete(api.courses.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'instructor') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = parseInt(req.params.id);
    const course = await storage.getCourse(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Only allow instructor who owns the course to delete
    if (course.instructorId !== req.user!.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await storage.deleteCourse(id);
    res.json({ success: true });
  });

  // === FILE UPLOADS ===
  app.post('/api/lessons/:lessonId/upload',
    (req, res, next) => {
      if (!req.isAuthenticated() || req.user!.role !== 'instructor') {
        return res.status(401).json({ message: "Unauthorized" });
      }
      next();
    },
    uploadLesson.single('file'),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const lessonId = parseInt(req.params.lessonId);
      const fileUrl = getFileUrl(req.file.filename, 'lessons');
      const fileType = req.file.mimetype.includes('video') ? 'video' :
        req.file.mimetype.includes('pdf') ? 'pdf' : 'document';

      // Update lesson with file URL
      if (fileType === 'video') {
        await storage.updateLesson(lessonId, { videoUrl: fileUrl });
      } else {
        await storage.updateLesson(lessonId, { pdfUrl: fileUrl });
      }

      res.json({ fileUrl, fileType });
    }
  );

  app.post('/api/assignments/:assignmentId/submit-file',
    (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      next();
    },
    uploadAssignment.single('file'),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const assignmentId = parseInt(req.params.assignmentId);

      // Check if student has already submitted
      const alreadySubmitted = await storage.hasSubmission(assignmentId, req.user!.id);
      if (alreadySubmitted) {
        return res.status(400).json({ message: "You have already submitted this assignment" });
      }

      const fileUrl = getFileUrl(req.file.filename, 'assignments');

      // Create submission with file URL
      const submission = await storage.createSubmission({
        assignmentId,
        studentId: req.user!.id,
        content: req.body.content || '',
        fileUrl,
      });

      res.json({ fileUrl, submissionId: submission.id });
    }
  );

  // === ANALYTICS ===
  app.get(api.analytics.courseAnalytics.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'instructor') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = parseInt(req.params.courseId);
    const analytics = await storage.getCourseAnalytics(courseId);
    res.json(analytics);
  });

  app.get(api.analytics.assignmentStats.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'instructor') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = parseInt(req.params.courseId);
    const stats = await storage.getCourseAssignmentStats(courseId);
    res.json(stats);
  });

  app.get(api.analytics.instructorDashboard.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'instructor') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dashboard = await storage.getInstructorDashboard(req.user!.id);
    res.json(dashboard);
  });

  return httpServer;
}
