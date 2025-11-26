// Game State
let balance = 100;
let currentBet = 0;
let deck = [];
let playerHand = [];
let dealerHand = [];
let gameInProgress = false;
let dealerHoleCard = null;

// Card values
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// DOM Elements
const balanceEl = document.getElementById('balance');
const currentBetEl = document.getElementById('current-bet');
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerValueEl = document.getElementById('dealer-value');
const playerValueEl = document.getElementById('player-value');
const messageEl = document.getElementById('message');
const dealBtn = document.getElementById('deal-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const doubleBtn = document.getElementById('double-btn');
const clearBetBtn = document.getElementById('clear-bet');
const chipButtons = document.querySelectorAll('.chip');

// Initialize game
function init() {
    updateDisplay();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    chipButtons.forEach(chip => {
        chip.addEventListener('click', () => {
            if (!gameInProgress) {
                addBet(parseInt(chip.dataset.value));
            }
        });
    });

    clearBetBtn.addEventListener('click', clearBet);
    dealBtn.addEventListener('click', dealCards);
    hitBtn.addEventListener('click', hit);
    standBtn.addEventListener('click', stand);
    doubleBtn.addEventListener('click', doubleDown);
}

// Betting functions
function addBet(amount) {
    if (balance >= amount) {
        currentBet += amount;
        updateDisplay();
    } else {
        showMessage('Insufficient balance!', 'error');
    }
}

function clearBet() {
    if (!gameInProgress) {
        currentBet = 0;
        updateDisplay();
    }
}

// Create and shuffle deck
function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    shuffleDeck();
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Deal cards
function dealCards() {
    if (currentBet === 0) {
        showMessage('Please place a bet first!', 'error');
        return;
    }

    if (balance < currentBet) {
        showMessage('Insufficient balance!', 'error');
        return;
    }

    // Deduct bet from balance
    balance -= currentBet;
    gameInProgress = true;

    createDeck();
    playerHand = [];
    dealerHand = [];
    dealerHoleCard = null;

    // Deal initial cards
    playerHand.push(deck.pop());
    dealerHand.push(deck.pop());
    playerHand.push(deck.pop());
    dealerHoleCard = deck.pop();
    dealerHand.push(dealerHoleCard);

    updateDisplay();
    renderHands(true); // Hide dealer's hole card

    // Check for blackjack
    if (calculateHandValue(playerHand) === 21) {
        if (calculateHandValue(dealerHand) === 21) {
            endGame('push');
        } else {
            endGame('blackjack');
        }
        return;
    }

    // Enable game buttons
    hitBtn.disabled = false;
    standBtn.disabled = false;
    doubleBtn.disabled = (balance < currentBet);
    dealBtn.disabled = true;

    showMessage('');
}

// Hit - draw another card
function hit() {
    playerHand.push(deck.pop());
    renderHands(true);

    const playerValue = calculateHandValue(playerHand);

    if (playerValue > 21) {
        endGame('bust');
    } else if (playerValue === 21) {
        stand();
    } else {
        doubleBtn.disabled = true; // Can't double after first hit
    }
}

// Stand - end player's turn
function stand() {
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;

    // Reveal dealer's hole card
    renderHands(false);

    // Dealer draws until 17 or higher
    setTimeout(() => {
        dealerPlay();
    }, 500);
}

// Double down
function doubleDown() {
    if (balance < currentBet) {
        showMessage('Insufficient balance to double down!', 'error');
        return;
    }

    balance -= currentBet;
    currentBet *= 2;
    updateDisplay();

    playerHand.push(deck.pop());
    renderHands(true);

    const playerValue = calculateHandValue(playerHand);

    if (playerValue > 21) {
        endGame('bust');
    } else {
        stand();
    }
}

// Dealer's turn
function dealerPlay() {
    let dealerValue = calculateHandValue(dealerHand);

    if (dealerValue < 17) {
        dealerHand.push(deck.pop());
        renderHands(false);
        setTimeout(() => dealerPlay(), 500);
    } else {
        determineWinner();
    }
}

// Calculate hand value
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (let card of hand) {
        if (card.value === 'A') {
            aces++;
            value += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

// Determine winner
function determineWinner() {
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);

    if (dealerValue > 21) {
        endGame('dealer-bust');
    } else if (playerValue > dealerValue) {
        endGame('win');
    } else if (dealerValue > playerValue) {
        endGame('lose');
    } else {
        endGame('push');
    }
}

// End game
function endGame(result) {
    gameInProgress = false;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    dealBtn.disabled = false;

    renderHands(false); // Show all cards

    let message = '';
    let messageClass = '';

    switch (result) {
        case 'blackjack':
            balance += Math.floor(currentBet * 2.5); // 3:2 payout
            message = '🎉 Blackjack! You win!';
            messageClass = 'success';
            break;
        case 'win':
        case 'dealer-bust':
            balance += currentBet * 2;
            message = result === 'dealer-bust' ? '🎉 Dealer busts! You win!' : '🎉 You win!';
            messageClass = 'success';
            break;
        case 'lose':
            message = '😞 Dealer wins!';
            messageClass = 'error';
            break;
        case 'bust':
            message = '💥 Bust! You lose!';
            messageClass = 'error';
            break;
        case 'push':
            balance += currentBet;
            message = '🤝 Push! Bet returned.';
            messageClass = 'info';
            break;
    }

    showMessage(message, messageClass);
    currentBet = 0;
    updateDisplay();

    // Check if player is out of money
    if (balance === 0) {
        setTimeout(() => {
            alert('Game Over! You\'re out of money. Starting fresh with $100.');
            balance = 100;
            updateDisplay();
        }, 1000);
    }
}

// Render hands
function renderHands(hideHoleCard) {
    // Render player hand
    playerCardsEl.innerHTML = '';
    playerHand.forEach(card => {
        playerCardsEl.appendChild(createCardElement(card));
    });
    playerValueEl.textContent = `(${calculateHandValue(playerHand)})`;

    // Render dealer hand
    dealerCardsEl.innerHTML = '';
    dealerHand.forEach((card, index) => {
        if (hideHoleCard && index === 1) {
            dealerCardsEl.appendChild(createCardElement(null, true));
        } else {
            dealerCardsEl.appendChild(createCardElement(card));
        }
    });

    if (hideHoleCard) {
        const visibleValue = getCardValue(dealerHand[0]);
        dealerValueEl.textContent = `(${visibleValue})`;
    } else {
        dealerValueEl.textContent = `(${calculateHandValue(dealerHand)})`;
    }
}

// Get single card value
function getCardValue(card) {
    if (card.value === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(card.value);
}

// Create card element
function createCardElement(card, hidden = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';

    if (hidden) {
        cardDiv.classList.add('card-back');
        cardDiv.textContent = '🂠';
    } else {
        const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
        cardDiv.classList.add(color);
        cardDiv.innerHTML = `
            <div class="card-value">${card.value}</div>
            <div class="card-suit">${card.suit}</div>
        `;
    }

    return cardDiv;
}

// Update display
function updateDisplay() {
    balanceEl.textContent = balance;
    currentBetEl.textContent = currentBet;

    // Disable chips if insufficient balance or game in progress
    chipButtons.forEach(chip => {
        const chipValue = parseInt(chip.dataset.value);
        chip.disabled = gameInProgress || balance < chipValue;
    });

    clearBetBtn.disabled = gameInProgress || currentBet === 0;
}

// Show message
function showMessage(message, className = '') {
    messageEl.textContent = message;
    messageEl.className = 'message ' + className;
}

// Start the game
init();
