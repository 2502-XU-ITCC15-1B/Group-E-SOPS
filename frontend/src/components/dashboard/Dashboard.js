import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  Users,
  Briefcase,
  FileText,
  MessageCircle,
  LogOut,
  Settings,
  Award,
  Phone,
  Mail,
  MapPin,
  User,
  Edit3
} from 'lucide-react';

const getNavigation = (userRole) => {
  const baseNav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];
  
  // Admin doesn't see about, services
  if (userRole !== 'admin') {
    baseNav.push(
      { id: 'about', label: 'About Us', icon: Users },
      { id: 'services', label: 'Services', icon: Briefcase }
    );
  }
  
  return baseNav;
};

const teamMembers = [
  {
    name: 'John Paul Nob',
    role: 'President',
    photo: '/images/nobpfp.jpg',
    bio1:
      'Responsible for overseeing the overall direction of the organization and managing major decisions.',
    bio2:
      'Leads strategic planning and represents the group in official functions and collaborations.'
  },
  {
    name: 'Christine Marie Amarille',
    role: 'Vice President',
    photo: '/images/AMARILLEE.jpg',
    bio1:
      'Assists in coordinating internal operations and supports the president in administrative duties.',
    bio2:
      'Oversees department collaboration and helps facilitate program implementation.'
  },
  {
    name: 'Glavine Layo',
    role: 'Secretary',
    photo: '/images/LAYO.jpg',
    bio1:
      'Handles official documentation, minutes, and administrative communication within the organization.',
    bio2:
      'Ensures organized record-keeping and supports coordination of scheduled activities.'
  },
  {
    name: 'Mary Angeli Talian',
    role: 'Treasurer',
    photo: '/images/TALIAN.png',
    bio1:
      'Manages organizational funds and secures accurate records of income and expenses.',
    bio2:
      'Prepares financial reports and assists in planning budget allocation.'
  },
  {
    name: 'Nadjah D. Dimaporo',
    role: 'Budget and Finance Head',
    photo: '/images/DIMAPORO.jpeg',
    bio1:
      'Oversees budgeting activities and monitors financial transactions of the organization.',
    bio2:
      'Coordinates with officers to align financial planning with internal programs.'
  },
  {
    name: 'Bae Fatma Razzia D. Tamano',
    role: 'Charter Commissioner',
    photo: '/images/TAMANO.jpg',
    bio1:
      'Ensures compliance with charter guidelines and monitors alignment with organizational policies.',
    bio2:
      'Handles documentation for membership regulations and organizational structure.'
  },
  {
    name: 'Raj Rhylle S. Flores',
    role: 'DEM Head',
    photo: '/images/FLORES.jpg',
    bio1:
      'Leads development, engagement, and monitoring initiatives for organizational progress.',
    bio2:
      'Coordinates evaluation of activities and supports member performance tracking.'
  },
  {
    name: 'Kristine Jean P. Baygan',
    role: 'DSEEA Head',
    photo: '/images/BAYGAN.jpeg',
    bio1:
      'Manages educational and engagement-related programs for members.',
    bio2:
      'Implements development activities and assists in coordinating academic-support initiatives.'
  },
  {
    name: 'Karla Mae G. Alo-ot',
    role: 'Layout Artist',
    photo: '/images/KARLA.jpg',
    bio1:
      'Creates visual materials for official announcements and branding content.',
    bio2:
      'Handles layout and formatting for promotional outputs and digital communication.'
  },
  {
    name: 'Julienne Amber M. Dayaday',
    role: 'Staff',
    photo: '/images/DAYADAY.jpeg',
    bio1:
      'Assists with logistical requirements needed for organizational events.',
    bio2:
      'Helps in coordination and preparation of venue, materials, and technical setup.'
  },
  {
    name: 'Gail Leanne N. Loking',
    role: 'Staff',
    photo: '/images/LOKING.png',
    bio1:
      'Supports content preparation and assists with event production materials.',
    bio2:
      'Helps implement tasks assigned during coordination and execution activities.'
  },
  {
    name: 'Jeremy A. Barcos',
    role: 'Staff',
    photo: '/images/JEREMMY.jpg',
    bio1:
      'Provides assistance during operational and outreach-related program activities.',
    bio2:
      'Helps facilitate resource handling and supports event coordination requirements.'
  }
];

