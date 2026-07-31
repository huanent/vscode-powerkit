import { CryptoPanel } from './components/CryptoPanel';
import { GeneratorsPanel } from './components/GeneratorsPanel';
import { NetworkPanel } from './components/NetworkPanel';

export default function App() {
	switch (document.body.dataset.view) {
		case 'generators':
			return <GeneratorsPanel />;
		case 'crypto':
			return <CryptoPanel />;
		default:
			return <NetworkPanel />;
	}
}