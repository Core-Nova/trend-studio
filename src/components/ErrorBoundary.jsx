import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error?.message ?? 'unknown',
        fatal: true,
      })
    }
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info)
    }
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary__inner">
          <h1 className="error-boundary__title">Something went wrong</h1>
          <p className="error-boundary__body">
            Please refresh the page or return to the home page. /
            Моля, презаредете страницата или се върнете към началната страница.
          </p>
          <button type="button" className="btn btn-primary" onClick={this.handleReload}>
            Reload
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
