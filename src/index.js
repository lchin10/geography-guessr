import ReactDOM from 'react-dom/client';
// import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// No StrictMode: @react-google-maps/api builds its google.maps objects in
// componentDidMount and never re-attaches them. StrictMode's dev-only remount
// leaves markers bound to a discarded map and races the Street View panorama.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
