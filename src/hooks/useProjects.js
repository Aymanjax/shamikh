import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import * as ps from "../services/projectService";

export function useProjects() {
  const { user, loading: authLoading } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user || authLoading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ps.fetchProjects(user.uid);
      setProjects(data);
    } catch (err) {
      setError(err.message || "فشل تحميل المشاريع");
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (data) => {
    if (!user) return null;
    const id = await ps.createProject(user.uid, data);
    await load();
    return id;
  }, [user, load]);

  const remove = useCallback(async (projectId) => {
    if (!user) return;
    await ps.deleteProject(user.uid, projectId);
    await load();
  }, [user, load]);

  const updateStatus = useCallback(async (projectId, status) => {
    if (!user) return;
    await ps.updateProjectStatus(user.uid, projectId, status);
    await load();
  }, [user, load]);

  return { projects, loading, error, create, remove, updateStatus, reload: load };
}
