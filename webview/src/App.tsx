import { GeneratorsPanel } from './components/GeneratorsPanel';
import { NetworkPanel } from './components/NetworkPanel';

export default function App() {
	return document.body.dataset.view === 'generators' ? <GeneratorsPanel /> : <NetworkPanel />;
}