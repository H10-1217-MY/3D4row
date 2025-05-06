// src/App.tsx
import { useState } from 'react';
import './App.css';
import { cpuMove } from './cpuAI';
import { useEffect } from 'react';
type Board = number[][][]; // board[z][y][x]

const EMPTY = 0;
const PLAYER1 = 1;
const PLAYER2 = 2;


function checkWin(board: Board, lastX: number, lastY: number, lastZ: number, player: number): boolean {
  const directions = [
    [1, 0, 0], [0, 1, 0], [0, 0, 1],
    [1, 1, 0], [1, -1, 0],
    [1, 0, 1], [1, 0, -1],
    [0, 1, 1], [0, 1, -1],
    [1, 1, 1], [1, -1, 1],
    [1, 1, -1], [1, -1, -1]
  ];

  for (const [dx, dy, dz] of directions) {
    let count = 1;

    // 正方向に伸ばす
    for (let step = 1; step < 4; step++) {
      const nx = lastX + dx * step;
      const ny = lastY + dy * step;
      const nz = lastZ + dz * step;
      if (0 <= nx && nx < 4 && 0 <= ny && ny < 4 && 0 <= nz && nz < 4) {
        if (board[nz][ny][nx] === player) {
          count++;
        } else {
          break;
        }
      }
    }

    // 逆方向にも伸ばす
    for (let step = 1; step < 4; step++) {
      const nx = lastX - dx * step;
      const ny = lastY - dy * step;
      const nz = lastZ - dz * step;
      if (0 <= nx && nx < 4 && 0 <= ny && ny < 4 && 0 <= nz && nz < 4) {
        if (board[nz][ny][nx] === player) {
          count++;
        } else {
          break;
        }
      }
    }

    if (count >= 4) {
      return true;
    }
  }

  return false;
}
function App() {
  const initialBoard: Board = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => Array(4).fill(EMPTY))
  );

  const [board, setBoard] = useState<Board>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<number>(PLAYER1);
  //リセット機能
  const resetGame = () => {
    const emptyBoard: Board = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => Array(4).fill(EMPTY))
    );
    setBoard(emptyBoard);
    setCurrentPlayer(PLAYER1);
  };
  //CPUターン監視
  useEffect(() => {
  if (currentPlayer === PLAYER2) {
    const [x, y] = cpuMove(board);
    setTimeout(() => {
      placePiece(x, y);
    }, 500); // 少し間を置いて自然に
  }
}, [currentPlayer]);
  const placePiece = (x: number, y: number) => {
    // 下から順にチェック（Z=0→Z=3）
    for (let z = 0; z < 4; z++) {
      if (board[z][y][x] === EMPTY) {
        const newBoard = board.map(layer =>
          layer.map(row => [...row])
        );
        newBoard[z][y][x] = currentPlayer;
        setBoard(newBoard);
        if (checkWin(newBoard, x, y, z, currentPlayer)) {
          alert(`🎉 プレイヤー${currentPlayer}の勝ちや！`);
          // 勝ったので操作を止める（ページリロードしてもいいし、リセットボタン作るのもアリ）
          return;
        }
        setCurrentPlayer(currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1);
        return;
      }
    }
    alert("そこはもう埋まってるで！");
  };

  return (
    
    <div style={{ padding: '1rem' }}>
      <button onClick={resetGame} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
  🔄 リセット
</button>
      <h2>3D 4目並べ - React版</h2>
      <p>現在のプレイヤー: {currentPlayer === 1 ? "🔴（先手）" : "🔵（後手）"}</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {board.map((layer, z) => (
          <div key={z}>
            <h4>Z = {z}</h4>
            {layer.map((row, y) => (
              <div key={y} style={{ display: 'flex' }}>
                {row.map((cell, x) => (
                  <div
                    key={x}
                    onClick={() => placePiece(x, y)}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid #999',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      backgroundColor:
                        cell === PLAYER1 ? '#f88' :
                        cell === PLAYER2 ? '#88f' :
                        '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {cell !== 0 ? cell : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
