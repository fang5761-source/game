// 九九乘法大挑戰 v2
// 功能：倒數條＋圓形倒數、強化結算畫面（獎章）

const TOTAL_QUESTIONS_IN_ROUND = 10;

let correctAnswersInRound = 0;
let currentQuestionIndex = 0;
let correctAnswer = 0;
let isGameActive = false;

// 時間相關
let timerId = null;
let selectedTimeLimit = 2; // 預設 2 秒
const TICK_INTERVAL = 100;
let timeRemaining = selectedTimeLimit;

// DOM
const scoreDisplay = document.getElementById("score-display");
const questionElement = document.getElementById("question");
const buttonsContainer = document.getElementById("answer-buttons");
const feedbackElement = document.getElementById("feedback-message");
const resetButton = document.getElementById("reset-button");
const timerBar = document.getElementById("timer-bar");
const timerCircle = document.getElementById("timer-circle");
const timerNumber = document.getElementById("timer-number");
const timeButtons = document.querySelectorAll(".time-btn");
const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");

// 小工具：音效
function playSound(isCorrect) {
    try {
        if (typeof AudioContext === "undefined" && typeof webkitAudioContext === "undefined") return;

        const Ctx = window.AudioContext || window.webkitAudioContext;
        const context = new Ctx();
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);

        if (isCorrect) {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(600, context.currentTime);
            gain.gain.setValueAtTime(0.4, context.currentTime);
            osc.start();
            osc.stop(context.currentTime + 0.1);
        } else {
            osc.type = "square";
            osc.frequency.setValueAtTime(180, context.currentTime);
            gain.gain.setValueAtTime(0.3, context.currentTime);
            osc.start();
            osc.stop(context.currentTime + 0.2);
        }
    } catch (e) {
        // 手機瀏覽器有時會擋掉，自然略過即可
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 設定時間按鈕
function setTimeLimit(seconds) {
    if (seconds < 1 || seconds > 10) return;
    selectedTimeLimit = seconds;

    timeButtons.forEach(btn => {
        const t = parseInt(btn.getAttribute("data-time"));
        if (t === seconds) {
            btn.className = "time-btn py-0.5 px-2 text-xs font-bold rounded-full transition duration-150 bg-purple-600 text-white shadow-md";
        } else {
            btn.className = "time-btn py-0.5 px-2 text-xs font-bold rounded-full transition duration-150 bg-gray-200 text-gray-800 hover:bg-gray-300";
        }
    });

    // 順便更新圓形倒數上的數字與顏色
    if (timerNumber) {
        timerNumber.textContent = seconds.toString();
    }
    resetTimerVisual();
}

// 重置倒數條與圓形倒數的外觀
function resetTimerVisual() {
    if (timerBar) {
        timerBar.style.width = "100%";
        timerBar.classList.remove("bg-red-500", "bg-yellow-500");
        timerBar.classList.add("bg-green-500");
    }
    if (timerCircle && timerNumber) {
        timerCircle.classList.remove("border-red-500", "border-yellow-400", "border-green-500");
        timerNumber.classList.remove("text-red-600", "text-yellow-500", "text-green-600");
        timerCircle.classList.add("border-green-500");
        timerNumber.classList.add("text-green-600");
    }
}

// 時間到
function timeUp() {
    clearInterval(timerId);
    timerId = null;
    isGameActive = false;

    showCorrectAnswer(null);

    if (feedbackElement) {
        feedbackElement.className = "text-base font-semibold mt-3 text-red-700";
        feedbackElement.textContent = `⏱️ 時間到！本題答案是 ${correctAnswer}。`;
    }

    if (timerNumber && timerCircle) {
        timerNumber.textContent = "0";
        timerCircle.classList.remove("border-green-500", "border-yellow-400");
        timerNumber.classList.remove("text-green-600", "text-yellow-500");
        timerCircle.classList.add("border-red-500");
        timerNumber.classList.add("text-red-600");
    }

    playSound(false);

    setTimeout(handleNextState, 1500);
}

// 啟動倒數
function startTimer() {
    if (timerId) clearInterval(timerId);

    timeRemaining = selectedTimeLimit;
    resetTimerVisual();

    if (timerNumber) {
        timerNumber.textContent = selectedTimeLimit.toString();
    }

    timerId = setInterval(() => {
        timeRemaining -= TICK_INTERVAL / 1000;

        if (timeRemaining <= 0) {
            timeUp();
            return;
        }

        const percentage = (timeRemaining / selectedTimeLimit) * 100;

        if (timerBar) {
            timerBar.style.width = `${percentage}%`;
            if (percentage < 25) {
                timerBar.classList.remove("bg-yellow-500", "bg-green-500");
                timerBar.classList.add("bg-red-500");
            } else if (percentage < 50) {
                timerBar.classList.remove("bg-red-500", "bg-green-500");
                timerBar.classList.add("bg-yellow-500");
            } else {
                timerBar.classList.remove("bg-red-500", "bg-yellow-500");
                timerBar.classList.add("bg-green-500");
            }
        }

        if (timerNumber && timerCircle) {
            const secondsLeft = Math.ceil(timeRemaining);
            timerNumber.textContent = secondsLeft.toString();

            timerCircle.classList.remove("border-red-500", "border-yellow-400", "border-green-500");
            timerNumber.classList.remove("text-red-600", "text-yellow-500", "text-green-600");

            if (percentage < 25) {
                timerCircle.classList.add("border-red-500");
                timerNumber.classList.add("text-red-600");
            } else if (percentage < 50) {
                timerCircle.classList.add("border-yellow-400");
                timerNumber.classList.add("text-yellow-500");
            } else {
                timerCircle.classList.add("border-green-500");
                timerNumber.classList.add("text-green-600");
            }
        }
    }, TICK_INTERVAL);
}

// 顯示正確答案（時間到或答錯用）
function showCorrectAnswer(selectedButton) {
    const buttons = document.querySelectorAll(".answer-button");
    buttons.forEach(btn => {
        btn.disabled = true;
        const value = parseInt(btn.getAttribute("data-answer"));
        if (value === correctAnswer) {
            btn.classList.remove("bg-blue-500", "hover:bg-blue-600");
            btn.classList.add("bg-green-400", "text-gray-800");
        }
        if (selectedButton && btn === selectedButton && value !== correctAnswer) {
            btn.classList.remove("bg-blue-500", "hover:bg-blue-600");
            btn.classList.add("bg-red-500", "text-white");
        }
    });
}

// 按下答案
function checkAnswer(selectedAnswer, buttonElement) {
    if (!isGameActive) return;

    clearInterval(timerId);
    timerId = null;
    isGameActive = false;

    const isCorrect = selectedAnswer === correctAnswer;

    if (isCorrect) {
        correctAnswersInRound++;
        if (feedbackElement) {
            feedbackElement.className = "text-base font-semibold mt-3 text-green-600";
            feedbackElement.textContent = "✅ 答對了！";
        }
        if (buttonElement) {
            buttonElement.className = buttonElement.className
                .replace("bg-blue-500", "bg-green-500")
                .replace("hover:bg-blue-600", "hover:bg-green-500");
        }
        playSound(true);
        setTimeout(handleNextState, 800);
    } else {
        if (feedbackElement) {
            feedbackElement.className = "text-base font-semibold mt-3 text-red-600";
            feedbackElement.textContent = "❌ 答錯了！";
        }
        showCorrectAnswer(buttonElement);
        playSound(false);
        setTimeout(handleNextState, 1500);
    }
}

// 控制下一題或結算
function handleNextState() {
    currentQuestionIndex++;
    if (feedbackElement) feedbackElement.textContent = "";

    if (currentQuestionIndex < TOTAL_QUESTIONS_IN_ROUND) {
        isGameActive = true;
        generateQuestionContent();
    } else {
        endGameSummary();
    }
}

// 結算畫面（有獎章）
function endGameSummary() {
    gameScreen.classList.add("hidden");
    resetButton.classList.remove("hidden");

    const correct = correctAnswersInRound;
    const total = TOTAL_QUESTIONS_IN_ROUND;
    const accuracy = (correct / total) * 100;

    questionElement.textContent = "挑戰結束！";
    buttonsContainer.innerHTML = "";

    let medalIcon = "🎖️";
    let medalTitle = "不錯的開始";
    let medalDesc = "再多玩幾輪，手感會越來越好！";
    let medalColor = "text-yellow-500";

    if (accuracy === 100) {
        medalIcon = "👑";
        medalTitle = "滿分王者";
        medalDesc = "你的速度與準確度都一級棒！";
        medalColor = "text-yellow-500";
    } else if (accuracy >= 90) {
        medalIcon = "🥇";
        medalTitle = "金牌高手";
        medalDesc = "只差一點點就滿分，太強了！";
        medalColor = "text-yellow-500";
    } else if (accuracy >= 70) {
        medalIcon = "🥈";
        medalTitle = "銀牌訓練生";
        medalDesc = "基礎很穩，再多練幾次就能衝更高。";
        medalColor = "text-gray-500";
    } else if (accuracy >= 50) {
        medalIcon = "🥉";
        medalTitle = "銅牌勇者";
        medalDesc = "願意挑戰本身就是很棒的開始。";
        medalColor = "text-amber-700";
    }

    const summaryHtml = `
        <div class="w-full mt-2">
            <div class="mx-auto max-w-xs p-3 bg-purple-50 rounded-2xl border border-purple-100 shadow-inner">
                <div class="flex items-center justify-center mb-2">
                    <span class="text-3xl mr-1">${medalIcon}</span>
                    <span class="text-lg font-extrabold ${medalColor}">${medalTitle}</span>
                </div>
                <p class="text-sm font-semibold text-gray-700 mb-1">
                    總題數：<span class="font-bold">${total}</span> 題　
                    答對：<span class="font-bold text-green-600">${correct}</span> 題
                </p>
                <p class="text-3xl font-black text-red-500 my-1">
                    ${accuracy.toFixed(0)}%
                </p>
                <p class="text-xs text-gray-600 mt-1">
                    ${medalDesc}
                </p>
            </div>
        </div>
    `;

    if (feedbackElement) {
        feedbackElement.className = "text-center mt-3";
        feedbackElement.innerHTML = summaryHtml;
    }
}

// 產生新題目
function generateQuestionContent() {
    try {
        const num1 = Math.floor(Math.random() * 9) + 1;
        const num2 = Math.floor(Math.random() * 9) + 1;

        correctAnswer = num1 * num2;

        questionElement.textContent = `${num1} × ${num2} = ?`;
        scoreDisplay.textContent = `${currentQuestionIndex + 1}/${TOTAL_QUESTIONS_IN_ROUND}`;

        const options = [correctAnswer];
        const used = new Set([correctAnswer]);

        while (options.length < 4) {
            let wrong;

            if (options.length === 1) {
                const delta = Math.floor(Math.random() * 5) + 1;
                wrong = correctAnswer + (Math.random() < 0.5 ? delta : -delta);
            } else if (options.length === 2) {
                let changeFirst = Math.random() < 0.5;
                let a = changeFirst ? num1 : num2;
                let b = changeFirst ? num2 : num1;
                a += Math.random() < 0.5 ? 1 : -1;
                if (a < 1) a = 1;
                if (a > 9) a = 9;
                wrong = a * b;
            } else {
                wrong = Math.floor(Math.random() * 81) + 1;
            }

            wrong = Math.max(1, Math.min(81, wrong));

            if (!used.has(wrong) && Math.abs(wrong - correctAnswer) > 1) {
                used.add(wrong);
                options.push(wrong);
            }
        }

        shuffleArray(options);
        displayOptions(options);

        startTimer();
        isGameActive = true;
    } catch (e) {
        console.error("Error generating question:", e);
        if (feedbackElement) {
            feedbackElement.className = "text-base font-semibold mt-3 text-red-700";
            feedbackElement.textContent = "❌ 遊戲出錯，請點擊「再玩一次」重新開始。";
        }
        resetButton.classList.remove("hidden");
        clearInterval(timerId);
        timerId = null;
        isGameActive = false;
    }
}

// 顯示選項按鈕
function displayOptions(options) {
    if (!buttonsContainer) return;
    buttonsContainer.innerHTML = "";

    options.forEach(option => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.className = "answer-button py-2.5 px-2 bg-blue-500 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-blue-600 transition duration-150 ease-in-out";
        btn.setAttribute("data-answer", option.toString());
        btn.onclick = () => checkAnswer(option, btn);
        buttonsContainer.appendChild(btn);
    });
}

// 開始遊戲
function startGame() {
    setupScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    resetButton.classList.add("hidden");

    correctAnswersInRound = 0;
    currentQuestionIndex = 0;
    if (feedbackElement) {
        feedbackElement.innerHTML = "";
    }

    generateQuestionContent();
}

// 回到初始設定畫面
function resetToSetup() {
    if (timerId) clearInterval(timerId);
    timerId = null;
    isGameActive = false;

    setupScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
    resetButton.classList.add("hidden");

    if (feedbackElement) {
        feedbackElement.innerHTML = "";
    }
    questionElement.textContent = "? × ? = ?";
    buttonsContainer.innerHTML = "";
    scoreDisplay.textContent = `0/${TOTAL_QUESTIONS_IN_ROUND}`;

    resetTimerVisual();
    if (timerNumber) {
        timerNumber.textContent = selectedTimeLimit.toString();
    }
}

// 初始化
window.onload = () => {
    setTimeLimit(selectedTimeLimit);
};

// 暴露給全域使用
window.setTimeLimit = setTimeLimit;
window.startGame = startGame;
window.resetToSetup = resetToSetup;
window.checkAnswer = checkAnswer;
