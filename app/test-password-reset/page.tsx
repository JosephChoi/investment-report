'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestPasswordReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      // 비밀번호 재설정 이메일 전송
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setMessage(`${email}로 비밀번호 재설정 링크가 전송되었습니다. 이메일을 확인해주세요.`);
    } catch (error: any) {
      console.error('비밀번호 재설정 오류:', error);
      setError(error.message || '비밀번호 재설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">비밀번호 재설정 테스트</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="사용자 이메일 주소"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? '처리 중...' : '비밀번호 재설정 링크 전송'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-semibold mb-2">사용 방법</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>API 테스트 페이지(<a href="/api/test-users" className="text-blue-600 hover:underline" target="_blank">http://localhost:3000/api/test-users</a>)에서 사용자 이메일을 확인합니다.</li>
          <li>위 폼에 사용자 이메일을 입력하고 비밀번호 재설정 링크를 전송합니다.</li>
          <li>이메일로 전송된 링크를 클릭하여 비밀번호를 설정합니다.</li>
          <li>설정한 비밀번호로 로그인하여 실제 데이터를 테스트합니다.</li>
        </ol>
      </div>
    </div>
  );
} 