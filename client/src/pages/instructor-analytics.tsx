import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useUser } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, ClipboardCheck, BarChart3, GraduationCap } from "lucide-react";
import { Link } from "wouter";

function useInstructorDashboard() {
    return useQuery({
        queryKey: [api.analytics.instructorDashboard.path],
        queryFn: async () => {
            const res = await fetch(api.analytics.instructorDashboard.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch dashboard");
            return res.json();
        },
    });
}

function useCourseAnalytics(courseId: number) {
    return useQuery({
        queryKey: [api.analytics.courseAnalytics.path, courseId],
        queryFn: async () => {
            const res = await fetch(buildUrl(api.analytics.courseAnalytics.path, { courseId }), { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch analytics");
            return res.json();
        },
        enabled: courseId > 0,
    });
}

function useCourseAssignmentStats(courseId: number) {
    return useQuery({
        queryKey: [api.analytics.assignmentStats.path, courseId],
        queryFn: async () => {
            const res = await fetch(buildUrl(api.analytics.assignmentStats.path, { courseId }), { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        },
        enabled: courseId > 0,
    });
}

export default function InstructorAnalytics() {
    const { data: user } = useUser();
    const { data: dashboard, isLoading } = useInstructorDashboard();

    if (!user || user.role !== "instructor") {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>Only instructors can view analytics.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                <p className="text-muted-foreground mt-1">
                    View detailed analytics for your courses and students.
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard?.totalCourses ?? 0}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard?.totalStudents ?? 0}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dashboard?.courses?.length > 0
                                ? Math.round(dashboard.courses.reduce((sum: number, c: any) => sum + c.completionRate, 0) / dashboard.courses.length)
                                : 0}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Course Analytics */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Course-wise Analytics</h3>

                {!dashboard?.courses?.length ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="font-semibold">No Courses Yet</h3>
                            <p className="text-sm text-muted-foreground">Create your first course to see analytics.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {dashboard.courses.map((course: any) => (
                            <CourseAnalyticsCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CourseAnalyticsCard({ course }: { course: any }) {
    const { data: analytics } = useCourseAnalytics(course.id);
    const { data: assignmentStats } = useCourseAssignmentStats(course.id);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription>Course analytics and student progress</CardDescription>
                    </div>
                    <Link href={`/courses/${course.id}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted">View Course</Badge>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="overview">
                    <TabsList className="mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="students">Students ({course.enrolledCount})</TabsTrigger>
                        <TabsTrigger value="assignments">Assignments ({course.assignmentCount})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                                <Users className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="text-2xl font-bold">{course.enrolledCount}</p>
                                    <p className="text-sm text-muted-foreground">Enrolled Students</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                                <ClipboardCheck className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="text-2xl font-bold">{course.assignmentCount}</p>
                                    <p className="text-sm text-muted-foreground">Assignments</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                                <GraduationCap className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="text-2xl font-bold">{course.completionRate}%</p>
                                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">Overall Progress</p>
                            <Progress value={course.completionRate} className="h-2" />
                        </div>
                    </TabsContent>

                    <TabsContent value="students">
                        {!analytics?.enrolledStudents?.length ? (
                            <p className="text-muted-foreground text-center py-8">No students enrolled yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {analytics.enrolledStudents.map((student: any) => (
                                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="font-medium text-primary">
                                                    {student.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{student.name}</p>
                                                <p className="text-sm text-muted-foreground">@{student.username}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary">
                                            Enrolled {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="assignments">
                        {!assignmentStats?.assignments?.length ? (
                            <p className="text-muted-foreground text-center py-8">No assignments created yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {assignmentStats.assignments.map((assignment: any) => (
                                    <div key={assignment.id} className="p-4 rounded-lg border">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium">{assignment.title}</h4>
                                            {assignment.dueDate && (
                                                <Badge variant="outline">
                                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Submissions</p>
                                                <p className="font-semibold">{assignment.totalSubmissions}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Graded</p>
                                                <p className="font-semibold">{assignment.gradedSubmissions}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Avg. Grade</p>
                                                <p className="font-semibold">
                                                    {assignment.averageGrade !== null ? `${assignment.averageGrade}%` : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
