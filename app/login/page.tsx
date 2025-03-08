'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);
  const router = useRouter();

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // 로그인 성공 시 대시보드로 이동
      if (email === 'kunmin.choi@gmail.com') {
        router.push('/admin'); // 관리자 이메일이면 관리자 페이지로 이동
      } else {
        router.push('/dashboard'); // 일반 사용자면 대시보드로 이동
      }
      
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setError(error.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 재설정 링크 전송
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // API 호출하여 비밀번호 재설정 링크 전송
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '비밀번호 재설정 링크 전송 중 오류가 발생했습니다.');
      }

      alert('비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.');
      setShowResetForm(false);
      
    } catch (error: any) {
      console.error('비밀번호 재설정 오류:', error);
      setError(error.message || '비밀번호 재설정 링크 전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">투자 관리 대시보드</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {!showResetForm ? (
          // 로그인 폼
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-black"
                placeholder="이메일 주소 입력"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-black"
                placeholder="비밀번호 입력"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-gray-600 hover:text-gray-900 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          </form>
        ) : (
          // 비밀번호 재설정 폼
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-black"
                placeholder="이메일 주소 입력"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? '처리 중...' : '비밀번호 재설정 링크 전송'}
            </button>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowResetForm(false)}
                className="text-gray-600 hover:text-gray-900 hover:underline"
              >
                로그인으로 돌아가기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 