"use client"
import { useEffect, useRef, useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useSignMessage } from "wagmi"
import { parseAbi, createPublicClient, createWalletClient, custom } from "viem"
import { sepolia } from "viem/chains"
import { motion, AnimatePresence } from "framer-motion"
import { JwtPayload } from "jwt-decode"
import { jwtDecode } from "jwt-decode"

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
	const [isLoading, setIsLoading] = useState(false)
	const [hasJwt, setHasJwt] = useState(false)
	const { address, isConnected } = useAccount()
	const { signMessageAsync } = useSignMessage()
	const [publicClient, setPublicClient] = useState<any>(null)
	const [walletClient, setWalletClient] = useState<any>(null)
	const initializedRef = useRef(false)

	const initGame = async () => {
		if (!address) return
		if (initializedRef.current) return
		setIsLoading(true)
		try {
			const response = await fetch(`/api?address=${address}`, { method: "GET" })
			const data = await response.json()
			setPlayerHand(data.playerCards || [])
			setDealerHand(data.dealerCards || [])
			setMessage(data.message || "")
			setScore(Number(data.score || 0))
			if (typeof window !== "undefined" && (window as any).ethereum) {
				const publicClientInstance = createPublicClient({
					chain: sepolia,
					transport: custom((window as any).ethereum),
				})
				const walletClientInstance = createWalletClient({
					chain: sepolia,
					transport: custom((window as any).ethereum),
				})
				setPublicClient(publicClientInstance)
				setWalletClient(walletClientInstance)
			}
			initializedRef.current = true
		} catch (error) {
			console.error("Error initializing game:", error)
			setMessage("Failed to start game. Please try again.")
		} finally {
			setIsLoading(false)
		}
	}

	async function handleSendTx() {
		setIsLoading(true)
		try {
			const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as
				| `0x${string}`
				| undefined
			const contractAbi = parseAbi([process.env.NEXT_PUBLIC_CONTRACT_ABI || ""])
			await publicClient.simulateContract({
				address: contractAddress!,
				abi: contractAbi,
				functionName: "sendRequest",
				args: [[address], address],
				account: address,
			})
			const txHash = await walletClient.writeContract({
				to: contractAddress!,
				abi: contractAbi,
				functionName: "sendRequest",
				args: [[address], address],
				account: address,
			})
			console.log("Transaction sent with hash:", txHash)
			const receipt = await publicClient.waitForTransactionReceipt({
				hash: txHash,
			})
			if (receipt.status === "success") {
				setMessage("Transaction successful! You have claimed your NFT.")
				const response = await fetch("/api", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
					},
					body: JSON.stringify({ action: "deduct", address }),
				})
				const data = await response.json()
				setScore(data.score || 0)
			}
		} catch (error) {
			console.error("Error sending transaction:", error)
			setMessage("Failed to send transaction.")
		} finally {
			setIsLoading(false)
		}
	}

	async function handleHit() {
		setIsLoading(true)
		try {
			const response = await fetch("/api", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
				},
				body: JSON.stringify({ action: "hit", address }),
			})
			const data = await response.json()
			setPlayerHand(data.playerCards || [])
			setDealerHand(data.dealerCards || [])
			setMessage(data.message || "")
			setScore(Number(data.score || 0))
		} catch (error) {
			console.error("Error hitting:", error)
			setMessage("Failed to hit. Please try again.")
		} finally {
			setIsLoading(false)
		}
	}

	async function handleStand() {
		setIsLoading(true)
		try {
			const response = await fetch("/api", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
				},
				body: JSON.stringify({ action: "stand", address }),
			})
			const data = await response.json()
			setPlayerHand(data.playerCards || [])
			setDealerHand(data.dealerCards || [])
			setMessage(data.message || "")
			setScore(Number(data.score || 0))
		} catch (error) {
			console.error("Error standing:", error)
			setMessage("Failed to stand. Please try again.")
		} finally {
			setIsLoading(false)
		}
	}

	async function handleReset() {
		initializedRef.current = false
		await initGame()
	}

	async function handleSign() {
		setIsLoading(true)
		try {
			const msg = `Welcome to Web3 game Black Jack at ${new Date().toString()}`
			const signature = await signMessageAsync({ message: msg })
			const response = await fetch("/api", {
				method: "POST",
				body: JSON.stringify({
					action: "auth",
					address,
					message: msg,
					signature,
				}),
			})
			if (response.ok) {
				const { jsonwebtoken } = await response.json()
				localStorage.setItem("jwt", jsonwebtoken)
				setHasJwt(true)
				setIsSigned(true)
				initializedRef.current = false
				await initGame()
			} else {
				setMessage("Authentication failed. Please try again.")
			}
		} catch (error) {
			console.error("Error signing message:", error)
			setMessage("Failed to sign message. Please try again.")
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (typeof window === "undefined") return
		const jwt = localStorage.getItem("jwt")
		if (!jwt) {
			setHasJwt(false)
			setIsSigned(false)
			return
		}
		try {
			const decoded = jwtDecode<JwtPayload>(jwt)
			const now = Date.now() / 1000
			if (typeof decoded.exp === "undefined" || decoded.exp < now) {
				localStorage.removeItem("jwt")
				setHasJwt(false)
				setIsSigned(false)
			} else {
				setHasJwt(true)
				if (isConnected && address) {
					setIsSigned(true)
					initGame()
				}
			}
		} catch {
			localStorage.removeItem("jwt")
			setHasJwt(false)
			setIsSigned(false)
		}
	}, [isConnected, address])

	useEffect(() => {
		if (!isConnected) {
			setIsSigned(false)
			setMessage("")
			setPlayerHand([])
			setDealerHand([])
			setScore(0)
			initializedRef.current = false
		}
	}, [isConnected])

	const Spinner = () => (
		<span
			className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-yellow-400/30 border-t-yellow-400 align-middle"
			aria-label="loading"
		/>
	)

	if (!isSigned) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#1b0036] to-black text-[#FFD700] flex flex-col">
				{/* Header */}
				<header className="w-full border-b border-yellow-500/40 bg-black/70 backdrop-blur-sm shadow-lg">
					<div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
						<h1 className="text-3xl font-extrabold tracking-widest drop-shadow-[0_0_6px_#FFD700]">
							♠ Web3 BlackJack
						</h1>
						<ConnectButton />
					</div>
				</header>

				{/* Main */}
				<main className="flex-grow max-w-7xl mx-auto px-8 flex flex-col justify-center items-center">
					<section className="max-w-xl w-full bg-black/60 backdrop-blur-lg rounded-3xl p-10 shadow-[0_0_25px_rgba(255,215,0,0.2)] border border-yellow-500/40">
						<h2 className="text-4xl font-bold mb-6 text-center tracking-wider drop-shadow-[0_0_8px_#FFD700]">
							Welcome to the BlackJack
						</h2>
						<p className="text-center text-yellow-200 mb-10 leading-relaxed">
							Connect your wallet and sign in to start your journey. Place your
							bets, trust the chain, and may the odds be in your favor.
						</p>

						{/* Buttons */}
						<div className="flex justify-center gap-5">
							<ConnectButton />
						</div>
						<div className="flex justify-center mt-6">
							{!hasJwt && (
								<button
									onClick={handleSign}
									disabled={isLoading || !isConnected}
									className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-yellow-500 to-yellow-300 hover:from-yellow-400 hover:to-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_#FFD700] hover:shadow-[0_0_25px_#FFD700] transition text-black"
								>
									{isLoading ? (
										<span className="flex items-center gap-2 justify-center">
											<Spinner />
											Signing...
										</span>
									) : (
										"Sign with your wallet"
									)}
								</button>
							)}
						</div>

						{/* Warning */}
						{hasJwt && !isConnected && (
							<p className="mt-6 text-center text-sm text-red-400">
								JWT detected, please connect your wallet to continue.
							</p>
						)}
					</section>
				</main>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#1b0036] to-black text-[#FFD700] flex flex-col">
			{/* Header */}
			<header className="w-full border-b border-yellow-500/40 bg-black/70 backdrop-blur-sm shadow-lg">
				<div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
					<h1 className="text-3xl font-extrabold tracking-widest drop-shadow-[0_0_6px_#FFD700]">
						♠ Web3 BlackJack
					</h1>
					<ConnectButton />
				</div>
			</header>

			<main className="flex-grow overflow-auto max-w-7xl mx-auto px-8 py-10 flex flex-col gap-10 w-full">
				<section className="bg-[#0B3D20]/90 backdrop-blur-md rounded-3xl border border-yellow-400 shadow-lg p-8 flex flex-col min-h-[600px]">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-xl font-semibold tracking-wide drop-shadow text-yellow-400">
							Game Status
						</h2>
						<div className="inline-flex items-center gap-2 rounded-full bg-yellow-600/40 px-4 py-1 font-semibold text-yellow-100">
							Score: <span className="text-yellow-300 text-2xl">{score}</span>
						</div>
					</div>

					<div
						className={`mb-6 px-5 py-3 rounded-xl border ${
							message.toLowerCase().includes("win")
								? "bg-green-900/80 border-green-500 text-green-300"
								: message.toLowerCase().includes("lose")
									? "bg-red-900/80 border-red-500 text-red-300"
									: "bg-[#114028] border-yellow-400 text-yellow-400"
						} drop-shadow-md`}
					>
						{message || (isLoading ? "Loading..." : "Game in progress")}
					</div>

					{/* Dealer Hand */}
					<section className="mb-8">
						<h3 className="text-lg font-semibold mb-3 drop-shadow text-yellow-400">
							Dealer
						</h3>
						<div className="flex flex-wrap gap-4 justify-start">
							<AnimatePresence>
								{dealerHand.length ? (
									dealerHand.map((card, i) => (
										<motion.div
											key={`dealer-${i}`}
											initial={{ opacity: 0, y: -40 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: 40 }}
											transition={{ duration: 0.4, delay: i * 0.07 }}
											className="w-28 sm:w-32 md:w-36 aspect-[2/3] rounded-2xl bg-gradient-to-br from-[#114028] via-[#145C34] to-[#0B3D20] shadow-lg border border-yellow-400 flex flex-col justify-between p-4 cursor-pointer select-none text-yellow-300"
										>
											<p className="text-lg font-bold">{card.rank}</p>
											<p className="text-5xl text-center">{card.suit}</p>
											<p className="text-lg font-bold self-end">{card.rank}</p>
										</motion.div>
									))
								) : (
									<p className="text-yellow-700 italic">No cards yet</p>
								)}
							</AnimatePresence>
						</div>
					</section>

					{/* Player Hand */}
					<section>
						<h3 className="text-lg font-semibold mb-3 drop-shadow text-yellow-400">
							Player
						</h3>
						<div className="flex flex-wrap gap-4 justify-start">
							<AnimatePresence>
								{playerHand.length ? (
									playerHand.map((card, i) => (
										<motion.div
											key={`player-${i}`}
											initial={{ opacity: 0, y: 40 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -40 }}
											transition={{ duration: 0.4, delay: i * 0.07 }}
											className="w-28 sm:w-32 md:w-36 aspect-[2/3] rounded-2xl bg-gradient-to-br from-[#114028] via-[#145C34] to-[#0B3D20] shadow-lg border border-yellow-400 flex flex-col justify-between p-4 cursor-pointer select-none text-yellow-300"
										>
											<p className="text-lg font-bold">{card.rank}</p>
											<p className="text-5xl text-center">{card.suit}</p>
											<p className="text-lg font-bold self-end">{card.rank}</p>
										</motion.div>
									))
								) : (
									<p className="text-yellow-700 italic">No cards yet</p>
								)}
							</AnimatePresence>
						</div>
					</section>

					{/* Action Buttons */}
					<div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
						{message === "" ? (
							<>
								<button
									onClick={handleHit}
									disabled={isLoading}
									className="px-6 py-3 rounded-full bg-gradient-to-r from-[#145C34] to-[#114028] hover:from-[#196637] hover:to-[#15602B] disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md transition text-yellow-300"
								>
									{isLoading ? (
										<span className="flex items-center gap-2 justify-center">
											<Spinner />
											Hitting...
										</span>
									) : (
										"Hit"
									)}
								</button>

								<button
									onClick={handleStand}
									disabled={isLoading}
									className="px-6 py-3 rounded-full bg-gradient-to-r from-[#6E1B17] to-[#4B130F] hover:from-[#7E231B] hover:to-[#5B1C12] disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md transition text-yellow-300"
								>
									{isLoading ? (
										<span className="flex items-center gap-2 justify-center">
											<Spinner />
											Standing...
										</span>
									) : (
										"Stand"
									)}
								</button>
							</>
						) : (
							<button
								onClick={handleReset}
								disabled={isLoading}
								className="px-6 py-3 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md transition text-yellow-400"
							>
								{isLoading ? (
									<span className="flex items-center gap-2 justify-center">
										<Spinner />
										Resetting...
									</span>
								) : (
									"Reset"
								)}
							</button>
						)}

						{score >= 1000 && (
							<button
								onClick={handleSendTx}
								disabled={isLoading}
								className="ml-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#196637] to-[#145C34] hover:from-[#237832] hover:to-[#1B622D] disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md transition text-yellow-300"
							>
								{isLoading ? (
									<span className="flex items-center gap-2 justify-center">
										<Spinner />
										Getting NFT...
									</span>
								) : (
									"Claim NFT"
								)}
							</button>
						)}
					</div>
				</section>
			</main>
		</div>
	)
}
