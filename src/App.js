import logo from './logo.svg';
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";
import { Link } from 'react-router-dom';
import './App.css';
import GamePage from './pages/Game';

function App() {
    // const navigate = useNavigate();

    // const handleEasyClick = () => {
    //     navigate('/game');
    // };
    return (
        <Router>
            <Routes>
                <Route path="/game" element={<GamePage />} />
            </Routes>
            <div className="App">
                <header className="App-header">
                    <div id="overlay" onClick={overlayOff} >
                        <div>Difficulty:</div>
                        <div id="difficulty-box" >
                            {/* <p>Easy1</p> */}
                            <Link to="/game" id="easy" className="column">Easy2</Link>
                            <Link to="/game" id="medium" className="column">Medium</Link>
                            <Link to="/game" id="hard" className="column">Hard</Link>
                            {/* <p id="medium" className="column" >Medium</p>
                            <p id="hard" className="column" >Hard</p> */}
                        </div>
                    </div>
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 id="page-title" >
                        GEOGUESSR
                    </h1>
                    <button onClick={startButton} id="start-button" >START</button>
                </header>
            </div>
        </Router>
    );
}

function startButton() {
    overlayOn();
}

function overlayOn() {
    document.getElementById("overlay").style.display = "block";
}

function overlayOff() {
    document.getElementById("overlay").style.display = "none";
}

export default App;
