# dai-subgraph

A subgraph for the DAI token. 

Documentation: https://thegraph.com/docs/en/cookbook/quick-start/

## First Step
1. Add a Transfer entity with these fields:
  - from: String (address)
  - to: String (address)
  - amount: BigInt (transfer amount)
  
2. Add a daily entity that summarizes totaly daily transfer count, transfer amount, and unique users (from or to).

3. Find a price oracle contract and convert the transfer amount to US dollar.

## Second Step
1. Find pairs on UniSwap v2 with one of the tokens is DAI
  - handle [PairCreated event](https://docs.uniswap.org/protocol/V2/reference/smart-contracts/factory)
  - add a [template data source](https://docs.uniswap.org/protocol/V2/reference/smart-contracts/factory) for DAI pairs
2. For each DAI pair, track pool (pair address, token0, token1, reserve0, reserve1) and swap (to, from, tokenA, tokenB, amountIn, amountOut) with a pool and swap entity
3. add to daily entity, total DAI liquidity (reserve) across all pools, total swap count, total swap amount (USD)
4. add to daily entity, % of DAI supply that is providing liquidity at UniSwap v2, % of DAI transfer counts that is swaps, % DAI transfer amount that is swaps

## Third Step
Develop a subgraph for Uniswap v2 using Messari's DEX schema: https://github.com/messari/subgraphs/blob/master/schema-dex-amm.graphql