const serviceMembers = [
  {
    name: 'Media Relations and Promotions Department (MRPD)',
    role: 'Media Relations & Creatives',
    bio1:
      'The Media Relations and Promotions Department, also known as the Creatives Team, is responsible for the design, production, and dissemination of all promotional materials, including graphics, videos, and other multimedia content.',
    bio2:
      'It manages the organization’s official online and offline publicity, ensuring consistent branding and effective communication with members and the public.'
  },
  {
    name: 'Department of Events and Management (DEM)',
    role: 'Events & Logistics',
    bio1:
      'The Department of Events and Management oversees the planning, coordination, and execution of all organizational events, ensuring alignment with the General Plan of Activities.',
    bio2:
      'It manages logistics, scheduling, and on-site operations for activities, ensuring events are carried out smoothly and successfully.'
  },
  {
    name: 'Department of Student Services and Academic Affairs (DSSAA)',
    role: 'Student Services & Academics',
    bio1:
      'The Department of Student Services and Academic Affairs provides programs and services that support the academic growth and welfare of Information Technology students.',
    bio2:
      'This includes organizing tutorials, academic forums, and skill-development workshops, as well as addressing academic-related concerns of members.'
  },
  {
    name: 'Department of Social Engagement and External Affairs (DSEEA)',
    role: 'Social Engagement & External Affairs',
    bio1:
      'The Department of Social Engagement and External Affairs serves as the primary liaison with external organizations, partners, and the broader community.',
    bio2:
      'It coordinates outreach programs, partnerships, and social advocacy initiatives, ensuring the organization remains socially aware and engaged beyond the university.'
  },
  {
    name: 'Department of Recreation and Sports Management Division (DRSMD)',
    role: 'Recreation & Sports',
    bio1:
      'The Department of Recreation and Sports Management Division organizes recreational activities and sports programs for members of the organization and the broader IT community.',
    bio2:
      'It fosters camaraderie, teamwork, and holistic well-being by coordinating participation in sports events, recreational competitions, and related activities.'
  }
];

const baseContacts = [
  {
    id: 1,
    name: 'John Paul Nob',
    title: 'President',
    phone: '+63 912 345 6789',
    email: 'john.paul@studentorg.com',
    location: 'University Town, City Campus',
    photo: '/images/nobpfp.jpg'
  },
  {
    id: 2,
    name: 'Karla Alo-ot',
    title: 'Layout Artist',
    phone: '+63 913 111 2222',
    email: 'karla.alo@students.org',
    location: 'City Campus',
    photo: '/images/KARLA.jpg'
  },
  {
    id: 3,
    name: 'Julienne Amber',
    title: 'Staff',
    phone: '+63 914 333 4444',
    email: 'julienne@students.org',
    location: 'City Campus',
    photo: '/images/DAYADAY.jpeg'
  },
  {
    id: 4,
    name: 'Kristine Baygan',
    title: 'DSEEA Head',
    phone: '+63 915 555 6666',
    email: 'kristine@students.org',
    location: 'City Campus',
    photo: '/images/BAYGAN.jpeg'
  },
  {
    id: 5,
    name: 'Christine Amarille',
    title: 'Vice President',
    phone: '+63 916 777 8888',
    email: 'christine@students.org',
    location: 'City Campus',
    photo: '/images/AMARILLEE.jpg'
  }
];

const getUserKey = (user) => {
  if (!user) return null;
  return user.uid || user.email || null;
};

