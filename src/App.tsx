import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './router/AppRoutes';
import { ErrorBoundary } from './components/reliability/ErrorBoundary';
import { mountToastContainer } from './lib/reliability/toast';

mountToastContainer();

function App() {
  return (
    <ErrorBoundary pageName="AppRoot">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
