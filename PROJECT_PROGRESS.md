# 📋 wFlow 개발 진행 상황 및 세션 핸드오버 문서

> **작성 일시**: 2026-10-19  
> **프로젝트 위치**: `/home/ingenie/wFlow`  
> **상태**: 풀스택 프로토타입 구축 완료, 핵심 노드 6종 및 실시간 런타임 연동 완료, 안정화 패치 완료  

---

## 1. 프로젝트 개요

`wFlow`는 **React Flow (`@xyflow/react`)** 기반의 프론트엔드 에디터와 **Node.js + WebSocket** 기반의 백엔드 실행 엔진을 결합하여, **Node-RED**와 동일한 플로우 기반 프로그래밍(Flow-based Programming) 경험을 제공하는 웹 애플리케이션입니다.

- **프론트엔드 URL**: `http://localhost:5173`
- **백엔드 REST API**: `http://localhost:3001`
- **WebSocket 실시간 통신**: `ws://localhost:3001`

---

## 2. 시스템 아키텍처 및 폴더 구조

```
wFlow/
├── client/                           # 프론트엔드 (Vite + React 19 + TypeScript + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/
│   │   │   ├── FlowEditor.tsx        # React Flow 메인 캔버스 (D&D, 와이어 펄스, 연결 관리)
│   │   │   ├── Header.tsx            # 상단 네비게이션 (Deploy, 상태 표시, Export/Import)
│   │   │   ├── Palette.tsx           # 좌측 사이드바 드래그 & 드롭 노드 목록
│   │   │   ├── NodeConfigDrawer.tsx  # 노드 속성/규칙/코드 편집 드로어
│   │   │   ├── DebugPanel.tsx        # 우측 실시간 Debug JSON 로그 패널
│   │   │   └── nodes/
│   │   │       ├── BaseNode.tsx      # 공통 노드 스타일 정의
│   │   │       ├── InjectNode.tsx    # 수동 실행 ▶ 버튼이 탑재된 주입 노드
│   │   │       ├── DebugNode.tsx     # 디버그 수신 노드
│   │   │       ├── FunctionNode.tsx  # JavaScript 코드 실행 노드
│   │   │       ├── SwitchNode.tsx    # 규칙에 따라 포트가 동적으로 생성되는 조건 분기 노드
│   │   │       ├── DelayNode.tsx     # 지연 전달 노드
│   │   │       ├── HttpRequestNode.tsx # 외부 REST API 호출 노드
│   │   │       └── NodeStatusBadge.tsx # 노드 하단 상태 인디케이터 (점/링/텍스트)
│   │   ├── context/
│   │   │   └── FlowContext.tsx       # 노드와 캔버스 간 이벤트 통신용 Context (triggerInject 등)
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts       # 백엔드 엔진 실시간 통신 훅 (재연결 방어 및 로그 중복 제거)
│   │   └── types/
│   │       └── flow.ts               # 플로우 데이터 모델, 노드 데이터, 메시지 스키마
│   ├── vite.config.ts                # Tailwind CSS v4 + React Vite 설정
│   └── package.json
│
├── server/                           # 백엔드 런타임 (Node.js + Express + ws + tsx)
│   ├── src/
│   │   ├── engine/
│   │   │   ├── FlowEngine.ts         # 플로우 실행 라이프사이클, 와이어 라우팅, 이벤트 발송
│   │   │   ├── runners.ts            # 노드별 실행기 (Inject, Debug, Function, Switch, Delay, HttpRequest)
│   │   │   └── types.ts              # 백엔드 타입 정의 (Msg, Flow, NodeStatus, DebugLog)
│   │   ├── storage.ts                # flows.json 파일 입출력 및 초기 기본 플로우 정의
│   │   └── server.ts                 # Express REST + WebSocket 서버 (포트 3001)
│   ├── flows.json                    # 현재 배포되어 영속화된 플로우 데이터
│   ├── tsconfig.json
│   └── package.json
│
├── README.md                         # 사용자 가이드 및 빠른 시작 문서
├── PROJECT_PROGRESS.md               # [본 문서] 세션 참조용 상세 진행 보고서
└── package.json                      # concurrently 루트 실행 설정
```

