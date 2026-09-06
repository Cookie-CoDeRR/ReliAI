import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * React Error Boundary — prevents the entire app from going blank
 * when a single component throws a render error.
 * Shows a diagnostic card with the error message and a retry button.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#e2e8f0',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '12px',
          margin: '2rem',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}>
          <AlertTriangle size={48} color="#ef4444" strokeWidth={1.5} />
          <h2 style={{ margin: '1rem 0 0.5rem', fontSize: '1.25rem', color: '#f87171' }}>
            Component Render Error
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', maxWidth: '500px' }}>
            {this.state.error?.message || 'An unexpected error occurred in a UI component.'}
          </p>
          {this.state.errorInfo && (
            <details style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              fontSize: '0.7rem',
              color: '#64748b',
              maxWidth: '600px',
              maxHeight: '200px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              border: '1px solid rgba(100,116,139,0.2)',
            }}>
              <summary style={{ cursor: 'pointer', color: '#94a3b8' }}>Stack Trace</summary>
              {this.state.errorInfo.componentStack}
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
