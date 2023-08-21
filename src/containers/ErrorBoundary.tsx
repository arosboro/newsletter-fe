import React, { Component } from 'react';

/**
 * Props definition for the `ErrorBoundary` component.
 */
interface Props {
  /** Children components that the error boundary watches over. */
  children: React.ReactNode;
}

/**
 * State definition for the `ErrorBoundary` component.
 */
interface State {
  /** Indicator if an error has been caught by the boundary. */
  hasError: boolean;
}

/**
 * `ErrorBoundary` is a higher-order component that captures JavaScript errors anywhere
 * in their child component tree, logs those errors, and displays a fallback UI.
 *
 * This component is useful for ensuring that the entire application does not crash
 * due to unhandled errors.
 */
class ErrorBoundary extends Component<Props, State> {
  /**
   * Creates a new instance of the ErrorBoundary component.
   *
   * @param props - Props passed to the component.
   */
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Catches errors that occur in the child components and updates the component state.
   *
   * @param error - The thrown error.
   * @param info - Additional information about what caused the error.
   */
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, info);
    this.setState({ hasError: true });
  }

  /**
   * Renders the fallback UI in case of an error or the child components if everything is fine.
   */
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
