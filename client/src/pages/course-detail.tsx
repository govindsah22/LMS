import { useRoute, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useCourse, useCreateLesson, useCreateAssignment, useDeleteLesson, useDeleteCourse } from "@/hooks/use-courses";
import { useEnrollments, useEnroll } from "@/hooks/use-enrollments";
import { useSubmissions, useCreateSubmission } from "@/hooks/use-submissions";
import { useStudentSubmissions } from "@/hooks/use-stats";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Video, Download, Lock, CheckCircle, Plus, Upload, CalendarDays, Loader2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLessonSchema, insertAssignmentSchema, insertSubmissionSchema } from "@shared/schema";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const courseId = parseInt(params?.id || "0");
  const { data: user } = useUser();
  const { data: course, isLoading } = useCourse(courseId);
  const { data: enrollments } = useEnrollments();
  const enroll = useEnroll();
  const createLesson = useCreateLesson();
  const createAssignment = useCreateAssignment();
  const deleteLesson = useDeleteLesson();
  const [openLesson, setOpenLesson] = useState(false);
  const [openAssignment, setOpenAssignment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isInstructor = user?.id === course?.instructorId;
  const isEnrolled = enrollments?.some(e => e.courseId === courseId);
  const canAccessContent = isInstructor || isEnrolled;
  const { data: studentSubmissions } = useStudentSubmissions();

  const lessonForm = useForm({
    resolver: zodResolver(insertLessonSchema.omit({ courseId: true })),
    defaultValues: { title: "", content: "", videoUrl: "", pdfUrl: "", order: 1 },
  });

  const assignmentForm = useForm({
    resolver: zodResolver(insertAssignmentSchema.omit({ courseId: true })),
    defaultValues: { title: "", description: "", dueDate: undefined },
  });

  // Handle lesson creation with file uploads
  const handleLessonSubmit = async (data: any) => {
    setIsUploading(true);
    try {
      // First create the lesson
      const response = await fetch(`/api/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to create lesson');
      const lesson = await response.json();

      // Upload video file if selected
      const videoFile = videoFileRef.current?.files?.[0];
      if (videoFile) {
        const formData = new FormData();
        formData.append('file', videoFile);
        const uploadRes = await fetch(`/api/lessons/${lesson.id}/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!uploadRes.ok) {
          console.error('Video upload failed');
          toast({ title: "Warning", description: "Lesson created but video upload failed", variant: "destructive" });
        }
      }

      // Upload PDF file if selected
      const pdfFile = pdfFileRef.current?.files?.[0];
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        const uploadRes = await fetch(`/api/lessons/${lesson.id}/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!uploadRes.ok) {
          console.error('PDF upload failed');
          toast({ title: "Warning", description: "Lesson created but PDF upload failed", variant: "destructive" });
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [api.courses.get.path, courseId] });
      toast({ title: "Success", description: "Lesson created successfully" });
      setOpenLesson(false);
      lessonForm.reset();

      // Clear file inputs
      if (videoFileRef.current) videoFileRef.current.value = '';
      if (pdfFileRef.current) pdfFileRef.current.value = '';
    } catch (error) {
      console.error('Lesson creation error:', error);
      toast({ title: "Error", description: "Failed to create lesson", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading || !course) return <CourseSkeleton />;

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div className="bg-card rounded-xl border p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <FileText className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Course</Badge>
            <span>ID: {courseId}</span>
          </div>
          <h1 className="text-4xl font-bold font-display mb-4">{course.title}</h1>
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{course.description}</p>

          <div className="flex items-center gap-4">
            {!isInstructor && !isEnrolled && (
              <Button
                size="lg"
                className="shadow-lg shadow-primary/25"
                onClick={() => enroll.mutate(courseId)}
                disabled={enroll.isPending}
              >
                {enroll.isPending ? "Enrolling..." : "Enroll Now"}
              </Button>
            )}
            {(isEnrolled || isInstructor) && (
              <Button size="lg" variant="secondary" className="cursor-default pointer-events-none gap-2">
                <CheckCircle className="w-4 h-4" />
                {isInstructor ? "You Teach This Course" : "Enrolled"}
              </Button>
            )}
            {isInstructor && (
              <DeleteCourseButton courseId={courseId} courseTitle={course.title} />
            )}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="lessons" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          {isInstructor && (
            <div className="flex gap-2">
              <Dialog open={openLesson} onOpenChange={setOpenLesson}>
                <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Add Lesson</Button></DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Add Lesson</DialogTitle></DialogHeader>
                  <Form {...lessonForm}>
                    <form onSubmit={lessonForm.handleSubmit(handleLessonSubmit)} className="space-y-4">
                      <FormField control={lessonForm.control} name="title" render={({ field }) => <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
                      <FormField control={lessonForm.control} name="content" render={({ field }) => <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>} />

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Video File (Optional)</label>
                        <Input
                          ref={videoFileRef}
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">Supported: MP4, WEBM, MOV (max 100MB)</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">PDF/Document File (Optional)</label>
                        <Input
                          ref={pdfFileRef}
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">Supported: PDF, DOC, DOCX (max 100MB)</p>
                      </div>

                      <FormField
                        control={lessonForm.control}
                        name="videoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Or Video URL (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="https://youtube.com/... or direct URL" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={lessonForm.control}
                        name="pdfUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Or PDF URL (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="https://example.com/document.pdf" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={isUploading} className="w-full">
                        {isUploading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                        ) : (
                          'Save Lesson'
                        )}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={openAssignment} onOpenChange={setOpenAssignment}>
                <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Add Assignment</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Assignment</DialogTitle></DialogHeader>
                  <Form {...assignmentForm}>
                    <form onSubmit={assignmentForm.handleSubmit(d => createAssignment.mutate({ courseId, ...d }, { onSuccess: () => setOpenAssignment(false) }))} className="space-y-4">
                      <FormField control={assignmentForm.control} name="title" render={({ field }) => <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
                      <FormField control={assignmentForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>} />
                      <FormField control={assignmentForm.control} name="dueDate" render={({ field }) => <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="datetime-local" {...field} value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} /></FormControl></FormItem>} />
                      <Button type="submit" disabled={createAssignment.isPending}>Save</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <TabsContent value="lessons" className="space-y-4">
          {!canAccessContent ? (
            <LockedContent />
          ) : (course.lessons?.length || 0) === 0 ? (
            <EmptyState message="No lessons have been added yet." />
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {course.lessons.sort((a, b) => a.order - b.order).map((lesson, index) => (
                <AccordionItem key={lesson.id} value={`item-${lesson.id}`} className="border rounded-lg bg-card px-4 mb-2 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-semibold">{lesson.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-4 border-t mt-2">
                    <div className="prose dark:prose-invert max-w-none mb-6">
                      <p>{lesson.content}</p>
                    </div>
                    {lesson.videoUrl && (
                      <div className="mb-4">
                        {lesson.videoUrl.startsWith('/uploads') ? (
                          <video
                            controls
                            className="w-full rounded-lg shadow-md"
                            style={{ maxHeight: '400px' }}
                          >
                            <source src={lesson.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div className="aspect-video bg-black/5 rounded-lg flex items-center justify-center">
                            <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="text-center">
                              <Video className="w-12 h-12 mx-auto text-primary mb-2" />
                              <p className="text-sm text-primary underline">Watch Video</p>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {lesson.pdfUrl && (
                        <a
                          href={lesson.pdfUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Download Materials
                          </Button>
                        </a>
                      )}
                      {isInstructor && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
                              deleteLesson.mutate({ lessonId: lesson.id, courseId });
                            }
                          }}
                          disabled={deleteLesson.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Lesson
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {!canAccessContent ? (
            <LockedContent />
          ) : (course.assignments?.length || 0) === 0 ? (
            <EmptyState message="No assignments available." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {course.assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  isInstructor={isInstructor}
                  studentSubmissions={studentSubmissions}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignmentCard({ assignment, isInstructor, studentSubmissions }: { assignment: any, isInstructor: boolean, studentSubmissions?: any[] }) {
  const [open, setOpen] = useState(false);
  const [viewSubmissionsOpen, setViewSubmissionsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [gradeValue, setGradeValue] = useState<string>('');
  const [feedbackValue, setFeedbackValue] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createSubmission = useCreateSubmission();
  const form = useForm({
    resolver: zodResolver(insertSubmissionSchema.omit({ assignmentId: true, studentId: true, grade: true, feedback: true, fileUrl: true })),
    defaultValues: { content: "" },
  });

  // Check if student has submitted this assignment
  const hasSubmitted = studentSubmissions?.some(s => s.assignmentId === assignment.id) ?? false;

  // Format due date
  const formatDueDate = (date: Date | string | null) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Fetch submissions for instructor
  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/assignments/${assignment.id}/submissions`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Handle grading
  const handleGrade = async (submissionId: number) => {
    const grade = parseInt(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast({ title: "Error", description: "Grade must be between 0 and 100", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, feedback: feedbackValue || undefined }),
        credentials: 'include',
      });

      if (res.ok) {
        toast({ title: "Success", description: "Grade saved successfully" });
        setGradingId(null);
        setGradeValue('');
        setFeedbackValue('');
        fetchSubmissions(); // Refresh
        queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      } else {
        throw new Error('Failed to save grade');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save grade", variant: "destructive" });
    }
  };

  // Handle submission with file upload
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const file = fileInputRef.current?.files?.[0];

      if (file) {
        // Upload file first
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch(`/api/assignments/${assignment.id}/submit-file`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (uploadRes.ok) {
          toast({ title: "Success", description: "Assignment submitted successfully" });
          queryClient.invalidateQueries({ queryKey: [api.stats.studentSubmissions.path] });
          setOpen(false);
          form.reset();
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData.message || 'File upload failed');
        }
      } else if (data.content) {
        // Text submission
        createSubmission.mutate({ assignmentId: assignment.id, ...data }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.stats.studentSubmissions.path] });
            setOpen(false);
            form.reset();
          }
        });
      } else {
        toast({ title: "Error", description: "Please provide content or upload a file", variant: "destructive" });
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({ title: "Error", description: error.message || "Failed to submit assignment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{assignment.title}</CardTitle>
          {!isInstructor && (
            <Badge variant={hasSubmitted ? "default" : "secondary"} className={hasSubmitted ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600 text-white"}>
              {hasSubmitted ? <><CheckCircle className="w-3 h-3 mr-1" /> Submitted</> : "Not Submitted"}
            </Badge>
          )}
        </div>
        <CardDescription>{assignment.description}</CardDescription>
        {assignment.dueDate && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <CalendarDays className="w-4 h-4" />
            <span>Due: {formatDueDate(assignment.dueDate)}</span>
          </div>
        )}
      </CardHeader>
      <CardFooter>
        {isInstructor ? (
          <Dialog open={viewSubmissionsOpen} onOpenChange={(open) => {
            setViewSubmissionsOpen(open);
            if (open) fetchSubmissions();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">View Submissions</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submissions for "{assignment.title}"</DialogTitle>
              </DialogHeader>

              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions yet
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-medium text-primary">
                              {sub.student?.username?.charAt(0).toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{sub.student?.username || 'Unknown Student'}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {new Date(sub.submittedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={sub.grade !== null ? "default" : "secondary"}>
                          {sub.grade !== null ? `Grade: ${sub.grade}/100` : "Not Graded"}
                        </Badge>
                      </div>

                      {/* Submission Content */}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">Submission:</p>
                        {sub.fileUrl ? (
                          <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            Download Submitted File
                          </a>
                        ) : sub.content ? (
                          <p className="text-sm whitespace-pre-wrap">{sub.content}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No content</p>
                        )}
                      </div>

                      {/* Grading Section */}
                      {gradingId === sub.id ? (
                        <div className="space-y-3 border-t pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium">Grade (0-100)</label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={gradeValue}
                                onChange={(e) => setGradeValue(e.target.value)}
                                placeholder="Enter grade..."
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Feedback (Optional)</label>
                              <Input
                                value={feedbackValue}
                                onChange={(e) => setFeedbackValue(e.target.value)}
                                placeholder="Optional feedback..."
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleGrade(sub.id)}>Save Grade</Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setGradingId(null);
                              setGradeValue('');
                              setFeedbackValue('');
                            }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setGradingId(sub.id);
                            setGradeValue(sub.grade?.toString() || '');
                            setFeedbackValue(sub.feedback || '');
                          }}>
                            {sub.grade !== null ? 'Edit Grade' : 'Add Grade'}
                          </Button>
                          {sub.feedback && (
                            <span className="text-sm text-muted-foreground">
                              Feedback: {sub.feedback}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="w-full gap-2" disabled={hasSubmitted}><Upload className="w-4 h-4" /> {hasSubmitted ? "Already Submitted" : "Submit Assignment"}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Submit Assignment</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload File (Optional)</label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg"
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">Supported: PDF, DOC, DOCX, TXT, ZIP, Images (max 50MB)</p>
                  </div>

                  <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Or Text Submission</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Type your submission or paste a link..." /></FormControl>
                    </FormItem>
                  )} />

                  <Button type="submit" disabled={isSubmitting || createSubmission.isPending} className="w-full">
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  )
}

function LockedContent() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/10 border-dashed">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold mb-2">Content Locked</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Enroll in this course to access lessons, assignments, and quizzes.
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-muted/5 border-dashed">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function CourseSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function DeleteCourseButton({ courseId, courseTitle }: { courseId: number; courseTitle: string }) {
  const [, navigate] = useLocation();
  const deleteCourse = useDeleteCourse();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${courseTitle}"? This will permanently remove all lessons and assignments.`)) {
      deleteCourse.mutate(courseId, {
        onSuccess: () => {
          navigate('/courses');
        }
      });
    }
  };

  return (
    <Button
      size="lg"
      variant="destructive"
      className="gap-2"
      onClick={handleDelete}
      disabled={deleteCourse.isPending}
    >
      {deleteCourse.isPending ? (
        <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</>
      ) : (
        <><Trash2 className="w-4 h-4" />Delete Course</>
      )}
    </Button>
  );
}
