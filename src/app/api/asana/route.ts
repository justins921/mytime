import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { getValidAsanaToken } from "@/lib/asana-oauth";

const ASANA_API = "https://app.asana.com/api/1.0";

interface AsanaTask {
  gid: string;
  name: string;
  notes: string;
  permalink_url: string;
  due_on: string | null;
  modified_at: string;
  created_at: string;
  completed: boolean;
  assignee_section?: { name: string };
  projects: { gid: string; name: string }[];
  tags: { gid: string; name: string }[];
  workspace: { gid: string; name: string };
}

interface AsanaWorkspace {
  gid: string;
  name: string;
}

async function getSettings(userId: string) {
  let settings = await prisma.settings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { userId } });
  }
  return settings;
}

async function asanaFetch(path: string, token: string) {
  const res = await fetch(`${ASANA_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asana API ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * GET /api/asana?action=workspaces — list workspaces
 * GET /api/asana?action=tasks     — get tasks assigned to you
 */
export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  let token: string;
  try {
    token = await getValidAsanaToken(user.id);
  } catch {
    return NextResponse.json({ error: "Asana not connected. Add it in Settings." }, { status: 400 });
  }

  const action = req.nextUrl.searchParams.get("action");

  try {
    if (action === "workspaces") {
      const data = await asanaFetch("/workspaces?opt_fields=name", token);
      return NextResponse.json(data.data || []);
    }

    if (action === "tasks") {
      // Get current user
      const me = await asanaFetch("/users/me?opt_fields=gid,workspaces.name", token);
      const userId = me.data.gid;
      const workspaces: AsanaWorkspace[] = me.data.workspaces || [];

      const allTasks: Record<string, AsanaTask[]> = {};

      for (const ws of workspaces) {
        try {
          const data = await asanaFetch(
            `/tasks?assignee=${userId}&workspace=${ws.gid}&opt_fields=name,notes,permalink_url,due_on,modified_at,created_at,completed,projects.name,tags.name&completed_since=now&limit=100`,
            token
          );
          const tasks: AsanaTask[] = (data.data || []).map((t: AsanaTask) => ({
            ...t,
            workspace: { gid: ws.gid, name: ws.name },
          }));
          allTasks[ws.gid] = tasks;
        } catch {
          // workspace may not be accessible
        }
      }

      return NextResponse.json({
        workspaces: workspaces.map((w) => ({ id: w.gid, name: w.name })),
        tasksByWorkspace: allTasks,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Asana API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/asana — Create a Work OS task from an Asana task
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { asanaTask, clientId, projectId } = body as {
    asanaTask: AsanaTask;
    clientId: string;
    projectId: string;
  };

  if (!clientId || !projectId) {
    return NextResponse.json({ error: "clientId and projectId are required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, client: { id: clientId, userId: user.id } },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title: asanaTask.name || "Asana Task",
      description: asanaTask.notes || "",
      priority: "P2",
      status: "Backlog",
      url: asanaTask.permalink_url || "",
      clickupTaskId: `asana_${asanaTask.gid}`,
      dueDate: asanaTask.due_on ? new Date(asanaTask.due_on) : null,
      tags: ["asana", ...(asanaTask.tags?.map((t) => t.name).filter(Boolean) || [])].join(","),
    },
    include: { project: { include: { client: true } } },
  });

  // Auto-dismiss from triage
  await prisma.triageDismissal.upsert({
    where: { userId_clickupTaskId: { userId: user.id, clickupTaskId: `asana_${asanaTask.gid}` } },
    create: { userId: user.id, clickupTaskId: `asana_${asanaTask.gid}`, source: "asana", action: "added" },
    update: { action: "added" },
  });

  return NextResponse.json(task);
}
