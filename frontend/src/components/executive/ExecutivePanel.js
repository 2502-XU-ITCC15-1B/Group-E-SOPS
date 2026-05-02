import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  Users, 
  Calendar, 
  Target,
  CheckCircle,
  Plus,
  Megaphone,
  X,
  Save,
  Edit,
  Trash2,
  Building2,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExecutivePanel = () => {
  const { currentUser, userRole, logEvent } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showMembersList, setShowMembersList] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberSortBy, setMemberSortBy] = useState('name');
  const [memberFilterDept, setMemberFilterDept] = useState('all');
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    dueDate: '',
    assignedTo: ''
  });

  const departments = [
    {
      name: 'Media Relations & Creatives',
      head: null,
      members: []
    },
    {
      name: 'Events & Logistics',
      head: null,
      members: []
    },
    {
      name: 'Student Services & Academics',
      head: null,
      members: []
    },
    {
      name: 'Social Engagement & External Affairs',
      head: null,
      members: []
    },
    {
      name: 'Recreation & Sports',
      head: null,
      members: []
    }
  ];

  useEffect(() => {
    fetchExecutiveData();
    
    // Set up real-time listeners for users and projects
    const usersUnsubscribe = onSnapshot(
      query(collection(db, 'users')),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllUsers(usersData);
      },
      (error) => {
        console.error('Error listening to users:', error);
      }
    );

    const projectsUnsubscribe = onSnapshot(
      query(collection(db, 'projects'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const projectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);
      },
      (error) => {
        console.error('Error listening to projects:', error);
      }
    );

    const announcementsUnsubscribe = onSnapshot(
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20)),
      (snapshot) => {
        const announcementsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAnnouncements(announcementsData);
      },
      (error) => {
        console.error('Error listening to announcements:', error);
      }
    );

    return () => {
      usersUnsubscribe();
      projectsUnsubscribe();
      announcementsUnsubscribe();
    };
  }, []);

  const fetchExecutiveData = async () => {
    try {
      setLoading(true);
      
      // Fetch all active users (excluding admins)
      const usersQuery = query(
        collection(db, 'users'),
        where('isActive', '==', true)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(usersData);

      // Fetch projects from Firestore
      const projectsQuery = query(
        collection(db, 'projects'),
        orderBy('createdAt', 'desc')
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);

      // Fetch announcements
      const announcementsQuery = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const announcementsSnapshot = await getDocs(announcementsQuery);
      const announcementsData = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(announcementsData);

    } catch (error) {
      console.error('Error fetching executive data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Organize departments based on current users
  const organizeDepartments = () => {
    const deptList = departments.map(dept => ({
      ...dept,
      members: allUsers.filter(user => 
        user.department === dept.name && user.role !== 'admin'
      ),
      head: null
    }));
    
    deptList.forEach(dept => {
      dept.head = dept.members.find(m => m.isDepartmentHead) || null;
    });
    
    return deptList;
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    try {
      setSavingAnnouncement(true);
      const newAnnouncement = {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        role: userRole
      };

      await addDoc(collection(db, 'announcements'), newAnnouncement);
      
      // Create notifications for all members, executives, and admins
const allRecipients = allUsers.filter(u => 
  u.role === 'member' || u.role === 'executive' || 
  u.role === 'admin'
);

console.log('All users in system:', allUsers.length, allUsers);
console.log('Filtered recipients:', allRecipients.length, allRecipients);
console.log('Current user role:', userRole, 'ID:', currentUser.uid);

const notificationPromises = allRecipients.map(user => {
  console.log('Creating notification for user:', user.email, user.role);
  return addDoc(collection(db, 'notifications'), {
    userId: user.id,
    title: newAnnouncement.title,
    content: newAnnouncement.content,
    type: 'announcement',
    read: false,
    createdAt: serverTimestamp(),
    createdBy: currentUser.uid
  });
});

await Promise.all(notificationPromises);
console.log('All notifications created successfully');


      // Log activity
      await logEvent({ 
        type: 'announcement_create', 
        userId: currentUser.uid,
        email: currentUser.email,
        action: `${userRole === 'admin' ? 'Admin' : 'Executive'} ${currentUser.email} created announcement: ${newAnnouncement.title}`,
        description: newAnnouncement.title
      });

      toast.success('Announcement created and sent to all members!');
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setShowAnnouncementModal(false);
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleSaveProject = async () => {
    if (!projectForm.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      if (editingProject) {
        // Update existing project
        await updateDoc(doc(db, 'projects', editingProject.id), {
          ...projectForm,
          updatedAt: serverTimestamp()
        });
        await logEvent({ 
          type: 'project_update', 
          userId: currentUser.uid,
          email: currentUser.email,
          action: `Executive ${currentUser.email} updated project: ${projectForm.name}`,
          description: projectForm.name
        });
        toast.success('Project updated successfully!');
      } else {
        // Create new project
        const newProject = {
          ...projectForm,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          progress: 0
        };
        await addDoc(collection(db, 'projects'), newProject);
        await logEvent({ 
          type: 'project_create', 
          userId: currentUser.uid,
          email: currentUser.email,
          action: `Executive ${currentUser.email} created project: ${projectForm.name}`,
          description: projectForm.name
        });
        toast.success('Project created successfully!');
      }
      
      setShowProjectModal(false);
      setEditingProject(null);
      setProjectForm({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        dueDate: '',
        assignedTo: ''
      });
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'projects', projectId));
      await logEvent({ 
        type: 'project_delete', 
        userId: currentUser.uid,
        email: currentUser.email,
        action: `Executive ${currentUser.email} deleted project: ${projectId}`,
        description: projectId
      });
      toast.success('Project deleted successfully!');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'planning',
      priority: project.priority || 'medium',
      dueDate: project.dueDate || '',
      assignedTo: project.assignedTo || ''
    });
    setShowProjectModal(true);
  };

    const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
      await logEvent({ 
        type: 'announcement_delete', 
        userId: currentUser.uid,
        email: currentUser.email,
        action: `${userRole === 'admin' ? 'Admin' : 'Executive'} ${currentUser.email} deleted announcement`,
        description: announcementId
      });
      toast.success('Announcement deleted successfully!');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'planning': return 'text-yellow-600 bg-yellow-100';
      case 'on-hold': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Count all users except admins
  const activeUsersCount = allUsers.filter(u => u.role !== 'admin').length;
  const activeProjectsCount = projects.filter(p => p.status === 'in-progress').length;
  const organizedDepartments = organizeDepartments();
  const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
  // Debug logging - REMOVE AFTER TESTING
console.log('All users:', allUsers.length, allUsers);
console.log('Non-admin users:', nonAdminUsers.length, nonAdminUsers);
console.log('Active users count:', activeUsersCount);

  // Filter and sort members for the modal
  const filteredMembers = nonAdminUsers
    .filter(user => {
      const matchesSearch = memberSearchTerm === '' || 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(memberSearchTerm.toLowerCase());
      const matchesDept = memberFilterDept === 'all' || user.department === memberFilterDept;
      return matchesSearch && matchesDept;
    })
    .sort((a, b) => {
      switch (memberSortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'role':
          return a.role.localeCompare(b.role);
        case 'department':
          return (a.department || '').localeCompare(b.department || '');
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Executive Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor team performance and manage organizational activities
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          {['overview', 'departments', 'projects', 'announcements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedView(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setShowMembersList(true)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer text-left"
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Total</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{activeUsersCount}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{activeProjectsCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Projects</h3>
                {(userRole === 'executive' || userRole === 'admin') && (
                  <button 
                    onClick={() => {
                      setEditingProject(null);
                      setProjectForm({
                        name: '',
                        description: '',
                        status: 'planning',
                        priority: 'medium',
                        dueDate: '',
                        assignedTo: ''
                      });
                      setShowProjectModal(true);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Due Date
                    </th>
                    {(userRole === 'executive' || userRole === 'admin') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {projects.slice(0, 5).map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</div>
                          {project.assignedTo && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">Assigned to {project.assignedTo}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status?.replace('-', ' ') || 'planning'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                          {project.priority || 'medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
                      </td>
                      {(userRole === 'executive' || userRole === 'admin') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No projects yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {selectedView === 'departments' && (
        <div className="space-y-6">
          {organizedDepartments.map((dept, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{dept.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department Head:</p>
                  <p className="text-gray-900 dark:text-white">
                    {dept.head 
                      ? `${dept.head.firstName} ${dept.head.lastName} (${dept.head.email})`
                      : 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Members ({dept.members.length}):
                  </p>
                  {dept.members.length > 0 ? (
                    <div className="space-y-2">
                      {dept.members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                          </div>
                          {member.isDepartmentHead && (
                            <span className="ml-auto px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                              Head
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No members assigned</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects Tab */}
      {selectedView === 'projects' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Projects</h3>
              {(userRole === 'executive' || userRole === 'admin') && (
                <button 
                  onClick={() => {
                    setEditingProject(null);
                    setProjectForm({
                      name: '',
                      description: '',
                      status: 'planning',
                      priority: 'medium',
                      dueDate: '',
                      assignedTo: ''
                    });
                    setShowProjectModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">{project.name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority || 'medium'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{project.description}</p>
                    )}
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Status: </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status?.replace('-', ' ') || 'planning'}
                      </span>
                    </div>
                    {project.assignedTo && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Assigned to: </span>
                        <span className="text-sm text-gray-900 dark:text-white">{project.assignedTo}</span>
                      </div>
                    )}
                    {project.dueDate && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Due: </span>
                        <span className="text-sm text-gray-900 dark:text-white">{new Date(project.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {(userRole === 'executive' || userRole === 'admin') && (
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                        >
                          <Edit className="h-4 w-4 inline mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                        >
                          <Trash2 className="h-4 w-4 inline mr-1" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {projects.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No projects yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {selectedView === 'announcements' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Announcements</h3>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Megaphone className="h-4 w-4 mr-2" />
                Create Announcement
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {announcements.length > 0 ? (
  announcements.map((announcement) => (
    <div key={announcement.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{announcement.title}</h4>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {announcement.createdAt && announcement.createdAt.toDate 
            ? new Date(announcement.createdAt.toDate()).toLocaleDateString()
            : 'Recently'}
        </span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-2">{announcement.content}</p>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          By: {announcement.createdByName || 'Executive'}
        </span>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            announcement.role === 'admin' 
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {announcement.role?.charAt(0).toUpperCase() + announcement.role?.slice(1)}
          </span>
          {(userRole === 'executive' || userRole === 'admin') && (
            <button
              onClick={() => handleDeleteAnnouncement(announcement.id)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
              title="Delete announcement"
            >
              <X className="h-4 w-4 text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  ))
) : (

                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Megaphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No announcements yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members List Modal */}
      {showMembersList && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">All Members ({filteredMembers.length})</h3>
                <button
                  onClick={() => {
                    setShowMembersList(false);
                    setMemberSearchTerm('');
                    setMemberFilterDept('all');
                    setMemberSortBy('name');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search and Filter Controls */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={memberFilterDept}
                      onChange={(e) => setMemberFilterDept(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept.name} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                    <select
                      value={memberSortBy}
                      onChange={(e) => setMemberSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="role">Sort by Role</option>
                      <option value="department">Sort by Department</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'executive' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                        </span>
                        {user.department && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{user.department}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No members found matching your criteria</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Megaphone className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Create New Announcement
                </h3>
                <button
                  onClick={() => {
                    setShowAnnouncementModal(false);
                    setAnnouncementTitle('');
                    setAnnouncementContent('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="Enter announcement content"
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAnnouncementModal(false);
                    setAnnouncementTitle('');
                    setAnnouncementContent('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAnnouncement}
                  disabled={savingAnnouncement}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingAnnouncement ? 'Creating...' : 'Create Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h3>
                <button
                  onClick={() => {
                    setShowProjectModal(false);
                    setEditingProject(null);
                    setProjectForm({
                      name: '',
                      description: '',
                      status: 'planning',
                      priority: 'medium',
                      dueDate: '',
                      assignedTo: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                    placeholder="Enter project name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                    placeholder="Enter project description"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={projectForm.status}
                      onChange={(e) => setProjectForm({...projectForm, status: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="planning">Planning</option>
                      <option value="in-progress">In Progress</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={projectForm.priority}
                      onChange={(e) => setProjectForm({...projectForm, priority: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={projectForm.dueDate}
                      onChange={(e) => setProjectForm({...projectForm, dueDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      value={projectForm.assignedTo}
                      onChange={(e) => setProjectForm({...projectForm, assignedTo: e.target.value})}
                      placeholder="Enter assignee name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowProjectModal(false);
                    setEditingProject(null);
                    setProjectForm({
                      name: '',
                      description: '',
                      status: 'planning',
                      priority: 'medium',
                      dueDate: '',
                      assignedTo: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProject}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutivePanel;
