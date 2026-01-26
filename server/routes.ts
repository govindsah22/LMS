import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertLessonSchema, insertAssignmentSchema } from "@shared/schema";

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
    const instructor = await storage.createUser({
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

    const course = await storage.createCourse({
      title: "Introduction to Web Development",
      description: "Learn the basics of HTML, CSS, and JavaScript.",
      instructorId: instructor.id
    });

    await storage.createLesson({
      courseId: course.id,
      title: "HTML Basics",
      content: "HTML stands for HyperText Markup Language.",
      order: 1
    });
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup Authentication
  setupAuth(app);
  
  // Seed Data
  seed();

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

  // === ASSIGNMENTS ===
  app.post(api.assignments.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role === 'student') {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const courseId = parseInt(req.params.courseId);
      const input = api.assignments.create.input.parse(req.body);
      const assignment = await storage.createAssignment({
        ...input,
        courseId,
      });
      res.status(201).json(assignment);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", field: e.errors[0].message });
      } else {
        throw e;
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

  return httpServer;
}
