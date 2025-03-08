'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // 로그인 성공 시 사용자 역할에 따라 리디렉션
      const user = data.user;
      console.log('로그인 성공:', user);
      
      // 사용자 정보 확인 및 업데이트 - API 호출 방식으로 변경
      try {
        if (user && user.email) {
          // API를 통해 사용자 정보 확인 및 생성
          const response = await fetch('/api/user/create-or-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email.split('@')[0],
              phone: user.user_metadata?.phone || null,
              role: 'customer'
            }),
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            console.error('사용자 정보 생성/업데이트 오류:', result.error);
          } else {
            console.log('사용자 정보 생성/업데이트 성공:', result.data);
          }
        }
      } catch (userInfoError) {
        console.error('사용자 정보 처리 오류:', userInfoError);
      }
      
      if (user && user.email && (user.email === 'kunmin.choi@gmail.com' || user.email === 'admin@example.com')) {
        // 관리자 계정인 경우 관리자 페이지로 이동
        router.push('/admin');
      } else {
        // 일반 사용자인 경우 대시보드로 이동
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('로그인 오류:', error);
      
      // 사용자가 등록되지 않은 경우 회원가입 안내
      if (error.message.includes('Invalid login credentials')) {
        // 이메일이 고객 데이터에 있는지 확인
        try {
          const response = await fetch(`/api/customer/check-email?email=${encodeURIComponent(email)}`);
          const data = await response.json();
          
          if (data.exists && !data.isRegistered) {
            setError('아직 회원가입하지 않은 이메일입니다. 회원가입을 진행해주세요.');
          } else {
            setError('이메일 또는 비밀번호가 올바르지 않습니다.');
          }
        } catch (checkError) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
      } else {
        setError(error.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setError(null);
      alert(`${email}로 비밀번호 재설정 링크가 전송되었습니다. 이메일을 확인해주세요.`);
      setShowResetForm(false);
    } catch (error: any) {
      console.error('비밀번호 재설정 오류:', error);
      setError(error.message || '비밀번호 재설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showResetForm ? '비밀번호 재설정' : '로그인'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showResetForm 
              ? '이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.' 
              : '계정에 로그인하여 투자 리포트를 확인하세요.'}
          </p>
        </div>
        
        {showResetForm ? (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowResetForm(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                로그인으로 돌아가기
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? '처리 중...' : '비밀번호 재설정 링크 전송'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="이메일 주소"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호"
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                비밀번호를 잊으셨나요?
              </button>
              
              <Link href="/signup" className="text-sm text-blue-600 hover:text-blue-800">
                회원가입
              </Link>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 