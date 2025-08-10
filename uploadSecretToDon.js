const { SecretsManager } = require("@chainlink/functions-toolkit")
const { ethers } = require("ethers")
const dotenv = require("dotenv")
const fs = require("fs")

dotenv.config({ path: "./.env.local" })

const makeRequestSepolia = async () => {
	if (!process.env.ETHEREUM_PROVIDER_SEPOLIA) {
		throw new Error(
			"ETHEREUM_PROVIDER_SEPOLIA not provided - check your environment variables",
		)
	}
	if (!process.env.AWS_API_KEY) {
		throw new Error(
			"AWS_API_KEY not provided - check your environment variables",
		)
	}
	if (!process.env.EVM_PRIVATE_KEY) {
		throw new Error(
			"EVM_PRIVATE_KEY not provided - check your environment variables",
		)
	}

	// Hardcoded for Sepolia
	const routerAddress = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0"
	const donId = "fun-ethereum-sepolia-1"
	const rpcUrl = process.env.ETHEREUM_PROVIDER_SEPOLIA

	const gatewayUrls = [
		"https://01.functions-gateway.testnet.chain.link/",
		"https://02.functions-gateway.testnet.chain.link/",
	]
	const slotIdNumber = 0
	const expirationTimeMinutes = 1440

	const secrets = { apiKey: process.env.AWS_API_KEY }

	// Initialize ethers signer and provider (v6 style)
	const privateKey = process.env.EVM_PRIVATE_KEY
	const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
	const signer = new ethers.Wallet(privateKey, provider)

	//////// MAKE REQUEST ////////

	console.log("\nMake request...")

	// First encrypt secrets
	const secretsManager = new SecretsManager({
		signer,
		functionsRouterAddress: routerAddress,
		donId,
	})
	await secretsManager.initialize()

	const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets)

	console.log(
		`Upload encrypted secret to gateways ${gatewayUrls}. slotId ${slotIdNumber}. Expiration: ${expirationTimeMinutes} mins`,
	)

	const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
		encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
		gatewayUrls,
		slotId: slotIdNumber,
		minutesUntilExpiration: expirationTimeMinutes,
	})

	if (!uploadResult.success) {
		throw new Error(`Encrypted secrets not uploaded to ${gatewayUrls}`)
	}

	console.log(
		`\n✅ Secrets uploaded to gateways ${gatewayUrls}! Response:`,
		uploadResult,
	)

	const donHostedSecretsVersion = Number(uploadResult.version)

	fs.writeFileSync(
		"donSecretsInfo.txt",
		JSON.stringify(
			{
				donHostedSecretsVersion: donHostedSecretsVersion.toString(),
				slotId: slotIdNumber.toString(),
				expirationTimeMinutes: expirationTimeMinutes.toString(),
			},
			null,
			2,
		),
	)

	console.log(
		`donHostedSecretsVersion is ${donHostedSecretsVersion}, saved info to donSecretsInfo.txt`,
	)
}

makeRequestSepolia().catch((e) => {
	console.error(e)
	process.exit(1)
})
