"use client"
import { useEffect, useState } from "react"

export default function Page() {
	const ranks = [
		"A",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"10",
		"J",
		"Q",
		"K",
	]
	const suits = ["♠", "♥", "♦", "♣"]
	const initialDeck = ranks
		.map((rank) => suits.map((suit) => ({ rank: rank, suit: suit })))
		.flat()

	const [deck, setDeck] = useState<{ rank: string; suit: string }[]>([])
	useEffect(() => {
		setDeck(initialDeck)
	}, [])

	return (
		<div className="flex flex-col gap-2 items-center justify-center h-screen bg-gray-300">
			<h1 className="text-3xl bold">Welcome to Web3 game Black jack</h1>
			<h2 className="text-2xl bold">
				Message: Player wins / dealer wins: Blackjack / bust!
			</h2>
			<div className="mt-4">
				<h2>Dealer's hand</h2>
				<div className="flex flex-row gap-2">
					{deck.slice(0, 3).map((card, index) => (
						<div
							key={index}
							className="w-32 h-42 border-1 border-black bg-white rounded-md flex flex-col justify-between"
						>
							<p className="self-start">{card.rank}</p>
							<p className="self-center">{card.suit}</p>
							<p className="self-end">{card.rank}</p>
						</div>
					))}
				</div>
			</div>

			<div>
				<h2>Player's hand</h2>
				<div className="flex flex-row gap-2">
					<div className="w-32 h-42 border-1 border-black bg-white rounded-md"></div>
					<div className="w-32 h-42 border-1 border-black bg-white rounded-md"></div>
					<div className="w-32 h-42 border-1 border-black bg-white rounded-md"></div>
				</div>
			</div>

			<div className="flex flex-row gap-2 mt-4">
				<button className="bg-amber-300 rounded-md p-2">Hit</button>
				<button className="bg-amber-300 rounded-md p-2">Stand</button>
				<button className="bg-amber-300 rounded-md p-2">Reset</button>
			</div>
		</div>
	)
}
