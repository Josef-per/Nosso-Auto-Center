import { Component } from 'react';
import ErrorState from './ErrorState';

export default class RouteErrorBoundary extends Component {
  state = { falhou: false };
  static getDerivedStateFromError() { return { falhou: true }; }
  render() {
    return this.state.falhou ? <div className="container route-status"><ErrorState title="Não foi possível abrir esta página" message="Confira sua conexão e recarregue para continuar." onRetry={() => window.location.reload()} /></div> : this.props.children;
  }
}
