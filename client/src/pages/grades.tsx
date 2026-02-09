import { useEnrollments } from "@/hooks/use-enrollments";
import { useStudentSubmissions } from "@/hooks/use-stats";
import { useCourses } from "@/hooks/use-courses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Clock, CheckCircle } from "lucide-react";

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
  const { data: submissions, isLoading } = useStudentSubmissions();

  // Filter submissions for this course
  const courseSubmissions = submissions?.filter(
    (sub: any) => sub.assignment?.courseId === courseId
  );

  if (isLoading) return <div className="h-20 bg-muted animate-pulse rounded-md" />;

  if (!courseSubmissions || courseSubmissions.length === 0) {
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
              No submissions yet for this course
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

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
        {courseSubmissions.map((sub: any) => (
          <TableRow key={sub.id}>
            <TableCell className="font-medium">{sub.assignment?.title || 'Assignment'}</TableCell>
            <TableCell>{new Date(sub.submittedAt).toLocaleDateString()}</TableCell>
            <TableCell>
              {sub.grade !== null ? (
                <Badge variant={sub.grade >= 60 ? "default" : "destructive"} className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {sub.grade}/100
                </Badge>
              ) : (
                <Badge variant="secondary">Pending</Badge>
              )}
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {sub.feedback || <span className="text-muted-foreground">-</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
