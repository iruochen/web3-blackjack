// when the game is initialized, get player and dealer 2 random cards respectively
export interface Card {
	rank: string
	suit: string
}

const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
const suits = ["♠️", "♥️", "♦️", "♣️"]
const initialDeck = ranks
	.map((rank) => suits.map((suit) => ({ rank: rank, suit: suit })))
	.flat()

const gameState: {
	playerHand: Card[]
	dealerHand: Card[]
	deck: Card[]
	message: string
	score: number
} = {
	playerHand: [],
	dealerHand: [],
	deck: initialDeck,
	message: "",
	score: 0,
}

function getRandomCard(deck: Card[], count: number) {
	const randomIndexSet = new Set<number>()
	while (randomIndexSet.size < count) {
		randomIndexSet.add(Math.floor(Math.random() * deck.length))
	}
	const randomCards = deck.filter((_, index) => randomIndexSet.has(index))
	const remainingDeck = deck.filter((_, index) => !randomIndexSet.has(index))
	return [randomCards, remainingDeck]
}

export function GET() {
	// reset the game state
	gameState.playerHand = []
	gameState.dealerHand = []
	gameState.deck = initialDeck
	gameState.message = ""

	const [playerCards, remainingDeck] = getRandomCard(gameState.deck, 2)
	const [dealerCards, newDeck] = getRandomCard(remainingDeck, 2)
	gameState.playerHand = playerCards
	gameState.dealerHand = dealerCards
	gameState.deck = newDeck
	gameState.message = ""

	return new Response(
		JSON.stringify({
			playerCards: gameState.playerHand,
			dealerCards: [gameState.dealerHand[0], { rank: "?", suit: "?" } as Card], // Hide one dealer card
			message: gameState.message,
			score: gameState.score,
		}),
		{
			status: 200,
		},
	)
}

export async function POST(request: Request) {
	const { action } = await request.json()

	// when hit is clicked, get a random card from the deck and add it to the player's hand
	// calculate the points of the player's hand
	// player hand value is 21: player wins, black jack
	// player hand is over 21: player loses, bust
	// player hand is under 21: continue the game
	if (action === "hit") {
		const [cards, newDeck] = getRandomCard(gameState.deck, 1)
		gameState.playerHand.push(...cards)
		gameState.deck = newDeck

		const playerHandValue = calculateHandValue(gameState.playerHand)
		if (playerHandValue === 21) {
			gameState.message = "Black Jack! Player wins!"
			gameState.score += 100
		} else if (playerHandValue > 21) {
			gameState.message = "Bust! Player loses!"
			gameState.score -= 100
		}

		// when stand is clicked, get a random card from the deck and add it to the dealer's hand
		// keep doing this until dealer has 17 or more points
		// calculate the points of the dealer's hand
		// dealer hand value is 21: player loses, black jack
		// dealer hand is over 21: player wins, bust
		// dealer hand is under 21
		// calculate the points of the player's hand
		// player > dealer: player wins
		// player < dealer: player loses
		// player === dealer: draw
	} else if (action === "stand") {
		while (calculateHandValue(gameState.dealerHand) < 17) {
			const [randomCards, newDeck] = getRandomCard(gameState.deck, 1)
			gameState.deck = newDeck
			gameState.dealerHand.push(...randomCards)
		}
		const dealerHandValue = calculateHandValue(gameState.dealerHand)
		if (dealerHandValue > 21) {
			gameState.message = "Dealer Bust! Player wins!"
			gameState.score += 100
		} else if (dealerHandValue === 21) {
			gameState.message = "Dealer Black Jack! Player wins!"
			gameState.score -= 100
		} else {
			const playerHandValue = calculateHandValue(gameState.playerHand)
			if (playerHandValue > dealerHandValue) {
				gameState.message = "Player wins!"
				gameState.score += 100
			} else if (playerHandValue < dealerHandValue) {
				gameState.message = "Dealer wins!"
				gameState.score -= 100
			} else {
				gameState.message = "Draw!"
			}
		}
	} else {
		return new Response(JSON.stringify("Invalid action"), { status: 400 })
	}
	return new Response(
		JSON.stringify({
			playerCards: gameState.playerHand,
			dealerCards:
				gameState.message === ""
					? [gameState.dealerHand[0], { rank: "?", suit: "?" } as Card]
					: gameState.dealerHand,
			message: gameState.message,
			score: gameState.score,
		}),
		{
			status: 200,
		},
	)
}

function calculateHandValue(hand: Card[]) {
	let value = 0
	let acesCount = 0

	for (const card of hand) {
		if (card.rank === "A") {
			acesCount++
			value += 11
		} else if (["K", "Q", "J"].includes(card.rank)) {
			value += 10
		} else {
			value += parseInt(card.rank)
		}
	}

	// Adjust for Aces if value exceeds 21
	while (value > 21 && acesCount > 0) {
		value -= 10 // Count Ace as 1 instead of 11
		acesCount--
	}

	return value
}
