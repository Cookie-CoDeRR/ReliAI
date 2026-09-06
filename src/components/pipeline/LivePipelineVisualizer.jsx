import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant
} from '@xyflow/react';
import dagre from 'dagre';
import {
  Play,
  RotateCcw,
  Sparkles,
  Send,
  Zap,
  Flame,
  Activity,
  Layers,
  ShieldCheck,
  Maximize2,
  Volume2,
  VolumeX,
  Sliders,
  ChevronRight,
  Database,
  Radio,
  Cpu,
  Bot
} from 'lucide-react';
import GlassAgentNode from './GlassAgentNode';
import EnergizedWireEdge from './EnergizedWireEdge';
import NodeInspectorDrawer from './NodeInspectorDrawer';

const nodeTypes = {
  glassAgent: GlassAgentNode
};

const edgeTypes = {
  energizedWire: EnergizedWireEdge
};

// Node dimensions for dagre auto-layout
const NODE_WIDTH = 240;
const NODE_HEIGHT = 110;

// Dagre auto-layout generator
const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 45,
    ranksep: 90,
    align: 'DL'
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2
      }
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Initial template pipeline structure
const INITIAL_PIPELINE_NODES = [
  {
    id: 'node-prompt',
    type: 'glassAgent',
    position: { x: 0, y: 150 },
    data: {
      label: 'Prompt Ingest',
      role: 'User Prompt & IoT Stream',
      state: 'done',
      iconType: 'prompt',
      isRoot: true,
      outputSnippet: 'User triggered anomaly investigation for Joint 3 thermal runaway.'
    }
  },
  {
    id: 'node-triage',
    type: 'glassAgent',
    position: { x: 300, y: 150 },
    data: {
      label: 'Triage Agent',
      role: 'Anomaly Classification',
      state: 'idle',
      iconType: 'triage',
      outputSnippet: ''
    }
  },
  {
    id: 'node-rag',
    type: 'glassAgent',
    position: { x: 600, y: 50 },
    data: {
      label: 'Knowledge RAG',
      role: 'ISO Specs & Manuals',
      state: 'idle',
      iconType: 'rag',
      outputSnippet: ''
    }
  },
  {
    id: 'node-domain',
    type: 'glassAgent',
    position: { x: 600, y: 250 },
    data: {
      label: 'Domain Analyst',
      role: 'FFT & Torque Kinematics',
      state: 'idle',
      iconType: 'domain',
      outputSnippet: ''
    }
  },
  {
    id: 'node-root-cause',
    type: 'glassAgent',
    position: { x: 900, y: 150 },
    data: {
      label: 'Root Cause Engine',
      role: 'Physics FMEA via Gemma',
      state: 'idle',
      iconType: 'root_cause',
      outputSnippet: ''
    }
  },
  {
    id: 'node-critic',
    type: 'glassAgent',
    position: { x: 1200, y: 150 },
    data: {
      label: 'Critic Debate',
      role: 'Adversarial Verification',
      state: 'idle',
      iconType: 'critic',
      outputSnippet: ''
    }
  },
  {
    id: 'node-verdict',
    type: 'glassAgent',
    position: { x: 1500, y: 150 },
    data: {
      label: 'Final Verdict & SOP',
      role: 'Audit Dossier & Action Plan',
      state: 'idle',
      iconType: 'verdict',
      isTarget: true,
      outputSnippet: ''
    }
  }
];

const INITIAL_PIPELINE_EDGES = [
  { id: 'e-prompt-triage', source: 'node-prompt', target: 'node-triage', type: 'energizedWire', data: { state: 'idle' } },
  { id: 'e-triage-rag', source: 'node-triage', target: 'node-rag', type: 'energizedWire', data: { state: 'idle' } },
  { id: 'e-triage-domain', source: 'node-triage', target: 'node-domain', type: 'energizedWire', data: { state: 'idle' } },
  { id: 'e-rag-root-cause', source: 'node-rag', target: 'node-root-cause', type: 'energizedWire', data: { state: 'idle' } },
  { id: 'e-domain-root-cause', source: 'node-domain', target: 'node-root-cause', type: 'energizedWire', data: { state: 'idle' } },
  { id: 'e-root-cause-critic', source: 'node-root-cause', target: 'node-critic', type: 'energizedWire', data: { state: 'idle' } },
  { id: 'e-critic-verdict', source: 'node-critic', target: 'node-verdict', type: 'energizedWire', data: { state: 'idle' } }
];

