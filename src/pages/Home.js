import { Link } from 'react-router-dom';
import React from "react";
import '../styles/Home.css';

const HomePage = () => {
    return (
        <div className="Home">
            <header className="Home-header">
                <div id="overlay" onClick={overlayOff} >
                    <div>Difficulty:</div>
                    <div id="difficulty-box" >
                        <Link to="/geography-guessr/game?difficulty=easy" id="easy" className="column">
                            Easy<br /><small>A city somewhere in the world</small>
                        </Link>
                        <Link to="/geography-guessr/game?difficulty=medium" id="medium" className="column">
                            Medium<br /><small>Anywhere on Earth</small>
                        </Link>
                        <Link to="/geography-guessr/game?difficulty=hard" id="hard" className="column">
                            Hard<br /><small>Anywhere, 5 minute timer</small>
                        </Link>
                    </div>
                </div>
                <h1 id="page-title" >
                    GEOGRAPHY<br></br>
                    GUESSR
                </h1>
                <button onClick={startButton} id="start-button" >START</button>
            </header>
        </div>
    );
};


function startButton() {
    overlayOn();
}

function overlayOn() {
    document.getElementById("overlay").style.display = "block";
}

function overlayOff() {
    document.getElementById("overlay").style.display = "none";
}

export default HomePage;
