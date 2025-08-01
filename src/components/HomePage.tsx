import React, { useState } from 'react';
import { Users, BookOpen, MessageCircle, TrendingUp, Filter, Search } from 'lucide-react';
import { Student, Course } from '../types';
import StudentCard from './StudentCard';
import { useDashboardMetrics, useStudentStatus } from '../data/mockData';

interface HomePageProps {
  students: Student[];
  courses: Course[];
  onViewStudentDetails: (student: Student) => void;
}

const HomePage: React.FC<HomePageProps> = ({ students, courses, onViewStudentDetails }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // API hooks for dashboard data
  const { data: metrics, loading: metricsLoading, error: metricsError } = useDashboardMetrics();
  const { data: studentStatus, loading: statusLoading, error: statusError } = useStudentStatus();

  // Calculate status counts from students prop for now (we'll migrate this later)
  const statusCounts = {
    all: students.length,
    new: students.filter(s => s.status === 'new').length,
    'in-progress': students.filter(s => s.status === 'in-progress').length,
    stuck: students.filter(s => s.status === 'stuck').length,
    completed: students.filter(s => s.status === 'completed').length
  };

  const filteredStudents = students.filter(student => {
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'from-blue-500 to-indigo-600';
      case 'in-progress': return 'from-orange-500 to-amber-600';
      case 'stuck': return 'from-red-500 to-pink-600';
      case 'completed': return 'from-emerald-500 to-teal-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return Users;
      case 'in-progress': return TrendingUp;
      case 'stuck': return MessageCircle;
      case 'completed': return BookOpen;
      default: return Users;
    }
  };

  // Show loading state
  if (metricsLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (metricsError || statusError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center bg-red-50 rounded-xl">
          <div className="mb-4 text-red-500">
            <MessageCircle size={48} className="mx-auto" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-red-700">Error Loading Dashboard</h2>
          <p className="text-red-600">
            {metricsError || statusError}
          </p>
          <p className="mt-2 text-sm text-red-500">
            Please check the console for more details or ensure your backend is running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="relative p-8 overflow-hidden glass rounded-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
        <div className="relative z-10">
          <h1 className="mb-4 text-4xl font-bold gradient-text">Dashboard</h1>
          <p className="mb-6 text-lg text-gray-600">Monitor student progress and manage your coaching programs</p>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="p-4 text-center bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="text-2xl font-bold text-blue-600">
                {metrics?.live_courses ?? 0}
              </div>
              <div className="text-sm text-gray-600">Live Courses</div>
            </div>
            <div className="p-4 text-center bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="text-2xl font-bold text-emerald-600">
                {metrics?.total_students ?? 0}
              </div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="p-4 text-center bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="text-2xl font-bold text-purple-600">
                {metrics?.avg_progress?.toFixed(1) ?? 0}%
              </div>
              <div className="text-sm text-gray-600">Avg Progress</div>
            </div>
            <div className="p-4 text-center bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="text-2xl font-bold text-orange-600">
                {metrics?.need_help ?? 0}
              </div>
              <div className="text-sm text-gray-600">Need Help</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="p-6 glass rounded-2xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Student Status Overview</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-5">
          {/* Use API data for status counts, with fallback to prop data */}
          {[
            { key: 'all', label: 'all', count: studentStatus?.all ?? statusCounts.all },
            { key: 'new', label: 'new', count: studentStatus?.new ?? statusCounts.new },
            { key: 'in-progress', label: 'in progress', count: studentStatus?.in_progress ?? statusCounts['in-progress'] },
            { key: 'stuck', label: 'stuck', count: studentStatus?.stuck ?? statusCounts.stuck },
            { key: 'completed', label: 'completed', count: studentStatus?.completed ?? statusCounts.completed }
          ].map(({ key, label, count }) => {
            const Icon = getStatusIcon(key);
            const isActive = selectedStatus === key;
            
            return (
              <button
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={`p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  isActive 
                    ? `bg-gradient-to-r ${getStatusColor(key)} text-white shadow-lg` 
                    : 'bg-white/60 hover:bg-white/80 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Icon size={24} />
                </div>
                <div className="mb-1 text-2xl font-bold">{count}</div>
                <div className="text-sm capitalize">{label.replace('-', ' ')}</div>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={20} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input 
            type="text" 
            placeholder="Search students..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-10 pr-4 transition-all duration-200 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
          />
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map(student => (
            <StudentCard 
              key={student.id} 
              student={student} 
              courses={courses}
              onClick={() => onViewStudentDetails(student)}
            />
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-400">
              <Users size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600">No students found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Debug Information (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 mt-4 text-xs bg-gray-100 rounded-lg">
          <strong>Debug Info:</strong>
          <div>Metrics Loading: {metricsLoading.toString()}</div>
          <div>Status Loading: {statusLoading.toString()}</div>
          <div>Metrics Error: {metricsError || 'None'}</div>
          <div>Status Error: {statusError || 'None'}</div>
          <div>Metrics Data: {JSON.stringify(metrics)}</div>
          <div>Status Data: {JSON.stringify(studentStatus)}</div>
        </div>
      )}
    </div>
  );
};

export default HomePage;