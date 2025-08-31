// Utility function to get profile URL based on user role
export function getProfileUrl(userId: string, userRole: string): string {
  if (userRole?.toLowerCase() === 'writer') {
    return `/writers/${userId}`
  } else {
    return `/readers/${userId}`
  }
}

// Helper to get profile link component
export function getProfileLinkProps(userId: string, userRole: string) {
  return {
    href: getProfileUrl(userId, userRole),
    text: userRole?.toLowerCase() === 'writer' ? 'View Writer Profile' : 'View Reader Profile'
  }
}
