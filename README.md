# dai-subgraph

A subgraph for the DAI token. 

Documentation: https://thegraph.com/docs/en/cookbook/quick-start/

## Next Steps
1. Add a Transfer entity with these fields:
  - from: String (address)
  - to: String (address)
  - amount: BigInt (transfer amount)
  
2. Add a daily entity that summarizes totaly daily transfer amount and unique users (from or to).

3. Find a price oracle contract and convert the transfer amount to US dollar.
