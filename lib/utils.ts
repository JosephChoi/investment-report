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
 * @param dateString - ISO 형식의 날짜 문자열
 * @returns 포맷팅된 날짜 문자열 (YYYY년 MM월 DD일)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) {
    return '날짜 정보 없음';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}년 ${month}월 ${day}일`;
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

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환하는 함수
 * @param bytes 바이트 단위의 파일 크기
 * @returns 포맷팅된 파일 크기 문자열 (예: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 