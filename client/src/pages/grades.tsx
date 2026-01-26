import { useEnrollments } from "@/hooks/use-enrollments";
import { useSubmissions } from "@/hooks/use-submissions";
import { useCourses } from "@/hooks/use-courses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Clock } from "lucide-react";

export default function Grades() {
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: courses, isLoading: coursesLoading } = useCourses();

  const isLoading = enrollmentsLoading || coursesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 w-48 bg-muted animate-spin rounded-md" />
        <div className="h-64 w-full bg-muted animate-spin rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary" />
          My Grades
        </h1>
        <p className="text-muted-foreground mt-2">Track your academic progress across all enrolled courses.</p>
      </div>

      <div className="grid gap-6">
        {enrollments?.map((enrollment) => {
          const course = courses?.find(c => c.id === enrollment.courseId);
          return (
            <Card key={enrollment.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">{course?.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    Instructor: {course?.instructor?.name}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-xs uppercase">Enrolled</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                 <CourseGrades courseId={enrollment.courseId} />
              </CardContent>
            </Card>
          );
        })}

        {enrollments?.length === 0 && (
          <div className="text-center py-12 border rounded-xl bg-muted/10 border-dashed">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No Enrollments Found</h3>
            <p className="text-muted-foreground">Enroll in a course to see your grades here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseGrades({ courseId }: { courseId: number }) {
  // In a real app, we'd fetch submissions per course, but here we can filter or use a specific hook
  const { data: submissions, isLoading } = useSubmissions(); 
  
  // Filtering for local demo, though a dedicated hook/api would be better
  // We'd need assignment information to link submissions to courses properly
  // For now, showing a placeholder table if submissions exist
  
  if (isLoading) return <div className="h-20 bg-muted animate-spin rounded-md" />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Assignment</TableHead>
          <TableHead>Submitted At</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Feedback</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
             <Clock className="w-4 h-4 inline mr-2" />
             Detailed assignment grades available in Course Details
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
