'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, RefreshCw, ArrowLeft, X, Calendar, User, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Announcement, AnnouncementFormData } from '@/lib/types';
import AnnouncementList from '@/components/announcement-list';
import AnnouncementDetail from '@/components/announcement-detail';
import AnnouncementForm from '@/components/announcement-form';
import Link from 'next/link';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [importanceFilter, setImportanceFilter] = useState<number | null>(null);
  const [targetFilter, setTargetFilter] = useState<'all' | 'portfolio' | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const router = useRouter();

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // 로그인하지 않은 경우 로그인 페이지로 이동
          router.push('/login');
          return;
        }
        
        // 관리자 이메일 확인
        if (user.email !== 'kunmin.choi@gmail.com') {
          // 관리자가 아닌 경우 대시보드로 이동
          alert('관리자 권한이 없습니다.');
          router.push('/dashboard');
          return;
        }
        
        // 공지사항 목록 가져오기
        fetchAnnouncements();
      } catch (error) {
        console.error('관리자 권한 확인 오류:', error);
        setError('권한을 확인하는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [router]);

  // 공지사항 목록 가져오기
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
      }
      
      // 필터링 쿼리 파라미터 구성
      let queryParams = new URLSearchParams();
      
      if (importanceFilter) {
        queryParams.append('importance_level', importanceFilter.toString());
      }
      
      if (targetFilter) {
        queryParams.append('target_type', targetFilter);
      }
      
      // API 호출 (인증 토큰 포함)
      const response = await fetch(`/api/announcements?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('공지사항을 불러오는데 실패했습니다.');
      }
      
      const { data } = await response.json();
      
      // 검색어로 필터링
      let filteredData = data;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredData = data.filter((announcement: Announcement) => 
          announcement.title.toLowerCase().includes(term) || 
          announcement.content.toLowerCase().includes(term)
        );
      }
      
      setAnnouncements(filteredData);
    } catch (err) {
      console.error('공지사항 목록 가져오기 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    setSearchTerm('');
    setImportanceFilter(null);
    setTargetFilter(null);
    fetchAnnouncements();
  };

  // 공지사항 생성 핸들러
  const handleCreateAnnouncement = async (formData: AnnouncementFormData) => {
    try {
      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
      }
      
      // 공지사항 생성 API 호출
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': session.user.id
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '공지사항 생성에 실패했습니다.');
      }
      
      const { data: announcement } = await response.json();
      
      // 폼 닫기 및 목록 새로고침
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('공지사항 생성 오류:', err);
      throw err;
    }
  };

  // 공지사항 수정 핸들러
  const handleUpdateAnnouncement = async (formData: AnnouncementFormData) => {
    if (!editingAnnouncement) return;
    
    try {
      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
      }
      
      // 공지사항 수정 API 호출
      const response = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '공지사항 수정에 실패했습니다.');
      }
      
      // 폼 닫기 및 목록 새로고침
      setShowForm(false);
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (err) {
      console.error('공지사항 수정 오류:', err);
      throw err;
    }
  };

  // 공지사항 삭제 핸들러
  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    try {
      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
      }
      
      // 공지사항 삭제 API 호출
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '공지사항 삭제에 실패했습니다.');
      }
      
      // 목록 새로고침
      fetchAnnouncements();
    } catch (err) {
      console.error('공지사항 삭제 오류:', err);
      alert(err instanceof Error ? err.message : '공지사항 삭제 중 오류가 발생했습니다.');
    }
  };

  // 공지사항 상세 보기
  const handleViewDetail = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
  };

  // 공지사항 상세 모달 닫기
  const handleCloseDetail = () => {
    setSelectedAnnouncement(null);
  };

  // 공지사항 수정 핸들러
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  // 폼 제출 핸들러
  const handleFormSubmit = async (formData: AnnouncementFormData, linkUrl?: string) => {
    try {
      if (editingAnnouncement) {
        await handleUpdateAnnouncement(formData);
      } else {
        await handleCreateAnnouncement(formData);
      }
    } catch (err) {
      console.error('폼 제출 오류:', err);
      alert(err instanceof Error ? err.message : '공지사항 저장 중 오류가 발생했습니다.');
    }
  };

  // 폼 취소 핸들러
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>관리자 페이지로 돌아가기</span>
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">공지사항 관리</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center shadow-sm hover:shadow-md transition-all duration-300"
          >
            <Plus className="h-5 w-5 mr-1" />
            새 공지사항
          </button>
        </div>
        
        {/* 검색 및 필터링 */}
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 mb-6 border border-gray-200">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="제목 또는 내용 검색"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">중요도:</label>
              <select
                value={importanceFilter || ''}
                onChange={(e) => setImportanceFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">전체</option>
                <option value="1">매우 중요</option>
                <option value="2">중요</option>
                <option value="3">보통</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">대상:</label>
              <select
                value={targetFilter || ''}
                onChange={(e) => setTargetFilter(e.target.value as 'all' | 'portfolio' | null || null)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">전체</option>
                <option value="all">전체 공지</option>
                <option value="portfolio">특정 포트폴리오</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-300"
              >
                검색
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center shadow-sm hover:shadow-md transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                초기화
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-lg text-gray-600">로딩 중...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          ) : (
            <AnnouncementList
              isAdmin={true}
              onViewDetail={handleViewDetail}
              onEdit={handleEdit}
              onDelete={handleDeleteAnnouncement}
            />
          )}
        </div>
      </div>
      
      {/* 공지사항 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-3 border-blue-500">
              {editingAnnouncement ? '공지사항 수정' : '새 공지사항 작성'}
            </h2>
            <AnnouncementForm
              announcement={editingAnnouncement || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
      
      {/* 공지사항 상세 모달 */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="absolute h-1 w-full bg-blue-500 top-0 left-0"></div>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">고객 공지사항 화면</h2>
              <button 
                onClick={handleCloseDetail}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="h-[80vh]">
              <iframe 
                src={`/announcements/${selectedAnnouncement.id}?preview=true`}
                className="w-full h-full border-none"
                title="고객 공지사항 보기"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 