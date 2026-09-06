import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom React hook for consuming POST-based Server-Sent Events (SSE)
 * from /api/v1/scenarios/{scenario_id}/stream or /harness/investigate/stream.
 * 
 * Uses browser-native fetch() + ReadableStream + TextDecoder with AbortController cancellation.
 */
export function useInvestigationStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentTraces, setAgentTraces] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [finalVerdict, setFinalVerdict] = useState(null);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Cleanup abort controller on component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startStream = useCallback(async (scenarioIdOrSnapshot, incidentId = null) => {
    // Abort any previously running stream
    abortStream();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setError(null);
    setAgentTraces([]);
    setActiveAgent(null);
    setFinalVerdict(null);

    try {
      let url;
      let options;

      if (typeof scenarioIdOrSnapshot === 'string') {
        url = `/api/v1/scenarios/${encodeURIComponent(scenarioIdOrSnapshot)}/stream`;
        options = {
          method: 'POST',
          headers: {
            'Accept': 'text/event-stream'
          },
          signal: controller.signal
        };
      } else {
        const queryParam = incidentId ? `?incident_id=${encodeURIComponent(incidentId)}` : '';
        url = `/harness/investigate/stream${queryParam}`;
        options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify(scenarioIdOrSnapshot),
          signal: controller.signal
        };
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`SSE stream connection failed (${response.status}): ${errText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream is not supported or response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split buffer by double newline (SSE event block boundary)
        const eventBlocks = buffer.split(/\r?\n\r?\n/);
        // Retain remaining incomplete block in buffer
        buffer = eventBlocks.pop() || '';

        for (const block of eventBlocks) {
          if (!block.trim()) continue;

          let eventName = 'message';
          let dataLines = [];

          const lines = block.split(/\r?\n/);
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trim());
            }
          }

          const rawData = dataLines.join('\n');

          if (eventName === 'complete') {
            setIsStreaming(false);
            setActiveAgent(null);
          } else if (eventName === 'error') {
            let parsedErr = 'Stream processing error';
            try {
              const errObj = JSON.parse(rawData);
              parsedErr = errObj.error || parsedErr;
            } catch {
              parsedErr = rawData || parsedErr;
            }
            setError(parsedErr);
            setIsStreaming(false);
            setActiveAgent(null);
          } else if (rawData) {
            try {
              const eventObj = JSON.parse(rawData);

              setAgentTraces((prevTraces) => {
                const normalized = {
                  agent: eventObj.agent || 'UNKNOWN',
                  step: eventObj.step || 'TRACE',
                  message: eventObj.message || null,
                  payload: eventObj.payload || eventObj.verdict || null,
                  verdict: eventObj.verdict || null,
                  created_at: new Date().toISOString()
                };
                return [...prevTraces, normalized];
              });

              if (eventObj.step === 'STARTED' && eventObj.agent) {
                setActiveAgent(eventObj.agent);
              }

              if (eventObj.step === 'FINAL_VERDICT' && eventObj.verdict) {
                setFinalVerdict(eventObj.verdict);
              }
            } catch (jsonErr) {
              console.warn('Malformed JSON in SSE data line:', rawData, jsonErr);
            }
          }
        }
      }

      setIsStreaming(false);
      setActiveAgent(null);

    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Error reading investigation SSE stream:', err);
      setError(err.message || 'Investigation streaming failed');
      setIsStreaming(false);
      setActiveAgent(null);
    } finally {
      abortControllerRef.current = null;
    }
  }, [abortStream]);

  return {
    isStreaming,
    agentTraces,
    activeAgent,
    finalVerdict,
    error,
    startStream,
    abortStream
  };
}
