'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash } from 'lucide-react';

// 알림 타입 정의
interface Notification {
  id: number;
  title: string;
  content: string;
  date: string;
  isActive: boolean;
}

// 샘플 알림 데이터
const sampleNotifications: Notification[] = [
  {
    id: 1,
    title: '3월 포트폴리오 리포트가 업데이트되었습니다.',
    content: '월간리포트에서 최신 포트폴리오 현황을 확인하세요.',
    date: '2024-03-15',
    isActive: true
  },
  {
    id: 2,
    title: '포트폴리오 리밸런싱이 완료되었습니다.',
    content: '리밸런싱 히스토리에서 자세한 내용을 확인하세요.',
    date: '2024-03-10',
    isActive: true
  },
  {
    id: 3,
    title: '관리자 상담 답변이 등록되었습니다.',
    content: '관리자 상담 내역에서 답변을 확인하세요.',
    date: '2024-03-05',
    isActive: true
  }
];

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: '',
    isActive: true
  });
  
  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 체크박스 핸들러
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isActive: e.target.checked
    });
  };
  
  // 알림 추가/수정 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // 수정 모드
      setNotifications(
        notifications.map((notification) =>
          notification.id === editingId
            ? { ...formData, id: editingId }
            : notification
        )
      );
      setEditingId(null);
    } else {
      // 추가 모드
      const newNotification: Notification = {
        ...formData,
        id: Math.max(0, ...notifications.map((n) => n.id)) + 1
      };
      setNotifications([...notifications, newNotification]);
    }
    
    // 폼 초기화
    setFormData({
      title: '',
      content: '',
      date: '',
      isActive: true
    });
    setShowForm(false);
  };
  
  // 알림 수정 핸들러
  const handleEdit = (id: number) => {
    const notificationToEdit = notifications.find((n) => n.id === id);
    if (notificationToEdit) {
      setFormData({
        title: notificationToEdit.title,
        content: notificationToEdit.content,
        date: notificationToEdit.date,
        isActive: notificationToEdit.isActive
      });
      setEditingId(id);
      setShowForm(true);
    }
  };
  
  // 알림 삭제 핸들러
  const handleDelete = (id: number) => {
    if (window.confirm('정말로 이 알림을 삭제하시겠습니까?')) {
      setNotifications(notifications.filter((n) => n.id !== id));
    }
  };
  
  // 알림 활성화/비활성화 토글 핸들러
  const handleToggleActive = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isActive: !notification.isActive }
          : notification
      )
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-gray-700 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>관리자 페이지로 돌아가기</span>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2 text-gray-900">최근 알림 관리</h1>
      <p className="text-gray-600 mb-8">고객에게 표시될 알림을 관리할 수 있습니다.</p>
      
      {/* 알림 추가 버튼 */}
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: '',
              content: '',
              date: '',
              isActive: true
            });
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          알림 추가
        </button>
      </div>
      
      {/* 알림 추가/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            {editingId ? '알림 수정' : '알림 추가'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                내용
              </label>
              <textarea
                id="content"
                name="content"
                rows={3}
                value={formData.content}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                required
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                날짜
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                활성화
              </label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {editingId ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 알림 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  날짜
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  내용
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {notification.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {notification.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {notification.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleToggleActive(notification.id)}
                        className={`text-xs mr-3 ${
                          notification.isActive
                            ? 'text-gray-600 hover:text-gray-900'
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {notification.isActive ? '비활성화' : '활성화'}
                      </button>
                      <button
                        onClick={() => handleEdit(notification.id)}
                        className="text-gray-600 hover:text-gray-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    등록된 알림이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 