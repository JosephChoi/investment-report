'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidCustomer, setIsValidCustomer] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const router = useRouter();

  // 이메일 입력 시 고객 정보 확인
  useEffect(() => {
    const checkCustomerEmail = async () => {
      if (!email || !email.includes('@')) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 이메일을 소문자로 변환
        const normalizedEmail = email.toLowerCase();
        
        // 서비스 역할 키를 사용하는 API 호출
        const response = await fetch(`/api/customer/check-email?email=${encodeURIComponent(normalizedEmail)}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '고객 정보 확인 중 오류가 발생했습니다.');
        }
        
        if (data.exists) {
          setIsValidCustomer(true);
          setCustomerInfo(data.customer);
          setMessage('고객 정보가 확인되었습니다.');
        } else {
          setIsValidCustomer(false);
          setCustomerInfo(null);
          setError('등록된 고객 정보가 없습니다. 관리자에게 문의하세요.');
        }
      } catch (error: any) {
        console.error('고객 정보 확인 오류:', error);
        setError(error.message || '고객 정보 확인 중 오류가 발생했습니다.');
        setIsValidCustomer(false);
        setCustomerInfo(null);
      } finally {
        setLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(() => {
      if (email) {
        checkCustomerEmail();
      }
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [email]);

  // 회원가입 처리
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidCustomer) {
      setError('유효한 고객 이메일이 아닙니다. 관리자에게 문의하세요.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      // 이메일을 소문자로 변환
      const normalizedEmail = email.toLowerCase();
      console.log('회원가입 이메일 정규화:', email, '->', normalizedEmail);
      
      // 고객 정보가 없는 경우 오류 처리
      if (!customerInfo || !customerInfo.id) {
        throw new Error('고객 정보를 찾을 수 없습니다. 관리자에게 문의하세요.');
      }
      
      console.log('기존 고객 정보로 회원가입 시도:', {
        id: customerInfo.id,
        email: normalizedEmail,
        name: customerInfo.name
      });
      
      // 기존 UUID로 Auth 사용자 생성 API 호출
      const response = await fetch('/api/auth/create-user-with-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: customerInfo.id,
          email: normalizedEmail,
          password,
          name: customerInfo.name || normalizedEmail.split('@')[0],
          phone: customerInfo.phone || ''
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('회원가입 API 응답 오류:', { status: response.status, result });
        
        // 오류 메시지 처리
        let errorMessage = result.error || '회원가입 중 오류가 발생했습니다.';
        
        // 특정 오류에 대한 사용자 친화적인 메시지
        if (errorMessage.includes('이미 가입된 이메일')) {
          errorMessage = '이미 가입된 이메일입니다. 로그인 페이지로 이동하여 로그인해주세요.';
          
          // 3초 후 로그인 페이지로 이동
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else if (errorMessage.includes('duplicate key')) {
          errorMessage = '이미 가입된 계정입니다. 로그인 페이지로 이동하여 로그인해주세요.';
          
          // 3초 후 로그인 페이지로 이동
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else if (errorMessage.includes('permission denied')) {
          errorMessage = '권한이 없습니다. 관리자에게 문의하세요.';
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('회원가입 성공:', result);
      
      setMessage('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      setError(error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            고객 회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            관리자가 등록한 고객 이메일로 회원가입할 수 있습니다.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
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
                placeholder="고객 이메일 주소"
              />
              {isValidCustomer && customerInfo && (
                <div className="mt-2 p-2 bg-green-50 text-green-700 text-sm rounded-md">
                  <p><strong>이름:</strong> {customerInfo.name}</p>
                  {customerInfo.phone && <p><strong>연락처:</strong> {customerInfo.phone}</p>}
                  {customerInfo.account_number && <p><strong>계좌번호:</strong> {customerInfo.account_number}</p>}
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호 (6자 이상)"
                minLength={6}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호 확인"
                minLength={6}
              />
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              <p className="font-bold">오류 발생:</p>
              <p>{error}</p>
              {error.includes('데이터베이스 오류') && (
                <p className="mt-2">
                  <strong>해결 방법:</strong> 관리자에게 다음 정보를 제공해주세요:
                  <br />- 이메일: {email}
                  <br />- 오류 시간: {new Date().toLocaleString()}
                </p>
              )}
            </div>
          )}
          
          {message && (
            <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
              {message}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading || !isValidCustomer}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              이미 계정이 있으신가요? 로그인하기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 