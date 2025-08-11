# BlackJack Web3 Game

A Web3-powered BlackJack game built with React, Next.js, Wagmi, Viem, RainbowKit, and TailwindCSS.  
Players connect their wallet on Sepolia testnet, play BlackJack, and mint NFT when reaching 1000 points.

## Features
- Play BlackJack in browser
- Wallet connect via RainbowKit
- Built with React + Next.js + Wagmi + Viem
- Styled with TailwindCSS
- Runs on Sepolia network
- Mint NFT at 1000 points

## Tech Stack
- React
- Next.js
- Wagmi
- Viem
- RainbowKit
- TailwindCSS

## Installation
```bash
git clone https://github.com/iruochen/web3-blackjack.git
cd blackjack-web3
pnpm install
pnpm dev
```

## Environment Variables
Create `.env.local` and add:
```
NEXT_PUBLIC_WC_PROJECT_ID=
NEXT_TELEMETRY_DISABLED=1
AWS_USER_ACCESS_KEY_ID=
AWS_USER_ACCESS_KEY=
JWT_SECRET=
ETHEREUM_PROVIDER_SEPOLIA=
AWS_API_KEY=
EVM_PRIVATE_KEY=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_CONTRACT_ABI=
```

## Usage
1. Connect wallet (MetaMask or RainbowKit)
2. Switch to Sepolia network
3. Play BlackJack to earn points
4. Mint NFT at 1000 points

## NFT Minting
- NFT minted on Sepolia smart contract
- Requires 1000 game points
- Transaction via connected wallet

## License
MIT License

## Acknowledgements
- [QingyangKong/blackjack-web3](https://github.com/QingyangKong/blackjack-web3)
---

# Web3 二十一点游戏

基于 React、Next.js、Wagmi、Viem、RainbowKit 和 TailwindCSS 的 Web3 二十一点游戏。  
玩家连接钱包到 Sepolia 测试网，玩二十一点，达到 1000 分可铸造 NFT。

## 功能
- 浏览器中玩二十一点
- RainbowKit 钱包连接
- 基于 React + Next.js + Wagmi + Viem 开发
- TailwindCSS 美化界面
- 运行于 Sepolia 网络
- 1000 分可铸造 NFT

## 技术栈
- React
- Next.js
- Wagmi
- Viem
- RainbowKit
- TailwindCSS

## 安装
```bash
git clone https://github.com/iruochen/web3-blackjack.git
cd blackjack-web3
pnpm install
pnpm dev
```

## 环境变量
新建 `.env.local`，添加：
```
NEXT_PUBLIC_WC_PROJECT_ID=
NEXT_TELEMETRY_DISABLED=1
AWS_USER_ACCESS_KEY_ID=
AWS_USER_ACCESS_KEY=
JWT_SECRET=
ETHEREUM_PROVIDER_SEPOLIA=
AWS_API_KEY=
EVM_PRIVATE_KEY=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_CONTRACT_ABI=
```

## 使用方法
1. 连接钱包（MetaMask 或 RainbowKit）
2. 切换到 Sepolia 网络
3. 玩二十一点累积分数
4. 达到 1000 分点击铸造 NFT

## NFT 铸造
- NFT 通过 Sepolia 智能合约铸造
- 需 1000 分游戏积分
- 交易通过连接的钱包发起

## 许可证
MIT 许可证
