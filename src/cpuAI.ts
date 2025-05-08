export type Board = number[][][];
// ある手が「危険（次で相手が勝てる）」かチェック
function isDangerousMove(board: number[][][], x: number, y: number, player: number): boolean {
  for (let z = 0; z < 4; z++) {
    if (board[z][y][x] === 0) {
      const copy = board.map(layer => layer.map(row => [...row]));
      copy[z][y][x] = player;

      const opponent = player === 1 ? 2 : 1;
      const threats = findAllThreats(copy, opponent, 3); // 相手が勝てる手を全部取る

      return threats.length > 0; // 勝てる手が1つでもあるなら危険
    }
  }
  return false;
}

//下が無ければ埋まらないからNG
function isPlaceable(board: Board, x: number, y: number, z: number): boolean {
  for (let checkZ = 0; checkZ < z; checkZ++) {
    if (board[checkZ][y][x] === 0) return false;
  }
  return board[z][y][x] === 0;
}

function findAllThreats(board: Board, targetPlayer: number, requiredCount = 2): [number, number][] {
  const directions = [
    [1, 0, 0], [0, 1, 0], [0, 0, 1],
    [1, 1, 0], [1, -1, 0],
    [1, 0, 1], [1, 0, -1],
    [0, 1, 1], [0, 1, -1],
    [1, 1, 1], [1, -1, 1],
    [1, 1, -1], [1, -1, -1]
  ];

  const threats: [number, number][] = [];

  for (let z = 0; z < 4; z++) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        for (const [dx, dy, dz] of directions) {
          const positions: [number, number, number][] = [];
          let count = 0;

          for (let i = 0; i < 4; i++) {
            const nx = x + dx * i;
            const ny = y + dy * i;
            const nz = z + dz * i;
            if (0 <= nx && nx < 4 && 0 <= ny && ny < 4 && 0 <= nz && nz < 4) {
              const val = board[nz][ny][nx];
              if (val === targetPlayer) {
                count++;
              } else if (val === 0) {
                positions.push([nx, ny, nz]);
              } else {
                break;
              }
            } else {
              break;
            }
          }

          if (count === requiredCount && positions.length === 4 - requiredCount) {
            const [px, py, pz] = positions[0];
            if (isPlaceable(board, px, py, pz)) {
              threats.push([px, py]);
            }
          }
        }
      }
    }
  }

  return threats;
}



function detectWinPatternPlane(
  board: number[][][], 
  player: number, 
  fixedAxis: 'x' | 'y'
): [number, number] | null {
  // 共通の「相手に作らせたくないパターン」定義
  // X-Z: [x, z], Y-Z: [y, z]
  const patterns: [number, number][][] = [
    [[0, 0], [1, 1], [1, 2], [2, 1], [2, 2]],
    [[3, 0], [2, 1], [2, 2], [1, 2], [3, 2]],
    [[0, 0], [1, 1], [1, 2], [2, 1], [2, 2], [3, 0]],
  ];

  // 固定軸に応じて 0〜3 をループ
  for (let fixed = 0; fixed < 4; fixed++) {
    for (const pattern of patterns) {
      let matchCount = 0;
      let candidate: [number, number] | null = null;

      for (const [v, z] of pattern) {
        const x = fixedAxis === 'x' ? fixed : v;
        const y = fixedAxis === 'y' ? fixed : v;
        const cell = board[z][y][x];

        if (cell === player) {
          matchCount++;
        } else if (cell === 0 && !candidate) {
          candidate = [x, y]; // 空きマスを候補に
        } else if (cell !== 0 && cell !== player) {
          matchCount = -99; // 相手の駒 → 無効化
          break;
        }
      }

      if (matchCount >= pattern.length - 1 && candidate) {
        return candidate;
      }
    }
  }

  return null;
}


export function cpuMove(board: Board): [number, number] {
  // ① 勝ちを優先
  const winPos = findAllThreats(board, 2, 3);
  for (const [x, y] of winPos) {
    return [x, y]; // 最初の勝ち手を採用
  }

  // ② 相手のリーチを防ぐ
  const blockPos = findAllThreats(board, 1, 3);
  for (const [x, y] of blockPos) {
    return [x, y]; // 最初の勝ち手を採用
  }

  // ③ 必勝形を防ぐ ← ← ここに追加！
  const pattern_blockx = detectWinPatternPlane(board, 1, 'y');
  const pattern_blocky = detectWinPatternPlane(board, 1, 'x');
  if (pattern_blockx) return pattern_blockx;
  if (pattern_blocky) return pattern_blocky;
  // ③ 四隅優先（Z=0）
  const corners: [number, number][] = [[0, 0], [0, 3], [3, 0], [3, 3]];
  for (const [x, y] of corners) {
    if (board[0][y][x] === 0) return [x, y];
  }

 // ④ 中央優先（Z=1,2）と Z=2,3 の優先ポイントを統合
const prioritizedZones: [number, number, number][] = [
  [1, 1, 1], [1, 2, 1], [2, 1, 1], [2, 2, 1], // Z=1 の中央
  [1, 1, 2], [1, 2, 2], [2, 1, 2], [2, 2, 2], // Z=2 の中央
  [0, 1, 2], [0, 2, 2], [1, 0, 2], [1, 3, 2], // Z=2の外周
  [2, 0, 2], [2, 3, 2], [3, 1, 2], [3, 2, 2], // Z=2の外周
];

for (const [x, y, z] of prioritizedZones) {
  if (board[z][y][x] === 0 && !isDangerousMove(board, x, y, 2)) {
    return [x, y];
  }
}

    // ⑤ 他に優先度が高そうなｚ軸が4行角5つの上がりにつながるものが多い。終盤しか置けないため優先度は低いが気にしておいても良いと思うところ
    const Z4counerdemension: [number, number][] = [[0, 0], [0, 3], [3, 0], [3, 3]];
    for (const z of [3]) {
      for (const [x, y] of Z4counerdemension) {
        if (board[z][y][x] === 0 && !isDangerousMove(board, x, y, 2)) {
          return [x, y];
        }
      }
    }
  // ⑤ リーチ作成（自駒2つ）
  const reachCandidates = findAllThreats(board, 2, 2);
  for (const [x, y] of reachCandidates) {
  if (!isDangerousMove(board, x, y, 2)) {
    return [x, y];  // 安全なリーチ作成手が見つかったら採用
  }
}


  // ⑥ リーチ阻害（敵2つ）
  const blockCandidates = findAllThreats(board, 1, 2);
  for (const [x, y] of blockCandidates) {
  if (!isDangerousMove(board, x, y, 2)) {
    return [x, y];  // 安全なリーチ阻止手
  }
}


  
  // ⑦ ランダム（Z=3に空きがあるところ）
  for (let tries = 0; tries < 100; tries++) {
  const x = Math.floor(Math.random() * 4);
  const y = Math.floor(Math.random() * 4);

  if (board[3][y][x] === 0 && !isDangerousMove(board, x, y,2)) {
    return [x, y];
  }
}

// どうしても見つからない場合は妥協して置く
while (true) {
  const x = Math.floor(Math.random() * 4);
  const y = Math.floor(Math.random() * 4);
  if (board[3][y][x] === 0) return [x, y];
}
}