const Dashboard = () => {
  const { currentUser, userRole, logout } = useAuth();
  const [selectedSection, setSelectedSection] = useState('home');
  const [loading] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState('');
  const [sentStatus, setSentStatus] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark';
  });

  const [conversations, setConversations] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem('conversations');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [profileData, setProfileData] = useState({
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    bio: '',
    birthday: '',
    school: '',
    phone: ''
  });

  useEffect(() => {
    const key = getUserKey(currentUser);

    if (!key) {
      setProfileData({
        name: '',
        email: '',
        bio: '',
        birthday: '',
        school: '',
        phone: ''
      });
      setProfileImage(null);
      setProfileLoaded(true);
      return;
    }

    const base = {
      name: currentUser?.displayName || '',
      email: currentUser?.email || '',
      bio: '',
      birthday: '',
      school: '',
      phone: ''
    };

    if (typeof window === 'undefined') {
      setProfileData(base);
      setProfileLoaded(true);
      return;
    }

    try {
      const profileKey = `profileData_${key}`;
      const imgKey = `profileImage_${key}`;

      const storedProfile = localStorage.getItem(profileKey);
      const storedImg = localStorage.getItem(imgKey);

      setProfileData(storedProfile ? { ...base, ...JSON.parse(storedProfile) } : base);
      setProfileImage(storedImg || null);
    } catch {
      setProfileData(base);
      setProfileImage(null);
    } finally {
      setProfileLoaded(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!profileLoaded) return;

    const key = getUserKey(currentUser);
    if (!key) return;

    try {
      const profileKey = `profileData_${key}`;
      localStorage.setItem(profileKey, JSON.stringify(profileData));
    } catch (e) {
      console.error('Unable to save profile data:', e);
    }
  }, [profileData, currentUser, profileLoaded]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('conversations', JSON.stringify(conversations));
    } catch (e) {
      console.error('Unable to save conversations:', e);
    }
  }, [conversations]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        const key = getUserKey(currentUser);
        if (key) {
          try {
            const profileKey = `profileData_${key}`;
            localStorage.setItem(profileKey, JSON.stringify(profileData));
            if (profileImage) {
              const imgKey = `profileImage_${key}`;
              localStorage.setItem(imgKey, profileImage);
            }
          } catch (e) {
            console.error('Failed to persist profile before logout:', e);
          }
        }
      }
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const key = getUserKey(currentUser);
    if (!key) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setProfileImage(reader.result);
        try {
          const imgKey = `profileImage_${key}`;
          localStorage.setItem(imgKey, reader.result);
        } catch (err) {
          console.error('Unable to save profile image to localStorage:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setIsEditingProfile(false);
  };

  const newsItems = [
    {
      title: 'ClickStart Kinawe: Young Minds in the DiGiTal World',
      date: 'November 22, 2025',
      image: '/images/digital.jpg',
      tag: 'Event',
      url: 'https://www.facebook.com/share/p/14S7y36azkn/',
      description:
        'ClickStart Kinawe: Young Minds in the DiGiTal World is a fun and interactive learning experience that brings tech, creativity, and big brain energy straight to Kinawe. Participants can expect hands-on sessions, interactive activities, and a full day of learning and exploration under SynXCITeS: System Upgrade in Progress.'
    },
    {
      title: 'XCITeS Staff Recruitment Update',
      date: 'September 12, 2025',
      image: '/images/extended.jpg',
      tag: 'Recruitment',
      url: 'https://www.facebook.com/share/p/1BqS1ZYnA5/',
      description:
        'XCITeS has extended its staff application period until September 12, 2025, with another opening during the General Assembly – Organizational Trip (GAOT). IT students are invited to join the sync, be part of the system upgrade, and contribute to the organization’s programs and initiatives.'
    },
    {
      title: 'Class Advisory: XU Festival Days 2025',
      date: 'December 3, 2025',
      image: '/images/Xufd.jpg',
      tag: 'Advisory',
      url: 'https://www.facebook.com/share/p/1JNzZQUVwS/',
      description:
        'In celebration of the XU Festival Days 2025, classes at all levels are suspended from December 3 to December 8, 2025, with regular classes resuming on December 9, 2025. The advisory reminds the community to enjoy the XU Festival Days while staying informed about the adjusted class schedule.'
    },
    {
      title: 'First General Meeting for AY 2025–2026',
      date: 'August 22, 2025',
      image: '/images/think.jpg',
      tag: 'General Meeting',
      url: 'https://www.facebook.com/share/p/1GxFy8ziNm/',
      description:
        'XCITeS conducted its First General Meeting for AY 2025–2026 at Faber Hall Room 205, attended by core officers, members, and the moderator with a 78% attendance rate. The session presented the General Plan of Action, discussed key programs and initiatives, and emphasized collaboration, commitment, and shared responsibility for the organization’s goals.'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  const appBgClass = isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-[#f7f7f7] text-gray-900';
  const sidebarBgClass = isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-100';
  const mainBgClass = isDarkMode ? 'bg-gray-900' : 'bg-[#f7f7f7]';

  const displayContacts = (() => {
    const list = [...baseContacts];
    if (currentUser) {
      const email = profileData.email || currentUser.email || '';
      const already = list.some((c) => c.email === email);
      if (!already && email) {
        list.push({
          id: list.length + 1,
          name: profileData.name || currentUser.displayName || 'New Member',
          title: userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Member',
          phone: profileData.phone || '+63 900 000 0000',
          email,
          location: 'City Campus',
          photo: profileImage || null
        });
      }
    }
    return list;
  })();

  const currentConversation =
    selectedContact && conversations[selectedContact.id]
      ? conversations[selectedContact.id]
      : [];

  const handleSendMessage = () => {
    if (!selectedContact || !message.trim()) {
      setSentStatus('error');
      setTimeout(() => setSentStatus(null), 2500);
      return;
    }

    const text = message.trim();

    setConversations((prev) => {
      const existing = prev[selectedContact.id] || [];
      const newMsg = {
        id: Date.now(),
        text,
        from: 'me',
        createdAt: new Date().toISOString()
      };
      return {
        ...prev,
        [selectedContact.id]: [...existing, newMsg]
      };
    });

    setMessage('');
    setSentStatus('sent');
    setTimeout(() => setSentStatus(null), 3000);
  };

  const getInitials = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0][0] || '').toUpperCase() + (parts[1][0] || '').toUpperCase();
  };

  const displayName = profileData.name || currentUser?.displayName || 'Karla';
  const displayRole = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Member';
  const chatBg = isDarkMode ? 'bg-[#0b1220]' : 'bg-gray-50';

  return (
    <>
      <style>{`
          html.dark .text-gray-600 { color: #cbd5e1 !important; }
          html.dark .text-gray-500 { color: #9aa6b2 !important; }
          html.dark .text-gray-400 { color: #8aa0b0 !important; }
          html.dark .text-gray-900 { color: #e6eef8 !important; }
          html.dark .text-gray-800 { color: #e6eef8 !important; }

          html.dark .bg-white { background-color: #0f1724 !important; }
          html.dark .bg-gray-50 { background-color: #071024 !important; }
          html.dark .border-gray-100 { border-color: #1f2937 !important; }
          html.dark .bg-red-50 { background-color: rgba(240, 75, 75, 0.06) !important; }

          .settings-dropdown .icon { width: 1.25rem; display: inline-flex; align-items: center; justify-content: center; }
        `}</style>

      <div className={`min-h-screen w-full ${appBgClass}`}>
        <div className="w-full h-screen overflow-auto">
          <div className="flex flex-col lg:flex-row h-full">
            <aside
              className={`w-full lg:w-72 xl:w-80 px-6 py-8 flex flex-col space-y-8 h-full overflow-y-auto ${sidebarBgClass}`}
            >
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-[#f04b4b] flex items-center justify-center shadow-md overflow-hidden">
                    <img
                      src="/images/logo.png"
                      alt="Student Organization Logo"
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Student</p>
                    <p className="text-lg font-semibold">Organization Profiling System</p>
                  </div>
                </div>
              </div>

              <nav className="space-y-3 flex-1">
                {getNavigation(userRole).map((item) => {
                  const active = selectedSection === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSection(item.id)}
                      className={`w-full flex items-center space-x-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition
                          ${active ? 'bg-[#f04b4b] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsDarkMode((p) => !p)}
                  className="w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-gray-600 hover:bg-gray-100"
                  aria-pressed={isDarkMode}
                  aria-label="Toggle dark mode"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-gray-400" />
                    <span>Dark Mode</span>
                  </div>
                  <div className={`h-5 w-9 rounded-full flex items-center p-0.5 ${isDarkMode ? 'bg-[#f04b4b]' : 'bg-gray-200'}`}>
                    <div className={`h-4 w-4 rounded-full bg-white transform transition-transform ${isDarkMode ? 'translate-x-4' : ''}`} />
                  </div>
                </button>
              </div>
            </aside>

            <main
              className={`flex-1 px-6 lg:px-10 py-10 overflow-y-auto h-full ${mainBgClass}`}
              style={{ color: isDarkMode ? '#e6eef8' : undefined, maxHeight: 'calc(100vh - 80px)' }}
            >
              {selectedSection === 'home' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-6">
                    <div
                      className={`rounded-3xl p-8 flex flex-col items-center text-center space-y-6 ${
                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                    >
                      <div className="relative flex flex-col items-center">
                        <div className="relative -mt-16 group">
                          <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 shadow-lg border-4 border-white flex items-center justify-center">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt="Profile"
                                className="h-32 w-32 object-cover"
                              />
                            ) : (
                              <span className="text-3xl font-semibold text-gray-600">
                                {getInitials(displayName)}
                              </span>
                            )}
                          </div>
                          <label
                            htmlFor="profileUpload"
                            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            Upload photo
                          </label>
                          <input
                            id="profileUpload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfileImageChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold">Hello, {displayName}!</h2>
                        <p className="text-sm text-gray-500 uppercase tracking-[0.4em]">
                          ORGANIZATIONAL PROFILING SYSTEM
                        </p>
                      </div>

                      <div className="w-full pt-6 border-t border-gray-100 space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Role</span>
                          <span className="inline-flex items-center space-x-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500">
                            <Award className="h-4 w-4" />
                            <span>{displayRole}</span>
                          </span>
                        </div>

                        <div className="mt-4 text-left text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Name: </span>
                            <span>{profileData.name || displayName}</span>
                          </div>
                          <div>
                            <span className="font-medium">Email: </span>
                            <span>
                              {profileData.email ||
                                currentUser?.email ||
                                'Not set'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">School: </span>
                            <span>{profileData.school || 'Not set'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Birthday: </span>
                            <span>{profileData.birthday || 'Not set'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Phone: </span>
                            <span>{profileData.phone || 'Not set'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Bio: </span>
                            <span>{profileData.bio || 'Tell us something about yourself.'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-3xl p-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <h1 className="text-4xl font-bold mb-6">Welcome</h1>
                      <p className="text-gray-600 leading-relaxed mb-6">
                        Xavier Circle of Information Technology Students (XCITeS) a proud student
                        organization at Xavier University Ateneo de Cagayan is a community of
                        passionate IT students who create meaningful campus impact through service,
                        learning, and innovation.
                        <br />
                        <br />
                        We organize events, provide opportunities for skills development, and
                        collaborate with partners across the university to improve student life and
                        technology literacy. As Magis-minded student leaders, we strive to grow,
                        lead, and serve with integrity for the benefit of our campus and local
                        community.
                      </p>

                      <p className="text-gray-600 leading-relaxed">
                        XCITeS strives to create an environment where students work together to
                        develop leadership, creativity, and social responsibility. By partnering
                        with university departments, local communities, and fellow organizations, we
                        nurture a culture of collaboration and inclusivity. As aspiring IT
                        professionals and student leaders, we move toward one mission: to grow,
                        lead, innovate, and serve with integrity for the betterment of our campus
                        and the communities we touch.
                        Xavier Circle of Information Technology Students - XCITeS is a co-curricular
                        student organization that aims to promote order and unite the IT community
                        through the Projects and Initiatives geared toward the IT students of the
                        Xavier University-College of Computer Studies.
                      </p>

                      <div className="mt-8">
                        <div
                          className={`w-full overflow-hidden rounded-3xl border border-gray-100 ${
                            isDarkMode ? 'bg-gray-700' : ''
                          }`}
                        >
                          <img
                            src="/images/xc.jpg"
                            alt="Organization group"
                            className="w-full max-h-[360px] object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedSection === 'about' && userRole !== 'admin' && (
                <div className="space-y-8 overflow-y-auto max-h-[calc(100vh-200px)]">
                  <div className={`rounded-3xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h1 className="text-4xl font-bold mb-2">About Us!</h1>
                    <p className="text-gray-500">Meet the leaders behind our organization</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pr-2">
                    {teamMembers.map((member) => (
                      <div
                        key={member.name}
                        className={`rounded-3xl p-6 space-y-4 flex flex-col min-h-[360px] ${
                          isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 flex-1 overflow-y-auto">
                          <p>{member.bio1}</p>
                          <p>{member.bio2}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSection === 'services' && userRole !== 'admin' && (
                <div className={`rounded-3xl p-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h1 className="text-4xl font-bold mb-4">Services</h1>
                  <p className="text-gray-500">
                    Learn more about the departments and services offered by the organization.
                  </p>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {serviceMembers.slice(0, 6).map((member) => (
                      <div
                        key={member.name}
                        className={`rounded-3xl p-6 flex flex-col min-h-[260px] ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <div className="mb-3">
                          <h3 className="text-base font-semibold text-gray-900">{member.name}</h3>
                          <p className="text-xs font-medium text-gray-500 mt-1">{member.role}</p>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{member.bio1}</p>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{member.bio2}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSection === 'reports' && (
                <div className="space-y-8">
                  <div className={`rounded-3xl p-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h1 className="text-4xl font-bold mb-4">Reports</h1>
                    <p className="text-gray-500 max-w-2xl">
                      Stay updated with the latest news, events, and milestones of the Student Organization.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {newsItems.map((item) => (
                      <a
                        key={item.title}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition transform hover:-translate-y-1 hover:shadow-lg ${
                          isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}
                      >
                        <div className="w-full h-48 overflow-hidden">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500">
                              {item.tag}
                            </span>
                            <span className="text-xs text-gray-400">{item.date}</span>
                          </div>
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h2>
                          <p className="text-sm text-gray-600 leading-relaxed flex-1">{item.description}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedSection === 'contacts' && false && (
                <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-6">
                  <div className="space-y-6">
                    <div className={`rounded-3xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <h1 className="text-4xl font-bold mb-6">Contacts</h1>
                      <p className="text-xs text-gray-500 mb-2">
                        {currentUser
                          ? `You are logged in as ${currentUser.email}. Pili ug contact sa left para maka-chat.`
                          : 'Log in para makit-an kinsa imong account nga nagamit.'}
                      </p>
                      <div className="space-y-4">
                        {displayContacts.map((contact) => {
                          const isSelected = selectedContact && selectedContact.id === contact.id;
                          return (
                            <button
                              key={contact.id}
                              onClick={() => setSelectedContact(contact)}
                              className={`group w-full text-left flex items-center rounded-2xl px-5 py-4 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f04b4b]
                                ${
                                  isSelected
                                    ? 'bg-[#f04b4b] text-white shadow-lg'
                                    : 'bg-gray-50 text-gray-700 hover:bg-[#f04b4b] hover:text-white hover:shadow-lg'
                                }`}
                              aria-pressed={isSelected}
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div
                                  className={`h-10 w-10 rounded-full bg-white flex items-center justify-center ${
                                    isSelected ? '' : 'group-hover:bg-white/20'
                                  }`}
                                >
                                  {contact.photo ? (
                                    <img
                                      src={contact.photo}
                                      alt={contact.name}
                                      className="h-10 w-10 object-cover rounded-full"
                                    />
                                  ) : (
                                    <span className="font-semibold">{getInitials(contact.name)}</span>
                                  )}
                                </div>
                                <div className="flex flex-col text-left min-w-0">
                                  <p className="font-semibold leading-tight truncate">{contact.name}</p>
                                  <p
                                    className={`text-sm ${
                                      isSelected ? 'text-white/70' : 'text-gray-500 group-hover:text-white/70'
                                    } truncate`}
                                  >
                                    {contact.title}
                                  </p>
                                </div>
                              </div>

                              <div className="ml-4 flex items-center space-x-2">
                                <a
                                  href={`tel:${contact.phone}`}
                                  className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${
                                    isSelected ? 'bg-white/25' : 'bg-white/30'
                                  } hover:opacity-90 transition`}
                                  title={`Call ${contact.name}`}
                                >
                                  <Phone className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                                </a>

                                <a
                                  href={`mailto:${contact.email}`}
                                  className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${
                                    isSelected ? 'bg-white/25' : 'bg-white/30'
                                  } hover:opacity-90 transition`}
                                  title={`Email ${contact.name}`}
                                >
                                  <Mail className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                                </a>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-3xl p-8 flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                        {selectedContact && selectedContact.photo ? (
                          <img src={selectedContact.photo} alt={selectedContact.name} className="w-full h-full object-cover" />
                        ) : profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full text-lg font-bold text-gray-600">
                            {selectedContact ? getInitials(selectedContact.name) : getInitials(displayName)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">
                          {selectedContact ? selectedContact.name : displayName}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {selectedContact ? selectedContact.title : displayRole}
                        </p>
                        {selectedContact && currentUser && (
                          <p className="text-xs text-gray-500 mt-1">
                            Connected as <span className="font-medium">{currentUser.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 space-y-4 text-sm text-gray-600">
                      <div className="flex items-start space-x-3">
                        <Phone className="h-4 w-4 text-gray-400 mt-1" />
                        <span>
                          {selectedContact ? selectedContact.phone : profileData.phone || '+63 912 345 6789'}
                        </span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Mail className="h-4 w-4 text-gray-400 mt-1" />
                        <span>
                          {selectedContact
                            ? selectedContact.email
                            : profileData.email ||
                              currentUser?.email ||
                              'john.paul@studentorg.com'}
                        </span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                        <span>{selectedContact ? selectedContact.location : 'University Town, City Campus'}</span>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-gray-100 pt-6 flex flex-col h-full">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        {selectedContact
                          ? `Conversation with ${selectedContact.name}`
                          : 'Select a contact to start chatting'}
                      </label>

                      <div
                        className={`flex-1 min-h-[180px] max-h-[260px] rounded-2xl mb-4 p-3 text-sm overflow-y-auto ${chatBg}`}
                      >
                        {selectedContact ? (
                          currentConversation.length > 0 ? (
                            currentConversation.map((msg) => (
                              <div key={msg.id} className="flex justify-end mb-2">
                                <div className="max-w-xs rounded-2xl px-3 py-2 bg-[#f04b4b] text-white text-sm">
                                  <p>{msg.text}</p>
                                  <span className="block mt-1 text-[10px] opacity-75 text-right">
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500 italic">
                              You have not sent any messages yet. Type below to start chatting.
                            </p>
                          )
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            Click one of the contacts on the left to view the conversation.
                          </p>
                        )}
                      </div>

                      <label className="text-sm font-medium text-gray-500 mb-1 block">
                        {selectedContact ? `Send a message to ${selectedContact.name}` : 'Send a message'}
                      </label>
                      <textarea
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30"
                        placeholder={
                          selectedContact
                            ? `Type your message to ${selectedContact.name} here...`
                            : 'Select a contact to message or type a note here...'
                        }
                        aria-label="Message"
                      />
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-500">
                          {sentStatus === 'sending' && 'Sending...'}
                          {sentStatus === 'sent' && 'Message sent ✓'}
                          {sentStatus === 'error' && 'Select a contact and write a message.'}
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setMessage('')}
                            type="button"
                            className="h-10 px-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleSendMessage}
                            className="h-12 px-4 rounded-2xl bg-[#f04b4b] text-white font-semibold hover:bg-[#e43a3a] transition disabled:opacity-50"
                            disabled={sentStatus === 'sending'}
                          >
                            Send message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {isEditingProfile && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
                <div className={`w-full max-w-lg rounded-3xl p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-[#f04b4b]" />
                      <h2 className="text-xl font-semibold">Edit Profile</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Close
                    </button>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-4 text-sm">
                    <div>
                      <label className="block mb-1 font-medium">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-gray-200 px-3 py-2 bg-gray-50 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-gray-200 px-3 py-2 bg-gray-50 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">School</label>
                      <input
                        type="text"
                        name="school"
                        value={profileData.school}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-gray-200 px-3 py-2 bg-gray-50 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Birthday</label>
                      <input
                        type="date"
                        name="birthday"
                        value={profileData.birthday}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-gray-200 px-3 py-2 bg-gray-50 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Phone number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-gray-200 px-3 py-2 bg-gray-50 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Bio</label>
                      <textarea
                        name="bio"
                        rows={3}
                        value={profileData.bio}
                        onChange={handleProfileInputChange}
                        className="w-full rounded-2xl border border-gray-200 px-3 py-2 bg-gray-50 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 rounded-2xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-2xl bg-[#f04b4b] text-white font-semibold hover:bg-[#e43a3a]"
                      >
                        Save changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
