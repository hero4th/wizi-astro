/**
 * Permission keys shared by the server guards, the admin UI, and the SQL seed.
 * Keep these in sync with netlify/database/migrations/0006_rbac.sql.
 */
export const PERMISSIONS = {
  POSTS_READ: "posts.read",
  POSTS_CREATE: "posts.create",
  POSTS_UPDATE: "posts.update",
  POSTS_DELETE: "posts.delete",
  POSTS_PUBLISH: "posts.publish",
  SNIPPETS_READ: "snippets.read",
  SNIPPETS_CREATE: "snippets.create",
  SNIPPETS_DELETE: "snippets.delete",
  MEDIA_UPLOAD: "media.upload",
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_MANAGE_SUPERADMINS: "users.manage_superadmins",
  ROLES_READ: "roles.read",
  ROLES_MANAGE: "roles.manage",
  SECURITY_MANAGE: "security.manage",
  BACKUP_EXPORT: "backup.export",
  BACKUP_IMPORT: "backup.import",
  DEPLOY_TRIGGER: "deploy.trigger",
  SETTINGS_MANAGE: "settings.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
