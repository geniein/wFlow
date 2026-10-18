# wFlow - Node-RED with React Flow & Node.js

React Flow(`@xyflow/react`)와 Node.js 백엔드 실행 엔진을 결합하여 구현한 **Node-RED 스타일의 비주얼 플로우 기반 프로그래밍 에디터**입니다.

---

## 🌟 주요 기능 (Key Features)

1. **Node-RED 스타일의 비주얼 에디터**:
   - **팔레트 (Palette)**: 좌측 사이드바에서 노드를 드래그 & 드롭(Drag & Drop)하여 캔버스에 추가.
   - **커스텀 노드 디자인**: Node-RED 고유의 색상 테마(파스텔톤 카드, 포트 핸들, 아이콘, 라벨).
   - **노드 상태 인디케이터 (Status Badges)**: 노드 하단에 실시간 실행 상태(점/링 인디케이터, 색상, 텍스트) 표시.
   - **Inject 퀵 트리거 버튼**: Inject 노드 좌측 버튼을 캔버스에서 직접 클릭하여 즉시 메시지 발행.
   - **동적 다중 출력 포트 (Switch Node)**: 설정된 분기 규칙(Rule) 개수에 따라 우측 출력 핸들이 동적으로 생성 및 매핑.
   - **실시간 와이어 펄스 애니메이션 (Edge Pulse Animation)**: 메시지가 노드 간 와이어를 타고 이동할 때 빨간색 대시 애니메이션으로 시각화.

2. **Node.js 백엔드 플로우 실행 런타임 (Engine)**:
   - **이벤트 기반 메시지 라우팅**: `{ _msgid, payload, topic, ... }` 구조의 메시지 객체를 와이어 연결에 따라 다음 노드로 전달.
   - **안전한 JS 샌드박스 실행 (`Function` 노드)**: Node.js VM 컨텍스트 내에서 비동기 코드 실행 및 `console.log` 디버그 연동.
   - **타이머 기반 반복 실행 및 지연 (`Inject`, `Delay`)**: 주기적 실행(`repeat`), 최초 1회 실행(`once`), 지정 시간 딜레이 지원.
   - **HTTP 요청 지원 (`HttpRequest` 노드)**: 외부 REST API 호출 후 응답을 `msg.payload`로 전달.
   - **Flow 영속성 (`flows.json`)**: 플로우 배포 시 백엔드 파일로 자동 저장되어 재시작 시에도 유지.

3. **실시간 WebSocket 통신**:
   - 플로우 배포(`deploy`) 및 동기화
   - 수동 Inject 트리거(`inject_trigger`)
   - 실시간 노드 상태 업데이트(`node_status`)
   - 실시간 와이어 펄스(`edge_pulse`)
   - 실시간 디버그 로그 스트리밍(`debug_log`)

4. **디버그 콘솔 & JSON 인스펙터 (Debug Panel)**:
   - Debug 노드로 유입되는 메시지를 실시간 모니터링
   - 타임스탬프, 노드 이름, 토픽, 포맷팅된 JSON 객체 뷰어 제공

5. **플로우 JSON 내보내기/가져오기 (Export / Import)**:
   - 완성된 플로우를 JSON 파일로 다운로드하거나 기존 플로우 파일을 불러와 즉시 실행.

---

## 🏗️ 아키텍처 구조

