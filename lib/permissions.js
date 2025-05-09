// permissions.js
const PERMISSION_GROUPS = {
    USER_MANAGEMENT: {
      name: "User Management",
      permissions: {
        CREATE: { 
          key: 'user:create',
          name: 'Create Users'
        },
        READ: { 
          key: 'user:read',
          name: 'View User Details'
        },
        UPDATE: { 
          key: 'user:update',
          name: 'Edit Users'
        },
        DELETE: { 
          key: 'user:delete',
          name: 'Delete Users'
        },
        LIST_ALL: { 
          key: 'user:list_all',
          name: 'List All Users'
        }
      }
    },
    SETTINGS: {
      name: "System Settings",
      permissions: {
        READ: { 
          key: 'settings:read',
          name: 'View Settings'
        },
        UPDATE: { 
          key: 'settings:update',
          name: 'Modify Settings'
        }
      }
    },
    REPORTS: {
      name: "Reporting",
      permissions: {
        GENERATE: { 
          key: 'reports:generate',
          name: 'Generate Reports'
        },
        VIEW_ALL: { 
          key: 'reports:view_all',
          name: 'View All Reports'
        },
        EXPORT: { 
          key: 'reports:export',
          name: 'Export Reports'
        }
      }
    }
  };
  
  // Helper functions to work with this structure
  const PERMISSIONS = {
    // Flattened permissions for easy checking
    keys: Object.values(PERMISSION_GROUPS).flatMap(group => 
      Object.values(group.permissions).map(p => p.key)
    ),
    
    // Get all permissions with their metadata
    list: Object.entries(PERMISSION_GROUPS).flatMap(([groupKey, group]) => 
      Object.entries(group.permissions).map(([permKey, perm]) => ({
        groupKey,
        groupName: group.name,
        permissionKey: perm.key,
        permissionName: perm.name,
        fullKey: `${groupKey}.${permKey}`
      }))
    ),
    
    // Get permission by key
    get: (key) => {
      for (const group of Object.values(PERMISSION_GROUPS)) {
        for (const perm of Object.values(group.permissions)) {
          if (perm.key === key) return {
            ...perm,
            groupName: group.name
          };
        }
      }
      return null;
    }
  };
  
  // roles.js (unchanged)
  const ROLES = {
    MANAGER: 'manager',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
  };
  
  // rolePermissions.js (now using permission keys)
  const ROLE_PERMISSIONS = {
    [ROLES.MANAGER]: [
      PERMISSION_GROUPS.USER_MANAGEMENT.permissions.READ.key,
      PERMISSION_GROUPS.USER_MANAGEMENT.permissions.LIST_ALL.key,
      PERMISSION_GROUPS.REPORTS.permissions.GENERATE.key
    ],
    [ROLES.ADMIN]: [
      // ...etc
    ]
  };