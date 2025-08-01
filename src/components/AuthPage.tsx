import React, { useState } from 'react';
import { Target, Phone, User, Mail, ArrowRight, Sparkles, Shield, Zap, Eye, EyeOff, X, CheckCircle, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onAuthenticated: () => void;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

interface Coach {
  id: string;
  name: string;
  email: string;
  phone?: string;
  auth_user_id: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  coach: Coach;
  expires_in: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed z-50 top-4 right-4 animate-slide-in">
      <div className={`glass rounded-xl p-4 shadow-xl border-l-4 ${
        type === 'success' 
          ? 'border-green-500 bg-green-50/80' 
          : 'border-red-500 bg-red-50/80'
      }`}>
        <div className="flex items-center gap-3">
          {type === 'success' ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className="text-red-600" />
          )}
          <p className={`font-medium ${
            type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message}
          </p>
          <button
            onClick={onClose}
            className={`ml-2 ${
              type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
            }`}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // API configuration
  const API_BASE_URL = 'http://localhost:3100';

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Email validation (required for both login and signup)
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (isSignUp && !validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Sign up specific validations
    if (isSignUp) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }

      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      const loginData: LoginResponse = data;

      // Store tokens in localStorage
      localStorage.setItem('access_token', loginData.access_token);
      localStorage.setItem('refresh_token', loginData.refresh_token);
      localStorage.setItem('coach', JSON.stringify(loginData.coach));
      localStorage.setItem('expires_at', String(Date.now() + (loginData.expires_in * 1000)));

      showToast(`Welcome back, ${loginData.coach.name}!`, 'success');
      
      // Small delay to show success message
      setTimeout(() => {
        onAuthenticated();
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  const handleSignUp = async () => {
    try {
      // Note: Your backend doesn't have a signup endpoint, so this is a placeholder
      // You would need to implement this in your FastAPI backend
      showToast('Sign up functionality needs to be implemented in the backend', 'error');
      
      // For now, we'll just show the error message
      // In a real implementation, you would:
      // 1. Create a POST /api/auth/signup endpoint in your backend
      // 2. Handle user registration with Supabase
      // 3. Send verification email if needed
      
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await handleSignUp();
      } else {
        await handleLogin();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Learning",
      description: "Personalized coaching with advanced AI technology"
    },
    {
      icon: Shield,
      title: "Progress Tracking",
      description: "Monitor your learning journey with detailed analytics"
    },
    {
      icon: Sparkles,
      title: "Interactive Content",
      description: "Engaging modules designed for maximum retention"
    }
  ];

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Left Side - Features */}
        <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute w-32 h-32 rounded-full top-20 left-20 bg-white/10 animate-float"></div>
          <div className="absolute w-24 h-24 rounded-full bottom-32 right-16 bg-white/10 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute w-16 h-16 rounded-full top-1/2 left-1/3 bg-white/10 animate-float" style={{animationDelay: '4s'}}></div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Target size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">SuperCoach AI</h1>
                  <p className="text-white/80">Your AI-Powered Learning Companion</p>
                </div>
              </div>
              
              <h2 className="mb-4 text-4xl font-bold leading-tight">
                Transform Your Learning Journey with AI
              </h2>
              <p className="mb-8 text-xl text-white/90">
                Experience personalized coaching, track your progress, and achieve your goals faster than ever before.
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="flex items-center justify-center w-12 h-12 transition-all duration-300 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30">
                    <feature.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-white/80">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex items-center justify-center w-full p-8 lg:w-1/2">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">SuperCoach AI</h1>
                <p className="text-sm text-gray-600">Your AI Learning Companion</p>
              </div>
            </div>

            <div className="p-8 border shadow-2xl glass rounded-2xl border-white/20">
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-3xl font-bold gradient-text">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600">
                  {isSignUp 
                    ? 'Join thousands of learners on their journey to success' 
                    : 'Sign in to continue your learning journey'
                  }
                </p>
              </div>

              <div className="space-y-6">
                {/* Name Field (Sign Up Only) */}
                {isSignUp && (
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                          errors.name 
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                            : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {errors.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={20} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                        errors.email 
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                          : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone Field (Sign Up Only) */}
                {isSignUp && (
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={20} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                          errors.phone 
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                            : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {errors.phone}
                      </p>
                    )}
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-4 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                        errors.password 
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                          : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field (Sign Up Only) */}
                {isSignUp && (
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full pl-4 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                          errors.confirmPassword 
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                            : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center justify-center w-full gap-2 px-6 py-3 font-semibold text-white transition-all duration-200 transform shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </>
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>

              {/* Forgot Password Link (Login Only) */}
              {!isSignUp && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Toggle Auth Mode */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrors({});
                      setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
                    }}
                    className="ml-2 font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-700"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>

              {/* Terms */}
              {isSignUp && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    By creating an account, you agree to our{' '}
                    <a href="#" className="text-blue-600 underline hover:text-blue-700">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 underline hover:text-blue-700">Privacy Policy</a>
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Features */}
            <div className="mt-8 space-y-4 lg:hidden">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 glass rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                    <feature.icon size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .gradient-text {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </>
  );
};

export default AuthPage;