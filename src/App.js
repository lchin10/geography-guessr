import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";
import HomePage from './pages/Home';
import GamePage from './pages/Game';
import SubmitPage from './pages/Submit';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/geography-guessr" element={<HomePage />} />
                <Route path="/geography-guessr/game" element={<GamePage />} />
                <Route path="/geography-guessr/result" element={<SubmitPage />} />
            </Routes>
        </Router>
    );
}

export default App;
