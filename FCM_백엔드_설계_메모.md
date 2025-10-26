# FCM 백엔드 설계 메모 - RecTime 프로젝트

## 📋 프론트엔드 구현 완료 사항
- ✅ Firebase 설정 및 FCM 초기화 (`firebaseConfig.ts`)
- ✅ FCM 토큰 등록/해제 유틸리티 (`registerFCMToken.ts`)
- ✅ 자동 토큰 등록 훅 (`useFCM.ts`)
- ✅ 기존 로그인 시스템과 FCM 통합 (`useStudentData.ts`)
- ✅ FCM 테스트 패널 (`FCMTestPanel.tsx`)

## 🛰️ 백엔드 API 엔드포인트 설계

### 1. FCM 토큰 등록 API
```
POST /api/register-fcm
Content-Type: application/json

{
  "token": "fSjI-gV5Rdz...",
  "studentNum": "50350",
  "timestamp": "2024-01-15T10:30:00Z",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Win32",
    "language": "ko-KR"
  }
}
```

**응답:**
```json
{
  "success": true,
  "message": "FCM 토큰이 성공적으로 등록되었습니다",
  "registeredAt": "2024-01-15T10:30:00Z"
}
```

### 2. FCM 상태 확인 API
```
GET /api/fcm-status/:studentNum
```

**응답:**
```json
{
  "registered": true,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "deviceInfo": {
    "platform": "Win32",
    "language": "ko-KR"
  }
}
```

### 3. FCM 토큰 해제 API
```
DELETE /api/fcm-unregister/:studentNum
```

**응답:**
```json
{
  "success": true,
  "message": "FCM 토큰이 성공적으로 해제되었습니다"
}
```

### 4. FCM 테스트 푸시 API
```
POST /api/test-push/:studentNum
Content-Type: application/json

{
  "title": "🧪 테스트 알림",
  "body": "FCM 푸시 알림이 정상적으로 작동합니다!",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**응답:**
```json
{
  "success": true,
  "message": "테스트 푸시가 성공적으로 전송되었습니다",
  "sentAt": "2024-01-15T10:30:00Z"
}
```

## 🗄️ 데이터베이스 설계 (Cloudflare D1)

### fcm_tokens 테이블
```sql
CREATE TABLE fcm_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_num TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  device_info TEXT, -- JSON string
  registered_at TEXT NOT NULL, -- ISO string
  last_used TEXT, -- ISO string
  is_active INTEGER DEFAULT 1, -- 0: inactive, 1: active
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fcm_tokens_student_num ON fcm_tokens(student_num);
CREATE INDEX idx_fcm_tokens_active ON fcm_tokens(is_active);
CREATE INDEX idx_fcm_tokens_token ON fcm_tokens(token);
```

### notification_logs 테이블 (선택사항)
```sql
CREATE TABLE notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_num TEXT NOT NULL,
  token TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  success INTEGER DEFAULT 0, -- 0: failed, 1: success
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 백엔드 구현 구조

### 1. FCM 서비스 모듈
```typescript
// services/fcmService.ts
export interface FCMTokenData {
  token: string;
  studentNum: string;
  timestamp: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export class FCMService {
  private firebaseAdmin: admin.app.App;
  
  async registerToken(data: FCMTokenData): Promise<boolean>
  async unregisterToken(studentNum: string): Promise<boolean>
  async sendNotification(token: string, payload: NotificationPayload): Promise<boolean>
  async sendBulkNotifications(tokens: string[], payload: NotificationPayload): Promise<number>
  async getTokensByStudentNum(studentNum: string): Promise<string[]>
  async getActiveTokens(): Promise<Array<{studentNum: string, token: string}>>
  async cleanupInactiveTokens(): Promise<number>
}
```

### 2. 알림 스케줄러 (Cron)
```typescript
// cron/notificationScheduler.ts
export class NotificationScheduler {
  async checkUpcomingEvents(): Promise<void>
  async sendEventReminders(): Promise<void>
  async sendEventStartNotifications(): Promise<void>
  async sendCustomNotification(studentNums: string[], payload: NotificationPayload): Promise<void>
}
```

### 3. 라우트 핸들러
```typescript
// routes/api/register-fcm.ts
export async function POST(request: Request): Promise<Response>

// routes/api/fcm-status.ts
export async function GET(request: Request): Promise<Response>

// routes/api/fcm-unregister.ts
export async function DELETE(request: Request): Promise<Response>

// routes/api/test-push.ts
export async function POST(request: Request): Promise<Response>
```

