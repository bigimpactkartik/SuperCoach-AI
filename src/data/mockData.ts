import { useState, useEffect } from 'react';
import { Course, Student, SuperCoach, Conversation, Module, Task, StudentProgress, Message, StudentCourseEnrollment } from '../types';

// API Configuration
const API_BASE_URL = 'http://localhost:3100';

// Types for API responses
interface DashboardMetrics {
  live_courses: number;
  total_students: number;
  avg_progress: number;
  need_help: number;
}

interface StudentStatus {
  all: number;
  new: number;
  in_progress: number;
  stuck: number;
  completed: number;
}

// Authentication helper functions
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const expiresAt = localStorage.getItem('expires_at');
  
  if (!token || !expiresAt) {
    return false;
  }
  
  // Check if token is expired
  const now = Date.now();
  const expiry = parseInt(expiresAt);
  
  return now < expiry;
};

const clearAuthData = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('coach');
  localStorage.removeItem('expires_at');
};

const redirectToLogin = (): void => {
  clearAuthData();
  // Trigger a page reload to go back to auth screen
  window.location.reload();
};

const refreshAuthToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.warn('🔄 No refresh token available for token refresh');
    redirectToLogin();
    return null;
  }

  try {
    console.log('🔄 Attempting to refresh auth token...');
    
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      }),
    });

    if (!response.ok) {
      console.error('❌ Token refresh failed:', response.status);
      redirectToLogin();
      return null;
    }

    const data = await response.json();
    
    // Update stored tokens
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('expires_at', String(Date.now() + (data.expires_in * 1000)));
    
    console.log('✅ Token refreshed successfully');
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    redirectToLogin();
    return null;
  }
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const handleAuthError = (status: number, errorText: string): Error => {
  switch (status) {
    case 401:
      if (errorText.includes('expired')) {
        return new Error('Your session has expired. Please log in again.');
      } else if (errorText.includes('invalid')) {
        return new Error('Invalid authentication credentials. Please log in again.');
      } else {
        return new Error('Authentication failed. Please log in again.');
      }
    case 403:
      return new Error('You do not have permission to access this resource.');
    case 404:
      return new Error('The requested resource was not found.');
    case 429:
      return new Error('Too many requests. Please try again later.');
    case 500:
      return new Error('Server error. Please try again later.');
    default:
      return new Error(`Request failed with status ${status}. ${errorText}`);
  }
};

// Enhanced authenticated fetch function
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Check if user is authenticated before making request
  if (!isAuthenticated()) {
    console.warn('🔒 User not authenticated, redirecting to login');
    redirectToLogin();
    throw new Error('Authentication required');
  }

  // First attempt with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  // If 401, try to refresh token and retry once
  if (response.status === 401) {
    console.log('🔄 Got 401, attempting token refresh...');
    
    const newToken = await refreshAuthToken();
    
    if (newToken) {
      console.log('🔄 Retrying request with refreshed token...');
      response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      });
    } else {
      // Token refresh failed, user will be redirected
      throw new Error('Authentication failed');
    }
  }

  return response;
};

