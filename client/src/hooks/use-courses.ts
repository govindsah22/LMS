import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCourse, type InsertLesson, type InsertAssignment } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCourses() {
  return useQuery({
    queryKey: [api.courses.list.path],
    queryFn: async () => {
      const res = await fetch(api.courses.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch courses");
      return api.courses.list.responses[200].parse(await res.json());
    },
  });
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: [api.courses.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.courses.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) throw new Error("Course not found");
      if (!res.ok) throw new Error("Failed to fetch course");
      return api.courses.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCourse) => {
      const res = await fetch(api.courses.create.path, {
        method: api.courses.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create course");
      return api.courses.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
      toast({ title: "Success", description: "Course created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create course", variant: "destructive" });
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ courseId, ...data }: InsertLesson & { courseId: number }) => {
      const url = buildUrl(api.lessons.create.path, { courseId });
      const res = await fetch(url, {
        method: api.lessons.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create lesson");
      return api.lessons.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courses.get.path, variables.courseId] });
      toast({ title: "Success", description: "Lesson added successfully" });
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ courseId, ...data }: InsertAssignment & { courseId: number }) => {
      const url = buildUrl(api.assignments.create.path, { courseId });
      const res = await fetch(url, {
        method: api.assignments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      return api.assignments.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courses.get.path, variables.courseId] });
      toast({ title: "Success", description: "Assignment created successfully" });
    },
  });
}
