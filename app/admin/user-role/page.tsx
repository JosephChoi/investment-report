'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminUserRole() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('admin');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [processing, setProcessing] = useState(false);
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
        
        setUser(user);
        setUserId(user.id); // 기본값으로 현재 사용자 ID 설정
      } catch (error) {
        console.error('관리자 권한 확인 오류:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [router]);

  // 역할 업데이트 핸들러
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setMessage(null);
    
    try {
      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('인증 세션이 없습니다. 다시 로그인해주세요.');
      }
      
      // 사용자 역할 업데이트 API 호출
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId, role }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '역할 업데이트에 실패했습니다.');
      }
      
      setMessage({ type: 'success', text: result.message || '사용자 역할이 성공적으로 업데이트되었습니다.' });
    } catch (err) {
      console.error('역할 업데이트 오류:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '역할 업데이트 중 오류가 발생했습니다.' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-800">로딩 중...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">사용자 역할 관리</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 mb-6 border border-gray-200 max-w-2xl mx-auto">
          <form onSubmit={handleUpdateRole} className="space-y-6">
            {message && (
              <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  )}
                  <p>{message.text}</p>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                사용자 ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="사용자 ID를 입력하세요"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Supabase 인증 시스템의 사용자 ID를 입력하세요.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할 <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={() => setRole('admin')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">관리자</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={role === 'user'}
                    onChange={() => setRole('user')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">일반 사용자</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? '처리 중...' : '역할 업데이트'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-200 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">사용 방법</h2>
          <div className="prose max-w-none text-gray-600">
            <ol className="list-decimal pl-5 space-y-2">
              <li>사용자 ID를 입력합니다. (Supabase 인증 시스템의 UUID 형식)</li>
              <li>부여할 역할을 선택합니다. (관리자 또는 일반 사용자)</li>
              <li>'역할 업데이트' 버튼을 클릭하여 변경사항을 저장합니다.</li>
            </ol>
            <p className="mt-4">
              <strong>참고:</strong> 관리자 역할을 가진 사용자만 공지사항 관리, 사용자 관리 등의 관리자 기능을 사용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 