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
                        <Link to="/geoguessr/game" id="easy" className="column">Easy</Link>
                        <Link to="/geoguessr/game" id="medium" className="column">Medium</Link>
                        <Link to="/geoguessr/game" id="hard" className="column">Hard</Link>
                    </div>
                </div>
                <h1 id="page-title" >
                    GEOGUESSR
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