```
wFlow/
├── client/                     # 프론트엔드 (React Flow v12 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── FlowEditor.tsx        # 메인 플로우 에디터 캔버스
│   │   │   ├── Header.tsx            # 배포, 상태, 가져오기/내보내기 상단 바
│   │   │   ├── Palette.tsx           # 좌측 드래그 & 드롭 노드 목록
│   │   │   ├── NodeConfigDrawer.tsx  # 노드 더블클릭/클릭 시 우측 속성 설정 드로어
│   │   │   ├── DebugPanel.tsx        # 우측 하단 디버그 로그 패널
│   │   │   └── nodes/
│   │   │       ├── InjectNode.tsx    # 퀵 트리거 버튼이 달린 주입 노드
│   │   │       ├── DebugNode.tsx     # 디버그 노드
│   │   │       ├── FunctionNode.tsx  # JS 함수 처리 노드
│   │   │       ├── SwitchNode.tsx    # 동적 다중 출력 조건 분기 노드
│   │   │       ├── DelayNode.tsx     # 지연 노드
│   │   │       ├── HttpRequestNode.tsx # HTTP 통신 노드
│   │   │       └── NodeStatusBadge.tsx # 노드 하단 상태 뱃지
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts       # 백엔드 엔진 실시간 통신 훅
│   │   └── types/
│   │       └── flow.ts               # 공통 타입 인터페이스
├── server/                     # 백엔드 (Node.js + Express + WebSocket + VM Engine)
│   ├── src/
│   │   ├── engine/
│   │   │   ├── FlowEngine.ts         # 플로우 실행, 라이프사이클 및 라우팅 관리
│   │   │   ├── runners.ts            # 개별 노드별 실행 로직 구현체
│   │   │   └── types.ts              # 메시지 및 플로우 스키마 정의
│   │   ├── storage.ts                # flows.json 파일 입출력 및 초기 템플릿
│   │   └── server.ts                 # Express REST + WebSocket 서버 (Port 3001)
│   └── flows.json                    # 현재 저장된 플로우 데이터
└── package.json                # 루트 실행 스크립트 (concurrently)
```

---

## 🚀 빠른 시작 (Quick Start)

### 1. 개발 서버 실행 (프론트엔드 + 백엔드 동시 구동)

루트 디렉토리(`/home/ingenie/wFlow`)에서 아래 명령어를 실행합니다:

```bash
npm run dev
```

- 백엔드 엔진: `http://localhost:3001` (WebSocket: `ws://localhost:3001`)
- 프론트엔드 UI: `http://localhost:5173`

---

## 💡 지원 노드 및 사용법

| 노드 종류 | 기본 색상 | 주요 기능 및 설정 |
|---|---|---|
| **Inject** | `#a6bbcf` (하늘색) | 메시지 트리거. Date.now(), 문자열, 숫자, JSON payload 설정 가능. 주기적 반복(`repeat`) 또는 시작 시 1회 실행(`once`) 지원. 캔버스 노드 좌측의 `▶` 버튼 클릭으로 즉시 수동 실행. |
| **Debug** | `#87a980` (초록색) | 유입된 메시지를 콘솔 및 우측 Debug 패널에 실시간 출력. `msg.payload`만 보거나 전체 `msg` 객체 확인 가능. |
| **Function** | `#fdd0a2` (주황색) | JavaScript 코드로 `msg`를 가공. 예: `msg.payload = msg.payload * 2; return msg;` (반환값이 `null`이면 흐름 중단). |
| **Switch** | `#e2d96e` (노란색) | 다중 조건 분기. 조건(`==`, `!=`, `>`, `<`, `contains`, `else`)을 추가하면 그에 맞춰 우측 출력 핸들이 동적으로 늘어남. |
| **Delay** | `#e6e0f8` (보라색) | 지정한 시간(ms) 동안 메시지 전달을 지연. |
| **HTTP Request** | `#ffcdd2` (분홍색) | 외부 HTTP URL로 GET/POST 요청을 전송하고 응답 결과를 `msg.payload`에 저장하여 다음 노드로 전달. |

---

## 🔄 작동 흐름 (Workflow)

1. 브라우저(`http://localhost:5173`) 접속 시 백엔드에 저장된 기본 플로우(타임스탬프 주입 ➔ 포맷팅 함수 ➔ 조건 검사 ➔ 고/저 점수 디버그)가 로드됩니다.
2. 좌측 **Inject** 노드의 `▶` 버튼을 클릭하면 메시지가 생성되어 실시간으로 와이어를 타고 이동하며, 우측 **Debug** 패널에 출력됩니다.
3. 좌측 팔레트에서 새 노드를 끌어다 놓고 포트끼리 드래그하여 연결할 수 있습니다.
4. 노드를 클릭하면 우측에 설정 드로어가 열려 코드를 수정하거나 딜레이 시간을 변경할 수 있습니다.
5. 상단 우측의 **Deploy** 버튼을 누르면 전체 플로우가 백엔드에 즉시 배포되어 실행 엔진에 반영됩니다.
