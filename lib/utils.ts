import { read, utils } from 'xlsx';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 클래스명을 병합하는 유틸리티 함수
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 엑셀 파일을 파싱하여 JSON 데이터로 변환하는 함수
 * @param file 엑셀 파일
 * @returns 파싱된 JSON 데이터
 */
export async function parseExcelFile(file: File) {
  // 파일을 ArrayBuffer로 읽기
  const buffer = await file.arrayBuffer();
  // 엑셀 워크북 파싱
  const workbook = read(buffer);
  // 첫 번째 시트 선택
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  // 시트 데이터를 JSON으로 변환
  const data = utils.sheet_to_json(worksheet);
  return data;
}

/**
 * 파일명에서 날짜 추출하는 함수
 * @param filename 파일명 (예: "고객데이터_2023-05-31.xlsx")
 * @returns 추출된 날짜 객체
 */
export function extractDateFromFilename(filename: string): Date | null {
  // 정규식으로 날짜 패턴 찾기 (YYYY-MM-DD 형식)
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch && dateMatch[1]) {
    return new Date(dateMatch[1]);
  }
  return null;
}

/**
 * 날짜 문자열을 포맷팅하는 함수
 * @param dateString ISO 형식의 날짜 문자열 또는 Date 객체
 * @returns 포맷팅된 날짜 문자열 (예: 2024년 3월 15일)
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '날짜 정보 없음';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    return '날짜 형식 오류';
  }
}

/**
 * 금액을 한국어 형식으로 포맷팅하는 함수
 * @param amount 금액
 * @returns 포맷팅된 금액 문자열 (예: "1,234,567원")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
} 