# 다사랑 간병 - 공식 홈페이지

따뜻한 가족 느낌의 간병 서비스 홈페이지 + 비공개 문의 시스템

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (warm/soft theme)
- **Auth**: Firebase Authentication
- **DB**: Firestore
- **Hosting**: Vercel (무료)

## 설치 및 실행

```bash
cd dasarang-web
npm install
cp .env.local.example .env.local
# .env.local 파일에 Firebase 설정 입력

npm run dev
# → http://localhost:3000
```

## Firebase 설정

1. Firebase 콘솔 → 프로젝트 설정 → 웹 앱 추가
2. `.env.local`에 Client SDK 값 입력
3. Authentication → 이메일/비밀번호 로그인 활성화
4. Firestore → 데이터베이스 생성
5. Firestore 규칙 설정:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /inquiries/{docId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid || request.auth.token.email == 'admin@dasarang.com');
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        request.auth.token.email == 'admin@dasarang.com';
    }
  }
}
```

## 관리자 계정

1. Firebase Auth → 사용자 추가
2. 이메일: `admin@dasarang.com`
3. 비밀번호 설정
4. Firestore 규칙에서 admin 권한 부여

## 📱 안드로이드 앱 연동

홈페이지 문의 API를 Flutter 앱에서 호출:

```dart
// 문의 작성 API 호출
final response = await http.post(
  Uri.parse('https://dasarang.vercel.app/api/inquiries'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'userId': user.uid,
    'userEmail': user.email,
    'title': '간병 문의',
    'patientName': '환자명',
    'patientAge': '75세',
    'patientGender': '남성',
    'hospital': '제천서울병원',
    'disease': '뇌졸중',
    'careNeeds': '24시간 간병 필요',
    'content': '상세 문의 내용...',
  }),
);

// 내 문의 목록 조회
final response = await http.get(
  Uri.parse('https://dasarang.vercel.app/api/inquiries?uid=${user.uid}'),
);
```

## 배포 (Vercel)

```bash
npm install -g vercel
vercel
# → https://dasarang.vercel.app
```

## 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 메인 홈 (히어로 + 서비스 + 가치) |
| `/about` | 소개 (연혁, 소속 정보) |
| `/services` | 서비스 상세 (6종 간병 서비스) |
| `/inquiry` | 문의 목록 (로그인 필요) |
| `/inquiry/new` | 새 문의 작성 (환자 정보 포함) |
| `/inquiry/[id]` | 문의 상세 (작성자+관리자만) |
| `/admin` | 관리자 대시보드 (문의 관리) |

## 보안

- 문의 내용: Firestore 규칙으로 작성자+관리자만 열람 가능
- API: Firebase Admin SDK로 서버 측 인증
- 관리자: 이메일 기반 권한 체크
