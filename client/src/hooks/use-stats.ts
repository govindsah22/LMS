import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useStudentStats() {
    return useQuery({
        queryKey: [api.stats.student.path],
        queryFn: async () => {
            const res = await fetch(api.stats.student.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch student stats");
            return api.stats.student.responses[200].parse(await res.json());
        },
    });
}

export function useInstructorStats() {
    return useQuery({
        queryKey: [api.stats.instructor.path],
        queryFn: async () => {
            const res = await fetch(api.stats.instructor.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch instructor stats");
            return api.stats.instructor.responses[200].parse(await res.json());
        },
    });
}

export function useStudentSubmissions() {
    return useQuery({
        queryKey: [api.stats.studentSubmissions.path],
        queryFn: async () => {
            const res = await fetch(api.stats.studentSubmissions.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch student submissions");
            return api.stats.studentSubmissions.responses[200].parse(await res.json());
        },
    });
}
