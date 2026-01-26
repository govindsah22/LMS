import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertSubmission } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useSubmissions(assignmentId: number) {
  return useQuery({
    queryKey: [api.submissions.list.path, assignmentId],
    queryFn: async () => {
      const url = buildUrl(api.submissions.list.path, { assignmentId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return api.submissions.list.responses[200].parse(await res.json());
    },
    enabled: !!assignmentId,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ assignmentId, ...data }: InsertSubmission & { assignmentId: number }) => {
      const url = buildUrl(api.submissions.create.path, { assignmentId });
      const res = await fetch(url, {
        method: api.submissions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit assignment");
      return api.submissions.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.submissions.list.path, variables.assignmentId] });
      toast({ title: "Success", description: "Assignment submitted successfully" });
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, grade, feedback }: { id: number; grade: number; feedback?: string }) => {
      const url = buildUrl(api.submissions.grade.path, { id });
      const res = await fetch(url, {
        method: api.submissions.grade.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, feedback }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to grade submission");
      return api.submissions.grade.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.submissions.list.path] });
      toast({ title: "Success", description: "Submission graded" });
    },
  });
}