---

## 3. 구현 완료된 기능 목록

### 3.1. 캔버스 및 노드 시스템
1. **팔레트 드래그 & 드롭 (D&D)**:
   - 좌측 카테고리(`common`, `function`, `network`)에서 캔버스로 노드를 드래그하여 배치 가능.
2. **Node-RED 고유 테마 스타일**:
   - Inject(하늘색), Debug(초록색), Function(주황색), Switch(노란색), Delay(보라색), HttpRequest(분홍색).
3. **노드 하단 상태 뱃지 (`NodeStatusBadge`)**:
   - 실행 중(`running...`), 대기(`ready`), 완료 텍스트 및 상태별 색상 점(green, red, yellow, blue, grey) 실시간 동기화.
4. **동적 출력 포트 (`SwitchNode`)**:
   - 설정된 조건 규칙(`eq`, `neq`, `gt`, `lt`, `contains`, `else`) 수에 따라 우측 출력 핸들(`output_0`, `output_1`, ...)이 동적으로 자동 생성 및 배치.
5. **Inject 노드 퀵 트리거 (`InjectNode`)**:
   - 노드 좌측의 `▶` 버튼을 캔버스에서 직접 클릭하여 즉시 메시지 발행.
6. **와이어 펄스 애니메이션 (`edge_pulse`)**:
   - 메시지가 노드 간 와이어를 타고 이동할 때 빨간색 점선으로 빛나는 흐름 애니메이션 시각화.

### 3.2. 백엔드 실행 엔진 (Runtime Engine)
1. **이벤트 기반 메시지 라우팅**:
   - `{ _msgid, payload, topic, ... }` 구조의 표준 메시지 객체를 엣지 연결에 따라 대상 노드로 비동기 전달.
2. **안전한 JavaScript 샌드박스 (`FunctionRunner`)**:
   - Node.js `node:vm` 기반으로 격리된 컨텍스트에서 실행하며, `console.log` 출력은 프론트엔드 Debug 패널로 자동 스트리밍.
3. **타이머 및 지연 제어 (`Inject`, `Delay`)**:
   - 주기적 반복 실행(`repeat`), 기동 시 1회 즉시 실행(`once`), 지정 시간 딜레이 처리.
4. **HTTP 외부 통신 (`HttpRequestRunner`)**:
   - `fetch` API를 사용하여 GET/POST 요청을 전송하고 응답을 `msg.payload`에 담아 전달.
5. **플로우 영속화 (`storage.ts`)**:
   - 배포된 플로우는 `server/flows.json` 파일에 즉시 기록되어 서버 재시작 시에도 복원.

### 3.3. UI 보조 도구
1. **디버그 패널 (`DebugPanel`)**:
   - Debug 노드로 들어오는 메시지를 타임스탬프, 노드 이름, 토픽과 함께 포맷팅된 JSON 트리로 실시간 모니터링.
2. **노드 상세 설정 드로어 (`NodeConfigDrawer`)**:
   - 노드 클릭 시 우측 슬라이드 패널 오픈.
   - Function 코드 에디터, Switch 조건 규칙 빌더, Inject 페이로드 타입 변경 등 완비.
3. **플로우 내보내기/가져오기 (Export/Import)**:
   - JSON 파일 다운로드 및 업로드 지원.

---

## 4. 해결된 주요 이슈 및 트러블슈팅 히스토리

