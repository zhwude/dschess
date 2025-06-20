// 游戏状态
const gameState = {
    board: Array(15).fill().map(() => Array(15).fill(0)), // 15x15棋盘
    currentPlayer: 1, // 1为黑棋，2为白棋
    gameOver: false,
    playerRole: null, // 1或2，表示当前玩家的角色
    roomId: null,
    ws: null
};

// 初始化游戏
function initGame() {
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const cellSize = canvas.width / 15;
    
    // 绘制棋盘
    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        for (let i = 0; i < 15; i++) {
            // 横线
            ctx.beginPath();
            ctx.moveTo(cellSize / 2, i * cellSize + cellSize / 2);
            ctx.lineTo(canvas.width - cellSize / 2, i * cellSize + cellSize / 2);
            ctx.stroke();
            
            // 竖线
            ctx.beginPath();
            ctx.moveTo(i * cellSize + cellSize / 2, cellSize / 2);
            ctx.lineTo(i * cellSize + cellSize / 2, canvas.height - cellSize / 2);
            ctx.stroke();
        }
        
        // 绘制棋子
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (gameState.board[i][j] === 1) {
                    drawPiece(ctx, j, i, 'black');
                } else if (gameState.board[i][j] === 2) {
                    drawPiece(ctx, j, i, 'white');
                }
            }
        }
    }
    
    // 绘制棋子
    function drawPiece(ctx, x, y, color) {
        ctx.beginPath();
        ctx.arc(
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2,
            cellSize / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.stroke();
    }
    
    // 检查胜负
    function checkWin(x, y) {
        const directions = [
            [1, 0], [0, 1], [1, 1], [1, -1] // 水平、垂直、对角线
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正向检查
            for (let i = 1; i < 5; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && 
                    gameState.board[ny][nx] === gameState.currentPlayer) {
                    count++;
                } else {
                    break;
                }
            }
            
            // 反向检查
            for (let i = 1; i < 5; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && 
                    gameState.board[ny][nx] === gameState.currentPlayer) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    // 处理点击事件
    canvas.addEventListener('click', (e) => {
        if (gameState.gameOver || gameState.playerRole !== gameState.currentPlayer || !gameState.ws) {
            return;
        }
        
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);
        
        if (x >= 0 && x < 15 && y >= 0 && y < 15 && gameState.board[y][x] === 0) {
            // 发送移动消息
            gameState.ws.send(JSON.stringify({
                type: 'move',
                x,
                y,
                player: gameState.playerRole
            }));
        }
    });
    
    // 初始化WebSocket连接
    function initWebSocket() {
        const urlParams = new URLSearchParams(window.location.search);
        gameState.roomId = urlParams.get('room') || generateRoomId();
        
        // 使用WebSocket模拟器，实际项目中应替换为真实WebSocket服务器
        gameState.ws = {
            send: function(data) {
                console.log('WebSocket message sent:', data);
                setTimeout(() => {
                    const msg = JSON.parse(data);
                    if (msg.type === 'move') {
                        handleMove(msg.x, msg.y, msg.player);
                    } else if (msg.type === 'join') {
                        handleJoin(msg.roomId, msg.player);
                    }
                }, 300);
            }
        };
        
        // 模拟加入房间
        setTimeout(() => {
            handleJoin(gameState.roomId, Math.random() > 0.5 ? 1 : 2);
        }, 500);
    }
    
    // 生成随机房间ID
    function generateRoomId() {
        return Math.random().toString(36).substring(2, 8);
    }
    
    // 处理移动
    function handleMove(x, y, player) {
        if (gameState.board[y][x] !== 0 || gameState.gameOver) {
            return;
        }
        
        gameState.board[y][x] = player;
        gameState.currentPlayer = player === 1 ? 2 : 1;
        drawBoard();
        
        if (checkWin(x, y)) {
            gameState.gameOver = true;
            document.getElementById('status').textContent = `玩家${player === 1 ? '黑棋' : '白棋'}获胜!`;
        } else {
            updateStatus();
        }
    }
    
    // 处理玩家加入
    function handleJoin(roomId, player) {
        gameState.roomId = roomId;
        gameState.playerRole = player;
        updateStatus();
        
        if (!window.location.search.includes('room=')) {
            const newUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
            window.history.replaceState(null, '', newUrl);
        }
    }
    
    // 更新状态显示
    function updateStatus() {
        let status = '';
        if (gameState.playerRole === gameState.currentPlayer) {
            status = `你的回合 (${gameState.currentPlayer === 1 ? '黑棋' : '白棋'})`;
        } else {
            status = `等待对方玩家 (${gameState.currentPlayer === 1 ? '黑棋' : '白棋'})`;
        }
        document.getElementById('status').textContent = status;
    }
    
    // 分享游戏
    document.getElementById('share-btn').addEventListener('click', () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${gameState.roomId}`;
        alert(`复制以下链接分享给好友:\n\n${shareUrl}`);
    });
    
    // 重新开始
    document.getElementById('restart-btn').addEventListener('click', () => {
        gameState.board = Array(15).fill().map(() => Array(15).fill(0));
        gameState.currentPlayer = 1;
        gameState.gameOver = false;
        drawBoard();
        updateStatus();
    });
    
    // 初始化
    initWebSocket();
    drawBoard();
}

// 启动游戏
window.onload = initGame;