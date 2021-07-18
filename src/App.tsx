import React from 'react';
import './App.css';
import Board from './Board'

const App = () => {
  return (
    <div className="App">
      <Board defaultboardsize={9}/>
    </div>
  );
}

export default App;
