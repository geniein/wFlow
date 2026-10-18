import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Check } from 'lucide-react';
import type { AppNode, FlowNodeData, Rule } from '../types/flow.js';

interface NodeConfigDrawerProps {
  node: AppNode | null;
  onClose: () => void;
  onSave: (nodeId: string, updatedData: FlowNodeData) => void;
  onDelete: (nodeId: string) => void;
}

export const NodeConfigDrawer: React.FC<NodeConfigDrawerProps> = ({
  node,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<FlowNodeData | null>(null);

  useEffect(() => {
    if (node && node.data) {
      try {
        setFormData(JSON.parse(JSON.stringify(node.data)));
      } catch {
        setFormData({ ...node.data });
      }
    } else {
      setFormData(null);
    }
  }, [node]);

  if (!node || !formData) return null;

  const nodeType = formData.type || 'inject';

  const handleSave = () => {
    onSave(node.id, formData);
    onClose();
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Rule helpers for Switch node
  const addRule = () => {
    const rules = formData.rules || [];
    setFormData({
      ...formData,
      rules: [...rules, { property: 'payload', operator: 'eq', value: '' }],
    });
  };

  const removeRule = (index: number) => {
    const rules = formData.rules || [];
    setFormData({
      ...formData,
      rules: rules.filter((_, i) => i !== index),
    });
  };

  const updateRule = (index: number, key: keyof Rule, val: string) => {
    const rules = [...(formData.rules || [])];
    if (rules[index]) {
      rules[index] = { ...rules[index], [key]: val };
      setFormData({ ...formData, rules });
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Edit {nodeType} node
          </h2>
          <span className="text-[10px] text-gray-400 font-mono">id: {node.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded text-gray-500 cursor-pointer"
            title="Cancel"
          >
            <X size={16} />
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded text-xs font-semibold cursor-pointer shadow-sm"
          >
            <Check size={14} />
            Done
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Name / Label */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
            placeholder="Node label"
          />
        </div>

        {/* INJECT NODE CONFIG */}
        {nodeType === 'inject' && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-gray-600 font-medium mb-1">Payload Type</label>
              <select
                value={formData.payloadType || 'date'}
                onChange={(e) => updateField('payloadType', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
              >
                <option value="date">timestamp (Date.now())</option>
                <option value="str">string</option>
                <option value="num">number</option>
                <option value="json">JSON</option>
              </select>
            </div>

            {formData.payloadType !== 'date' && (
              <div>
                <label className="block text-gray-600 font-medium mb-1">Payload Value</label>
                <input
                  type="text"
                  value={formData.payload || ''}
                  onChange={(e) => updateField('payload', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                  placeholder={formData.payloadType === 'json' ? '{"key": "val"}' : 'Value'}
                />
              </div>
            )}

            <div>
              <label className="block text-gray-600 font-medium mb-1">Topic</label>
              <input
                type="text"
                value={formData.topic || ''}
                onChange={(e) => updateField('topic', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded"
                placeholder="optional/topic"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">Repeat Interval (seconds)</label>
              <input
                type="number"
                min="0"
                value={formData.repeat || 0}
                onChange={(e) => updateField('repeat', parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded"
                placeholder="0 = manual trigger only"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="inject-once"
                checked={!!formData.once}
                onChange={(e) => updateField('once', e.target.checked)}
                className="rounded text-red-600"
              />
              <label htmlFor="inject-once" className="text-gray-700 font-medium">
                Inject once at deploy
              </label>
            </div>
          </div>
        )}

        {/* DEBUG NODE CONFIG */}
        {nodeType === 'debug' && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-gray-600 font-medium mb-1">Output</label>
              <select
                value={formData.complete ? 'complete' : 'payload'}
                onChange={(e) => updateField('complete', e.target.value === 'complete')}
                className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
              >
                <option value="payload">msg.payload only</option>
                <option value="complete">complete msg object</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="debug-active"
                checked={formData.active !== false}
                onChange={(e) => updateField('active', e.target.checked)}
                className="rounded text-red-600"
              />
              <label htmlFor="debug-active" className="text-gray-700 font-medium">
                Enable logging to Debug tab
              </label>
            </div>
          </div>
        )}

        {/* FUNCTION NODE CONFIG */}
        {nodeType === 'function' && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-gray-600 font-medium">JavaScript Code</label>
              <span className="text-[10px] text-gray-400">return msg;</span>
            </div>
            <textarea
              rows={12}
              value={formData.code || ''}
              onChange={(e) => updateField('code', e.target.value)}
              className="w-full p-2.5 font-mono text-[11px] leading-relaxed border border-gray-300 rounded bg-gray-900 text-emerald-400 focus:outline-none"
              placeholder="// Code here..."
            />
            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[10px] text-gray-600 space-y-1">
              <p className="font-semibold">Tips:</p>
              <p>• Modify <code className="text-red-600">msg.payload</code> and return <code className="text-red-600">msg</code>.</p>
              <p>• Return <code className="text-red-600">null</code> to stop flow execution.</p>
              <p>• Use <code className="text-red-600">console.log(...)</code> to log messages.</p>
            </div>
          </div>
        )}

        {/* SWITCH NODE CONFIG */}
        {nodeType === 'switch' && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-gray-600 font-medium">Routing Rules (Outputs)</label>
              <button
                type="button"
                onClick={addRule}
                className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-medium cursor-pointer"
              >
                <Plus size={12} /> Add Rule
              </button>
            </div>

            <div className="space-y-2">
              {(formData.rules || []).map((rule, idx) => (
                <div
                  key={idx}
                  className="p-2 border border-gray-200 rounded bg-gray-50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] text-gray-500">
                      Output port {idx + 1}
                    </span>
                    {(formData.rules?.length || 0) > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="text-gray-400 hover:text-rose-600"
                        title="Remove rule"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={rule.property}
                      onChange={(e) => updateRule(idx, 'property', e.target.value)}
                      placeholder="property (e.g. payload)"
                      className="px-2 py-1 border border-gray-300 rounded bg-white text-[11px]"
                    />
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(idx, 'operator', e.target.value as any)}
                      className="px-1.5 py-1 border border-gray-300 rounded bg-white text-[11px]"
                    >
                      <option value="eq">== (equals)</option>
                      <option value="neq">!= (not equal)</option>
                      <option value="gt">&gt; (greater than)</option>
                      <option value="lt">&lt; (less than)</option>
                      <option value="contains">contains</option>
                      <option value="else">otherwise (else)</option>
                    </select>
                  </div>
                  {rule.operator !== 'else' && (
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => updateRule(idx, 'value', e.target.value)}
                      placeholder="value"
                      className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-[11px]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DELAY NODE CONFIG */}
        {nodeType === 'delay' && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-gray-600 font-medium mb-1">Delay (milliseconds)</label>
              <input
                type="number"
                min="100"
                step="100"
                value={formData.delayMs || 1000}
                onChange={(e) => updateField('delayMs', parseInt(e.target.value, 10) || 1000)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                {((formData.delayMs || 1000) / 1000).toFixed(1)} seconds
              </span>
            </div>
          </div>
        )}

        {/* HTTP REQUEST NODE CONFIG */}
        {nodeType === 'httpRequest' && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-gray-600 font-medium mb-1">HTTP Method</label>
              <select
                value={formData.method || 'GET'}
                onChange={(e) => updateField('method', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">URL</label>
              <input
                type="text"
                value={formData.url || ''}
                onChange={(e) => updateField('url', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-mono text-[11px]"
                placeholder="https://api.example.com/data"
              />
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <button
          onClick={() => {
            onDelete(node.id);
            onClose();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded text-xs font-medium transition-colors cursor-pointer"
        >
          <Trash2 size={13} />
          Delete Node
        </button>
      </div>
    </div>
  );
};