## 🎯 핵심 로직 플로우

### 1. 토큰 등록 플로우
1. 프론트엔드에서 FCM 토큰 발급
2. `POST /api/register-fcm` 호출
3. 백엔드에서 토큰 + 학번을 DB에 저장
4. 중복 토큰 처리 (기존 토큰 비활성화 후 새 토큰 등록)
5. 등록 성공 응답 반환

### 2. 알림 전송 플로우
1. Cron이 5분마다 실행
2. 현재 시간 기준으로 30분/10분/5분 전 이벤트 조회
3. 해당 이벤트 참가 학생들의 FCM 토큰 조회
4. Firebase Admin SDK로 푸시 전송
5. 전송 결과 로깅 및 통계 업데이트

### 3. 오프라인 알림 처리
- FCM 서버가 직접 OS 레벨에서 푸시 전송
- 앱이 꺼져 있어도 수신 가능
- 브라우저 탭이 닫혀도 수신 가능
- 폰이 꺼져 있어도 다음 부팅 시 수신 가능

## 🔐 보안 고려사항

### 1. 토큰 검증
- 유효한 FCM 토큰인지 Firebase에서 검증
- 만료된 토큰 자동 정리

### 2. 학번 인증
- 기존 로그인 시스템과 연동
- 학번 + 생년월일 인증 후에만 토큰 등록 허용

### 3. Rate Limiting
- API 호출 제한 (예: 1분에 10회)
- IP 기반 제한

### 4. 데이터 보호
- 개인정보 최소화 (학번만 저장)
- 토큰 암호화 저장

## 📊 모니터링 및 로깅

### 1. 토큰 등록 통계
- 일별/주별 등록 현황
- 활성 토큰 수 추적
- 디바이스별 등록 현황

### 2. 푸시 전송 통계
- 성공/실패율 추적
- 전송 시간 분석
- 에러 유형별 분류

### 3. 에러 로깅
- 상세한 에러 정보 수집
- 스택 트레이스 포함
- 알림 전송 실패 원인 분석

### 4. 성능 모니터링
- API 응답 시간 추적
- 데이터베이스 쿼리 성능
- Firebase API 호출 성능

## 🚀 배포 시나리오

### 1. 학생 등록 플로우
1. 홈화면에 PWA 앱 설치
2. 학번 + 생년월일로 로그인
3. 자동으로 FCM 토큰 발급 및 등록
4. 백엔드 DB에 토큰 저장

### 2. 경기 일정 등록
1. 관리자가 경기 일정 입력
2. 참가 학생 정보 연동
3. 자동 알림 스케줄링

### 3. 자동 알림 전송
1. Cron이 5분마다 실행
2. 경기 시간 계산 (30분/10분/5분 전)
3. 해당 학생들의 토큰으로 푸시 전송
4. 전송 결과 로깅

### 4. 오프라인 수신
1. 앱이 꺼져 있어도 FCM 서버가 OS 푸시로 전송
2. 학생이 폰을 켜면 알림 확인 가능
3. 알림 클릭 시 앱 자동 실행

## 💡 최종 목표

**전교생이 홈화면에 앱을 추가하고 로그인만 하면, 경기 시간에 맞춰 자동으로 푸시 알림을 받을 수 있는 완전 자동화 시스템 구축**

### 핵심 특징
- ✅ **완전 자동화**: 한 번 등록하면 관리 불필요
- ✅ **오프라인 지원**: 앱 꺼져 있어도 수신 가능
- ✅ **실시간 알림**: 경기 시간에 맞춰 정확한 알림
- ✅ **확장성**: 전교생 규모 지원 가능
- ✅ **안정성**: 에러 처리 및 복구 시스템

## 🔧 구현 우선순위

### Phase 1: 기본 FCM 시스템
1. FCM 토큰 등록/해제 API
2. 기본 푸시 전송 기능
3. 테스트 푸시 API

### Phase 2: 자동 알림 시스템
1. Cron 스케줄러 구현
2. 경기 시간 계산 로직
3. 자동 푸시 전송

### Phase 3: 모니터링 및 최적화
1. 통계 및 로깅 시스템
2. 성능 최적화
3. 에러 처리 강화

### Phase 4: 고급 기능
1. 커스텀 알림 설정
2. 알림 히스토리
3. 관리자 대시보드
