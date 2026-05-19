import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

const sessionCookieName = "barpos_user_id";
export const SESSION_COOKIE_NAME = sessionCookieName;

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export type CurrentUser = Awaited<ReturnType<typeof requireUser>>;

export function getPermissionKeys(user: CurrentUser) {
  return user.role.permissions.map((entry) => entry.permission.key);
}

export function hasPermission(user: CurrentUser, permissionKey: string) {
  return getPermissionKeys(user).includes(permissionKey);
}

export async function requirePermission(permissionKey: string) {
  const user = await requireUser();
  if (!hasPermission(user, permissionKey)) {
    redirect("/");
  }
  return user;
}

export async function signIn(username: string, password: string) {
  const email = username.includes("@") ? username : `${username}@barpos.local`;
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.active) {
    return false;
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return true;
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}
