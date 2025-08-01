import React from 'react';
import { Edit, Copy, Play, Users, BookOpen, Clock, MoreVertical, Lock, AlertTriangle, GitBranch } from 'lucide-react';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onEdit: () => void;
  onCreateVersion: () => void;
  onMakeLive: () => void;
  isLocked?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEdit, onCreateVersion, onMakeLive, isLocked = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'from-emerald-500 to-teal-600';
      case 'draft': return 'from-blue-500 to-indigo-600';
      case 'archived': return 'from-gray-500 to-slate-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'Live';
      case 'draft': return 'Draft';
      case 'archived': return 'Archived';
      default: return status;
    }
  };

  const handleEditClick = () => {
    if (isLocked && course.status === 'live') {
      // Show warning for live courses
      alert('Live courses cannot be edited to maintain data integrity for enrolled students. Create a new version instead.');
      return;
    }
    onEdit();
  };

  return (
    <div className="relative p-6 overflow-hidden transition-all duration-300 transform glass rounded-2xl hover:shadow-xl hover:-translate-y-2 group">
      {/* Background Pattern */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getStatusColor(course.status)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-blue-600">
                {course.title}
              </h3>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStatusColor(course.status)} shadow-lg`}>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                {getStatusText(course.status)}
              </span>
              {isLocked && course.status === 'live' && (
                <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                  <Lock size={12} />
                  Protected
                </div>
              )}
            </div>
            <p className="mb-3 text-sm text-gray-600 line-clamp-2">{course.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <GitBranch size={12} />
                <span>Version {course.version}</span>
              </div>
              <span>•</span>
              <span>Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
              {/* {course.baseId && (
                 <>
                   <span>•</span>
                   <span>Base ID: {course.baseId}</span>
                </>
              )} */}
              {/* {course.isCurrentVersion && (
                <>
                  <span>•</span>
                  <span className="font-medium text-emerald-600">Current</span>
                </>
              )} */}
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen size={14} className="text-blue-600" />
              <span className="text-lg font-bold text-blue-600">{course.modules.length}</span>
            </div>
            <p className="text-xs font-medium text-gray-600">Modules</p>
          </div>
          
          <div className="p-3 text-center bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users size={14} className="text-emerald-600" />
              <span className="text-lg font-bold text-emerald-600">{course.enrolledStudents}</span>
            </div>
            <p className="text-xs font-medium text-gray-600">Students</p>
          </div>
          
          <div className="p-3 text-center bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock size={14} className="text-purple-600" />
              <span className="text-lg font-bold text-purple-600">{course.completionRate}%</span>
            </div>
            <p className="text-xs font-medium text-gray-600">Complete</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={handleEditClick}
            disabled={isLocked && course.status === 'live'}
            className={`flex-1 px-4 py-2 rounded-xl transition-all duration-200 text-sm font-semibold transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
              isLocked && course.status === 'live'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {isLocked && course.status === 'live' ? (
              <>
                <Lock size={14} />
                {/*Locked*/}
                View
              </>
            ) : (
              <>
                <Edit size={14} />
                Edit
              </>
            )}
          </button>
          
          <button 
  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-400 border-2 border-gray-200 opacity-50 cursor-not-allowed rounded-xl bg-gray-50"
  disabled
>
  <Copy size={14} />
  Version
</button>
          
          {course.status === 'draft' && (
            <button 
              onClick={onMakeLive}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-200 transform border-2 border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 hover:scale-105"
            >
              <Play size={14} />
              Go Live
            </button>
          )}
        </div>

        {/* Version Info for Live Courses */}
        {course.status === 'live' && course.enrolledStudents > 0 && (
          <div className="p-3 mt-4 border border-orange-200 bg-orange-50 rounded-xl">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle size={14} />
              <span className="text-xs font-medium">
                This course is live with {course.enrolledStudents} enrolled student{course.enrolledStudents !== 1 ? 's' : ''}. 
                Students enrolled in this version will always access v{course.version} content.
              </span>
            </div>
          </div>
        )}

        {/* Version History Indicator */}
        {course.baseId && !course.isCurrentVersion && (
          <div className="p-3 mt-4 border border-blue-200 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 text-blue-700">
              <GitBranch size={14} />
              <span className="text-xs font-medium">
                This is version {course.version} of the course. Students enrolled in this version will continue to access this content.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;