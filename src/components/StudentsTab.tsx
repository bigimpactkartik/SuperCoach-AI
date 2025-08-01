import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, TrendingUp, AlertTriangle, Plus, UserPlus } from 'lucide-react';
import { Student, Course } from '../types';
import StudentRow from './StudentRow';
import { useStudents, useCourses } from '../data/mockData';

interface StudentsTabProps {
  onViewDetails: (student: Student) => void;
  onAddToCourse: (studentId: number, courseId: number) => void;
  onRemoveFromCourse: (studentId: number, courseId: number) => void;
  // Optional fallback props for backward compatibility
  students?: Student[];
  courses?: Course[];
}

const StudentsTab: React.FC<StudentsTabProps> = ({ 
  onViewDetails, 
  onAddToCourse, 
  onRemoveFromCourse,
  students: propStudents,
  courses: propCourses
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // API hooks with filters
  const { 
    data: apiStudents, 
    loading: studentsLoading, 
    error: studentsError 
  } = useStudents({
    course_id: selectedCourse ? parseInt(selectedCourse) : undefined,
    status: selectedStatus || undefined,
    search: searchTerm || undefined
  });

  const { 
    data: apiCourses, 
    loading: coursesLoading, 
    error: coursesError 
  } = useCourses();

  // Use API data if available, otherwise fall back to props
  const students = apiStudents || propStudents || [];
  const courses = apiCourses || propCourses || [];

  // Client-side filtering for prop data (when API filtering isn't available)
  const filteredStudents = searchTerm || selectedCourse || selectedStatus 
    ? students.filter(student => {
        const matchesSearch = !searchTerm || (
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Handle both API structure (courses_enrolled) and mock structure (enrolledCourses)
        const studentCourses = student.courses_enrolled || student.enrolledCourses || [];
        const matchesCourse = !selectedCourse || (
          Array.isArray(studentCourses) 
            ? studentCourses.some(enrollment => 
                typeof enrollment === 'object' 
                  ? enrollment.courseId === parseInt(selectedCourse) 
                  : enrollment === parseInt(selectedCourse)
              )
            : studentCourses === parseInt(selectedCourse)
        );
        
        const matchesStatus = !selectedStatus || student.status === selectedStatus;
        return matchesSearch && matchesCourse && matchesStatus;
      })
    : students;

  // Show loading state
  if ((studentsLoading || coursesLoading) && !propStudents && !propCourses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  // Show error state (but still show fallback data if available)
  if ((studentsError || coursesError) && !students.length && !courses.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center bg-red-50 rounded-xl">
          <div className="mb-4 text-red-500">
            <Users size={48} className="mx-auto" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-red-700">Error Loading Students</h2>
          <p className="text-red-600">{studentsError || coursesError}</p>
          <p className="mt-2 text-sm text-red-500">
            Please check the console for more details or ensure your backend is running.
          </p>
        </div>
      </div>
    );
  }

  const statusCounts = {
    new: students.filter(s => s.status === 'new').length,
    'in-progress': students.filter(s => s.status === 'in-progress').length,
    stuck: students.filter(s => s.status === 'stuck').length,
    completed: students.filter(s => s.status === 'completed').length
  };

  const avgProgress = students.length > 0 
    ? Math.round(students.reduce((acc, s) => {
        // Handle both API structure (overall_progress) and mock structure (progress array)
        const progress = s.overall_progress !== undefined 
          ? s.overall_progress 
          : s.progress && s.progress.length > 0 
            ? (s.progress.filter(p => p.status === 'completed').length / s.progress.length) * 100 
            : 0;
        return acc + progress;
      }, 0) / students.length) 
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Error Banner (show if there's an error but we have fallback data) */}
      {(studentsError || coursesError) && (students.length > 0 || courses.length > 0) && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl">
          <div className="flex items-center gap-2 text-yellow-800">
            <Users size={16} />
            <span className="text-sm font-medium">
              Unable to fetch latest student data. Showing cached information.
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <h2 className="mb-2 text-3xl font-bold gradient-text">Student Management</h2>
          <p className="text-gray-600">Monitor and engage with your students' learning journey
            {(studentsLoading || coursesLoading) && <span className="ml-2 text-purple-600">(Updating...)</span>}
          </p>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex gap-3">
            <div className="relative">
              <Search size={20} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-3 pl-10 pr-4 transition-all duration-200 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white/80 backdrop-blur-sm min-w-64"
              />
            </div>
            
            <select 
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-3 transition-all duration-200 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white/80 backdrop-blur-sm"
              disabled={coursesLoading}
            >
              <option value="">All Courses</option>
              {courses.filter(c => c.status === 'live').map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 transition-all duration-200 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white/80 backdrop-blur-sm"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="stuck">Stuck</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        <div className="p-6 transition-all duration-300 glass rounded-xl hover:shadow-glow-blue">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Users className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{students.length}</span>
          </div>
          <p className="text-sm font-semibold text-gray-600">Total Students</p>
        </div>
        
        <div className="p-6 transition-all duration-300 glass rounded-xl hover:shadow-glow-green">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <TrendingUp className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-emerald-600">{statusCounts['in-progress']}</span>
          </div>
          <p className="text-sm font-semibold text-gray-600">In Progress</p>
        </div>
        
        <div className="p-6 transition-all duration-300 glass rounded-xl hover:shadow-glow-purple">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-orange-600">{statusCounts.stuck}</span>
          </div>
          <p className="text-sm font-semibold text-gray-600">Need Help</p>
        </div>
        
        <div className="p-6 transition-all duration-300 glass rounded-xl hover:shadow-glow-green">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <span className="text-lg font-bold text-white">{statusCounts.completed}</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-600">Completed</p>
        </div>
        
        <div className="p-6 transition-all duration-300 glass rounded-xl hover:shadow-glow-purple">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
              <span className="text-lg font-bold text-white">{avgProgress}%</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-600">Avg Progress</p>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedCourse && ` in ${courses.find(c => c.id === parseInt(selectedCourse))?.title}`}
            {selectedStatus && ` with status "${selectedStatus.replace('-', ' ')}"`}
          </h3>
          
          {/* Show total vs filtered count */}
          {filteredStudents.length !== students.length && (
            <p className="text-sm text-gray-500">
              of {students.length} total students
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          {filteredStudents.map(student => (
            <StudentRow 
              key={student.id} 
              student={student} 
              courses={courses}
              onViewDetails={() => onViewDetails(student)}
              onAddToCourse={onAddToCourse}
              onRemoveFromCourse={onRemoveFromCourse}
            />
          ))}
        </div>

        {filteredStudents.length === 0 && !studentsLoading && (
          <div className="p-12 text-center glass rounded-2xl">
            <div className="mb-4 text-gray-400">
              <Users size={48} className="mx-auto" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              {students.length === 0 ? 'No students yet' : 'No students found'}
            </h3>
            <p className="text-gray-600">
              {students.length === 0 
                ? 'Add your first student to get started'
                : 'Try adjusting your search criteria'
              }
            </p>
          </div>
        )}
      </div>

      {/* Debug Information (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 mt-4 text-xs bg-gray-100 rounded-lg">
          <strong>Debug Info (StudentsTab):</strong>
          <div>Students API Loading: {studentsLoading.toString()}</div>
          <div>Courses API Loading: {coursesLoading.toString()}</div>
          <div>Students API Error: {studentsError || 'None'}</div>
          <div>Courses API Error: {coursesError || 'None'}</div>
          <div>API Students Count: {apiStudents?.length || 0}</div>
          <div>API Courses Count: {apiCourses?.length || 0}</div>
          <div>Prop Students Count: {propStudents?.length || 0}</div>
          <div>Prop Courses Count: {propCourses?.length || 0}</div>
          <div>Used Students Count: {students.length}</div>
          <div>Filtered Students Count: {filteredStudents.length}</div>
          <div>Current Filters: search="{searchTerm}", course="{selectedCourse}", status="{selectedStatus}"</div>
          <div>Data Source: Students={apiStudents ? 'API' : propStudents ? 'Props' : 'None'}, Courses={apiCourses ? 'API' : propCourses ? 'Props' : 'None'}</div>
        </div>
      )}
    </div>
  );
};

export default StudentsTab;