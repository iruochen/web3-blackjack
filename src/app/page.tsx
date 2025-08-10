"use client"
import { useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useSignMessage } from "wagmi"
import { parseAbi, createPublicClient, createWalletClient, custom } from "viem"
import { sepolia } from "viem/chains"

export default function Page() {
	const [message, setMessage] = useState<string>("")
	const [playerHand, setPlayerHand] = useState<
		{ rank: string; suit: string }[]
	>([])
	const [dealerHand, setDealerHand] = useState<
		{ rank: string; suit: string }[]
	>([])
	const [score, setScore] = useState<number>(0)
	const [isSigned, setIsSigned] = useState(false)
	const { address } = useAccount()
	const { signMessageAsync } = useSignMessage()
	const [publicClient, setPublicClient] = useState<any>(null)
	const [walletClient, setWalletClient] = useState<any>(null)

	const initGame = async () => {
		const response = await fetch(`/api?address=${address}`, { method: "GET" })
		const data = await response.json()
		setPlayerHand(data.playerCards)
		setDealerHand(data.dealerCards)
		setMessage(data.message)
		setScore(data.score)
		if (typeof window !== "undefined" && window.ethereum) {
			const publicClientInstance = createPublicClient({
				chain: sepolia,
				transport: custom(window.ethereum),
			})
			const walletClientInstance = createWalletClient({
				chain: sepolia,
				transport: custom(window.ethereum),
			})
			setPublicClient(publicClientInstance)
			setWalletClient(walletClientInstance)
		} else {
			console.error(
				"Ethereum provider not found. Please install MetaMask or another wallet.",
			)
		}
	}

	async function handleSendTx() {
		// get address contract
		const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
		// get abi
		const contractAbi = parseAbi([process.env.NEXT_PUBLIC_CONTRACT_ABI || ""])
		// publicClient -> simulate -> sendTransaction
		await publicClient.simulateContract({
			address: contractAddress,
			abi: contractAbi,
			functionName: "sendRequest",
			args: [[address], address],
			account: address,
		})
		// walletClient -> sendTransaction
		const txHash = await walletClient.writeContract({
			to: contractAddress,
			abi: contractAbi,
			functionName: "sendRequest",
			args: [[address], address],
			account: address,
		})
		console.log("Transaction sent with hash:", txHash)
	}

	async function handleHit() {
		const response = await fetch("/api", {
			method: "POST",
			headers: {
				bearer: `Bearer ${localStorage.getItem("jwt") || ""}`,
			},
			body: JSON.stringify({ action: "hit", address: address }),
		})
		const data = await response.json()
		setPlayerHand(data.playerCards)
		setDealerHand(data.dealerCards)
		setMessage(data.message)
		setScore(data.score)
	}

	async function handleStand() {
		const response = await fetch("/api", {
			method: "POST",
			headers: {
				bearer: `Bearer ${localStorage.getItem("jwt") || ""}`,
			},
			body: JSON.stringify({ action: "stand", address: address }),
		})
		const data = await response.json()
		setPlayerHand(data.playerCards)
		setDealerHand(data.dealerCards)
		setMessage(data.message)
		setScore(data.score)
	}

	async function handleReset() {
		const response = await fetch(`/api?address=${address}`, { method: "GET" })
		const data = await response.json()
		setPlayerHand(data.playerCards)
		setDealerHand(data.dealerCards)
		setMessage(data.message)
		setScore(data.score)
	}

	async function handleSign() {
		const message = `Welcome to Web3 game Black Jack at ${new Date().toString()}`
		const signature = await signMessageAsync({ message })
		const response = await fetch("api", {
			method: "POST",
			body: JSON.stringify({ action: "auth", address, message, signature }),
		})
		if (response.status === 200) {
			const { jsonwebtoken } = await response.json()
			localStorage.setItem("jwt", jsonwebtoken)
			setIsSigned(true)
			initGame()
		}
	}
	if (!isSigned) {
		return (
			<div className="flex flex-col gap-2 items-center justify-center h-screen bg-gray-300">
				<ConnectButton />
				<button
					onClick={handleSign}
					className="border-black bg-amber-300 p-2 rounded-md"
				>
					Sign with your wallet
				</button>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-2 items-center justify-center h-screen bg-gray-300">
			<ConnectButton />
			<h1 className="text-3xl bold">Welcome to Web3 game Black Jack</h1>
			<h2 className="text-2xl bold">Score: {score}</h2>
			<h2
				className={`text-2xl bold ${message.includes("win") ? "bg-green-300" : "bg-amber-500"}`}
			>
				{message}
			</h2>
			<button
				onClick={handleSendTx}
				className="border-black bg-amber-300 p-2 rounded-md"
			>
				Get NFT
			</button>
			<div className="mt-4">
				<h2>Dealer's hand</h2>
				<div className="flex flex-row gap-2">
					{dealerHand.map((card, index) => (
						<div
							key={index}
							className="w-32 h-42 border-1 border-black bg-white rounded-md flex flex-col justify-between"
						>
							<p className="self-start p-2 text-lg">{card.rank}</p>
							<p className="self-center p-2 text-3xl">{card.suit}</p>
							<p className="self-end p-2 text-lg">{card.rank}</p>
						</div>
					))}
				</div>
			</div>

			<div>
				<h2>Player's hand</h2>
				<div className="flex flex-row gap-2">
					{playerHand.map((card, index) => (
						<div
							key={index}
							className="w-32 h-42 border-1 border-black bg-white rounded-md flex flex-col justify-between"
						>
							<p className="self-start p-2 text-lg">{card.rank}</p>
							<p className="self-center p-2 text-3xl">{card.suit}</p>
							<p className="self-end p-2 text-lg">{card.rank}</p>
						</div>
					))}
				</div>
			</div>

			<div className="flex flex-row gap-2 mt-4">
				{message === "" ? (
					<>
						<button onClick={handleHit} className="bg-amber-300 rounded-md p-2">
							Hit
						</button>
						<button
							onClick={handleStand}
							className="bg-amber-300 rounded-md p-2"
						>
							Stand
						</button>
					</>
				) : (
					<button onClick={handleReset} className="bg-amber-300 rounded-md p-2">
						Reset
					</button>
				)}
			</div>
		</div>
	)
}
