import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';

const LandingPage = () => {
  const activities = [
    {
      title: 'ClickStart Kinawe: Young Minds in the DiGiTal World',
      date: 'November 22, 2025',
      image: '/images/digital.jpg',
      tag: 'Event',
      url: 'https://www.facebook.com/share/p/14S7y36azkn/',
      description: 'ClickStart Kinawe: Young Minds in the DiGiTal World is a fun and interactive learning experience that brings tech, creativity, and big brain energy straight to Kinawe. Participants can expect hands-on sessions, interactive activities, and a full day of learning and exploration under SynXCITeS: System Upgrade in Progress.'
    },
    {
      title: 'XCITeS Staff Recruitment Update',
      date: 'September 12, 2025',
      image: '/images/extended.jpg',
      tag: 'Recruitment',
      url: 'https://www.facebook.com/share/p/1BqS1ZYnA5/',
      description: 'XCITeS has extended its staff application period until September 12, 2025, with another opening during the General Assembly – Organizational Trip (GAOT). IT students are invited to join the sync, be part of the system upgrade, and contribute to the organization\'s programs and initiatives.'
    },
    {
      title: 'First General Meeting for AY 2025–2026',
      date: 'August 22, 2025',
      image: '/images/think.jpg',
      tag: 'General Meeting',
      url: 'https://www.facebook.com/share/p/1GxFy8ziNm/',
      description: 'XCITeS conducted its First General Meeting for AY 2025–2026 at Faber Hall Room 205, attended by core officers, members, and the moderator with a 78% attendance rate. The session presented the General Plan of Action, discussed key programs and initiatives, and emphasized collaboration, commitment, and shared responsibility for the organization\'s goals.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header with Get Started Button */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-[#f04b4b] flex items-center justify-center shadow-md">
                <img
                  src="/images/logo.png"
                  alt="Student Organization Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Organization Profiling System</h1>
                <p className="text-sm text-gray-600">Xavier Circle of Information Technology Students (XCITeS)</p>
              </div>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-[#f04b4b] text-white text-base font-semibold rounded-xl shadow-lg shadow-[#f04b4b]/40 hover:bg-[#e43a3a] transition transform hover:scale-105"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome to XCITeS
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              A proud student organization at Xavier University Ateneo de Cagayan, 
              creating meaningful campus impact through service, learning, and innovation.
            </p>
          </div>
        </div>
      </div>

      {/* Current Activities Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Current & Recent Activities
          </h2>
          <p className="text-xl text-gray-600">
            Stay updated with the latest events and initiatives from XCITeS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {activities.map((activity, index) => (
            <a
              key={index}
              href={activity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={activity.image}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#f04b4b] text-white text-xs font-semibold rounded-full">
                    {activity.tag}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{activity.date}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {activity.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {activity.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Student Organization Profiling System. 
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

