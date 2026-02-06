import { useUser } from "@/hooks/use-auth";
import { useCourses } from "@/hooks/use-courses";
import { useEnrollments } from "@/hooks/use-enrollments";
import { useStudentStats, useInstructorStats } from "@/hooks/use-stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Users, Trophy, Clock, Plus } from "lucide-react";

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: courses = [] } = useCourses();
  const { data: enrollments = [] } = useEnrollments();
  const { data: studentStats } = useStudentStats();
  const { data: instructorStats } = useInstructorStats();

  // Instructor specific logic
  const myCreatedCourses = courses.filter(c => c.instructorId === user?.id);

  // Student specific logic
  const myEnrolledCourses = enrollments.map(e => e.course);

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.name}. Here's what's happening today.
          </p>
        </div>

        {user.role === "instructor" && (
          <Link href="/courses">
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              Create New Course
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user.role === "instructor" ? "Total Courses" : "Enrolled Courses"}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.role === "instructor" ? myCreatedCourses.length : myEnrolledCourses.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {user.role === "instructor" ? "Active courses taught" : "In progress"}
            </p>
          </CardContent>
        </Card>

        {user.role === "instructor" && (
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instructorStats?.totalStudents ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
            </CardContent>
          </Card>
        )}

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.role === "student" ? (studentStats?.upcomingAssignments ?? 0) : 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{user.role === "student" ? "Due soon" : "Due this week"}</p>
          </CardContent>
        </Card>

        {user.role === "student" && (
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentStats?.averageGrade ?? 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">Based on graded submissions</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Course List Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold tracking-tight">
          {user.role === "instructor" ? "Your Courses" : "My Learning"}
        </h3>

        {((user.role === "instructor" ? myCreatedCourses : myEnrolledCourses).length === 0) ? (
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No courses yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                {user.role === "instructor"
                  ? "Get started by creating your first course content."
                  : "Explore the course catalog and enroll in a class."}
              </p>
              <Link href="/courses">
                <Button variant="outline">
                  {user.role === "instructor" ? "Create Course" : "Browse Courses"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(user.role === "instructor" ? myCreatedCourses : myEnrolledCourses).map(course => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group">
                  <div className="h-32 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-xl flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-primary/40 group-hover:text-primary/60 transition-colors" />
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Course ID: {course.id}</span>
                      <span className="bg-secondary px-2 py-1 rounded-md text-secondary-foreground text-xs font-medium">Active</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
