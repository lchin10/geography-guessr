import React from 'react';

import Resources from './Resources.js';
import DinoScript from './DinoScript.js';
import DinoStyle from './DinoStyle.js';

import './Dino.css';

class ChromeDinoComponent extends React.Component {
  appendDinoScript() {
    // Only add the large Dino script once to the document to avoid duplicate instances
    if (!document.getElementById('dino-script')) {
      let dinoScriptContainer = document.createElement("script");
      dinoScriptContainer.id = 'dino-script';
      dinoScriptContainer.appendChild(document.createTextNode(DinoScript));
      // append to body so React remounts (StrictMode) won't create duplicates inside React-managed nodes
      document.body.appendChild(dinoScriptContainer);
    }
  }

  appendRunnerScript() {
    // Guard the Runner invocation so it only runs once.
    // Uses a small invoker script that sets a global flag when the Runner is started.
    if (!document.getElementById('dino-runner-invoker')) {
      let runnerScriptContainer = document.createElement("script");
      runnerScriptContainer.id = 'dino-runner-invoker';
      runnerScriptContainer.appendChild(document.createTextNode(`(function(){ if(!window.__dino_started){ window.__dino_started=true; try{ new Runner('.interstitial-wrapper'); }catch(e){ console.warn('Dino: failed to start runner', e); } } })();`));
      this.endDiv.appendChild(runnerScriptContainer);
    }
  }

  componentWillUnmount() {
    // Remove the invoker when the React component unmounts to allow future clean re-mounts
    const invoker = document.getElementById('dino-runner-invoker');
    if (invoker) invoker.remove();
    // Leave the main dino-script in place to avoid reloading large inline script repeatedly.
  }

  componentDidMount() {
    // Clone audio resources into a hidden container on document.body so the injected Runner
    // script can reliably find audio elements (avoid moving React-managed nodes).
    const localAudio = this.startDiv && this.startDiv.querySelector
      ? this.startDiv.querySelector('#audio-resources')
      : document.getElementById('audio-resources');
    if (localAudio) {
      // Create a body-level clone of the audio resources so the injected Runner
      // script can access plain DOM elements (avoid moving React-managed nodes).
      const bodyId = 'audio-resources';
      if (!document.getElementById(bodyId)) {
        const container = document.createElement('div');
        container.id = bodyId;
        container.style.display = 'none';
        // clone markup rather than nodes so React isn't interfered with
        container.innerHTML = localAudio.innerHTML;
        document.body.appendChild(container);
      }
    }

    this.appendDinoScript();
    this.appendRunnerScript();
  }

    render() {
        return (
          <div ref={el => (this.startDiv = el)}>
            <style>{DinoStyle}</style>
            <div id="main-frame-error" className="interstitial-wrapper">
              <Resources />
              <div ref={el => (this.endDiv = el)}>
              </div>
            </div>
          </div>
        );
    }
}

export default ChromeDinoComponent;