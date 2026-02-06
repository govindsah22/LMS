import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directories exist
const uploadsDir = path.join(process.cwd(), "uploads");
const lessonsDir = path.join(uploadsDir, "lessons");
const assignmentsDir = path.join(uploadsDir, "assignments");

[uploadsDir, lessonsDir, assignmentsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage for lessons (PDFs, videos, docs)
const lessonStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, lessonsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `lesson-${uniqueSuffix}${ext}`);
    },
});

// Configure storage for assignment submissions
const assignmentStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, assignmentsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `submission-${uniqueSuffix}${ext}`);
    },
});

// File filter for lessons (PDF, DOC, DOCX, video files)
const lessonFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "video/mp4",
        "video/webm",
        "video/quicktime",
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed: PDF, DOC, DOCX, MP4, WEBM, MOV`));
    }
};

// File filter for assignments (any document or common file types)
const assignmentFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "text/plain",
        "image/jpeg",
        "image/png",
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type for assignment submission.`));
    }
};

// Multer instances
export const uploadLesson = multer({
    storage: lessonStorage,
    fileFilter: lessonFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max for videos
    },
});

export const uploadAssignment = multer({
    storage: assignmentStorage,
    fileFilter: assignmentFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max for assignments
    },
});

// Helper to get file URL
export function getFileUrl(filename: string, type: "lessons" | "assignments"): string {
    return `/uploads/${type}/${filename}`;
}
