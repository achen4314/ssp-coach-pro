import { PropsWithChildren } from 'react';
import './app.scss';

function App({ children }: PropsWithChildren<object>) {
  return children;
}

export default App;