// Enhanced API call wrapper with better error handling
const makeAuthenticatedAPICall = async <T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> => {
  try {
    console.log(`🚀 Making authenticated API call to: ${url}`);
    
    const response = await authenticatedFetch(url, options);
    
    console.log(`📋 Response status: ${response.status}`);
    console.log(`📋 Response ok: ${response.ok}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API call failed. Status: ${response.status}, Text: ${errorText}`);
      
      // Handle auth errors specially
      if (response.status === 401) {
        console.warn('🔒 Authentication failed, redirecting to login');
        redirectToLogin();
        throw new Error('Authentication failed');
      }
      
      throw handleAuthError(response.status, errorText);
    }
    
    console.log('✅ API call successful, parsing JSON...');
    const data = await response.json();
    console.log(`📊 API response data:`, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ API call error: ${error.message}`);
      throw error;
    } else {
      console.error(`❌ Unknown API call error:`, error);
      throw new Error('An unexpected error occurred');
    }
  }
};

// Custom hooks for API data with authentication
export const useDashboardMetrics = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const metrics = await makeAuthenticatedAPICall<DashboardMetrics>(
          `${API_BASE_URL}/api/dashboard/metrics`
        );
        
        setData(metrics);
        console.log('✅ Dashboard metrics set in state successfully');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('❌ Error fetching dashboard metrics:', errorMessage);
        setError(errorMessage);
        
      } finally {
        setLoading(false);
        console.log('🏁 Dashboard metrics fetch completed');
      }
    };

    // Only fetch if authenticated
    if (isAuthenticated()) {
      fetchMetrics();
    } else {
      console.warn('🔒 Not authenticated, skipping dashboard metrics fetch');
      setLoading(false);
      setError('Authentication required');
    }
  }, []);

  return { data, loading, error };
};

export const useStudentStatus = () => {
  const [data, setData] = useState<StudentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const status = await makeAuthenticatedAPICall<StudentStatus>(
          `${API_BASE_URL}/api/dashboard/student-status`
        );
        
        setData(status);
        console.log('✅ Student status set in state successfully');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('❌ Error fetching student status:', errorMessage);
        setError(errorMessage);
        
      } finally {
        setLoading(false);
        console.log('🏁 Student status fetch completed');
      }
    };

    // Only fetch if authenticated
    if (isAuthenticated()) {
      fetchStudentStatus();
    } else {
      console.warn('🔒 Not authenticated, skipping student status fetch');
      setLoading(false);
      setError('Authentication required');
    }
  }, []);

  return { data, loading, error };
};

// TEMPORARY: Keep existing mock data for other components until we migrate them
// This ensures existing components don't break while we migrate step by step

// Mock Modules and Tasks (keeping as-is for now)
const mockModules: Module[] = [
  {
    id: 1,
    title: "Introduction to Digital Marketing",
    description: "Learn the fundamentals of digital marketing",
    order: 1,
    tasks: [
      {
        id: 1,
        title: "What is Digital Marketing?",
        description: "Overview of digital marketing concepts",
        type: "video",
        order: 1,
        estimatedTime: 30
      },
      {
        id: 2,
        title: "Digital Marketing Channels",
        description: "Understanding different marketing channels",
        type: "reading",
        order: 2,
        estimatedTime: 45
      },
      {
        id: 3,
        title: "Quiz: Marketing Basics",
        description: "Test your understanding of basic concepts",
        type: "quiz",
        order: 3,
        estimatedTime: 15
      }
    ]
  },
  {
    id: 2,
    title: "Social Media Marketing",
    description: "Master social media platforms for marketing",
    order: 2,
    tasks: [
      {
        id: 4,
        title: "Facebook Marketing Strategy",
        description: "Learn to create effective Facebook campaigns",
        type: "video",
        order: 1,
        estimatedTime: 60
      },
      {
        id: 5,
        title: "Instagram for Business",
        description: "Leverage Instagram for brand growth",
        type: "video",
        order: 2,
        estimatedTime: 45
      },
      {
        id: 6,
        title: "Create a Social Media Plan",
        description: "Develop your own social media strategy",
        type: "assignment",
        order: 3,
        estimatedTime: 120
      }
    ]
  }
];

const mockLeadershipModules: Module[] = [
  {
    id: 3,
    title: "Leadership Fundamentals",
    description: "Core principles of effective leadership",
    order: 1,
    tasks: [
      {
        id: 7,
        title: "What Makes a Great Leader?",
        description: "Explore leadership qualities and traits",
        type: "video",
        order: 1,
        estimatedTime: 40
      },
      {
        id: 8,
        title: "Leadership Styles",
        description: "Understanding different leadership approaches",
        type: "reading",
        order: 2,
        estimatedTime: 30
      }
    ]
  },
  {
    id: 4,
    title: "Team Management",
    description: "Building and managing high-performing teams",
    order: 2,
    tasks: [
      {
        id: 9,
        title: "Team Building Strategies",
        description: "Learn effective team building techniques",
        type: "video",
        order: 1,
        estimatedTime: 50
      },
      {
        id: 10,
        title: "Conflict Resolution",
        description: "Handle team conflicts professionally",
        type: "assignment",
        order: 2,
        estimatedTime: 90
      }
    ]
  }
];

// Mock Courses with versioning (keeping as-is for now)
export const mockCourses: Course[] = [
  {
    id: 1,
    title: "Digital Marketing Mastery",
    description: "Comprehensive course covering all aspects of digital marketing from social media to SEO and paid advertising.",
    status: "live",
    version: 2,
    modules: mockModules,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-02-01T14:30:00Z",
    enrolledStudents: 45,
    completionRate: 68,
    superCoachId: 1,
    baseId: 1,
    isCurrentVersion: true
  },
  {
    id: 2,
    title: "Leadership Excellence",
    description: "Develop essential leadership skills and learn to inspire and manage teams effectively.",
    status: "live",
    version: 1,
    modules: mockLeadershipModules,
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-02-15T16:45:00Z",
    enrolledStudents: 32,
    completionRate: 85,
    superCoachId: 2,
    baseId: 2,
    isCurrentVersion: true
  },
  {
    id: 3,
    title: "Digital Marketing Mastery",
    description: "Comprehensive course covering all aspects of digital marketing from social media to SEO and paid advertising.",
    status: "draft",
    version: 3,
    modules: [...mockModules, {
      id: 11,
      title: "Advanced Analytics",
      description: "Deep dive into marketing analytics and data interpretation",
      order: 3,
      tasks: [
        {
          id: 11,
          title: "Google Analytics Setup",
          description: "Learn to set up and configure Google Analytics",
          type: "video",
          order: 1,
          estimatedTime: 45
        }
      ]
    }],
    createdAt: "2024-02-20T11:00:00Z",
    updatedAt: "2024-02-25T10:15:00Z",
    enrolledStudents: 0,
    completionRate: 0,
    superCoachId: null,
    baseId: 1,
    isCurrentVersion: false
  },
  // Previous version (v1) of Digital Marketing course
  {
    id: 4,
    title: "Digital Marketing Mastery",
    description: "Comprehensive course covering all aspects of digital marketing from social media to SEO and paid advertising.",
    status: "archived",
    version: 1,
    modules: mockModules.slice(0, 1), // Only first module in v1
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    enrolledStudents: 15,
    completionRate: 85,
    superCoachId: 1,
    baseId: 1,
    isCurrentVersion: false
  }
];

// Mock Student Enrollments with versioning (keeping as-is for now)
const mockStudentEnrollments: StudentCourseEnrollment[] = [
  // Sarah enrolled in v2 of Digital Marketing
  { courseId: 1, courseVersion: 2, enrolledAt: "2024-02-01T10:00:00Z", baseId: 1 },
  
  // Mike enrolled in v1 of Digital Marketing (earlier enrollment)
  { courseId: 4, courseVersion: 1, enrolledAt: "2024-01-25T10:30:00Z", baseId: 1 },
  
  // Emma enrolled in v1 of Leadership
  { courseId: 2, courseVersion: 1, enrolledAt: "2024-02-05T14:15:00Z", baseId: 2 },
  
  // David enrolled in both courses (latest versions)
  { courseId: 1, courseVersion: 2, enrolledAt: "2024-02-28T16:45:00Z", baseId: 1 },
  { courseId: 2, courseVersion: 1, enrolledAt: "2024-02-28T16:45:00Z", baseId: 2 },
  
  // Lisa completed v1 of Leadership
  { courseId: 2, courseVersion: 1, enrolledAt: "2024-01-10T12:00:00Z", baseId: 2 },
  
  // Alex enrolled in v1 of Digital Marketing
  { courseId: 4, courseVersion: 1, enrolledAt: "2024-02-10T09:30:00Z", baseId: 1 }
];

// Mock Student Progress with versioning (keeping as-is for now)
const mockStudentProgress: StudentProgress[] = [
  // Sarah's progress (v2)
  { courseId: 1, courseVersion: 2, moduleId: 1, taskId: 1, status: "completed", completedAt: "2024-02-01T10:00:00Z", timeSpent: 35 },
  { courseId: 1, courseVersion: 2, moduleId: 1, taskId: 2, status: "completed", completedAt: "2024-02-01T11:00:00Z", timeSpent: 50 },
  { courseId: 1, courseVersion: 2, moduleId: 1, taskId: 3, status: "completed", completedAt: "2024-02-01T12:00:00Z", timeSpent: 20 },
  { courseId: 1, courseVersion: 2, moduleId: 2, taskId: 4, status: "in-progress", timeSpent: 30 },
  { courseId: 1, courseVersion: 2, moduleId: 2, taskId: 5, status: "not-started", timeSpent: 0 },
  { courseId: 1, courseVersion: 2, moduleId: 2, taskId: 6, status: "not-started", timeSpent: 0 },
  
  // Mike's progress (v1 - only has first module)
  { courseId: 4, courseVersion: 1, moduleId: 1, taskId: 1, status: "completed", completedAt: "2024-01-28T14:00:00Z", timeSpent: 40 },
  { courseId: 4, courseVersion: 1, moduleId: 1, taskId: 2, status: "in-progress", timeSpent: 25 },
  { courseId: 4, courseVersion: 1, moduleId: 1, taskId: 3, status: "not-started", timeSpent: 0 },
  
  // Emma's progress (Leadership v1)
  { courseId: 2, courseVersion: 1, moduleId: 3, taskId: 7, status: "completed", completedAt: "2024-02-10T09:00:00Z", timeSpent: 45 },
  { courseId: 2, courseVersion: 1, moduleId: 3, taskId: 8, status: "completed", completedAt: "2024-02-10T10:00:00Z", timeSpent: 35 },
  { courseId: 2, courseVersion: 1, moduleId: 4, taskId: 9, status: "completed", completedAt: "2024-02-12T11:00:00Z", timeSpent: 55 },
  { courseId: 2, courseVersion: 1, moduleId: 4, taskId: 10, status: "in-progress", timeSpent: 60 },
  
  // Lisa's completed progress (Leadership v1)
  { courseId: 2, courseVersion: 1, moduleId: 3, taskId: 7, status: "completed", completedAt: "2024-01-15T09:00:00Z", timeSpent: 45 },
  { courseId: 2, courseVersion: 1, moduleId: 3, taskId: 8, status: "completed", completedAt: "2024-01-15T10:00:00Z", timeSpent: 35 },
  { courseId: 2, courseVersion: 1, moduleId: 4, taskId: 9, status: "completed", completedAt: "2024-01-18T11:00:00Z", timeSpent: 55 },
  { courseId: 2, courseVersion: 1, moduleId: 4, taskId: 10, status: "completed", completedAt: "2024-01-20T14:00:00Z", timeSpent: 95 },
  
  // Alex's progress (v1)
  { courseId: 4, courseVersion: 1, moduleId: 1, taskId: 1, status: "completed", completedAt: "2024-02-15T10:00:00Z", timeSpent: 35 },
  { courseId: 4, courseVersion: 1, moduleId: 1, taskId: 2, status: "in-progress", timeSpent: 15 }
];

// Mock Students with versioned enrollments (keeping as-is for now)
export const mockStudents: Student[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    status: "in-progress",
    enrolledCourses: [mockStudentEnrollments[0]], // v2 of Digital Marketing
    progress: mockStudentProgress.filter(p => p.courseId === 1 && p.courseVersion === 2),
    joinedAt: "2024-01-20T08:00:00Z",
    lastActivity: "2 hours ago"
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike.chen@email.com",
    status: "stuck",
    enrolledCourses: [mockStudentEnrollments[1]], // v1 of Digital Marketing
    progress: mockStudentProgress.filter(p => p.courseId === 4 && p.courseVersion === 1),
    joinedAt: "2024-01-25T10:30:00Z",
    lastActivity: "3 days ago"
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    email: "emma.rodriguez@email.com",
    status: "in-progress",
    enrolledCourses: [mockStudentEnrollments[2]], // v1 of Leadership
    progress: mockStudentProgress.filter(p => p.courseId === 2 && p.courseVersion === 1 && [7, 8, 9, 10].includes(p.taskId)),
    joinedAt: "2024-02-05T14:15:00Z",
    lastActivity: "1 hour ago"
  },
  {
    id: 4,
    name: "David Kim",
    email: "david.kim@email.com",
    status: "new",
    enrolledCourses: [mockStudentEnrollments[3], mockStudentEnrollments[4]], // Latest versions
    progress: [],
    joinedAt: "2024-02-28T16:45:00Z",
    lastActivity: "5 minutes ago"
  },
  {
    id: 5,
    name: "Lisa Wang",
    email: "lisa.wang@email.com",
    status: "completed",
    enrolledCourses: [mockStudentEnrollments[5]], // v1 of Leadership
    progress: mockStudentProgress.filter(p => p.courseId === 2 && p.courseVersion === 1 && p.status === 'completed'),
    joinedAt: "2024-01-10T12:00:00Z",
    lastActivity: "1 week ago"
  },
  {
    id: 6,
    name: "Alex Thompson",
    email: "alex.thompson@email.com",
    status: "stuck",
    enrolledCourses: [mockStudentEnrollments[6]], // v1 of Digital Marketing
    progress: mockStudentProgress.filter(p => p.courseId === 4 && p.courseVersion === 1 && [1, 2].includes(p.taskId)),
    joinedAt: "2024-02-10T09:30:00Z",
    lastActivity: "4 days ago"
  }
];

// Mock SuperCoaches (keeping as-is for now)
export const mockSuperCoaches: SuperCoach[] = [
  {
    id: 1,
    name: "Coach Maya",
    personalityType: "friendly",
    description: "A warm and encouraging coach who specializes in digital marketing. Maya helps students overcome challenges with patience and positivity.",
    avatar: "",
    coursesAssigned: [1, 4], // Assigned to both versions of Digital Marketing
    createdAt: "2024-01-10T08:00:00Z",
    isActive: true
  },
  {
    id: 2,
    name: "Coach Alexander",
    personalityType: "professional",
    description: "A structured and results-oriented coach focused on leadership development. Alexander provides clear guidance and actionable feedback.",
    avatar: "",
    coursesAssigned: [2],
    createdAt: "2024-01-15T10:00:00Z",
    isActive: true
  },
  {
    id: 3,
    name: "Coach Zara",
    personalityType: "motivational",
    description: "An energetic and inspiring coach who helps students push through barriers and achieve their goals with enthusiasm.",
    avatar: "",
    coursesAssigned: [],
    createdAt: "2024-02-01T12:00:00Z",
    isActive: true
  },
  {
    id: 4,
    name: "Coach Sam",
    personalityType: "supportive",
    description: "A patient and understanding coach who provides emotional support and helps students build confidence in their learning journey.",
    avatar: "",
    coursesAssigned: [],
    createdAt: "2024-02-10T14:30:00Z",
    isActive: false
  }
];

// Mock Messages (keeping as-is for now)
const mockMessages: Message[] = [
  {
    id: 1,
    senderId: 1,
    senderType: "student",
    content: "Hi Coach Maya! I'm having trouble understanding the Facebook advertising module. Could you help me?",
    timestamp: "2024-02-25T10:00:00Z",
    type: "text"
  },
  {
    id: 2,
    senderId: 1,
    senderType: "supercoach",
    content: "Hi Sarah! I'd be happy to help you with Facebook advertising. What specific part are you finding challenging? Is it the audience targeting or the ad creation process?",
    timestamp: "2024-02-25T10:15:00Z",
    type: "text"
  },
  {
    id: 3,
    senderId: 1,
    senderType: "student",
    content: "I'm confused about how to set up custom audiences. The interface seems different from what's shown in the video.",
    timestamp: "2024-02-25T10:30:00Z",
    type: "text"
  },
  {
    id: 4,
    senderId: 1,
    senderType: "supercoach",
    content: "That's a great question! Facebook does update their interface regularly. Let me walk you through the current process step by step. First, go to your Ads Manager and click on 'Audiences' in the main menu...",
    timestamp: "2024-02-25T10:45:00Z",
    type: "text"
  },
  {
    id: 5,
    senderId: 1,
    senderType: "student",
    content: "Thank you so much! That makes it much clearer. I'll try it now and let you know how it goes.",
    timestamp: "2024-02-25T11:00:00Z",
    type: "text"
  }
];

const mockMessages2: Message[] = [
  {
    id: 6,
    senderId: 3,
    senderType: "student",
    content: "Coach Alexander, I've completed the team building module and I'm really excited to apply these concepts in my workplace!",
    timestamp: "2024-02-24T14:00:00Z",
    type: "text"
  },
  {
    id: 7,
    senderId: 2,
    senderType: "supercoach",
    content: "Excellent work, Emma! Your enthusiasm is wonderful to see. How do you plan to implement the team building strategies we discussed?",
    timestamp: "2024-02-24T14:30:00Z",
    type: "text"
  },
  {
    id: 8,
    senderId: 3,
    senderType: "student",
    content: "I'm thinking of starting with the trust-building exercises during our weekly team meetings. Do you think that's a good approach?",
    timestamp: "2024-02-24T15:00:00Z",
    type: "text"
  },
  {
    id: 9,
    senderId: 2,
    senderType: "supercoach",
    content: "That's a strategic approach! Starting with trust-building is foundational. Remember to be consistent and patient - trust develops over time. Keep me updated on your progress!",
    timestamp: "2024-02-24T15:15:00Z",
    type: "text"
  }
];

const mockMessages3: Message[] = [
  {
    id: 10,
    senderId: 2,
    senderType: "supercoach",
    content: "Hi Mike! I noticed you haven't been active in the course for a few days. Is everything okay? I'm here to help if you're facing any challenges.",
    timestamp: "2024-02-23T09:00:00Z",
    type: "text"
  },
  {
    id: 11,
    senderId: 2,
    senderType: "student",
    content: "Hi Coach Maya, sorry for the delay. I've been really busy at work and finding it hard to keep up with the course material.",
    timestamp: "2024-02-26T18:30:00Z",
    type: "text"
  },
  {
    id: 12,
    senderId: 1,
    senderType: "supercoach",
    content: "I completely understand! Work-life balance can be challenging. Would it help if we created a more flexible study schedule that works with your work commitments?",
    timestamp: "2024-02-26T19:00:00Z",
    type: "text"
  }
];

// Mock Conversations with versioning (keeping as-is for now)
export const mockConversations: Conversation[] = [
  {
    id: 1,
    studentId: 1,
    superCoachId: 1,
    courseId: 1,
    courseVersion: 2,
    messages: mockMessages,
    startedAt: "2024-02-25T10:00:00Z",
    lastMessageAt: "2024-02-25T11:00:00Z"
  },
  {
    id: 2,
    studentId: 3,
    superCoachId: 2,
    courseId: 2,
    courseVersion: 1,
    messages: mockMessages2,
    startedAt: "2024-02-24T14:00:00Z",
    lastMessageAt: "2024-02-24T15:15:00Z"
  },
  {
    id: 3,
    studentId: 2,
    superCoachId: 1,
    courseId: 4,
    courseVersion: 1,
    messages: mockMessages3,
    startedAt: "2024-02-23T09:00:00Z",
    lastMessageAt: "2024-02-26T19:00:00Z"
  }
];

// API hook for courses with authentication
export const useCourses = () => {
  const [data, setData] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const courses = await makeAuthenticatedAPICall<any[]>(
          `${API_BASE_URL}/api/courses`
        );
        
        // Transform API response to match frontend expectations
        const transformedCourses = courses.map((course: any) => ({
          ...course,
          // Map API fields to frontend fields
          enrolledStudents: course.student_count,
          completionRate: course.completion_rate,
          status: course.is_active ? 'live' : 'draft',
          // Add default fields that might be missing
          version: course.version || 1,
          modules: [],
          superCoachId: null,
          baseId: course.id,
          isCurrentVersion: true,
          updatedAt: course.created_at
        }));
        
        setData(transformedCourses);
        console.log('✅ Courses set in state successfully');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('❌ Error fetching courses:', errorMessage);
        setError(errorMessage);
        
      } finally {
        setLoading(false);
        console.log('🏁 Courses fetch completed');
      }
    };

    // Only fetch if authenticated
    if (isAuthenticated()) {
      fetchCourses();
    } else {
      console.warn('🔒 Not authenticated, skipping courses fetch');
      setLoading(false);
      setError('Authentication required');
    }
  }, []);

  return { data, loading, error };
};

// API hook for students with filtering and authentication
export const useStudents = (filters?: {
  course_id?: number;
  status?: string;
  search?: string;
}) => {
  const [data, setData] = useState<Student[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build URL with query parameters manually for better control over integer types
        let url = `${API_BASE_URL}/api/students`;
        const queryParams: string[] = [];
        
        if (filters?.course_id) {
          queryParams.push(`course_id=${filters.course_id}`);
        }
        if (filters?.status) {
          queryParams.push(`status=${encodeURIComponent(filters.status)}`);
        }
        if (filters?.search) {
          queryParams.push(`search=${encodeURIComponent(filters.search)}`);
        }
        
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }
        
        const students = await makeAuthenticatedAPICall<any[]>(url);
        
        // Transform API response to match frontend expectations
        const transformedStudents = students.map((student: any) => ({
          ...student,
          // Map API fields to frontend fields
          enrolledCourses: [], // Will be populated from courses_enrolled count
          progress: [], // Will be populated from task assignments
          joinedAt: student.created_at,
          lastActivity: student.last_active ? new Date(student.last_active).toLocaleString() : 'No activity',
          // Keep original API fields for compatibility
          courses_enrolled: student.courses_enrolled || 0
        }));
        
        setData(transformedStudents);
        console.log('✅ Students set in state successfully');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('❌ Error fetching students:', errorMessage);
        setError(errorMessage);
        
      } finally {
        setLoading(false);
        console.log('🏁 Students fetch completed');
      }
    };

    // Only fetch if authenticated
    if (isAuthenticated()) {
      fetchStudents();
    } else {
      console.warn('🔒 Not authenticated, skipping students fetch');
      setLoading(false);
      setError('Authentication required');
    }
  }, [filters?.course_id, filters?.status, filters?.search]);

  return { data, loading, error };
};

// API hook for student details with authentication
export const useStudentDetail = (studentId: number | null) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchStudentDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const studentDetail = await makeAuthenticatedAPICall<any>(
          `${API_BASE_URL}/api/students/${studentId}`
        );
        
        setData(studentDetail);
        console.log('✅ Student detail set in state successfully');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('❌ Error fetching student detail:', errorMessage);
        setError(errorMessage);
        
      } finally {
        setLoading(false);
        console.log('🏁 Student detail fetch completed');
      }
    };

    // Only fetch if authenticated
    if (isAuthenticated()) {
      fetchStudentDetail();
    } else {
      console.warn('🔒 Not authenticated, skipping student detail fetch');
      setLoading(false);
      setError('Authentication required');
    }
  }, [studentId]);

  return { data, loading, error };
};

// API hook for leaderboard with authentication
export const useLeaderboard = (filters?: {
  course_id?: number;
  limit?: number;
  student_id?: number;
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build URL with query parameters
        let url = `${API_BASE_URL}/api/leaderboard`;
        const queryParams: string[] = [];
        
        if (filters?.course_id) {
          queryParams.push(`course_id=${filters.course_id}`);
        }
        if (filters?.limit) {
          queryParams.push(`limit=${filters.limit}`);
        }
        if (filters?.student_id) {
          queryParams.push(`student_id=${filters.student_id}`);
        }
        
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }
        
        const leaderboard = await makeAuthenticatedAPICall<any>(url);
        setData(leaderboard);
        console.log('✅ Leaderboard set in state successfully');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('❌ Error fetching leaderboard:', errorMessage);
        setError(errorMessage);
        
      } finally {
        setLoading(false);
        console.log('🏁 Leaderboard fetch completed');
      }
    };

    // Only fetch if authenticated
    if (isAuthenticated()) {
      fetchLeaderboard();
    } else {
      console.warn('🔒 Not authenticated, skipping leaderboard fetch');
      setLoading(false);
      setError('Authentication required');
    }
  }, [filters?.course_id, filters?.limit, filters?.student_id]);

  return { data, loading, error };
};

// API hook for creating a new course with authentication
export const useCreateCourse = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCourse = async (courseData: { 
    title: string; 
    description?: string;
    modules?: any[];
  }) => {
    console.log('🚀 Creating new course...', courseData);
    
    try {
      setLoading(true);
      setError(null);
      
      const newCourse = await makeAuthenticatedAPICall<any>(
        `${API_BASE_URL}/api/courses`,
        {
          method: 'POST',
          body: JSON.stringify(courseData),
        }
      );
      
      console.log('✅ Course created successfully:', newCourse);
      return newCourse;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error creating course:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createCourse, loading, error };
};

// API hook for creating a new student with authentication
export const useCreateStudent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStudent = async (studentData: { 
    name: string; 
    email: string; 
    phone: string;
    course_ids?: number[];
  }) => {
    console.log('🚀 Creating new student...', studentData);
    
    try {
      setLoading(true);
      setError(null);
      
      const newStudent = await makeAuthenticatedAPICall<any>(
        `${API_BASE_URL}/api/students`,
        {
          method: 'POST',
          body: JSON.stringify(studentData),
        }
      );
      
      console.log('✅ Student created successfully:', newStudent);
      return newStudent;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error creating student:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createStudent, loading, error };
};

// API hook for enrolling a student in a course with authentication
export const useEnrollStudent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrollStudent = async (enrollmentData: { 
    student_id: number; 
    course_id: number;
  }) => {
    console.log('🚀 Enrolling student in course...', enrollmentData);
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeAuthenticatedAPICall<any>(
        `${API_BASE_URL}/api/enrollments`,
        {
          method: 'POST',
          body: JSON.stringify(enrollmentData),
        }
      );
      
      console.log('✅ Student enrolled successfully:', result);
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error enrolling student:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { enrollStudent, loading, error };
};

// API hook for SuperCoaches with fallback to mock data
export const useSuperCoaches = () => {
  const [data, setData] = useState<SuperCoach[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuperCoaches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API first
        const superCoaches = await makeAuthenticatedAPICall<SuperCoach[]>(
          `${API_BASE_URL}/api/supercoaches`
        );
        
        setData(superCoaches);
        console.log('✅ Super coaches set in state successfully');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.warn('⚠️ SuperCoaches API error, falling back to mock data:', errorMessage);
        
        // Fall back to mock data on error (endpoint might not exist yet)
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          setData(mockSuperCoaches);
          setError(null); // Don't show error since we have fallback
        } else {
          setError(errorMessage);
        }
        
      } finally {
        setLoading(false);
        console.log('🏁 Super coaches fetch completed');
      }
    };

    // Only fetch if authenticated
    if (isAuthenticated()) {
      fetchSuperCoaches();
    } else {
      console.warn('🔒 Not authenticated, using mock super coaches data');
      setData(mockSuperCoaches);
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
};

// API hook for conversations with fallback to mock data
export const useConversations = () => {
  const [data, setData] = useState<Conversation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API first
        const conversations = await makeAuthenticatedAPICall<Conversation[]>(
          `${API_BASE_URL}/api/conversations`
        );
        
        setData(conversations);
        console.log('✅ Conversations set in state successfully');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.warn('⚠️ Conversations API error, falling back to mock data:', errorMessage);
        
        // Fall back to mock data on error (endpoint might not exist yet)
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          setData(mockConversations);
          setError(null); // Don't show error since we have fallback
        } else {
          setError(errorMessage);
        }
        
      } finally {
        setLoading(false);
        console.log('🏁 Conversations fetch completed');
      }
    };

    // Only fetch if authenticated
    if (isAuthenticated()) {
      fetchConversations();
    } else {
      console.warn('🔒 Not authenticated, using mock conversations data');
      setData(mockConversations);
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
};

// Combined hook for all dashboard data with authentication
export const useDashboardData = () => {
  const metrics = useDashboardMetrics();
  const studentStatus = useStudentStatus();
  const courses = useCourses();
  const students = useStudents();

  const loading = metrics.loading || studentStatus.loading || courses.loading || students.loading;
  const error = metrics.error || studentStatus.error || courses.error || students.error;

  return {
    metrics: metrics.data,
    studentStatus: studentStatus.data,
    courses: courses.data,
    students: students.data,
    loading,
    error,
    // Individual loading states
    metricsLoading: metrics.loading,
    studentStatusLoading: studentStatus.loading,
    coursesLoading: courses.loading,
    studentsLoading: students.loading,
    // Individual errors
    metricsError: metrics.error,
    studentStatusError: studentStatus.error,
    coursesError: courses.error,
    studentsError: students.error,
  };
};

// Enhanced useStudents hook with real-time filtering
export const useStudentsWithFilters = () => {
  const [filters, setFilters] = useState<{
    course_id?: number;
    status?: string;
    search?: string;
  }>({});

  const { data, loading, error } = useStudents(filters);

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
  };
};

// Utility hook for API status monitoring with authentication
export const useAPIStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkAPIStatus = async () => {
    try {
      // Use a lightweight health check endpoint if available
      const response = await fetch(`${API_BASE_URL}/health`);
      const isHealthy = response.ok;
      setIsOnline(isHealthy);
      setLastChecked(new Date());
      console.log('🏥 API Health Status:', isHealthy ? 'Healthy' : 'Unhealthy');
      return isHealthy;
    } catch (error) {
      console.error('🏥 API Health Check Failed:', error);
      setIsOnline(false);
      setLastChecked(new Date());
      return false;
    }
  };

  useEffect(() => {
    // Check API status on mount
    checkAPIStatus();
    
    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkAPIStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    lastChecked,
    checkAPIStatus,
  };
};

// Hook for managing data refresh
export const useDataRefresh = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    console.log('🔄 Refreshing all data...');
    setRefreshKey(prev => prev + 1);
  };

  return {
    refreshKey,
    refreshData,
  };
};

// Helper function to get recent activity (will be API-powered later)
export const recentActivity = [
  {
    type: 'completion',
    message: 'Sarah Johnson completed Module 1 in Digital Marketing v2',
    course: 'Digital Marketing Mastery v2',
    time: '2 hours ago'
  },
  {
    type: 'followup',
    message: 'AI sent follow-up message to Mike Chen (Digital Marketing v1)',
    course: 'Digital Marketing Mastery v1',
    time: '4 hours ago'
  },
  {
    type: 'completion',
    message: 'Emma Rodriguez completed Team Building task in Leadership v1',
    course: 'Leadership Excellence v1',
    time: '1 day ago'
  },
  {
    type: 'enrollment',
    message: 'David Kim enrolled in Digital Marketing v2 and Leadership v1',
    course: 'Multiple Courses',
    time: '2 days ago'
  }
];

// Export authentication utilities for use in other components
export const authUtils = {
  isAuthenticated,
  getAuthToken,
  clearAuthData,
  redirectToLogin,
};

// Export all API configuration for external use if needed
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    DASHBOARD_METRICS: '/api/dashboard/metrics',
    STUDENT_STATUS: '/api/dashboard/student-status',
    COURSES: '/api/courses',
    STUDENTS: '/api/students',
    STUDENT_DETAIL: '/api/students',
    LEADERBOARD: '/api/leaderboard',
    ENROLLMENTS: '/api/enrollments',
    SUPERCOACHES: '/api/supercoaches',
    CONVERSATIONS: '/api/conversations',
    AUTH_LOGIN: '/api/auth/login',
    AUTH_LOGOUT: '/api/auth/logout',
    AUTH_REFRESH: '/api/auth/refresh',
    AUTH_ME: '/api/auth/me',
    HEALTH: '/health',
  }
} as const;