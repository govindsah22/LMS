import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useEnrollments() {
  return useQuery({
    queryKey: [api.enrollments.list.path],
    queryFn: async () => {
      const res = await fetch(api.enrollments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch enrollments");
      return api.enrollments.list.responses[200].parse(await res.json());
    },
  });
}

export function useEnroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: number) => {
      const url = buildUrl(api.enrollments.enroll.path, { courseId });
      const res = await fetch(url, {
        method: api.enrollments.enroll.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to enroll");
      return api.enrollments.enroll.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.enrollments.list.path] });
      toast({ title: "Success", description: "Enrolled in course successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to enroll in course", variant: "destructive" });
    },
  });
}
