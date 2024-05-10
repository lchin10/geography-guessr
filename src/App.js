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
                <Route exact path="/geoguessr" element={<HomePage />} />
                <Route path="/geoguessr/game" element={<GamePage />} />
                <Route path="/geoguessr/result" element={<SubmitPage />} />
            </Routes>
        </Router>
    );
}

export default App;
