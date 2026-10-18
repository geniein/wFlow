import { ReactFlowProvider } from '@xyflow/react';
import { FlowEditor } from './components/FlowEditor.js';

export function App() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}

export default App;
