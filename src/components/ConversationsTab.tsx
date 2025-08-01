import React, { useState } from 'react';
import { Search, Filter, MessageCircle, Bot, User, Clock } from 'lucide-react';
import { Conversation, Student, SuperCoach } from '../types';
import { useConversations, useStudents, useSuperCoaches } from '../data/mockData';

interface ConversationsTabProps {
  onViewConversation: (conversation: Conversation) => void;
  // Optional fallback props for backward compatibility
  conversations?: Conversation[];
  students?: Student[];
  superCoaches?: SuperCoach[];
}

const ConversationsTab: React.FC<ConversationsTabProps> = ({ 
  onViewConversation,
  conversations: propConversations,
  students: propStudents,
  superCoaches: propSuperCoaches
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuperCoach, setSelectedSuperCoach] = useState('');

  // API hooks
  const { 
    data: apiConversations, 
    loading: conversationsLoading, 
    error: conversationsError 
  } = useConversations();

  const { 
    data: apiStudents, 
    loading: studentsLoading, 
    error: studentsError 
  } = useStudents();

  const { 
    data: apiSuperCoaches, 
    loading: superCoachesLoading, 
    error: superCoachesError 
  } = useSuperCoaches();

  // Use API data if available, otherwise fall back to props
  const conversations = apiConversations || propConversations || [];
  const students = apiStudents || propStudents || [];
  const superCoaches = apiSuperCoaches || propSuperCoaches || [];

  // Show loading state (same as HomePage)
  if ((conversationsLoading || studentsLoading || superCoachesLoading) && !propConversations && !propStudents && !propSuperCoaches) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // Show error state (same as HomePage)
  if ((conversationsError || studentsError || superCoachesError) && !conversations.length && !students.length && !superCoaches.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center bg-red-50 rounded-xl">
          <div className="mb-4 text-red-500">
            <MessageCircle size={48} className="mx-auto" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-red-700">Error Loading Conversations</h2>
          <p className="text-red-600">
            {conversationsError || studentsError || superCoachesError}
          </p>
          <p className="mt-2 text-sm text-red-500">
            Please check the console for more details or ensure your backend is running.
          </p>
        </div>
      </div>
    );
  }

  const filteredConversations = conversations.filter(conversation => {
    const student = students.find(s => s.id === conversation.studentId);
    const superCoach = superCoaches.find(sc => sc.id === conversation.superCoachId);
    
    const matchesSearch = !searchTerm || (
      student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      superCoach?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesSuperCoach = !selectedSuperCoach || conversation.superCoachId === parseInt(selectedSuperCoach);
    
    return matchesSearch && matchesSuperCoach;
  });

  const getTimeSince = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Error Banner (show if there's an error but we have fallback data) */}
      {(conversationsError || studentsError || superCoachesError) && (conversations.length > 0 || students.length > 0 || superCoaches.length > 0) && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl">
          <div className="flex items-center gap-2 text-yellow-800">
            <MessageCircle size={16} />
            <span className="text-sm font-medium">
              Unable to fetch latest conversation data. Showing cached information.
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <h2 className="mb-2 text-3xl font-bold gradient-text">Conversation History</h2>
          <p className="text-gray-600">View and manage conversations between students and SuperCoaches
            {(conversationsLoading || studentsLoading || superCoachesLoading) && <span className="ml-2 text-pink-600">(Updating...)</span>}
          </p>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative">
            <Search size={20} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-3 pl-10 pr-4 transition-all duration-200 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white/80 backdrop-blur-sm min-w-64"
            />
          </div>
          
          <select 
            value={selectedSuperCoach}
            onChange={(e) => setSelectedSuperCoach(e.target.value)}
            className="px-4 py-3 transition-all duration-200 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white/80 backdrop-blur-sm"
            disabled={superCoachesLoading}
          >
            <option value="">All SuperCoaches</option>
            {superCoaches.map(superCoach => (
              <option key={superCoach.id} value={superCoach.id}>{superCoach.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="p-6 glass rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
              <MessageCircle className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
              <p className="text-sm font-medium text-gray-600">Total Conversations</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 glass rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{superCoaches.filter(sc => sc.isActive).length}</p>
              <p className="text-sm font-medium text-gray-600">Active Coaches</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 glass rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <User className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{new Set(conversations.map(c => c.studentId)).size}</p>
              <p className="text-sm font-medium text-gray-600">Students Engaged</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 glass rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
              <span className="text-lg font-bold text-white">{conversations.reduce((acc, c) => acc + c.messages.length, 0)}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">Messages</p>
              <p className="text-sm font-medium text-gray-600">Total Exchanged</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="p-8 shadow-lg glass rounded-2xl">
        <h3 className="mb-6 text-2xl font-bold text-gray-900">Recent Conversations</h3>
        
        <div className="space-y-4">
          {filteredConversations.map(conversation => {
            const student = students.find(s => s.id === conversation.studentId);
            const superCoach = superCoaches.find(sc => sc.id === conversation.superCoachId);
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            
            if (!student || !superCoach) return null;

            return (
              <div 
                key={conversation.id}
                onClick={() => onViewConversation(conversation)}
                className="flex items-center gap-4 p-4 transition-all duration-300 cursor-pointer bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 group"
              >
                {/* Student Avatar */}
                <div className="flex items-center justify-center w-12 h-12 font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.name} className="object-cover w-full h-full rounded-xl" />
                  ) : (
                    student.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-600">
                      {student.name}
                    </h4>
                    <span className="text-gray-400">↔</span>
                    <span className="text-sm font-medium text-gray-600">{superCoach.name}</span>
                  </div>
                  
                  {lastMessage && (
                    <p className="text-sm text-gray-600 line-clamp-1">
                      <span className="font-medium">
                        {lastMessage.senderType === 'student' ? student.name : superCoach.name}:
                      </span>
                      {' '}{lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Message Count & Time */}
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">{conversation.messages.length}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{getTimeSince(conversation.lastMessageAt)}</span>
                  </div>
                </div>

                {/* SuperCoach Avatar */}
                <div className="flex items-center justify-center w-10 h-10 text-white rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                  {superCoach.avatar ? (
                    <img src={superCoach.avatar} alt={superCoach.name} className="object-cover w-full h-full rounded-lg" />
                  ) : (
                    <Bot size={16} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredConversations.length === 0 && !conversationsLoading && (
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-400">
              <MessageCircle size={48} className="mx-auto" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              {conversations.length === 0 ? 'No conversations yet' : 'No conversations found'}
            </h3>
            <p className="text-gray-600">
              {conversations.length === 0 
                ? 'Start engaging with students to see conversations here'
                : 'Try adjusting your search criteria'
              }
            </p>
          </div>
        )}
      </div>

      {/* Debug Information (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 mt-4 text-xs bg-gray-100 rounded-lg">
          <strong>Debug Info (ConversationsTab):</strong>
          <div>Conversations API Loading: {conversationsLoading.toString()}</div>
          <div>Students API Loading: {studentsLoading.toString()}</div>
          <div>SuperCoaches API Loading: {superCoachesLoading.toString()}</div>
          <div>Conversations API Error: {conversationsError || 'None'}</div>
          <div>Students API Error: {studentsError || 'None'}</div>
          <div>SuperCoaches API Error: {superCoachesError || 'None'}</div>
          <div>API Conversations Count: {apiConversations?.length || 0}</div>
          <div>API Students Count: {apiStudents?.length || 0}</div>
          <div>API SuperCoaches Count: {apiSuperCoaches?.length || 0}</div>
          <div>Prop Conversations Count: {propConversations?.length || 0}</div>
          <div>Prop Students Count: {propStudents?.length || 0}</div>
          <div>Prop SuperCoaches Count: {propSuperCoaches?.length || 0}</div>
          <div>Used Conversations Count: {conversations.length}</div>
          <div>Filtered Conversations Count: {filteredConversations.length}</div>
          <div>Current Filters: search="{searchTerm}", superCoach="{selectedSuperCoach}"</div>
          <div>Data Source: Conversations={apiConversations ? 'API' : propConversations ? 'Props' : 'None'}, Students={apiStudents ? 'API' : propStudents ? 'Props' : 'None'}, SuperCoaches={apiSuperCoaches ? 'API' : propSuperCoaches ? 'Props' : 'None'}</div>
        </div>
      )}
    </div>
  );
};

export default ConversationsTab;