export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_SUSPEND: 'users.suspend',
  TREE_READ: 'tree.read',
  TREE_WRITE: 'tree.write',
  TREE_DELETE: 'tree.delete',
  FINANCE_READ_ALL: 'finance.read.all',
  FINANCE_WRITE: 'finance.write',
  FINANCE_EXPORT: 'finance.export',
  FINANCE_READ_SELF: 'finance.read.self',
  MEETINGS_READ: 'meetings.read',
  MEETINGS_WRITE: 'meetings.write',
  MEETINGS_ARCHIVE: 'meetings.archive',
  VOTE_CAST: 'vote.cast',
  VOTE_VIEW: 'vote.view',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export type Role = 'super_admin' | 'secretary' | 'treasurer' | 'member'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),
  secretary: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_SUSPEND,
    PERMISSIONS.TREE_READ,
    PERMISSIONS.TREE_WRITE,
    PERMISSIONS.MEETINGS_READ,
    PERMISSIONS.MEETINGS_WRITE,
    PERMISSIONS.MEETINGS_ARCHIVE,
    PERMISSIONS.VOTE_VIEW,
  ],
  treasurer: [
    PERMISSIONS.TREE_READ,
    PERMISSIONS.FINANCE_READ_ALL,
    PERMISSIONS.FINANCE_WRITE,
    PERMISSIONS.FINANCE_EXPORT,
    PERMISSIONS.MEETINGS_READ,
    PERMISSIONS.VOTE_VIEW,
  ],
  member: [
    PERMISSIONS.TREE_READ,
    PERMISSIONS.FINANCE_READ_SELF,
    PERMISSIONS.MEETINGS_READ,
    PERMISSIONS.VOTE_CAST,
    PERMISSIONS.VOTE_VIEW,
  ],
}