### Issue 1: React Key 중복 경고
- **증상**: `Encountered two children with the same key, '72b79610-0adc-44cc-9166-d7b73b6a1594'...`
- **원인**: React 19 StrictMode / HMR 재마운트 시 기존 소켓이 비동기 종료되면서 `onclose`가 재연결 타이머를 가동해 **단일 탭에 다중 WebSocket 연결**이 형성됨. 서버 브로드캐스트 시 동일한 `log.id`가 2번 수신되어 `DebugPanel`의 React Key 충돌 발생.
- **조치**:
  1. `client/src/hooks/useWebSocket.ts`: `isMountedRef` 도입, 언마운트 시 모든 소켓 이벤트 리스너 제거 및 소켓 정상 종료.
  2. `setDebugLogs`: `prev.some(item => item.id === data.log.id)` 검사로 중복 수신 방어.
  3. `client/src/components/DebugPanel.tsx`: `key={`${log.id}-${index}`}` 복합키 적용.

### Issue 2: 노드 클릭 시 상세 드로어 크래시 (`Uncaught DataCloneError`)
- **증상**: `Uncaught DataCloneError: Failed to execute 'structuredClone' on 'Window': (id) => triggerInject(id) could not be cloned. at NodeConfigDrawer.tsx:22:19`
- **원인**: Inject 노드의 `▶` 버튼 처리를 위해 `node.data` 안에 `onInject: (id) => triggerInject(id)`라는 함수 객체를 넣어두었으나, `structuredClone`은 함수를 복제할 수 없어 에러 발생.
- **조치**:
  1. `client/src/context/FlowContext.tsx`: `FlowContext`를 신설하여 `InjectNode`가 `useFlowContext()`를 통해 액션을 호출하도록 변경.
  2. `node.data`에서 모든 함수를 제거하고 순수 JSON 데이터만 남김.
  3. `client/src/components/NodeConfigDrawer.tsx`: `structuredClone` 대신 `JSON.parse(JSON.stringify(node.data))` 및 `try/catch` fallback 적용.

---

## 5. 실행 및 검증 명령어

### 전체 실행 (프론트엔드 + 백엔드 동시 실행)
```bash
cd /home/ingenie/wFlow
npm run dev
```

### 개별 서비스 실행
```bash
# 백엔드만 실행 (포트 3001)
npm run dev:server

# 프론트엔드만 실행 (포트 5173)
npm run dev:client
```

### 빌드 및 타입 검사
```bash
# 프론트엔드 빌드 검사
npm run build

# 백엔드 TypeScript 타입 검사
npx --prefix server tsc -p server/tsconfig.json --noEmit
```

---

## 6. 다음 세션을 위한 권장 작업 (Roadmap / Next Steps)

다음 작업자가 이어서 진행하기 좋은 개선 항목들입니다:

1. **에디터 편의 기능 고도화**:
   - `Function` 노드 코드 편집기에 Monaco Editor(VS Code 에디터) 탑재 및 TypeScript/JS 신택스 하이라이팅, 자동완성 지원.
   - 키보드 단축키 지원 (`Ctrl+S`로 Deploy, `Delete`/`Backspace`로 노드 삭제, `Ctrl+Z`/`Ctrl+Y` Undo/Redo).
2. **다중 탭(Multi-tab Flow) 관리**:
   - Header의 `Flow 1` 외에 `+` 탭 버튼을 눌러 새 탭 생성, 탭 삭제, 탭 이름 변경 기능 구현.
3. **신규 노드 추가**:
   - **MQTT In / Out 노드**: IoT 장비 연동을 위한 MQTT 브로커 연동 노드.
   - **WebSocket In / Out 노드**: 외부 웹소켓 클라이언트와 실시간 통신.
   - **JSON / CSV 파서 노드**: 데이터 포맷 변환 노드.
   - **Template 노드**: Mustache 템플릿 기반 문자열 렌더링.
4. **에러 핸들링 시각화**:
   - `catch` 노드 지원 또는 노드 실행 에러 발생 시 해당 노드와 와이어에 붉은색 경고 표시 및 트레이스백 표시.
