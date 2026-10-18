import { createContext, useContext } from 'react';

export interface FlowContextValue {
  triggerInject: (nodeId: string) => void;
}

export const FlowContext = createContext<FlowContextValue>({
  triggerInject: () => {},
});

export const useFlowContext = () => useContext(FlowContext);
