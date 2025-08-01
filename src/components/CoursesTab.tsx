import React, { useState } from 'react';
import { Plus, Search, Filter, Edit, Copy, Play, Archive, Lock, UserPlus, CheckCircle, X } from 'lucide-react';
import { Course } from '../types';
import CourseCard from './CourseCard';
import { useCourses } from '../data/mockData';

// API Configuration
const BASE_URL = 'http://localhost:3100';

// Create Student Modal Component
interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateStudentModal: React.FC<CreateStudentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  // Validate form data
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim()
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create student';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      setShowSuccess(true);
      setFormData({ name: '', email: '', phone: '' });
      
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        onSuccess();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    if (error) {
      setError(null);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    
    setFormData({ name: '', email: '', phone: '' });
    setError(null);
    setFieldErrors({});
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      <div className="relative w-full max-w-md mx-4 bg-white shadow-2xl rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {showSuccess && (
          <div className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Student Created Successfully!</h3>
              <p className="text-gray-600">The new student has been added to your system.</p>
            </div>
          </div>
        )}

        {!showSuccess && (
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                  fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter student's full name"
                disabled={isLoading}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                  fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="student@example.com"
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                  fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 font-medium text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center justify-center flex-1 gap-2 px-4 py-3 font-medium text-white transition-all bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Student'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CoursesTabProps {
  onCreateCourse: () => void;
  onEditCourse: (course: Course) => void;
  onCreateVersion: (courseId: number) => void;
  onMakeLive: (courseId: number) => void;
  onCreateStudent: () => void;
  courses?: Course[];
}

const CoursesTab: React.FC<CoursesTabProps> = ({ 
  onCreateCourse, 
  onEditCourse, 
  onCreateVersion, 
  onMakeLive,
  onCreateStudent,
  courses: propCourses
}) => {
  const { data: apiCourses, loading, error } = useCourses();
  const courses = apiCourses || propCourses || [];
  
  // State for create student modal
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  
  // Success notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  // Handle create student button click
  const handleCreateStudentClick = () => {
    setShowCreateStudentModal(true);
  };

  // Handle student creation success
  const handleStudentCreated = () => {
    // Show success notification
    setShowSuccessNotification(true);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
    
    // Call the original onCreateStudent if needed for data refresh
    if (onCreateStudent) {
      onCreateStudent();
    }
  };

  // Show loading state
  if (loading && !propCourses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !courses.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center bg-red-50 rounded-xl">
          <div className="mb-4 text-red-500">
            <Archive size={48} className="mx-auto" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-red-700">Error Loading Courses</h2>
          <p className="text-red-600">{error}</p>
          <p className="mt-2 text-sm text-red-500">
            Please check the console for more details or ensure your backend is running.
          </p>
        </div>
      </div>
    );
  }

  const liveCourses = courses.filter(c => c.status === 'live');
  const draftCourses = courses.filter(c => c.status === 'draft');
  const archivedCourses = courses.filter(c => c.status === 'archived');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed z-50 p-4 border border-green-200 shadow-lg top-4 right-4 bg-green-50 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">Student created successfully!</p>
            <button
              onClick={() => setShowSuccessNotification(false)}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create Student Modal */}
      <CreateStudentModal
        isOpen={showCreateStudentModal}
        onClose={() => setShowCreateStudentModal(false)}
        onSuccess={handleStudentCreated}
      />

      {/* Error Banner */}
      {error && courses.length > 0 && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl">
          <div className="flex items-center gap-2 text-yellow-800">
            <Archive size={16} />
            <span className="text-sm font-medium">
              Unable to fetch latest course data. Showing cached information.
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <h2 className="mb-2 text-3xl font-bold gradient-text">Course Management</h2>
          <p className="text-gray-600">Create, manage, and monitor your training courses
            {loading && <span className="ml-2 text-blue-600">(Updating...)</span>}
          </p>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex gap-3">
            <div className="relative">
              <Search size={20} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="py-3 pl-10 pr-4 transition-all duration-200 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm min-w-64"
              />
            </div>
            <button className="px-4 py-3 transition-all duration-200 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white/80 backdrop-blur-sm">
              <Filter size={20} className="text-gray-600" />
            </button>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleCreateStudentClick}
              className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all duration-200 transform shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl"
            >
              <UserPlus size={20} />
              Add Student
            </button>
            
            <button 
              onClick={onCreateCourse}
              className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all duration-200 transform shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 hover:scale-105 hover:shadow-xl"
            >
              <Plus size={20} />
              Create Course
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="p-6 glass rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <span className="text-lg font-bold text-white">{liveCourses.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Live Courses</p>
              <p className="text-lg font-bold text-gray-900">Active Programs</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 glass rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <span className="text-lg font-bold text-white">{draftCourses.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Draft Courses</p>
              <p className="text-lg font-bold text-gray-900">In Development</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 glass rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
              <span className="text-lg font-bold text-white">
                {courses.reduce((acc, course) => acc + (course.student_count || course.enrolledStudents || 0), 0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
              <p className="text-lg font-bold text-gray-900">All Courses</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 glass rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
              <span className="text-lg font-bold text-white">
                {courses.length > 0 
                  ? Math.round(courses.reduce((acc, course) => acc + (course.completion_rate || course.completionRate || 0), 0) / courses.length)
                  : 0}%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Completion</p>
              <p className="text-lg font-bold text-gray-900">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Courses */}
      {liveCourses.length > 0 && (
        <div className="p-8 shadow-lg glass rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Play className="text-emerald-600" size={24} />
              Live Courses
            </h3>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCreateStudentClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 transition-all duration-200 bg-blue-50 rounded-xl hover:bg-blue-100"
              >
                <UserPlus size={16} />
                Add Student to Live Course
              </button>
              <div className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-orange-600 rounded-full bg-orange-50">
                <Lock size={14} />
                Protected from editing
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {liveCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course} 
                onEdit={() => onEditCourse(course)}
                onCreateVersion={() => onCreateVersion(course.id)}
                onMakeLive={() => onMakeLive(course.id)}
                isLocked={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Draft Courses */}
      {draftCourses.length > 0 && (
        <div className="p-8 shadow-lg glass rounded-2xl">
          <h3 className="flex items-center gap-2 mb-6 text-2xl font-bold text-gray-900">
            <Edit className="text-blue-600" size={24} />
            Draft Courses
          </h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {draftCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course} 
                onEdit={() => onEditCourse(course)}
                onCreateVersion={() => onCreateVersion(course.id)}
                onMakeLive={() => onMakeLive(course.id)}
                isLocked={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Courses State */}
      {courses.length === 0 && !loading && (
        <div className="p-12 text-center glass rounded-2xl">
          <div className="mb-4 text-gray-400">
            <Plus size={48} className="mx-auto" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">No courses yet</h3>
          <p className="mb-6 text-gray-600">Create your first course to get started</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={handleCreateStudentClick}
              className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all duration-200 transform shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl"
            >
              <UserPlus size={20} />
              Add Student
            </button>
            <button 
              onClick={onCreateCourse}
              className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all duration-200 transform shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 hover:scale-105 hover:shadow-xl"
            >
              <Plus size={20} />
              Create Course
            </button>
          </div>
        </div>
      )}

      {/* Debug Information (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 mt-4 text-xs bg-gray-100 rounded-lg">
          <strong>Debug Info (CoursesTab):</strong>
          <div>API Loading: {loading.toString()}</div>
          <div>API Error: {error || 'None'}</div>
          <div>API Courses Count: {apiCourses?.length || 0}</div>
          <div>Prop Courses Count: {propCourses?.length || 0}</div>
          <div>Used Courses Count: {courses.length}</div>
          <div>Data Source: {apiCourses ? 'API' : propCourses ? 'Props' : 'None'}</div>
        </div>
      )}
    </div>
  );
};

export default CoursesTab;