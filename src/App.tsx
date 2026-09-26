import TemplatePage from "./pages/TemplatePage";
import { initApm } from "./util/apm";

initApm();

export default function App() {
	return <TemplatePage />;
}
