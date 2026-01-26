import { useRoute, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useCourse, useCreateLesson, useCreateAssignment } from "@/hooks/use-courses";
import { useEnrollments, useEnroll } from "@/hooks/use-enrollments";
import { useSubmissions, useCreateSubmission } from "@/hooks/use-submissions";
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
import { FileText, Video, Download, Lock, CheckCircle, Plus, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLessonSchema, insertAssignmentSchema, insertSubmissionSchema } from "@shared/schema";
import { useState } from "react";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const courseId = parseInt(params?.id || "0");
  const { data: user } = useUser();
  const { data: course, isLoading } = useCourse(courseId);
  const { data: enrollments } = useEnrollments();
  const enroll = useEnroll();
  const createLesson = useCreateLesson();
  const createAssignment = useCreateAssignment();
  const [openLesson, setOpenLesson] = useState(false);
  const [openAssignment, setOpenAssignment] = useState(false);

  const isInstructor = user?.id === course?.instructorId;
  const isEnrolled = enrollments?.some(e => e.courseId === courseId);
  const canAccessContent = isInstructor || isEnrolled;

  const lessonForm = useForm({
    resolver: zodResolver(insertLessonSchema.omit({ courseId: true })),
    defaultValues: { title: "", content: "", videoUrl: "", pdfUrl: "", order: 1 },
  });

  const assignmentForm = useForm({
    resolver: zodResolver(insertAssignmentSchema.omit({ courseId: true })),
    defaultValues: { title: "", description: "", dueDate: undefined },
  });

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
                 <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2"/>Add Lesson</Button></DialogTrigger>
                 <DialogContent>
                   <DialogHeader><DialogTitle>Add Lesson</DialogTitle></DialogHeader>
                   <Form {...lessonForm}>
                     <form onSubmit={lessonForm.handleSubmit(d => createLesson.mutate({ courseId, ...d }, { onSuccess: () => setOpenLesson(false) }))} className="space-y-4">
                       <FormField control={lessonForm.control} name="title" render={({field}) => <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
                       <FormField control={lessonForm.control} name="content" render={({field}) => <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>} />
                       <FormField control={lessonForm.control} name="videoUrl" render={({field}) => <FormItem><FormLabel>Video URL (Optional)</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>} />
                       <Button type="submit" disabled={createLesson.isPending}>Save</Button>
                     </form>
                   </Form>
                 </DialogContent>
               </Dialog>
               
               <Dialog open={openAssignment} onOpenChange={setOpenAssignment}>
                 <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2"/>Add Assignment</Button></DialogTrigger>
                 <DialogContent>
                   <DialogHeader><DialogTitle>Add Assignment</DialogTitle></DialogHeader>
                   <Form {...assignmentForm}>
                     <form onSubmit={assignmentForm.handleSubmit(d => createAssignment.mutate({ courseId, ...d }, { onSuccess: () => setOpenAssignment(false) }))} className="space-y-4">
                        <FormField control={assignmentForm.control} name="title" render={({field}) => <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
                        <FormField control={assignmentForm.control} name="description" render={({field}) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>} />
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
              {course.lessons.sort((a,b) => a.order - b.order).map((lesson) => (
                <AccordionItem key={lesson.id} value={`item-${lesson.id}`} className="border rounded-lg bg-card px-4 mb-2 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {lesson.order}
                      </div>
                      <span className="font-semibold">{lesson.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-4 border-t mt-2">
                    <div className="prose dark:prose-invert max-w-none mb-6">
                      <p>{lesson.content}</p>
                    </div>
                    {lesson.videoUrl && (
                      <div className="aspect-video bg-black/5 rounded-lg flex items-center justify-center mb-4">
                        <div className="text-center">
                           <Video className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-2"/>
                           <p className="text-sm text-muted-foreground">Video Placeholder: {lesson.videoUrl}</p>
                        </div>
                      </div>
                    )}
                    {lesson.pdfUrl && (
                      <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download Materials
                      </Button>
                    )}
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
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignmentCard({ assignment, isInstructor }: { assignment: any, isInstructor: boolean }) {
  const [open, setOpen] = useState(false);
  const createSubmission = useCreateSubmission();
  const form = useForm({
    resolver: zodResolver(insertSubmissionSchema.omit({ assignmentId: true, studentId: true, grade: true, feedback: true })),
    defaultValues: { content: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{assignment.title}</CardTitle>
        <CardDescription>{assignment.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        {isInstructor ? (
           <Button variant="outline" className="w-full">View Submissions</Button>
        ) : (
           <Dialog open={open} onOpenChange={setOpen}>
             <DialogTrigger asChild><Button className="w-full gap-2"><Upload className="w-4 h-4"/> Submit Assignment</Button></DialogTrigger>
             <DialogContent>
               <DialogHeader><DialogTitle>Submit Assignment</DialogTitle></DialogHeader>
               <Form {...form}>
                 <form onSubmit={form.handleSubmit(d => createSubmission.mutate({ assignmentId: assignment.id, ...d }, { onSuccess: () => setOpen(false) }))} className="space-y-4">
                   <FormField control={form.control} name="content" render={({field}) => <FormItem><FormLabel>Your Submission (Text or Link)</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>} />
                   <Button type="submit" disabled={createSubmission.isPending}>Submit</Button>
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
