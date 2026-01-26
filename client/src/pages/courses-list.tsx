import { useUser } from "@/hooks/use-auth";
import { useCourses, useCreateCourse } from "@/hooks/use-courses";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, BookOpen, User } from "lucide-react";
import { useState } from "react";

export default function CoursesList() {
  const { data: user } = useUser();
  const { data: courses, isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertCourseSchema.omit({ instructorId: true })),
    defaultValues: { title: "", description: "" },
  });

  const onSubmit = (data: any) => {
    createCourse.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Courses</h2>
          <p className="text-muted-foreground mt-1">
            Browse our catalog of available courses.
          </p>
        </div>

        {user?.role === "instructor" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Enter the details for your new course.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Introduction to Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What will students learn in this course?" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createCourse.isPending}>
                    {createCourse.isPending ? "Creating..." : "Create Course"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses?.map((course) => (
          <Link key={course.id} href={`/courses/${course.id}`}>
            <Card className="flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-border/60">
              <div className="h-40 bg-muted/30 rounded-t-xl flex items-center justify-center border-b border-border/50">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
              </div>
              <CardHeader>
                <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs pt-1">
                  <User className="w-3 h-3" />
                  Instructor: {course.instructor.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {course.description}
                </p>
              </CardContent>
              <CardFooter className="border-t border-border/50 pt-4 bg-muted/10 mt-auto">
                <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  View Course
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
