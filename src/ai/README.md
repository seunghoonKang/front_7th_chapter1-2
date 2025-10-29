# 🤖 BMAD-METHOD 에이전트 구조

이 프로젝트는 [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) 스타일의 에이전트 기반 개발 워크플로우를 따라 반복 일정 기능을 구현합니다.

## 📋 에이전트 역할

### 1. SpecWriter (Analyst Role)

**파일**: `src/ai/agents/SpecWriter.md`

**책임**:

- 기능 요구사항 분석
- PRD 문서 작성
- 테스트 시나리오 블루프린트 작성
- 엣지 케이스 정의

**산출물**:

- `src/ai/PRD/recurrence-feature.md`

**핸드오프**: TDD-Engineer

---

### 2. TDD-Engineer (Dev Role)

**파일**: `src/ai/agents/TDD-Engineer.md`

**책임**:

- Kent Beck의 TDD 원칙 따르기
- 테스트 우선 작성 (Red → Green → Refactor)
- 핵심 로직 구현
- Tidy First 원칙 적용

**산출물**:

- `src/utils/recurrenceUtils.ts`
- `src/__tests__/unit/easy.recurrenceUtils.spec.ts`
- `src/__tests__/unit/medium.recurrenceUtils.spec.ts`
- `src/ai/reports/TDD-Engineer-result.md`

**핸드오프**: UI-Designer

---

### 3. UI-Designer (Design Role)

**파일**: `src/ai/agents/UI-Designer.md`

**책임**:

- UI 컴포넌트 구현
- Material-UI 디자인 시스템 적용
- 사용자 인터랙션 구현
- 접근성 확인

**산출물**:

- `src/App.tsx` 업데이트 (반복 폼, 아이콘, 다이얼로그)
- `src/__tests__/medium.integration.spec.tsx` 확장
- `src/ai/reports/UI-Designer-result.md`

**핸드오프**: Integrator

---

### 4. Integrator (QA/Integration Role)

**파일**: `src/ai/agents/Integrator.md`

**책임**:

- 전체 기능 통합 테스트
- 엣지 케이스 검증
- 버그 수정
- 최종 품질 확인

**산출물**:

- `src/__tests__/medium.integration.spec.tsx` 확장
- 버그 수정 코드
- `src/ai/reports/Integrator-result.md`

**핸드오프**: 배포 준비 완료

---

## 🔄 워크플로우

```
[SpecWriter]
    ↓ PRD 작성
[TDD-Engineer]
    ↓ 테스트 + 구현
[UI-Designer]
    ↓ UI 구현
[Integrator]
    ↓ 통합 및 QA
[배포 준비 완료]
```

## 📚 참고 문서

### 핵심 문서

- **TDD 원칙**: `src/ai/docs/kent-beck-tdd.md`
- **PRD**: `src/ai/PRD/recurrence-feature.md`

### 에이전트 가이드

- `src/ai/agents/SpecWriter.md`
- `src/ai/agents/TDD-Engineer.md`
- `src/ai/agents/UI-Designer.md`
- `src/ai/agents/Integrator.md`

## 🧪 개발 명령어

```bash
# 테스트 실행 (Watch 모드)
pnpm test

# 테스트 커버리지 확인
pnpm test:coverage

# 개발 서버 실행
pnpm dev

# 린트 확인
pnpm lint
```

## 📌 현재 상태

- ✅ SpecWriter: PRD 작성 완료
- ⏳ TDD-Engineer: 진행 중
- ⏳ UI-Designer: 대기 중
- ⏳ Integrator: 대기 중

## 🎯 다음 단계

1. **TDD-Engineer 시작**

   - `src/utils/recurrenceUtils.ts` 생성
   - 첫 번째 테스트 작성 (RED)
   - 최소 구현 (GREEN)
   - 리팩토링 (BLUE)

2. **UI-Designer 시작** (TDD-Engineer 완료 후)

   - 반복 폼 UI 활성화
   - 아이콘 추가
   - 다이얼로그 구현

3. **Integrator 시작** (UI-Designer 완료 후)
   - 통합 테스트 작성
   - 버그 수정
   - 최종 검증

## 🔗 BMAD-METHOD 참고

이 프로젝트는 BMAD-METHOD의 다음 원칙을 따릅니다:

1. **Agentic Planning**: SpecWriter가 PRD 작성
2. **Context-Engineered Development**: PRD에 모든 컨텍스트 포함
3. **TDD Methodology**: Kent Beck의 TDD 원칙 따르기
4. **Tidy First**: 구조적 변경과 행동적 변경 분리

더 자세한 내용은 [BMAD-METHOD GitHub](https://github.com/bmad-code-org/BMAD-METHOD)를 참고하세요.