function PipelineVisualizerInner({
  onSelectNode,
  selectedNode,
  activeScenarioId = 'SCENARIO-01-THERMAL-OVERHEAT'
}) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [promptInput, setPromptInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCircuitComplete, setIsCircuitComplete] = useState(false);
  const audioContextRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Play subtle futuristic audio cues via Web Audio API
  const playSound = useCallback((type) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'tick') {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'complete') {
        // Futuristic warm chord chime
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const chimeOsc = ctx.createOscillator();
          const chimeGain = ctx.createGain();
          chimeOsc.connect(chimeGain);
          chimeGain.connect(ctx.destination);
          chimeOsc.frequency.setValueAtTime(freq, now + i * 0.06);
          chimeGain.gain.setValueAtTime(0.05, now + i * 0.06);
          chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          chimeOsc.start(now + i * 0.06);
          chimeOsc.stop(now + 0.6);
        });
      }
    } catch (e) {}
  }, [soundEnabled]);

  // Initialize auto-layout on mount
  useEffect(() => {
    const layouted = getLayoutedElements(INITIAL_PIPELINE_NODES, INITIAL_PIPELINE_EDGES);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 100);
  }, [fitView, setNodes, setEdges]);

  // Update specific node state helper
  const updateNodeData = useCallback((nodeId, updates) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Update specific edge state helper
  const updateEdgeData = useCallback((edgeId, updates) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            data: {
              ...edge.data,
              ...updates
            }
          };
        }
        return edge;
      })
    );
  }, [setEdges]);

  // Execute full organic multi-agent pipeline simulation
  const runLivePipeline = async (customPrompt = null) => {
    if (isRunning) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsRunning(true);
    setIsCircuitComplete(false);

    const query = customPrompt || promptInput.trim() || 'Diagnose Joint 3 thermal runaway and vibration anomaly.';
    setPromptInput('');

    // Reset all nodes to idle
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          state: n.id === 'node-prompt' ? 'done' : 'idle',
          outputSnippet: n.id === 'node-prompt' ? query : '',
          fullReasoning: '',
          latency: null,
          tokens: null
        }
      }))
    );
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        data: { state: 'idle', isCircuitFlash: false }
      }))
    );

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms / speedMultiplier));

    try {
      // Step 1: Root Prompt Node Activates
      playSound('tick');
      updateNodeData('node-prompt', { state: 'done', outputSnippet: query });
      updateEdgeData('e-prompt-triage', { state: 'active' });
      await sleep(400);

      // Step 2: Triage Agent Starts
      playSound('tick');
      updateNodeData('node-triage', {
        state: 'active',
        inputPrompt: query,
        outputSnippet: 'Ingesting 1000Hz EtherCAT sensor bus...'
      });
      await sleep(500);

      updateNodeData('node-triage', { state: 'streaming' });
      await sleep(600);

      updateNodeData('node-triage', {
        state: 'done',
        latency: 184,
        tokens: 312,
        outputSnippet: 'Critical Thermal runaway detected on Joint 3 (82.4°C vs 65.0°C ISO limit).',
        fullReasoning: 'Triage assessment identified critical thermal elevation on Axis 3. Containment protocol: throttle arm velocity by 50%.'
      });

      // Step 3: PARALLEL 1-TO-MANY FAN-OUT (Knowledge RAG + Domain Analyst)
      playSound('tick');
      updateEdgeData('e-triage-rag', { state: 'active' });
      await sleep(80);
      updateEdgeData('e-triage-domain', { state: 'active' });

      updateNodeData('node-rag', {
        state: 'active',
        inputPrompt: 'Retrieve ISO-10218 limits & Harmonic Drive CSG lubrication manuals.',
        outputSnippet: 'Querying vector database...'
      });
      updateNodeData('node-domain', {
        state: 'active',
        inputPrompt: 'Inspect 3X harmonic FFT vibration spectrum & bus voltage ripple.',
        outputSnippet: 'Decomposing 73.5 Hz FFT harmonic...'
      });
      await sleep(600);

      updateNodeData('node-rag', { state: 'streaming' });
      updateNodeData('node-domain', { state: 'streaming' });
      await sleep(700);

      updateNodeData('node-rag', {
        state: 'done',
        latency: 240,
        tokens: 420,
        outputSnippet: 'Indexed 3 golden engineering SOPs: Harmonic Drive grease viscosity curves.',
        fullReasoning: 'Retrieved KUKA KR C4 maintenance manuals and Mobilgrease 28 shear degradation models.'
      });
      updateNodeData('node-domain', {
        state: 'done',
        latency: 210,
        tokens: 380,
        outputSnippet: '3X Harmonic (73.5 Hz) elevated to 0.38g. Electrical torque ripple nominal (<1.2%).',
        fullReasoning: 'Vibration spectrum confirms bearing outer race frequency alignment. Ruled out stator inverter fault.'
      });

      // Step 4: Converge into Root Cause Engine
      playSound('tick');
      updateEdgeData('e-rag-root-cause', { state: 'active' });
      updateEdgeData('e-domain-root-cause', { state: 'active' });
      await sleep(400);

      updateNodeData('node-root-cause', {
        state: 'active',
        inputPrompt: 'Synthesize thermal breach + FFT 3X peak into physics-grounded hypotheses.',
        outputSnippet: 'Formulating FMEA causal chains via Gemma...'
      });
      await sleep(600);

      updateNodeData('node-root-cause', { state: 'streaming' });
      await sleep(800);

      updateNodeData('node-root-cause', {
        state: 'done',
        latency: 480,
        tokens: 890,
        confidence: 98.5,
        outputSnippet: 'Primary Cause: Harmonic Drive Flexspline Lubricant Breakdown.',
        fullReasoning: 'High-temperature thermal runaway accompanied by 3X harmonic vibration is consistent with grease shear breakdown and metal-on-metal micro-galling.'
      });

      // Step 5: Adversarial Critic Debate
      playSound('tick');
      updateEdgeData('e-root-cause-critic', { state: 'active' });
      await sleep(400);

      updateNodeData('node-critic', {
        state: 'active',
        inputPrompt: 'Adversarial challenge: Verify electrical short vs lubrication breakdown.',
        outputSnippet: 'Cross-examining voltage bus ripple...'
      });
      await sleep(600);

      updateNodeData('node-critic', { state: 'streaming' });
      await sleep(700);

      updateNodeData('node-critic', {
        state: 'done',
        latency: 310,
        tokens: 520,
        outputSnippet: 'Falsified electrical stator short hypothesis. Mechanical wear corroborated.',
        fullReasoning: 'No voltage ripple observed on CAN bus telemetry. Dual thermal-vibration coupling provides conclusive empirical proof.'
      });

      // Step 6: Final Verdict & Action Plan
      playSound('tick');
      updateEdgeData('e-critic-verdict', { state: 'active' });
      await sleep(400);

      updateNodeData('node-verdict', {
        state: 'active',
        outputSnippet: 'Compiling structured audit report...'
      });
      await sleep(500);

      updateNodeData('node-verdict', {
        state: 'done',
        latency: 190,
        tokens: 610,
        confidence: 98.5,
        outputSnippet: 'CONCLUSIVE AUDIT: Joint 3 Harmonic Drive Lubricant Breakdown. Purge & re-grease.',
        fullReasoning: 'Actionable Mitigation: Dispatch mechanical technician to purge Axis 3 gear cavity and re-lubricate with Mobilgrease 28.'
      });

      // Step 7: CIRCUIT COMPLETE PULSE (travels through entire graph)
      setIsCircuitComplete(true);
      playSound('complete');
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: { ...e.data, isCircuitFlash: true, state: 'done' }
        }))
      );

      await sleep(1200);
      setIsCircuitComplete(false);

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Pipeline simulation error:', err);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleNodeClick = (_, node) => {
    if (onSelectNode) onSelectNode(node);
  };

  const handleAutoFit = () => {
    fitView({ padding: 0.18, duration: 500 });
  };

  const handleReset = () => {
    const layouted = getLayoutedElements(INITIAL_PIPELINE_NODES, INITIAL_PIPELINE_EDGES);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setIsRunning(false);
    setIsCircuitComplete(false);
    if (onSelectNode) onSelectNode(null);
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  };

  return (
    <div className="relative w-full h-full bg-[#fcfaf8] overflow-hidden flex flex-col select-none">
      
      {/* Ambient Moving Wave Gradient & Subtle Terracotta Grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,#fceee4,transparent)] opacity-75" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_90%,#fae7d9,transparent)] opacity-60" />
      </div>

      {/* Top Floating Command Bar (Signature Theme Frosted Glass with 8-12px corners) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Branding & Status Badge */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/95 backdrop-blur-md border border-[#ecd7c7] text-xs font-mono text-slate-800 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#d98555] animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-bold text-[#c8764b]">LIVE PIPELINE</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">{isRunning ? 'DELIBERATING' : 'READY'}</span>
          </div>

          {/* Preset Scenario Quick Trigger Chips */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => runLivePipeline('Diagnose Joint 3 thermal runaway and vibration anomaly.')}
              disabled={isRunning}
              className="px-2.5 py-1 rounded-[6px] bg-white/90 hover:bg-[#faeee5] border border-[#f0dfd3] hover:border-[#d98555] text-slate-700 hover:text-[#c8764b] text-[10.5px] font-mono transition cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
            >
              <Flame className="w-3 h-3 text-amber-500" />
              <span>Thermal Overheat</span>
            </button>

            <button
              onClick={() => runLivePipeline('Inspect pneumatic clamp pressure drop on end-effector.')}
              disabled={isRunning}
              className="px-2.5 py-1 rounded-[6px] bg-white/90 hover:bg-[#faeee5] border border-[#f0dfd3] hover:border-[#d98555] text-slate-700 hover:text-[#c8764b] text-[10.5px] font-mono transition cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
            >
              <Radio className="w-3 h-3 text-[#d98555]" />
              <span>Pneumatic Drop</span>
            </button>

            <button
              onClick={() => runLivePipeline('Verify motor bus voltage surge and electrical stator harmonics.')}
              disabled={isRunning}
              className="px-2.5 py-1 rounded-[6px] bg-white/90 hover:bg-[#faeee5] border border-[#f0dfd3] hover:border-[#d98555] text-slate-700 hover:text-[#c8764b] text-[10.5px] font-mono transition cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Voltage Ripple</span>
            </button>
          </div>
        </div>

        {/* Right: Controls & Speed Toggles */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md border border-[#ecd7c7] p-1 rounded-[8px] shadow-2xs">
          {/* Speed Selector */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-[6px]">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold transition cursor-pointer ${
                  speedMultiplier === s ? 'bg-[#d98555] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Disable audio cues' : 'Enable audio cues'}
            className="p-1.5 rounded-[6px] text-slate-500 hover:text-[#c8764b] hover:bg-[#faeee5] transition cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#d98555]" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Auto Fit */}
          <button
            onClick={handleAutoFit}
            title="Auto-Fit Camera"
            className="p-1.5 rounded-[6px] text-slate-500 hover:text-[#c8764b] hover:bg-[#faeee5] transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            title="Reset Pipeline Graph"
            className="p-1.5 rounded-[6px] text-slate-500 hover:text-[#c8764b] hover:bg-[#faeee5] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Main React Flow Graph Canvas */}
      <div className="flex-1 w-full h-full relative z-10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={handleNodeClick}
          fitView
          minZoom={0.3}
          maxZoom={2.2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
          proOptions={{ hideAttribution: true }}
          className="theme-pipeline-flow"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.2}
            color="rgba(217, 133, 85, 0.22)"
            className="bg-[#fcfaf8]"
          />
          <Controls position="bottom-left" showInteractive={false} />
          <MiniMap
            position="bottom-right"
            nodeColor={(n) => {
              if (n.data?.state === 'active') return '#d98555';
              if (n.data?.state === 'streaming') return '#c8764b';
              if (n.data?.state === 'done') return '#10b981';
              return '#cbd5e1';
            }}
            maskColor="rgba(253, 251, 249, 0.75)"
            className="!bg-white !border !border-[#ecd7c7] !rounded-[8px] !shadow-2xs"
          />
        </ReactFlow>
      </div>

      {/* Bottom Interactive Prompt Launch Bar (Frosted Glass Capsule) */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:left-1/2 sm:-translate-x-1/2 sm:w-[580px] z-20 pointer-events-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runLivePipeline();
          }}
          className="flex items-center gap-2 p-1.5 bg-white/95 backdrop-blur-xl rounded-[12px] border border-white/80 shadow-[0_8px_30px_rgba(217,133,85,0.16)]"
        >
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-tr from-[#d98555] to-[#c8764b] flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Type custom inquiry (e.g. Inspect Joint 3 thermal runaway)..."
            disabled={isRunning}
            className="flex-1 bg-transparent text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none px-1"
          />

          <button
            type="submit"
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-[8px] bg-gradient-to-r from-[#d98555] to-[#c8764b] hover:from-[#c8764b] hover:to-[#b7653b] text-white font-mono text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Pipeline</span>
          </button>
        </form>
      </div>

    </div>
  );
}

export default function LivePipelineVisualizer(props) {
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="w-full h-full flex overflow-hidden rounded-[10px] sm:rounded-[12px] bg-white/95 backdrop-blur-md border border-white/80 shadow-xs relative">
      <ReactFlowProvider>
        <PipelineVisualizerInner
          {...props}
          onSelectNode={setSelectedNode}
          selectedNode={selectedNode}
        />
      </ReactFlowProvider>

      {/* Flyout Node Inspector Drawer */}
      {selectedNode && (
        <NodeInspectorDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
